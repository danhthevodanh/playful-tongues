import { useState, useCallback, useRef, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, wordCount: number) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = "en-US",
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const wantActive = useRef(false);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const current = finalTranscript || interimTranscript;
      setTranscript(current);

      if (current) {
        const words = current.trim().split(/\s+/).filter(Boolean);
        onResultRef.current?.(current.trim(), words.length);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore transient errors that happen during normal operation
      if (event.error === "aborted" || event.error === "no-speech") return;
      onErrorRef.current?.(event.error);
      wantActive.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if caller still wants us active (hold-to-talk)
      if (wantActive.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to stop
        }
      }
      wantActive.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      wantActive.current = false;
      recognition.abort();
    };
  }, [lang]);

  const stopListening = useCallback(() => {
    wantActive.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || wantActive.current) return;
    setTranscript("");
    wantActive.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started — that's fine, just mark active
      setIsListening(true);
    }
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
