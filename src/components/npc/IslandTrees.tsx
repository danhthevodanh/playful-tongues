import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TREE_POSITIONS: [number, number, number][] = [
  [-5, 0, -4],
  [4, 0, -6],
  [-7, 0, 2],
  [6, 0, 1],
  [-3, 0, 5],
  [3, 0, 7],
];

function BlockyTree({ position, index, transformed }: { position: [number, number, number]; index: number; transformed: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (transformed) {
      if (startTime.current === null) startTime.current = clock.elapsedTime + index * 0.15;
      const elapsed = clock.elapsedTime - startTime.current;
      if (elapsed > 0) {
        const s = Math.min(1, elapsed * 2);
        groupRef.current.scale.set(s, s, s);
      }
    } else {
      groupRef.current.scale.set(0, 0, 0);
      startTime.current = null;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[0, 0, 0]}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.4, 2, 0.4]} />
        <meshStandardMaterial color="#6b4226" />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[1.8, 1, 1.8]} />
        <meshStandardMaterial color="#2d8a2e" />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#3aad3b" />
      </mesh>
      <mesh position={[0, 3.9, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#4bc94c" />
      </mesh>
    </group>
  );
}

export function IslandTrees({ transformed }: { transformed: boolean }) {
  return (
    <>
      {TREE_POSITIONS.map((pos, i) => (
        <BlockyTree key={i} position={pos} index={i} transformed={transformed} />
      ))}
    </>
  );
}
