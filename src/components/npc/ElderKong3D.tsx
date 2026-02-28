import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ElderMood } from "./useIslandState";

const SAD_COLOR = new THREE.Color("#777777");
const HOPEFUL_COLOR = new THREE.Color("#b08050");
const HAPPY_COLOR = new THREE.Color("#d4915e");
const SKIN_SAD = new THREE.Color("#999999");
const SKIN_HAPPY = new THREE.Color("#e8b88a");

export function ElderKong3D({ mood }: { mood: ElderMood }) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const skinMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const targetColor = mood === "happy" ? HAPPY_COLOR : mood === "hopeful" ? HOPEFUL_COLOR : SAD_COLOR;
  const targetSkin = mood === "happy" ? SKIN_HAPPY : mood === "hopeful" ? new THREE.Color("#c0a080") : SKIN_SAD;
  const targetRotX = mood === "sad" ? 0.15 : 0;
  const targetBounce = mood === "happy" ? 1 : 0;

  useFrame(({ clock }, delta) => {
    if (bodyMatRef.current) bodyMatRef.current.color.lerp(targetColor, delta * 2);
    if (skinMatRef.current) skinMatRef.current.color.lerp(targetSkin, delta * 2);
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2);
      if (mood === "happy") {
        groupRef.current.position.y = Math.sin(clock.elapsedTime * 3) * 0.1;
      } else {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 2);
      }
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.8, 1, 0.5]} />
          <meshStandardMaterial ref={bodyMatRef} color="#777777" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.5]} />
          <meshStandardMaterial ref={skinMatRef} color="#999999" />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.55, 1.2, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#777777" />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.55, 1.2, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#777777" />
        </mesh>
        {/* Left leg */}
        <mesh position={[-0.2, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.35]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.2, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.35]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 2.15, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0.12, 2.15, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </group>
      <Html position={[0, 2.8, 0]} center distanceFactor={8}>
        <div style={{ color: "white", fontFamily: "Fredoka, sans-serif", fontSize: "14px", textShadow: "0 1px 4px rgba(0,0,0,0.8)", whiteSpace: "nowrap" }}>
          Elder Kong 🧙‍♂️
        </div>
      </Html>
    </group>
  );
}
