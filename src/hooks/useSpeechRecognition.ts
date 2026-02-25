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
  const restartTimeoutRef = useRef<number | null>(null);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) setIsSupported(false);
  }, []);

  const createAndStart = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) { }
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 3;

    // Add Grammar if supported
    const GrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (GrammarList) {
      const grammar = "#JSGF V1.0; grammar keywords; public <keyword> = break | brake | broke | brick | back | lake | cake | fake | shake | rake | take | make | great | bread | freak | prick | work | beach | bleach | reach | teach | pray | bray | brey | brk | brek | brik | rick | rock | raik | wreck | wake | wake up ;";
      const speechRecognitionList = new GrammarList();
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
    }

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      // Collect BEST alternatives from each result segment
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;

        // Also check if ANY of the alternatives matches our core keyword
        // and append it if it exists (hidden logic booster)
        for (let j = 1; j < event.results[i].length; j++) {
          const alt = event.results[i][j].transcript.toLowerCase();
          if (alt.includes("break") || alt.includes("brake")) {
            fullTranscript += " break"; // Force injection if it's an alternative
            break;
          }
        }
      }
      const current = fullTranscript.trim();
      setTranscript(current);
      if (current) {
        onResultRef.current?.(current, current.split(/\s+/).length);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setIsSupported(false);
        wantActive.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition onend. wantActive:", wantActive.current);
      if (wantActive.current) {
        // Debounced restart to avoid "rapid fire" start calls
        restartTimeoutRef.current = window.setTimeout(() => {
          if (wantActive.current) createAndStart();
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    console.log("Stopping speech recognition manually");
    wantActive.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (wantActive.current) return;
    console.log("Starting speech recognition manually");
    setTranscript("");
    wantActive.current = true;
    createAndStart();
  }, [createAndStart]);

  useEffect(() => {
    return () => {
      wantActive.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
