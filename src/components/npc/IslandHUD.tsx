import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import type { ElderMood } from "./useIslandState";

interface IslandHUDProps {
  chatHistory: { role: "player" | "elder"; content: string }[];
  localMerit: number;
  transformed: boolean;
  hasCape: boolean;
  elderMood: ElderMood;
  isThinking: boolean;
  isListening: boolean;
  transcript: string;
}

export function IslandHUD({
  chatHistory,
  localMerit,
  transformed,
  hasCape,
  elderMood,
  isThinking,
  isListening,
  transcript,
}: IslandHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex">
      {/* Left side: quest + merit */}
      <div className="pointer-events-auto flex flex-col gap-3 p-4 pt-16 w-64">
        {/* Merit counter */}
        <div className="rounded-xl bg-card/80 p-3 backdrop-blur-sm">
          <p className="font-fredoka text-sm text-foreground mb-1">
            Merit Earned: {localMerit}/50
          </p>
          <Progress value={Math.min(100, (localMerit / 50) * 100)} className="h-2" />
        </div>

        {/* Quest tracker */}
        <div className="rounded-xl bg-card/80 p-3 backdrop-blur-sm font-nunito text-xs text-muted-foreground space-y-1">
          <p className="font-fredoka text-sm text-foreground mb-1">Quests</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={transformed} readOnly className="accent-primary" />
            <span className={transformed ? "line-through" : ""}>Convince Elder Kong (50 Merit)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasCape} readOnly className="accent-primary" />
            <span className={hasCape ? "line-through" : ""}>Claim Kindness Cape</span>
          </label>
        </div>
      </div>

      {/* Right side: chat panel */}
      <div className="ml-auto flex flex-col justify-end p-4 w-80 max-h-[60vh] pointer-events-auto">
        <div className="rounded-xl bg-card/80 p-3 backdrop-blur-sm overflow-y-auto max-h-[50vh] space-y-2 scrollbar-thin">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "player" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-3 py-1.5 text-xs font-nunito max-w-[90%] ${
                  msg.role === "player"
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.role === "elder" && <span className="font-fredoka text-accent mr-1">🧙‍♂️</span>}
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <span className="font-fredoka text-accent mr-1">🧙‍♂️</span>
                <span className="animate-pulse">thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom center: voice indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {isListening ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-full bg-accent/90 px-4 py-2 text-accent-foreground font-fredoka text-sm backdrop-blur-sm"
            >
              🎤 Listening... {transcript && <span className="text-xs opacity-80">"{transcript}"</span>}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="rounded-full bg-card/60 px-4 py-2 text-foreground font-fredoka text-xs backdrop-blur-sm"
            >
              Hold V to speak
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cape notification */}
      <AnimatePresence>
        {hasCape && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 rounded-xl bg-accent/90 px-6 py-3 text-accent-foreground font-fredoka text-lg pointer-events-none"
          >
            ✨ Kindness Cape Earned! ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
