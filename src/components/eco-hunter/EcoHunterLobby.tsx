import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { EcoRoom, EcoPlayer } from "./useEcoRoom";

interface EcoHunterLobbyProps {
  room: EcoRoom | null;
  players: EcoPlayer[];
  loading: boolean;
  error: string | null;
  isHost: boolean;
  profileId: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function EcoHunterLobby({
  room, players, loading, error, isHost, profileId,
  onCreateRoom, onJoinRoom, onStartGame, onLeaveRoom,
}: EcoHunterLobbyProps) {
  const [joinCode, setJoinCode] = useState("");

  // No room yet — show create/join
  if (!room) {
    return (
      <motion.div className="mt-12 flex flex-col items-center gap-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.span className="text-7xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          ♻️
        </motion.span>
        <h2 className="font-fredoka text-2xl text-foreground">Eco Hunter</h2>
        <p className="max-w-md text-center font-nunito text-muted-foreground">
          One player becomes the <span className="font-bold text-game-green">Hunter</span>. Others disguise as{" "}
          <span className="font-bold text-destructive">trash</span>. Say <span className="font-bold text-game-pink">"Recycle!"</span> to clean up!
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            className="rounded-full bg-game-green font-fredoka text-lg px-8 text-primary-foreground hover:bg-game-green/90"
            onClick={onCreateRoom}
            disabled={loading}
          >
            🏠 Create Room
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Room Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-32 text-center font-fredoka text-lg uppercase tracking-widest"
          />
          <Button
            onClick={() => onJoinRoom(joinCode)}
            disabled={loading || joinCode.length < 6}
            className="rounded-full bg-game-blue font-fredoka text-primary-foreground hover:bg-game-blue/90"
          >
            🚪 Join
          </Button>
        </div>

        {error && <p className="font-nunito text-sm text-destructive">{error}</p>}
      </motion.div>
    );
  }

  // In room — lobby view
  return (
    <motion.div className="mt-8 flex flex-col items-center gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-fredoka text-xl">
            Room: <span className="tracking-widest text-game-green">{room.code}</span>
          </CardTitle>
          <p className="font-nunito text-sm text-muted-foreground">Share this code with friends!</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="font-fredoka text-sm text-muted-foreground">Players ({players.length}/16)</p>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg border p-2 ${
                    p.profile_id === room.host_profile_id ? "border-game-yellow bg-accent/20" : "border-border"
                  }`}
                >
                  <span className="text-lg">{p.profile_id === room.host_profile_id ? "👑" : "🧑"}</span>
                  <span className="truncate font-nunito text-sm text-foreground">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {isHost && (
              <Button
                className="flex-1 rounded-full bg-game-green font-fredoka text-primary-foreground hover:bg-game-green/90"
                onClick={onStartGame}
                disabled={players.length < 2}
              >
                🎮 Start Game {players.length < 2 && "(need 2+)"}
              </Button>
            )}
            <Button variant="outline" className="rounded-full font-fredoka" onClick={onLeaveRoom}>
              Leave
            </Button>
          </div>

          {error && <p className="font-nunito text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
