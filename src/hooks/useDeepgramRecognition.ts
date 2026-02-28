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
    const [volume, setVolume] = useState(0);      // 0–1, microphone loudness
    const [isSupported, setIsSupported] = useState(true);

    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const onResultRef = useRef(onResult);
    const wantActive = useRef(false);
    const volumePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    onResultRef.current = onResult;

    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

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
            setVolume(Math.min(1, rms * 6)); // amplify to 0–1 range
        }, 80);
    };

    const stopListening = useCallback(() => {
        wantActive.current = false;
        stopVolumePoll();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try { mediaRecorderRef.current.stop(); } catch { }
        }
        if (socketRef.current) {
            try { socketRef.current.close(); } catch { }
            socketRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch { }
            audioCtxRef.current = null;
        }
        analyserRef.current = null;
        setIsListening(false);
    }, []);

    const createAndStart = useCallback(async () => {
        if (!apiKey || !wantActive.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!wantActive.current) { stream.getTracks().forEach(t => t.stop()); return; }
            streamRef.current = stream;

            // Web Audio API for real-time volume
            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            const src = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;
            startVolumePoll(analyser);

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
                    let finalTranscript = text;
                    const lowerText = text.toLowerCase();
                    for (const [misheard, replacement] of Object.entries(transcriptMapping)) {
                        if (lowerText.includes(misheard.toLowerCase())) {
                            finalTranscript = replacement;
                            break;
                        }
                    }

                    setTranscript(finalTranscript);
                    if (data.is_final) {
                        // Compute clarity: weighted combo of mic volume + Deepgram confidence
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
                if (wantActive.current) setTimeout(() => wantActive.current && createAndStart(), 500);
            };

            socketRef.current = socket;
        } catch (err: any) {
            console.error("Deepgram:", err);
            setIsListening(false);
            if (err.name === "NotAllowedError") setIsSupported(false);
        }
    }, [apiKey, keywords]);

    const startListening = useCallback(() => {
        if (wantActive.current) return;
        setTranscript("");
        wantActive.current = true;
        createAndStart();
    }, [createAndStart]);

    useEffect(() => () => {
        wantActive.current = false;
        stopVolumePoll();
        socketRef.current?.close();
        mediaRecorderRef.current?.stop();
        audioCtxRef.current?.close();
    }, []);

    return { isListening, transcript, volume, isSupported, startListening, stopListening };
}
