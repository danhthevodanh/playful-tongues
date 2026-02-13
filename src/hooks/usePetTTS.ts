import { useCallback, useRef } from "react";

export function usePetTTS() {
  const isSpeakingRef = useRef(false);

  const speak = useCallback((text: string, stage: number) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Make the voice fun/childish based on stage
    utterance.rate = stage <= 1 ? 1.3 : stage <= 2 ? 1.1 : 1.0;
    utterance.pitch = stage <= 1 ? 1.8 : stage <= 2 ? 1.5 : 1.2;
    utterance.volume = 1;

    // Try to pick a fun voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) 
      || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => { isSpeakingRef.current = true; };
    utterance.onend = () => { isSpeakingRef.current = false; };

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
