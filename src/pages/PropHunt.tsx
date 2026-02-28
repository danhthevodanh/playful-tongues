import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEcoRoom } from "@/components/eco-hunter/useEcoRoom";
import { EcoHunterLobby } from "@/components/eco-hunter/EcoHunterLobby";
import { EcoHunterArena } from "@/components/eco-hunter/EcoHunterArena";
import { EcoHunterResults } from "@/components/eco-hunter/EcoHunterResults";

export default function PropHunt() {
  const navigate = useNavigate();
  const { profileId, room, players, loading, error, isHost, createRoom, joinRoom, startGame, leaveRoom } = useEcoRoom();

  const isPlaying = room?.status === "playing";
  const isFinished = room?.status === "finished";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-4">
      {!isPlaying && (
        <header className="flex w-full max-w-2xl items-center justify-between">
          <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
            ← Home
          </Button>
          <h1 className="font-fredoka text-2xl font-bold text-game-green">Eco Hunter ♻️</h1>
          <div className="w-20" />
        </header>
      )}

      {isPlaying && room && profileId ? (
        <EcoHunterArena room={room} players={players} profileId={profileId} />
      ) : isFinished ? (
        <EcoHunterResults
          players={players}
          isHost={isHost}
          onPlayAgain={startGame}
          onLeave={leaveRoom}
        />
      ) : (
        <EcoHunterLobby
          room={room}
          players={players}
          loading={loading}
          error={error}
          isHost={isHost}
          profileId={profileId}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      )}
    </div>
  );
}
