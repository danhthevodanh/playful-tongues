import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** The main floating temple island platform */
export function TemplePlatform({ complete }: { complete: boolean }) {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (glowRef.current) {
      const target = complete ? 3 : 0.5;
      glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, target, delta * 2);
    }
  });

  return (
    <group>
      {/* Main platform */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <cylinderGeometry args={[18, 20, 2, 8]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.8} />
      </mesh>

      {/* Temple pillars */}
      {[[-6, 0, -6], [6, 0, -6], [-6, 0, 6], [6, 0, 6]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.6, 6, 8]} />
            <meshStandardMaterial color="#8a8a7a" roughness={0.7} />
          </mesh>
          {/* Pillar cap */}
          <mesh position={[0, 6.2, 0]}>
            <boxGeometry args={[1.4, 0.4, 1.4]} />
            <meshStandardMaterial color="#9a9a8a" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Temple roof beams */}
      <mesh position={[0, 6.5, -6]} castShadow>
        <boxGeometry args={[14, 0.3, 0.8]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 6.5, 6]} castShadow>
        <boxGeometry args={[14, 0.3, 0.8]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.7} />
      </mesh>

      {/* Floor tiles */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#5a5a52" roughness={0.9} />
      </mesh>

      {/* Altar in center */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.6} />
      </mesh>

      {/* Golden glow light (intensifies when complete) */}
      <pointLight
        ref={glowRef}
        position={[0, 4, 0]}
        color="#ffd700"
        intensity={0.5}
        distance={30}
      />

      {/* Floating debris under the platform */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 22 + Math.random() * 5;
        return (
          <FloatingRock
            key={i}
            position={[Math.cos(angle) * r, -3 - Math.random() * 4, Math.sin(angle) * r]}
            scale={0.5 + Math.random() * 1.5}
          />
        );
      })}
    </group>
  );
}

function FloatingRock({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5 + offset.current) * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <dodecahedronGeometry args={[scale, 0]} />
      <meshStandardMaterial color="#555550" roughness={0.9} />
    </mesh>
  );
}
