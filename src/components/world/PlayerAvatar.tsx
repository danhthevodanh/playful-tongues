import { motion } from "framer-motion";
import { BlobPet } from "@/components/BlobPet";

interface PlayerAvatarProps {
  x: number; // percentage
  y: number; // percentage
  name: string;
  evolutionStage?: number;
  wordsSpoken?: number;
  isCurrentPlayer?: boolean;
  speechBubble?: string;
}

export function PlayerAvatar({
  x,
  y,
  name,
  evolutionStage = 0,
  wordsSpoken = 0,
  isCurrentPlayer = false,
  speechBubble,
}: PlayerAvatarProps) {
  return (
    <motion.div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={{ type: "tween", duration: 0.15, ease: "linear" }}
    >
      {/* Speech bubble */}
      {speechBubble && (
        <motion.div
          className="mb-1 max-w-[120px] rounded-xl bg-card px-2 py-1 text-center font-nunito text-[10px] text-foreground shadow-md"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          💬 {speechBubble}
        </motion.div>
      )}

      {/* Blob pet avatar */}
      <div className={isCurrentPlayer ? "drop-shadow-lg" : "opacity-80"}>
        <BlobPet evolutionStage={evolutionStage} wordsSpoken={wordsSpoken} size="sm" />
      </div>

      {/* Name tag */}
      <span
        className={`mt-[-4px] font-fredoka text-[10px] ${
          isCurrentPlayer ? "text-primary font-bold" : "text-foreground/60"
        }`}
      >
        {name}
      </span>

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute -bottom-2 w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
