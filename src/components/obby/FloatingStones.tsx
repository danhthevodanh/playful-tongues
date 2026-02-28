import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FloatingStonesProps {
  aligned: boolean;
}

/** Scattered floating stones that align into a bridge when voice-triggered */
export function FloatingStones({ aligned }: FloatingStonesProps) {
  const stonesRef = useRef<THREE.Group>(null);

  // Scattered positions (messy) and target bridge positions (aligned)
  const stoneData = useMemo(() => {
    const bridgeStart = new THREE.Vector3(-12, 0.5, 0);
    const bridgeEnd = new THREE.Vector3(-20, 0.5, 0);
    const count = 6;

    return Array.from({ length: count }).map((_, i) => {
      const t = i / (count - 1);
      const target = new THREE.Vector3().lerpVectors(bridgeStart, bridgeEnd, t);
      // Messy scattered positions around the gap
      const scattered = new THREE.Vector3(
        -16 + (Math.random() - 0.5) * 10,
        2 + Math.random() * 4,
        (Math.random() - 0.5) * 12
      );
      const scatteredRot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      return {
        scattered,
        scatteredRot,
        target,
        targetRot: new THREE.Euler(0, 0, 0),
        floatOffset: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  // Per-stone refs for smooth animation
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }, delta) => {
    stoneData.forEach((stone, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;

      const targetPos = aligned ? stone.target : stone.scattered;
      const targetRot = aligned ? stone.targetRot : stone.scatteredRot;
      const speed = aligned ? 2 : 0;

      // Lerp position
      mesh.position.lerp(targetPos, delta * (aligned ? 2.5 : 0.01));

      // Lerp rotation
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot.x, delta * 2.5);
      mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRot.y, delta * 2.5);
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRot.z, delta * 2.5);

      // Floating bob when scattered
      if (!aligned) {
        mesh.position.y += Math.sin(clock.elapsedTime + stone.floatOffset) * 0.005;
      }
    });
  });

  return (
    <group ref={stonesRef}>
      {/* The gap in the platform edge */}
      <mesh position={[-16, -0.5, 0]}>
        <boxGeometry args={[10, 0.1, 4]} />
        <meshStandardMaterial color="#3a3a35" roughness={1} transparent opacity={0.3} />
      </mesh>

      {stoneData.map((stone, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          position={stone.scattered.clone()}
          rotation={stone.scatteredRot.clone()}
          castShadow
        >
          <boxGeometry args={[1.8, 0.5, 2.5]} />
          <meshStandardMaterial
            color={aligned ? "#b8a878" : "#7a7a70"}
            roughness={0.7}
            emissive={aligned ? "#ffd700" : "#000000"}
            emissiveIntensity={aligned ? 0.15 : 0}
          />
        </mesh>
      ))}

      {/* Glowing particles when aligning */}
      {aligned && (
        <pointLight position={[-16, 2, 0]} color="#ffd700" intensity={2} distance={15} />
      )}
    </group>
  );
}
