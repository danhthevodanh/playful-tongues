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

// Mutable animation state readable by useFrame — shared with GameWorld3D's movementState
export const animationState = {
  moving: false,
  rotation: 0,
};

interface PlayerCharacter3DProps {
  position: THREE.Vector3;
  name: string;
  isCurrentPlayer?: boolean;
  rotation?: number;
  moving?: boolean;
  /** If true, read moving/rotation from animationState (mutable) instead of props */
  useAnimationState?: boolean;
}

export function PlayerCharacter3D({ position, name, isCurrentPlayer, rotation = 0, moving = false, useAnimationState = false }: PlayerCharacter3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmPivot = useRef<THREE.Group>(null);
  const rightArmPivot = useRef<THREE.Group>(null);
  const leftLegPivot = useRef<THREE.Group>(null);
  const rightLegPivot = useRef<THREE.Group>(null);
  const bodyBob = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const { camera } = useThree();
  const colors = useMemo(() => nameToColors(name), [name]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const isMoving = useAnimationState ? animationState.moving : moving;
    const targetRotation = useAnimationState ? animationState.rotation : rotation;

    groupRef.current.position.lerp(position, 0.15);

    // Smooth rotation
    currentRotation.current = lerpAngle(currentRotation.current, targetRotation, 0.12);
    groupRef.current.rotation.y = currentRotation.current;

    const t = state.clock.elapsedTime;

    if (isMoving) {
      const swingSpeed = 10;
      const armSwing = Math.sin(t * swingSpeed) * 0.8;
      const legSwing = Math.sin(t * swingSpeed) * 0.6;

      if (leftArmPivot.current) leftArmPivot.current.rotation.x = armSwing;
      if (rightArmPivot.current) rightArmPivot.current.rotation.x = -armSwing;
      if (leftLegPivot.current) leftLegPivot.current.rotation.x = -legSwing;
      if (rightLegPivot.current) rightLegPivot.current.rotation.x = legSwing;

      if (bodyBob.current) {
        bodyBob.current.position.y = Math.abs(Math.sin(t * swingSpeed)) * 0.15;
      }
    } else {
      // Smooth return to idle
      if (leftArmPivot.current) leftArmPivot.current.rotation.x *= 0.85;
      if (rightArmPivot.current) rightArmPivot.current.rotation.x *= 0.85;
      if (leftLegPivot.current) leftLegPivot.current.rotation.x *= 0.85;
      if (rightLegPivot.current) rightLegPivot.current.rotation.x *= 0.85;

      // Idle breathing
      if (bodyBob.current) {
        bodyBob.current.position.y = Math.sin(t * 2) * 0.05;
      }
    }

    // Fixed third-person camera
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
      <group ref={bodyBob}>
        {/* Head */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
        <mesh position={[-0.25, 3.3, 0.61]}>
          <boxGeometry args={[0.2, 0.15, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.25, 3.3, 0.61]}>
          <boxGeometry args={[0.2, 0.15, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 3.0, 0.61]}>
          <boxGeometry args={[0.4, 0.08, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[1.4, 1.6, 0.8]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>

        {/* Left Arm — pivot at shoulder */}
        <group ref={leftArmPivot} position={[-1.1, 2.8, 0]}>
          <mesh position={[0, -0.8, 0]} castShadow>
            <boxGeometry args={[0.5, 1.6, 0.5]} />
            <meshStandardMaterial color={colors.shirt} />
          </mesh>
          <mesh position={[0, -1.7, 0]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
        </group>

        {/* Right Arm — pivot at shoulder */}
        <group ref={rightArmPivot} position={[1.1, 2.8, 0]}>
          <mesh position={[0, -0.8, 0]} castShadow>
            <boxGeometry args={[0.5, 1.6, 0.5]} />
            <meshStandardMaterial color={colors.shirt} />
          </mesh>
          <mesh position={[0, -1.7, 0]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
        </group>

        {/* Left Leg — pivot at hip */}
        <group ref={leftLegPivot} position={[-0.35, 1.2, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow>
            <boxGeometry args={[0.5, 1.2, 0.6]} />
            <meshStandardMaterial color={colors.pants} />
          </mesh>
          <mesh position={[0, -1.25, 0.1]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.7]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>

        {/* Right Leg — pivot at hip */}
        <group ref={rightLegPivot} position={[0.35, 1.2, 0]}>
          <mesh position={[0, -0.6, 0]} castShadow>
            <boxGeometry args={[0.5, 1.2, 0.6]} />
            <meshStandardMaterial color={colors.pants} />
          </mesh>
          <mesh position={[0, -1.25, 0.1]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.7]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>

        {/* Name tag */}
        <Html position={[0, 4.2, 0]} center distanceFactor={25}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm">
            <span className="font-fredoka text-xs font-bold text-white">{name}</span>
          </div>
        </Html>
      </group>
    </group>
  );
}
