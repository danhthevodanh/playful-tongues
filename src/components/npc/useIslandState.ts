import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { meritStore } from "@/stores/useMeritStore";

interface ChatMessage {
  role: "player" | "elder";
  content: string;
}

export type ElderMood = "sad" | "hopeful" | "happy";

export function useIslandState() {
  const [localMerit, setLocalMerit] = useState(0);
  const [transformed, setTransformed] = useState(false);
  const [hasCape, setHasCape] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "elder", content: "Who comes to this forsaken place? Fate has cursed this island... nothing can change it." },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const transformedRef = useRef(false);

  const elderMood: ElderMood =
    localMerit >= 40 ? "happy" : localMerit >= 20 ? "hopeful" : "sad";

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    setChatHistory((prev) => [...prev, { role: "player", content: text }]);
    setIsThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("npc-chat", {
        body: { spokenText: text, currentMerit: localMerit },
      });

      if (error) throw error;

      const reply = data?.reply || "...";
      const meritAwarded = data?.meritAwarded || 0;

      setChatHistory((prev) => [...prev, { role: "elder", content: reply }]);

      if (meritAwarded > 0) {
        const newMerit = localMerit + meritAwarded;
        setLocalMerit(newMerit);
        meritStore.addMerit(meritAwarded);

        if (newMerit >= 50 && !transformedRef.current) {
          transformedRef.current = true;
          setTransformed(true);
        }
      }
    } catch (e) {
      console.error("NPC chat error:", e);
      setChatHistory((prev) => [
        ...prev,
        { role: "elder", content: "...the wind swallows my words. Try again." },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [localMerit, isThinking]);

  const claimCape = useCallback((text: string): boolean => {
    const keywords = ["good child", "kind", "brave", "help others", "be good", "nice", "caring", "love"];
    const lower = text.toLowerCase();
    const found = keywords.some((k) => lower.includes(k));
    if (found) {
      setHasCape(true);
      meritStore.addMerit(10);
    }
    return found;
  }, []);

  return {
    localMerit,
    transformed,
    hasCape,
    chatHistory,
    elderMood,
    isThinking,
    sendMessage,
    claimCape,
  };
}
