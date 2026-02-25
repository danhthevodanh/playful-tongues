import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionOptions {
    onResult?: (transcript: string, wordCount: number) => void;
    lang?: string;
    keywords?: string[];
}

export function useDeepgramRecognition({
    onResult,
    keywords = ["break"],
}: UseSpeechRecognitionOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(true);

    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const onResultRef = useRef(onResult);
    const wantActive = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);

    onResultRef.current = onResult;

    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

    const stopListening = useCallback(() => {
        console.log("Deepgram: Stopping...");
        wantActive.current = false;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }
        if (socketRef.current) {
            try { socketRef.current.close(); } catch (e) { }
            socketRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsListening(false);
    }, []);

    const createAndStart = useCallback(async () => {
        if (!apiKey || !wantActive.current) return;

        try {
            console.log("Deepgram: Requesting mic...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!wantActive.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            streamRef.current = stream;

            // Setup WebSocket
            // Added search parameter for boosting specific keywords
            const searchParams = new URLSearchParams({
                model: "nova-2",
                smart_format: "true",
                interim_results: "true",
                keywords: keywords.map(k => `${k}:15`).join(","), // Increased boost
            });

            const socket = new WebSocket(
                `wss://api.deepgram.com/v1/listen?${searchParams.toString()}`,
                ["token", apiKey]
            );

            socket.onopen = () => {
                if (!wantActive.current) {
                    socket.close();
                    return;
                }
                console.log("Deepgram: WebSocket Open");
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.addEventListener("dataavailable", (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        socket.send(event.data);
                    }
                });

                mediaRecorder.start(200);
                setIsListening(true);
            };

            socket.onmessage = (message) => {
                if (!wantActive.current) return;
                const received = JSON.parse(message.data);
                const transcriptText = received.channel?.alternatives[0]?.transcript;

                if (transcriptText) {
                    setTranscript(transcriptText);
                    if (received.is_final) {
                        console.log("Deepgram Word Match:", transcriptText);
                        onResultRef.current?.(transcriptText, transcriptText.split(/\s+/).length);
                    }
                }
            };

            socket.onerror = (err) => {
                console.error("Deepgram Error:", err);
            };

            socket.onclose = () => {
                console.log("Deepgram: WebSocket Closed");
                if (wantActive.current) {
                    console.log("Deepgram: Reconnecting...");
                    setTimeout(() => wantActive.current && createAndStart(), 500);
                }
            };

            socketRef.current = socket;

        } catch (err: any) {
            console.error("Deepgram Error:", err);
            setIsListening(false);
            if (err.name === "NotAllowedError") setIsSupported(false);
        }
    }, [apiKey, keywords]);

    const startListening = useCallback(() => {
        if (wantActive.current) return;
        console.log("Deepgram: Starting manually...");
        setTranscript("");
        wantActive.current = true;
        createAndStart();
    }, [createAndStart]);

    useEffect(() => {
        return () => {
            wantActive.current = false;
            if (socketRef.current) socketRef.current.close();
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        };
    }, []);

    return { isListening, transcript, isSupported, startListening, stopListening };
}
