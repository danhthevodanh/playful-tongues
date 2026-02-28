import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMeritStore } from "@/stores/useMeritStore";
import { getNextMilestoneForValue } from "@/lib/milestones";
import { Progress } from "@/components/ui/progress";

export function MeritLedger() {
  const { meritPoints, ecoVitality, loaded, glowing } = useMeritStore();
  const [expanded, setExpanded] = useState(false);

  if (!loaded) return null;

  const meritMilestone = getNextMilestoneForValue("merit", meritPoints);
  const ecoMilestone = getNextMilestoneForValue("eco", ecoVitality);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 w-56 rounded-xl border border-yellow-500/30 bg-card/95 p-4 shadow-xl backdrop-blur"
          >
            <h3 className="mb-3 font-fredoka text-sm font-bold text-foreground">
              📜 Sổ Công Quá
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-nunito text-muted-foreground">✨ Merit Points</span>
                  <span className="font-fredoka font-bold text-foreground">{meritPoints}</span>
                </div>
                {meritMilestone && (
                  <div className="mt-1">
                    <Progress value={meritMilestone.progress * 100} className="h-2" />
                    <p className="mt-0.5 font-nunito text-[10px] text-muted-foreground">
                      Next: {meritMilestone.name} ({meritMilestone.threshold})
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-nunito text-muted-foreground">🌿 Eco-Vitality</span>
                  <span className="font-fredoka font-bold text-foreground">{ecoVitality}</span>
                </div>
                {ecoMilestone && (
                  <div className="mt-1">
                    <Progress value={ecoMilestone.progress * 100} className="h-2" />
                    <p className="mt-0.5 font-nunito text-[10px] text-muted-foreground">
                      Next: {ecoMilestone.name} ({ecoMilestone.threshold})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded(!expanded)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-500/40 bg-card shadow-lg transition-all hover:scale-105 ${
          glowing ? "animate-merit-glow" : ""
        }`}
      >
        <span className="text-2xl">📖</span>

        {/* Mini badges */}
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-fredoka text-[9px] font-bold text-primary-foreground">
          {meritPoints}
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-fredoka text-[9px] font-bold text-accent-foreground">
          {ecoVitality}
        </span>
      </button>
    </div>
  );
}
