import { motion } from "framer-motion";

interface PlayerAvatarProps {
  x: number;
  y: number;
  name: string;
  evolutionStage?: number;
  wordsSpoken?: number;
  isCurrentPlayer?: boolean;
  speechBubble?: string;
}

const SKIN_COLORS = [
  "hsl(35, 60%, 70%)",
  "hsl(25, 55%, 60%)",
  "hsl(15, 50%, 50%)",
  "hsl(30, 65%, 75%)",
];

const SHIRT_COLORS = [
  "hsl(210, 80%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(130, 60%, 45%)",
  "hsl(280, 65%, 55%)",
  "hsl(45, 90%, 55%)",
  "hsl(330, 70%, 55%)",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function RobloxCharacter({ name, size = 50 }: { name: string; size?: number }) {
  const h = hashStr(name);
  const skin = SKIN_COLORS[h % SKIN_COLORS.length];
  const shirt = SHIRT_COLORS[h % SHIRT_COLORS.length];
  const pants = "hsl(220, 40%, 35%)";
  const scale = size / 50;

  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" style={{ overflow: "visible" }}>
      {/* Shadow */}
      <ellipse cx="25" cy="68" rx="12" ry="3" fill="rgba(0,0,0,0.15)" />

      {/* Left leg */}
      <rect x="14" y="50" width="9" height="14" rx="1" fill={pants}
        style={{ filter: "brightness(0.9)" }} />
      {/* Right leg */}
      <motion.rect
        x="27" y="50" width="9" height="14" rx="1" fill={pants}
        style={{ filter: "brightness(0.95)" }}
      />

      {/* Left shoe */}
      <rect x="13" y="62" width="11" height="5" rx="1.5" fill="hsl(0,0%,25%)" />
      {/* Right shoe */}
      <rect x="26" y="62" width="11" height="5" rx="1.5" fill="hsl(0,0%,25%)" />

      {/* Torso */}
      <rect x="12" y="30" width="26" height="22" rx="2" fill={shirt}
        style={{ filter: "drop-shadow(-2px 2px 0 rgba(0,0,0,0.1))" }} />
      {/* Shirt detail */}
      <rect x="22" y="32" width="6" height="18" rx="1" fill="rgba(255,255,255,0.15)" />

      {/* Left arm */}
      <motion.rect
        x="4" y="31" width="9" height="18" rx="2" fill={shirt}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "8px 31px", filter: "brightness(0.85)" }}
      />
      {/* Left hand */}
      <circle cx="8" cy="50" r="3.5" fill={skin} />

      {/* Right arm */}
      <motion.rect
        x="37" y="31" width="9" height="18" rx="2" fill={shirt}
        animate={{ rotate: [5, -5, 5] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "42px 31px", filter: "brightness(0.85)" }}
      />
      {/* Right hand */}
      <circle cx="42" cy="50" r="3.5" fill={skin} />

      {/* Head */}
      <rect x="13" y="6" width="24" height="24" rx="4" fill={skin}
        style={{ filter: "drop-shadow(-2px 2px 0 rgba(0,0,0,0.1))" }} />

      {/* Eyes */}
      <circle cx="20" cy="17" r="2.5" fill="white" />
      <circle cx="30" cy="17" r="2.5" fill="white" />
      <circle cx="20.5" cy="17.5" r="1.5" fill="hsl(220,30%,15%)" />
      <circle cx="30.5" cy="17.5" r="1.5" fill="hsl(220,30%,15%)" />

      {/* Smile */}
      <path d="M 20 22 Q 25 26 30 22" stroke="hsl(0,0%,20%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Hair (blocky) */}
      <rect x="11" y="4" width="28" height="10" rx="3" fill={`hsl(${(h * 37) % 360}, 30%, 25%)`}
        style={{ filter: "brightness(0.9)" }} />
    </svg>
  );
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
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -100%)" }}
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

      {/* Name tag */}
      <div className={`mb-0.5 rounded px-1.5 py-0.5 text-center font-fredoka text-[10px] font-bold drop-shadow ${
        isCurrentPlayer
          ? "bg-primary/80 text-primary-foreground"
          : "bg-[hsl(0,0%,0%)]/50 text-white"
      }`}>
        {name}
      </div>

      {/* Roblox-style character */}
      <div className={isCurrentPlayer ? "drop-shadow-lg" : "opacity-80"}>
        <RobloxCharacter name={name} size={40} />
      </div>

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-sm">▼</span>
        </motion.div>
      )}
    </motion.div>
  );
}
