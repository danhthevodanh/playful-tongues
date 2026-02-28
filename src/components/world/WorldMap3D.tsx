import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Html } from "@react-three/drei";

// ─── Island definitions ────────────────────────────────────────────────────
export const ISLANDS = [
  { id: "spawn", center: [0, 0, 0] as [number, number, number], half: [25, 25] as [number, number] },
  { id: "npc", center: [-70, 0, 0] as [number, number, number], half: [28, 28] as [number, number] },
  { id: "chest", center: [70, 0, 0] as [number, number, number], half: [28, 28] as [number, number] },
];

// Bridge gap: spawn ends at x=±25, npc/chest start at x=±42 → ~17u gap, mid at ±33.5
export const BRIDGE_DEFS = [
  { id: "left-bridge", midX: -33.5, midZ: 0, length: 17 },
  { id: "right-bridge", midX: 33.5, midZ: 0, length: 17 },
];

// Zone buildings positioned on their islands
export const ZONE_BUILDINGS = [
  { id: "npc", label: "NPC Hut", icon: "🧙‍♂️", color: "#e8913a", position: [-78, 0, -10] as [number, number, number] },
  { id: "pet", label: "Pet Garden", icon: "🐾", color: "#7c4dcc", position: [-65, 0, 14] as [number, number, number] },
  { id: "obby", label: "Chest Vault", icon: "🏆", color: "#3dbf8f", position: [70, 0, 0] as [number, number, number] },
];

// ─── Land collision helper (used by PlayerController) ─────────────────────
export function isOnLand(x: number, z: number, bridges: Record<string, string>): boolean {
  for (const island of ISLANDS) {
    const [cx, , cz] = island.center;
    if (Math.abs(x - cx) <= island.half[0] && Math.abs(z - cz) <= island.half[1]) return true;
  }
  for (const b of BRIDGE_DEFS) {
    if (bridges[b.id] !== "solid") continue;
    if (Math.abs(x - b.midX) <= b.length / 2 + 1 && Math.abs(z - b.midZ) <= 3) return true;
  }
  return false;
}

// ─── Ocean ─────────────────────────────────────────────────────────────────
function Ocean() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(() => {
    if (matRef.current) {
      matRef.current.color.setHSL(0.57, 0.72, 0.33 + Math.sin(Date.now() * 0.0009) * 0.025);
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial ref={matRef} color="#1a6fa0" metalness={0.15} roughness={0.3} />
    </mesh>
  );
}

// ─── Island platform ───────────────────────────────────────────────────────
function IslandPlatform({ island }: { island: typeof ISLANDS[0] }) {
  const [cx, , cz] = island.center;
  const [hx, hz] = island.half;
  return (
    <group position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        <meshStandardMaterial color="#4a9e3f" />
      </mesh>
      <mesh position={[0, -1.6, 0]}>
        <boxGeometry args={[hx * 2, 3.2, hz * 2]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>
    </group>
  );
}

// ─── Bridge-gap sign ───────────────────────────────────────────────────────
function BridgeEdgeSign({ x, z }: { x: number; z: number }) {
  return (
    <Html position={[x, 2.5, z]} center distanceFactor={38}>
      <div className="pointer-events-none select-none text-center animate-bounce">
        <div className="rounded-xl bg-indigo-950/90 px-3 py-1.5 border-2 border-yellow-400 shadow-xl">
          <div className="text-xl">🌉</div>
          <div className="font-fredoka text-xs font-bold text-yellow-200 whitespace-nowrap">Say "Bridge!"</div>
        </div>
      </div>
    </Html>
  );
}

// ─── Blocky building ───────────────────────────────────────────────────────
function BlockyBuilding({ color, position, label, icon }: { color: string; position: [number, number, number]; label: string; icon: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[10, 2, 10]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
      </mesh>
      <mesh position={[0, 1.5, 4.01]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      <mesh position={[-2, 5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#a8d8ea" />
      </mesh>
      <mesh position={[2, 5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#a8d8ea" />
      </mesh>
      <Html position={[0, 13, 0]} center distanceFactor={40}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-black/70 px-3 py-1 backdrop-blur-sm">
          <span className="text-lg">{icon}</span>
          <span className="ml-1 font-fredoka text-sm font-bold text-white">{label}</span>
        </div>
      </Html>
    </group>
  );
}

// ─── Tree ──────────────────────────────────────────────────────────────────
function BlockyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 4, 6]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial color="#2d8a4e" />
      </mesh>
      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color="#3aad5c" />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#4cc96e" />
      </mesh>
    </group>
  );
}

// ─── Spawn pad ─────────────────────────────────────────────────────────────
function SpawnPad() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 8]} />
        <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={0.3} />
      </mesh>
      <Html position={[0, 0.5, 0]} center distanceFactor={30}>
        <div className="pointer-events-none select-none font-fredoka text-xs font-bold text-white drop-shadow-md">⭐ SPAWN</div>
      </Html>
    </group>
  );
}

// ─── Tree positions per island ─────────────────────────────────────────────
const TREES: [number, number, number][] = [
  // Spawn
  [-18, 0, -18], [16, 0, -20], [-20, 0, 16], [18, 0, 18],
  // NPC island
  [-80, 0, -20], [-60, 0, -24], [-85, 0, 6], [-58, 0, 20],
  // Chest island
  [80, 0, -20], [58, 0, -24], [85, 0, 6], [60, 0, 20],
];

// ─── WorldMap3D ────────────────────────────────────────────────────────────
export function WorldMap3D() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[60, 80, 40]} intensity={1.2} castShadow shadow-mapSize={1024} />
      <Sky sunPosition={[100, 45, 100]} turbidity={1.5} rayleigh={0.4} />

      <Ocean />

      {ISLANDS.map((island) => <IslandPlatform key={island.id} island={island} />)}

      {/* Bridge-edge signs near the water gaps */}
      <BridgeEdgeSign x={-27} z={0} />
      <BridgeEdgeSign x={27} z={0} />

      <SpawnPad />

      {ZONE_BUILDINGS.map((z) => (
        <BlockyBuilding key={z.id} color={z.color} position={z.position} label={z.label} icon={z.icon} />
      ))}

      {TREES.map((pos, i) => <BlockyTree key={i} position={pos} />)}

      {/* Activation Zones (Magic Pads) */}
      <mesh position={[-37.5, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[45, 12]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} />
      </mesh>
      <mesh position={[37.5, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[45, 12]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} />
      </mesh>
    </>
  );
}
