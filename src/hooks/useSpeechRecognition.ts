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
  const shouldBeListening = useRef(false);

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

      if (current) {
        const words = current.trim().split(/\s+/).filter(Boolean);
        onResultRef.current?.(current.trim(), words.length);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        onErrorRef.current?.(event.error);
        shouldBeListening.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Browser can fire onend even with continuous=true.
      // If we still want to be listening, restart immediately.
      if (shouldBeListening.current) {
        try {
          recognition.start();
        } catch {
          shouldBeListening.current = false;
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListening.current = false;
      recognition.abort();
    };
  }, [lang]);

  const stopListening = useCallback(() => {
    clearAutoStop();
    shouldBeListening.current = false;
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [clearAutoStop]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    clearAutoStop();
    shouldBeListening.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      autoStopTimer.current = setTimeout(() => {
        shouldBeListening.current = false;
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
      }, autoStopMs);
    } catch {
      // Already started
    }
  }, [clearAutoStop, autoStopMs]);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
