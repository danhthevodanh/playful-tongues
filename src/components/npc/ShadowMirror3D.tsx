import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export function ShadowMirror3D({
  hasCape,
  onApproach,
}: {
  hasCape: boolean;
  onApproach: (near: boolean) => void;
}) {
  const [isNear, setIsNear] = useState(true); // always show prompt for simplicity
  const particlesRef = useRef<THREE.Points>(null);
  const frameMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (hasCape && particlesRef.current) {
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.3;
      particlesRef.current.rotation.y += delta * 0.5;
    }
    if (frameMatRef.current) {
      const glow = hasCape ? new THREE.Color("#ffd700") : new THREE.Color("#333333");
      frameMatRef.current.emissive.lerp(glow, delta * 2);
    }
  });

  // Sparkle particles
  const sparklePositions = useRef(
    new Float32Array(
      Array.from({ length: 30 * 3 }, () => (Math.random() - 0.5) * 2)
    )
  );

  return (
    <group position={[7, 0, -2]}>
      {/* Frame */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[2.2, 3.6, 0.15]} />
        <meshStandardMaterial ref={frameMatRef} color="#2a2a2a" emissive="#000000" emissiveIntensity={0.3} />
      </mesh>
      {/* Mirror surface */}
      <mesh position={[0, 2, 0.08]}>
        <boxGeometry args={[1.8, 3, 0.05]} />
        <meshStandardMaterial color="#88aacc" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Sparkles when cape claimed */}
      {hasCape && (
        <points ref={particlesRef} position={[0, 2, 0.5]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[sparklePositions.current, 3]}
              count={30}
            />
          </bufferGeometry>
          <pointsMaterial color="#ffd700" size={0.1} transparent opacity={0.5} depthWrite={false} />
        </points>
      )}

      {/* Prompt */}
      {!hasCape && (
        <Html position={[0, 4.2, 0]} center distanceFactor={10}>
          <div style={{
            background: "rgba(0,0,0,0.7)",
            color: "#ffd700",
            padding: "6px 12px",
            borderRadius: "8px",
            fontFamily: "Fredoka, sans-serif",
            fontSize: "12px",
            textAlign: "center",
            maxWidth: "180px",
          }}>
            🪞 Hold V near the mirror and speak a positive affirmation
          </div>
        </Html>
      )}
      {hasCape && (
        <Html position={[0, 4.2, 0]} center distanceFactor={10}>
          <div style={{
            background: "rgba(0,0,0,0.7)",
            color: "#ffd700",
            padding: "6px 12px",
            borderRadius: "8px",
            fontFamily: "Fredoka, sans-serif",
            fontSize: "12px",
          }}>
            ✨ Kindness Cape Claimed!
          </div>
        </Html>
      )}
    </group>
  );
}
