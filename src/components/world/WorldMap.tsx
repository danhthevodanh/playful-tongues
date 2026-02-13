import { motion } from "framer-motion";

export interface Zone {
  id: string;
  label: string;
  icon: string;
  color: string;
  x: number; // % from left
  y: number; // % from top
  width: number; // % width
  height: number; // % height
}

export const ZONES: Zone[] = [
  { id: "npc", label: "NPC Hut", icon: "🧙‍♂️", color: "hsl(35, 95%, 58%)", x: 5, y: 5, width: 40, height: 40 },
  { id: "prop-hunt", label: "Prop Hunt", icon: "🔍", color: "hsl(330, 80%, 65%)", x: 55, y: 5, width: 40, height: 40 },
  { id: "pet", label: "Pet Garden", icon: "🐾", color: "hsl(260, 67%, 55%)", x: 5, y: 55, width: 40, height: 40 },
  { id: "obby", label: "Obby Track", icon: "🏃", color: "hsl(170, 60%, 50%)", x: 55, y: 55, width: 40, height: 40 },
];

export function WorldMap() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base grass */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(120,40%,75%)] to-[hsl(140,35%,65%)]" />

      {/* Center spawn area */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full bg-[hsl(45,80%,80%)]/50 border-4 border-dashed border-[hsl(45,80%,60%)]/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[60%] font-fredoka text-xs text-foreground/40 whitespace-nowrap pointer-events-none select-none">
        ⭐ Spawn
      </div>

      {/* Paths connecting center to zones */}
      <div className="absolute left-[25%] top-1/2 w-[15%] h-1 bg-[hsl(30,30%,70%)]/60 -translate-y-1/2" />
      <div className="absolute right-[25%] top-1/2 w-[15%] h-1 bg-[hsl(30,30%,70%)]/60 -translate-y-1/2" />
      <div className="absolute left-1/2 top-[25%] w-1 h-[15%] bg-[hsl(30,30%,70%)]/60 -translate-x-1/2" />
      <div className="absolute left-1/2 bottom-[25%] w-1 h-[15%] bg-[hsl(30,30%,70%)]/60 -translate-x-1/2" />

      {/* Decorative elements */}
      {[
        { emoji: "🌸", x: 12, y: 70 },
        { emoji: "🌻", x: 20, y: 80 },
        { emoji: "🌺", x: 30, y: 65 },
        { emoji: "🌲", x: 8, y: 15 },
        { emoji: "🌲", x: 85, y: 12 },
        { emoji: "🍄", x: 78, y: 75 },
        { emoji: "⭐", x: 48, y: 48 },
      ].map((d, i) => (
        <motion.span
          key={i}
          className="absolute text-lg pointer-events-none select-none"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
        >
          {d.emoji}
        </motion.span>
      ))}

      {/* Zone regions */}
      {ZONES.map((zone) => (
        <div
          key={zone.id}
          className="absolute rounded-2xl border-4 border-white/30 flex flex-col items-center justify-center gap-1 pointer-events-none select-none"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
            backgroundColor: `${zone.color}33`,
            borderColor: `${zone.color}66`,
          }}
        >
          <span className="text-3xl md:text-4xl">{zone.icon}</span>
          <span className="font-fredoka text-sm md:text-base font-bold text-foreground/70 drop-shadow">
            {zone.label}
          </span>
        </div>
      ))}
    </div>
  );
}
