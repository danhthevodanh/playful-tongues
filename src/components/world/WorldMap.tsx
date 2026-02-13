import { motion } from "framer-motion";

export interface Zone {
  id: string;
  label: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ZONES: Zone[] = [
  { id: "npc", label: "NPC Hut", icon: "🧙‍♂️", color: "hsl(35, 95%, 58%)", x: 5, y: 5, width: 40, height: 40 },
  { id: "prop-hunt", label: "Prop Hunt", icon: "🔍", color: "hsl(330, 80%, 65%)", x: 55, y: 5, width: 40, height: 40 },
  { id: "pet", label: "Pet Garden", icon: "🐾", color: "hsl(260, 67%, 55%)", x: 5, y: 55, width: 40, height: 40 },
  { id: "obby", label: "Obby Track", icon: "🏃", color: "hsl(170, 60%, 50%)", x: 55, y: 55, width: 40, height: 40 },
];

function BlockyBuilding({ zone }: { zone: Zone }) {
  const cx = zone.x + zone.width / 2;
  const cy = zone.y + zone.height / 2;

  return (
    <div
      className="absolute flex flex-col items-center justify-center pointer-events-none select-none"
      style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" }}
    >
      {/* 3D blocky building */}
      <div className="relative" style={{ width: 80, height: 100 }}>
        {/* Shadow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-sm opacity-20"
          style={{ width: 70, height: 12, backgroundColor: "hsl(0,0%,0%)" }}
        />
        {/* Front face */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-sm border-2 border-white/30"
          style={{
            width: 60,
            height: 60,
            backgroundColor: zone.color,
            boxShadow: `inset -8px -8px 0 rgba(0,0,0,0.15), inset 4px 4px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {/* Door */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm"
            style={{ width: 16, height: 22, backgroundColor: "hsl(30,40%,30%)" }}
          />
          {/* Windows */}
          <div className="absolute top-3 left-3 grid grid-cols-2 gap-2">
            <div className="w-3 h-3 rounded-[2px] bg-[hsl(200,80%,85%)] border border-white/40" />
            <div className="w-3 h-3 rounded-[2px] bg-[hsl(200,80%,85%)] border border-white/40" />
          </div>
        </div>
        {/* Roof */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 60 }}
        >
          <div
            className="border-l-[34px] border-r-[34px] border-b-[24px] border-l-transparent border-r-transparent"
            style={{ borderBottomColor: `color-mix(in hsl, ${zone.color}, hsl(0,0%,30%) 25%)` }}
          />
        </div>
      </div>
      {/* Label */}
      <div className="mt-1 flex items-center gap-1 rounded-lg bg-[hsl(0,0%,0%)]/60 px-2 py-0.5 backdrop-blur-sm">
        <span className="text-base">{zone.icon}</span>
        <span className="font-fredoka text-[11px] font-bold text-white drop-shadow">{zone.label}</span>
      </div>
    </div>
  );
}

export function WorldMap() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,80%,70%)] via-[hsl(195,70%,75%)] to-[hsl(120,45%,65%)]" />

      {/* Ground - Roblox-style checker grass */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: "30%" }}
      >
        <div className="absolute inset-0 bg-[hsl(120,50%,45%)]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(0deg, hsl(120,60%,35%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(120,60%,35%) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Darker grass patches */}
        <div className="absolute left-[10%] top-[20%] w-16 h-16 rounded-sm bg-[hsl(120,55%,40%)] opacity-40 rotate-12" />
        <div className="absolute left-[60%] top-[40%] w-20 h-12 rounded-sm bg-[hsl(120,55%,40%)] opacity-30 -rotate-6" />
        <div className="absolute left-[80%] top-[10%] w-12 h-12 rounded-sm bg-[hsl(120,55%,40%)] opacity-35 rotate-3" />
      </div>

      {/* Clouds */}
      {[
        { x: 10, y: 8, scale: 1 },
        { x: 45, y: 5, scale: 1.3 },
        { x: 75, y: 12, scale: 0.9 },
        { x: 90, y: 7, scale: 0.7 },
      ].map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${cloud.x}%`, top: `${cloud.y}%`, transform: `scale(${cloud.scale})` }}
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
        >
          <div className="flex gap-0">
            <div className="w-8 h-6 rounded-full bg-white/80" />
            <div className="w-10 h-8 rounded-full bg-white/90 -ml-3 -mt-2" />
            <div className="w-8 h-6 rounded-full bg-white/80 -ml-3" />
          </div>
        </motion.div>
      ))}

      {/* Dirt paths connecting zones */}
      <div className="absolute left-[25%] top-1/2 w-[50%] h-2 bg-[hsl(30,40%,55%)] -translate-y-1/2 rounded-full opacity-60" />
      <div className="absolute left-1/2 top-[25%] w-2 h-[50%] bg-[hsl(30,40%,55%)] -translate-x-1/2 rounded-full opacity-60" />

      {/* Spawn pad */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
        <motion.div
          className="w-full h-full rounded-lg border-2 border-[hsl(45,90%,60%)]/60"
          style={{
            backgroundColor: "hsl(45,80%,70%)",
            boxShadow: "inset -4px -4px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.2)",
          }}
          animate={{ boxShadow: [
            "inset -4px -4px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.2)",
            "inset -4px -4px 0 rgba(0,0,0,0.1), 0 4px 20px rgba(255,200,0,0.4)",
            "inset -4px -4px 0 rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.2)",
          ]}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xl">⭐</span>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[120%] font-fredoka text-[10px] text-white font-bold drop-shadow-md pointer-events-none select-none">
        SPAWN
      </div>

      {/* Blocky trees */}
      {[
        { x: 8, y: 35 },
        { x: 92, y: 38 },
        { x: 15, y: 80 },
        { x: 85, y: 75 },
        { x: 50, y: 85 },
      ].map((tree, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ left: `${tree.x}%`, top: `${tree.y}%`, transform: "translate(-50%, -100%)" }}
        >
          {/* Trunk */}
          <div className="mx-auto w-3 h-6 bg-[hsl(25,50%,35%)] rounded-sm" style={{ boxShadow: "inset -2px 0 0 rgba(0,0,0,0.2)" }} />
          {/* Leaves - stacked blocks */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-5 bg-[hsl(130,55%,40%)] rounded-sm" style={{ boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.15)" }} />
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 w-8 h-5 bg-[hsl(130,60%,45%)] rounded-sm" style={{ boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.15)" }} />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-5 h-4 bg-[hsl(130,65%,50%)] rounded-sm" style={{ boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.15)" }} />
        </div>
      ))}

      {/* Zone buildings */}
      {ZONES.map((zone) => (
        <BlockyBuilding key={zone.id} zone={zone} />
      ))}

      {/* Zone hitboxes (invisible) */}
      {ZONES.map((zone) => (
        <div
          key={`hitbox-${zone.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
        />
      ))}
    </div>
  );
}
