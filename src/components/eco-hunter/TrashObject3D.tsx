import { useRef } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type TrashType = "bottle" | "can" | "bag" | "box" | "tire";

const TRASH_CONFIGS: Record<TrashType, { color: string; geometry: [number, number, number]; emoji: string }> = {
  bottle: { color: "#4a9eff", geometry: [0.3, 1.2, 0.3], emoji: "🍶" },
  can: { color: "#c0c0c0", geometry: [0.4, 0.6, 0.4], emoji: "🥫" },
  bag: { color: "#f5f5dc", geometry: [0.8, 0.5, 0.6], emoji: "🛍️" },
  box: { color: "#8b6914", geometry: [0.7, 0.5, 0.7], emoji: "📦" },
  tire: { color: "#333", geometry: [0.8, 0.3, 0.8], emoji: "⭕" },
};

export const TRASH_TYPES: TrashType[] = ["bottle", "can", "bag", "box", "tire"];

interface TrashObject3DProps {
  position: [number, number, number];
  type: TrashType;
  isMonster?: boolean;
  isHighlighted?: boolean;
  onRecycle?: () => void;
}

export function TrashObject3D({ position, type, isHighlighted }: TrashObject3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = TRASH_CONFIGS[type];

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, config.geometry[1] / 2, 0]} castShadow>
        <boxGeometry args={config.geometry} />
        <meshStandardMaterial
          color={isHighlighted ? "#ffff00" : config.color}
          emissive={isHighlighted ? "#ffff00" : "#000000"}
          emissiveIntensity={isHighlighted ? 0.3 : 0}
        />
      </mesh>
      <Html position={[0, config.geometry[1] + 0.3, 0]} center distanceFactor={20}>
        <span className="pointer-events-none select-none text-lg">{config.emoji}</span>
      </Html>
    </group>
  );
}
