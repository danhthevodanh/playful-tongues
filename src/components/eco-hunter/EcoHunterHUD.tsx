import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { EcoPlayer, PlayerRole } from "./useEcoRoom";

interface EcoHunterHUDProps {
  role: PlayerRole;
  score: number;
  roundTimerEnd: string | null;
  players: EcoPlayer[];
  isDisguised: boolean;
  isListening: boolean;
  onGameEnd?: () => void;
}

export function EcoHunterHUD({ role, score, roundTimerEnd, players, isDisguised, isListening, onGameEnd }: EcoHunterHUDProps) {
  const [timeLeft, setTimeLeft] = useState(90);

  useEffect(() => {
    if (!roundTimerEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(roundTimerEnd).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onGameEnd?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [roundTimerEnd, onGameEnd]);

  const monstersAlive = players.filter((p) => p.role === "monster" && p.is_alive).length;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 p-4">
      {/* Role banner */}
      <motion.div
        className={`pointer-events-auto rounded-full px-6 py-2 font-fredoka text-lg font-bold shadow-lg ${
          role === "hunter"
            ? "bg-game-green text-primary-foreground"
            : role === "monster"
            ? "bg-destructive text-destructive-foreground"
            : "bg-muted text-muted-foreground"
        }`}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        {role === "hunter" ? "🔍 HUNTER" : role === "monster" ? "👹 MONSTER" : "👻 SPECTATOR"}
      </motion.div>

      {/* Timer */}
      <div className="w-48">
        <div className="flex justify-between font-fredoka text-xs text-foreground">
          <span>⏱ {timeLeft}s</span>
          <span>Score: {score}</span>
        </div>
        <Progress value={(timeLeft / 90) * 100} className="h-2" />
      </div>

      {/* Monster count */}
      <p className="font-nunito text-xs text-muted-foreground">
        Monsters alive: {monstersAlive}
      </p>

      {/* Status indicators */}
      {role === "monster" && isDisguised && (
        <motion.div className="rounded-full bg-game-yellow/80 px-4 py-1 font-fredoka text-sm text-accent-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}>
          🎭 Disguised — Press E to undisguise
        </motion.div>
      )}

      {role === "hunter" && isListening && (
        <motion.div className="rounded-full bg-game-pink/80 px-4 py-1 font-fredoka text-sm text-primary-foreground"
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
          🎤 Listening...
        </motion.div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="rounded-lg bg-card/80 p-3 backdrop-blur-sm">
          <p className="font-fredoka text-xs text-foreground">WASD — Move</p>
          {role === "hunter" && <p className="font-fredoka text-xs text-foreground">Hold V — Say "Recycle!"</p>}
          {role === "monster" && <p className="font-fredoka text-xs text-foreground">E — Toggle disguise</p>}
        </div>
      </div>
    </div>
  );
}
