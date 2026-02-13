import { BlobPet } from "@/components/BlobPet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { usePetTTS } from "@/hooks/usePetTTS";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EVOLUTION_THRESHOLDS = [0, 10, 30, 60, 100];

function getEvolutionStage(wordsSpoken: number): number {
  for (let i = EVOLUTION_THRESHOLDS.length - 1; i >= 0; i--) {
    if (wordsSpoken >= EVOLUTION_THRESHOLDS[i]) return i;
  }
  return 0;
}

const STAGE_NAMES = ["Blob", "Buddy", "Critter", "Flyer", "Champion"];

export default function Pet() {
  const navigate = useNavigate();
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
        body: {
          spokenText,
          wordsSpoken: totalWords,
          evolutionStage: getEvolutionStage(totalWords),
          petName,
        },
      });

      if (error) throw error;

      const reply = data?.reply || "Bloop! 🫧";
      setPetReply(reply);
      speak(reply, getEvolutionStage(totalWords));
    } catch (e: any) {
      console.error("Pet chat error:", e);
      // Fallback: pet just repeats
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
  }, [fetchPetReply]);

  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: (err) => toast.error(`Mic error: ${err}`),
  });

  const prevStage = getEvolutionStage(Math.max(0, wordsSpoken - 1));
  const justEvolved = evolutionStage > prevStage && wordsSpoken > 0;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
          ← Home
        </Button>
        <h1 className="font-fredoka text-2xl font-bold text-primary">My Pet 🐾</h1>
        <div className="w-20" />
      </header>

      {/* Pet */}
      <motion.div
        className="mt-12"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <BlobPet evolutionStage={evolutionStage} wordsSpoken={wordsSpoken} size="lg" />
      </motion.div>

      {/* Evolution alert */}
      <AnimatePresence>
        {justEvolved && (
          <motion.div
            className="mt-4 rounded-full bg-accent px-6 py-2 font-fredoka text-lg font-bold text-accent-foreground"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            🎉 Evolved to {STAGE_NAMES[evolutionStage]}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="font-fredoka text-xl text-foreground">{petName}</h2>
        <p className="mt-2 font-nunito text-muted-foreground">
          Words spoken: <span className="font-bold text-primary">{wordsSpoken}</span>
        </p>
        <p className="mt-1 font-nunito text-sm text-muted-foreground">
          Stage: <span className="font-bold">{STAGE_NAMES[evolutionStage]}</span>
          {evolutionStage < 4 && (
            <> — Next at <span className="text-primary font-bold">{EVOLUTION_THRESHOLDS[evolutionStage + 1]}</span> words!</>
          )}
        </p>
      </motion.div>

      {/* Live transcript */}
      {isListening && transcript && (
        <motion.div
          className="mt-4 rounded-xl bg-card px-6 py-3 font-nunito text-foreground shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎙️ "{transcript}"
        </motion.div>
      )}

      {/* Pet reply bubble */}
      <AnimatePresence>
        {(petReply || isThinking) && (
          <motion.div
            className="mt-4 max-w-xs rounded-2xl bg-primary/10 px-6 py-3 text-center font-nunito text-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {isThinking ? (
              <span className="animate-pulse">💭 Thinking...</span>
            ) : (
              <span>💬 {petReply}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {!isSupported ? (
          <p className="font-nunito text-sm text-destructive">
            Speech recognition not supported in this browser. Try Chrome!
          </p>
        ) : (
          <>
            <Button
              size="lg"
              className={`rounded-full font-fredoka text-lg px-8 transition-all ${
                isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : ""
              }`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? "🛑 Stop" : "🎤 Start Talking"}
            </Button>
            <p className="mt-3 text-center font-nunito text-xs text-muted-foreground">
              Speak English to grow your pet!
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
