import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface GuardianStatueProps {
  passed: boolean;
  shaking: boolean;
}

/** Giant stone guardian that blocks the path. Responds to greetings. */
export function GuardianStatue({ passed, shaking }: GuardianStatueProps) {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const gateRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    // Eye glow
    const eyeColor = passed ? new THREE.Color("#00ff88") : shaking ? new THREE.Color("#ff2200") : new THREE.Color("#ff6600");
    if (eyeLeftRef.current) {
      (eyeLeftRef.current.material as THREE.MeshStandardMaterial).emissive.lerp(eyeColor, delta * 5);
    }
    if (eyeRightRef.current) {
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissive.lerp(eyeColor, delta * 5);
    }

    // Gate slides up when passed
    if (gateRef.current) {
      const targetY = passed ? 6 : 0;
      gateRef.current.position.y = THREE.MathUtils.lerp(gateRef.current.position.y, targetY, delta * 2);
    }

    // Shake effect on the statue
    if (groupRef.current && shaking) {
      groupRef.current.position.x = Math.sin(clock.elapsedTime * 40) * 0.15;
    } else if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, delta * 5);
    }
  });

  return (
    <group position={[0, 0, -8]} ref={groupRef}>
      {/* Gate archway */}
      <mesh position={[-2.5, 3, 0]} castShadow>
        <boxGeometry args={[1, 6, 2]} />
        <meshStandardMaterial color="#5a5a50" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 3, 0]} castShadow>
        <boxGeometry args={[1, 6, 2]} />
        <meshStandardMaterial color="#5a5a50" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[6, 1, 2]} />
        <meshStandardMaterial color="#5a5a50" roughness={0.9} />
      </mesh>

      {/* Sliding gate door */}
      <mesh ref={gateRef} position={[0, 3, 0]} castShadow>
        <boxGeometry args={[4, 6, 0.5]} />
        <meshStandardMaterial color="#4a4a42" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Guardian face on the gate arch */}
      {/* Head */}
      <mesh position={[0, 8, 0.5]} castShadow>
        <boxGeometry args={[3, 2.5, 2]} />
        <meshStandardMaterial color="#6a6a5a" roughness={0.85} />
      </mesh>

      {/* Eyes */}
      <mesh ref={eyeLeftRef} position={[-0.6, 8.3, 1.6]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#333" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.6, 8.3, 1.6]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#333" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>

      {/* Mouth (stoic line) */}
      <mesh position={[0, 7.5, 1.55]}>
        <boxGeometry args={[1.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#3a3a30" />
      </mesh>

      {/* Prompt text */}
      {!passed && (
        <Text
          position={[0, 10.5, 0.5]}
          fontSize={0.35}
          color="#b8a878"
          anchorX="center"
          maxWidth={6}
          textAlign="center"
          font="https://fonts.gstatic.com/s/fredoka/v14/X7nP6b87HGSp0bEqlAfaJg.woff"
        >
          {shaking ? "🗿 TOO LOUD! Speak gently..." : "🗿 Greet the Guardian politely"}
        </Text>
      )}
      {passed && (
        <Text
          position={[0, 10.5, 0.5]}
          fontSize={0.35}
          color="#00ff88"
          anchorX="center"
          font="https://fonts.gstatic.com/s/fredoka/v14/X7nP6b87HGSp0bEqlAfaJg.woff"
        >
          ✅ The Guardian approves!
        </Text>
      )}
    </group>
  );
}
