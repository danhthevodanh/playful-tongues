import { BlobPet } from "@/components/BlobPet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { usePetTTS } from "@/hooks/usePetTTS";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { meritStore } from "@/stores/useMeritStore";

const EVOLUTION_THRESHOLDS = [0, 10, 30, 60, 100];

function getEvolutionStage(wordsSpoken: number): number {
  for (let i = EVOLUTION_THRESHOLDS.length - 1; i >= 0; i--) {
    if (wordsSpoken >= EVOLUTION_THRESHOLDS[i]) return i;
  }
  return 0;
}

const STAGE_NAMES = ["Blob", "Buddy", "Critter", "Flyer", "Champion"];

export function PetActivity() {
  const { speak } = usePetTTS();
  const [wordsSpoken, setWordsSpoken] = useState(0);
  const [petName] = useState("Blob");
  const [petReply, setPetReply] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const evolutionStage = getEvolutionStage(wordsSpoken);

  const fetchPetReply = useCallback(async (spokenText: string, totalWords: number) => {
    setIsThinking(true);
    setPetReply("");
    try {
      const { data, error } = await supabase.functions.invoke("pet-chat", {
        body: { spokenText, wordsSpoken: totalWords, evolutionStage: getEvolutionStage(totalWords), petName },
      });
      if (error) throw error;
      const reply = data?.reply || "Bloop! 🫧";
      setPetReply(reply);
      speak(reply, getEvolutionStage(totalWords));
    } catch (e: any) {
      console.error("Pet chat error:", e);
      const fallback = `Bloop! ${spokenText}! 🫧`;
      setPetReply(fallback);
      speak(fallback, evolutionStage);
    } finally {
      setIsThinking(false);
    }
  }, [petName, speak, evolutionStage]);

  const handleSpeechResult = useCallback((transcript: string, wordCount: number) => {
    setWordsSpoken(prev => {
      const newTotal = prev + wordCount;
      fetchPetReply(transcript, newTotal);
      return newTotal;
    });
    meritStore.addMerit(wordCount);
  }, [fetchPetReply]);

  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: (err) => console.error(`Mic error: ${err}`),
  });

  const prevStage = getEvolutionStage(Math.max(0, wordsSpoken - 1));
  const justEvolved = evolutionStage > prevStage && wordsSpoken > 0;

  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <BlobPet evolutionStage={evolutionStage} wordsSpoken={wordsSpoken} size="lg" />
      </motion.div>

      <AnimatePresence>
        {justEvolved && (
          <motion.div
            className="mt-2 rounded-full bg-accent px-4 py-1 font-fredoka text-sm font-bold text-accent-foreground"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
          >
            🎉 Evolved to {STAGE_NAMES[evolutionStage]}!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 text-center">
        <h2 className="font-fredoka text-lg text-foreground">{petName}</h2>
        <p className="font-nunito text-sm text-muted-foreground">
          Words: <span className="font-bold text-primary">{wordsSpoken}</span> · Stage: <span className="font-bold">{STAGE_NAMES[evolutionStage]}</span>
        </p>
      </div>

      {isListening && transcript && (
        <motion.div className="mt-3 rounded-xl bg-card px-4 py-2 font-nunito text-sm text-foreground shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          🎙️ "{transcript}"
        </motion.div>
      )}

      <AnimatePresence>
        {(petReply || isThinking) && (
          <motion.div
            className="mt-3 max-w-xs rounded-2xl bg-primary/10 px-4 py-2 text-center font-nunito text-sm text-foreground"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          >
            {isThinking ? <span className="animate-pulse">💭 Thinking...</span> : <span>💬 {petReply}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        {!isSupported ? (
          <p className="font-nunito text-xs text-destructive">Speech not supported. Try Chrome!</p>
        ) : (
          <Button
            size="lg"
            className={`rounded-full font-fredoka px-6 ${isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : ""}`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? "🛑 Stop" : "🎤 Talk to Pet"}
          </Button>
        )}
      </div>
    </div>
  );
}
