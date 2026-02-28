import { useState, useCallback, useRef, useEffect } from "react";

interface UseDeepgramOptions {
    onResult?: (transcript: string, wordCount: number, clarity: number) => void;
    keywords?: string[];
    transcriptMapping?: Record<string, string>;
}

export function useDeepgramRecognition({
    onResult,
    keywords = ["break", "open", "bridge", "speed"],
    transcriptMapping = {},
}: UseDeepgramOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [volume, setVolume] = useState(0);
    const [isSupported, setIsSupported] = useState(true);

    const onResultRef = useRef(onResult);
    const wantActive = useRef(false);
    onResultRef.current = onResult;

    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    const useNative = !apiKey;

    // ── Shared refs ──
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const volumePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Deepgram refs ──
    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // ── Native Speech refs ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const stopVolumePoll = () => {
        if (volumePollRef.current) clearInterval(volumePollRef.current);
        volumePollRef.current = null;
        setVolume(0);
    };

    const startVolumePoll = (analyser: AnalyserNode) => {
        stopVolumePoll();
        const data = new Uint8Array(analyser.frequencyBinCount);
        volumePollRef.current = setInterval(() => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const n = (data[i] - 128) / 128;
                sum += n * n;
            }
            const rms = Math.sqrt(sum / data.length);
            setVolume(Math.min(1, rms * 6));
        }, 80);
    };

    const applyMapping = useCallback((text: string): string => {
        const lower = text.toLowerCase();
        for (const [misheard, replacement] of Object.entries(transcriptMapping)) {
            if (lower.includes(misheard.toLowerCase())) return replacement;
        }
        return text;
    }, [transcriptMapping]);

    // ── Start mic + analyser (shared) ──
    const startMicAnalyser = useCallback(async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!wantActive.current) { stream.getTracks().forEach(t => t.stop()); return null; }
            streamRef.current = stream;

            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            const src = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;
            startVolumePoll(analyser);
            return stream;
        } catch (err: any) {
            console.error("Mic access error:", err);
            if (err.name === "NotAllowedError") setIsSupported(false);
            return null;
        }
    }, []);

    // ── Cleanup helpers ──
    const cleanupAudio = useCallback(() => {
        stopVolumePoll();
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
        analyserRef.current = null;
    }, []);

    // ════════════════════════════════════════════════════════════════════════
    // NATIVE WEB SPEECH API PATH
    // ════════════════════════════════════════════════════════════════════════

    const startNative = useCallback(async () => {
        const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) { setIsSupported(false); return; }

        // Get mic for volume meter
        const stream = await startMicAnalyser();
        if (!stream) return;

        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3;

        // Add grammar hints if supported
        const GrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
        if (GrammarList) {
            const grammar = `#JSGF V1.0; grammar keywords; public <keyword> = ${keywords.join(" | ")} ;`;
            const list = new GrammarList();
            list.addFromString(grammar, 1);
            recognition.grammars = list;
        }

        recognition.onresult = (event: any) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                const best = event.results[i][0].transcript;
                fullTranscript += best;

                // Check alternatives for keyword matches
                for (let j = 1; j < event.results[i].length; j++) {
                    const alt = event.results[i][j].transcript.toLowerCase();
                    for (const kw of keywords) {
                        if (alt.includes(kw)) { fullTranscript += ` ${kw}`; break; }
                    }
                }
            }

            const mapped = applyMapping(fullTranscript.trim());
            setTranscript(mapped);

            // Check if last result is final
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const confidence = lastResult[0].confidence || 0.5;
                const currentVolume = analyserRef.current ? (() => {
                    const d = new Uint8Array(analyserRef.current!.frequencyBinCount);
                    analyserRef.current!.getByteTimeDomainData(d);
                    let s = 0; for (let i = 0; i < d.length; i++) { const n = (d[i] - 128) / 128; s += n * n; }
                    return Math.min(1, Math.sqrt(s / d.length) * 6);
                })() : 0;
                const clarity = Math.min(1, confidence * 0.65 + currentVolume * 0.35);
                console.log(`NativeSpeech: "${mapped}" conf=${confidence.toFixed(2)} clarity=${clarity.toFixed(2)}`);
                onResultRef.current?.(mapped, mapped.split(/\s+/).length, clarity);
            }
        };

        recognition.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
                setIsSupported(false);
                wantActive.current = false;
                setIsListening(false);
                cleanupAudio();
            }
        };

        recognition.onend = () => {
            if (wantActive.current) {
                try { recognition.start(); } catch {}
            } else {
                setIsListening(false);
                cleanupAudio();
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true);
            console.log("Native Speech Recognition started");
        } catch (e) {
            console.error("Failed to start native recognition:", e);
            cleanupAudio();
        }
    }, [startMicAnalyser, cleanupAudio, applyMapping, keywords]);

    const stopNative = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch {}
            recognitionRef.current = null;
        }
        cleanupAudio();
        setIsListening(false);
    }, [cleanupAudio]);

    // ════════════════════════════════════════════════════════════════════════
    // DEEPGRAM PATH
    // ════════════════════════════════════════════════════════════════════════

    const startDeepgram = useCallback(async () => {
        if (!apiKey) return;

        const stream = await startMicAnalyser();
        if (!stream) return;

        const params = new URLSearchParams({
            model: "nova-2",
            smart_format: "true",
            interim_results: "true",
            keywords: keywords.map(k => `${k}:15`).join(","),
        });

        const socket = new WebSocket(
            `wss://api.deepgram.com/v1/listen?${params.toString()}`,
            ["token", apiKey]
        );

        socket.onopen = () => {
            if (!wantActive.current) { socket.close(); return; }
            console.log("Deepgram: Open");
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = recorder;
            recorder.addEventListener("dataavailable", (e) => {
                if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(e.data);
            });
            recorder.start(200);
            setIsListening(true);
        };

        socket.onmessage = (msg) => {
            if (!wantActive.current) return;
            const data = JSON.parse(msg.data);
            const alt = data.channel?.alternatives?.[0];
            const text = alt?.transcript ?? "";
            const confidence: number = alt?.confidence ?? 0;

            if (text) {
                const finalTranscript = applyMapping(text);
                setTranscript(finalTranscript);
                if (data.is_final) {
                    const currentVolume = analyserRef.current ? (() => {
                        const d = new Uint8Array(analyserRef.current!.frequencyBinCount);
                        analyserRef.current!.getByteTimeDomainData(d);
                        let s = 0; for (let i = 0; i < d.length; i++) { const n = (d[i] - 128) / 128; s += n * n; }
                        return Math.min(1, Math.sqrt(s / d.length) * 6);
                    })() : 0;
                    const clarity = Math.min(1, confidence * 0.65 + currentVolume * 0.35);
                    console.log(`Deepgram: "${finalTranscript}" (was "${text}") | conf=${confidence.toFixed(2)} vol=${currentVolume.toFixed(2)} clarity=${clarity.toFixed(2)}`);
                    onResultRef.current?.(finalTranscript, finalTranscript.split(/\s+/).length, clarity);
                }
            }
        };

        socket.onerror = (e) => console.error("Deepgram error", e);
        socket.onclose = () => {
            if (wantActive.current) setTimeout(() => wantActive.current && startDeepgram(), 500);
        };

        socketRef.current = socket;
    }, [apiKey, keywords, startMicAnalyser, applyMapping]);

    const stopDeepgram = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try { mediaRecorderRef.current.stop(); } catch {}
        }
        if (socketRef.current) { try { socketRef.current.close(); } catch {} socketRef.current = null; }
        cleanupAudio();
        setIsListening(false);
    }, [cleanupAudio]);

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ════════════════════════════════════════════════════════════════════════

    const stopListening = useCallback(() => {
        wantActive.current = false;
        if (useNative) stopNative(); else stopDeepgram();
    }, [useNative, stopNative, stopDeepgram]);

    const startListening = useCallback(() => {
        if (wantActive.current) return;
        setTranscript("");
        wantActive.current = true;
        if (useNative) startNative(); else startDeepgram();
    }, [useNative, startNative, startDeepgram]);

    useEffect(() => () => {
        wantActive.current = false;
        stopVolumePoll();
        socketRef.current?.close();
        mediaRecorderRef.current?.stop();
        audioCtxRef.current?.close();
        if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }
    }, []);

    // Check support on mount
    useEffect(() => {
        if (useNative) {
            const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!Ctor) setIsSupported(false);
        }
    }, [useNative]);

    return { isListening, transcript, volume, isSupported, startListening, stopListening };
}
