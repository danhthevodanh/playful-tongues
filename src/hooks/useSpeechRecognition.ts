import { useState, useCallback, useRef, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, wordCount: number) => void;
  onError?: (error: string) => void;
  lang?: string;
  autoStopMs?: number;
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = "en-US",
  autoStopMs = 5000,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const clearAutoStop = useCallback(() => {
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
  }, []);

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

      // Fire callback for both interim and final so keywords are caught immediately
      if (current) {
        const words = current.trim().split(/\s+/).filter(Boolean);
        onResultRef.current?.(current.trim(), words.length);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        onErrorRef.current?.(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [lang]);

  const stopListening = useCallback(() => {
    clearAutoStop();
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [clearAutoStop]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    clearAutoStop();
    try {
      recognitionRef.current.start();
      setIsListening(true);
      // Auto-stop after timeout
      autoStopTimer.current = setTimeout(() => {
        stopListening();
      }, autoStopMs);
    } catch {
      // Already started
    }
  }, [clearAutoStop, stopListening, autoStopMs]);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
