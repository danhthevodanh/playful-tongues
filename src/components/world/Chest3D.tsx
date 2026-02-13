import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface Chest3DProps {
  id: string;
  position: [number, number, number];
  isNear: boolean;
  breaking: boolean;
  onBreakComplete: (id: string) => void;
}

export function Chest3D({ id, position, isNear, breaking, onBreakComplete }: Chest3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const [breakProgress, setBreakProgress] = useState(0);
  const timeRef = useRef(0);
  const breakTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    if (breaking) {
      breakTimeRef.current += delta;
      const p = Math.min(breakTimeRef.current / 0.8, 1);
      setBreakProgress(p);

      // Shake
      groupRef.current.position.x = position[0] + Math.sin(breakTimeRef.current * 40) * 0.3 * (1 - p);
      groupRef.current.position.z = position[2] + Math.cos(breakTimeRef.current * 35) * 0.3 * (1 - p);

      // Open lid
      if (lidRef.current) {
        lidRef.current.rotation.x = -p * Math.PI * 0.6;
      }

      // Scale down and fade
      const scale = 1 - p * 0.5;
      groupRef.current.scale.setScalar(scale);

      if (p >= 1) {
        onBreakComplete(id);
      }
    } else {
      // Floating bob animation
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current * 2) * 0.3 + 0.5;
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    }
  });

  if (breakProgress >= 1) return null;

  return (
    <group ref={groupRef} position={[position[0], position[1] + 0.5, position[2]]}>
      {/* Chest body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 1.4]} />
        <meshStandardMaterial color="#8B6914" />
      </mesh>

      {/* Chest trim bands */}
      <mesh position={[0, 0, 0.71]}>
        <boxGeometry args={[2.05, 1.25, 0.05]} />
        <meshStandardMaterial color="#B8860B" />
      </mesh>
      <mesh position={[0, 0, -0.71]}>
        <boxGeometry args={[2.05, 1.25, 0.05]} />
        <meshStandardMaterial color="#B8860B" />
      </mesh>

      {/* Lid - pivots from back edge */}
      <group position={[0, 0.6, -0.7]}>
        <mesh ref={lidRef} position={[0, 0.25, 0.7]} castShadow>
          <boxGeometry args={[2, 0.5, 1.4]} />
          <meshStandardMaterial color="#A07818" />
        </mesh>
      </group>

      {/* Lock */}
      <mesh position={[0, 0.1, 0.72]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
      </mesh>

      {/* Glow light */}
      <pointLight position={[0, 1.5, 0]} color="#FFD700" intensity={isNear ? 3 : 1} distance={6} />

      {/* Sparkle particles - simple floating dots */}
      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const r = 0.8;
        return (
          <mesh key={i} position={[Math.cos(angle + timeRef.current) * r, 1.5 + Math.sin(timeRef.current * 3 + i) * 0.5, Math.sin(angle + timeRef.current) * r]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
          </mesh>
        );
      })}

      {/* Label when near */}
      {isNear && !breaking && (
        <Html position={[0, 2.5, 0]} center distanceFactor={30}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 backdrop-blur-sm border border-yellow-500/30">
            <span className="font-fredoka text-sm font-bold text-yellow-300">🎤 Shout BREAK!</span>
          </div>
        </Html>
      )}
    </group>
  );
}
