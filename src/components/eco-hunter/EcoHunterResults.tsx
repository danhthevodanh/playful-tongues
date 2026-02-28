import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EcoPlayer } from "./useEcoRoom";

interface EcoHunterResultsProps {
  players: EcoPlayer[];
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function EcoHunterResults({ players, isHost, onPlayAgain, onLeave }: EcoHunterResultsProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div className="mt-8 flex flex-col items-center gap-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <span className="text-6xl">🏆</span>
      <h2 className="font-fredoka text-2xl text-foreground">Round Over!</h2>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-fredoka text-lg text-center">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 ${i === 0 ? "border-game-yellow bg-accent/20" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <span className="font-fredoka text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                <span className="font-nunito text-sm text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">({p.role === "hunter" ? "🔍" : "👹"})</span>
              </div>
              <span className="font-fredoka text-lg text-game-green">{p.score}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {isHost && (
          <Button className="rounded-full bg-game-green font-fredoka text-primary-foreground hover:bg-game-green/90" onClick={onPlayAgain}>
            🔄 Play Again
          </Button>
        )}
        <Button variant="outline" className="rounded-full font-fredoka" onClick={onLeave}>
          🚪 Leave
        </Button>
      </div>
    </motion.div>
  );
}
