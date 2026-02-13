import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function nameToColors(name: string) {
  const h = Math.abs(hashCode(name));
  const shirtHue = h % 360;
  const skinTones = ["#f5c5a3", "#e8b58a", "#c68c5b", "#a0674b", "#6b4226"];
  const skin = skinTones[h % skinTones.length];
  const shirt = `hsl(${shirtHue}, 70%, 55%)`;
  const pants = `hsl(${(shirtHue + 120) % 360}, 50%, 35%)`;
  return { skin, shirt, pants };
}

function lerpAngle(a: number, b: number, t: number) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

interface PlayerCharacter3DProps {
  position: THREE.Vector3;
  name: string;
  isCurrentPlayer?: boolean;
  rotation?: number;
  moving?: boolean;
}

export function PlayerCharacter3D({ position, name, isCurrentPlayer, rotation = 0, moving = false }: PlayerCharacter3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const currentRotation = useRef(0);
  const { camera } = useThree();
  const colors = useMemo(() => nameToColors(name), [name]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth position
    groupRef.current.position.lerp(position, 0.15);

    // Smooth rotation
    currentRotation.current = lerpAngle(currentRotation.current, rotation, 0.12);
    groupRef.current.rotation.y = currentRotation.current;

    // Arm/leg swing animation
    const swing = moving ? Math.sin(state.clock.elapsedTime * 8) * 0.6 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;

    // Fixed third-person camera (doesn't rotate with player)
    if (isCurrentPlayer) {
      const targetCamPos = new THREE.Vector3(
        groupRef.current.position.x,
        groupRef.current.position.y + 14,
        groupRef.current.position.z + 18
      );
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(
        groupRef.current.position.x,
        groupRef.current.position.y + 1,
        groupRef.current.position.z
      );
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Head */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.25, 3.3, 0.61]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.25, 3.3, 0.61]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1.4, 1.6, 0.8]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-1.1, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 1.6, 0.5]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>
      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[1.1, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 1.6, 0.5]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.6]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.6]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>

      {/* Name tag */}
      <Html position={[0, 4.2, 0]} center distanceFactor={25}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm">
          <span className="font-fredoka text-xs font-bold text-white">{name}</span>
        </div>
      </Html>
    </group>
  );
}
