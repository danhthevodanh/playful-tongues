import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Volumetric-ish grey mist that fades when all puzzles are complete */
export function TempleMist({ clearing }: { clearing: boolean }) {
  const { scene } = useThree();
  const fogRef = useRef({ density: 0.04 });

  useFrame((_, delta) => {
    const target = clearing ? 0.005 : 0.04;
    fogRef.current.density = THREE.MathUtils.lerp(fogRef.current.density, target, delta * 1.5);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = fogRef.current.density;
    }

    // Shift fog color from grey to golden
    if (scene.fog) {
      const fogColor = scene.fog.color;
      const targetColor = clearing ? new THREE.Color("#ffeebb") : new THREE.Color("#666666");
      fogColor.lerp(targetColor, delta * 1.5);
    }
  });

  // Set fog on mount
  useFrame(() => {
    if (!scene.fog) {
      scene.fog = new THREE.FogExp2("#666666", 0.04);
    }
  });

  // Mist particles
  const particlesRef = useRef<THREE.Points>(null);
  const particleData = useRef(
    Array.from({ length: 200 }).map(() => ({
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 6,
      z: (Math.random() - 0.5) * 40,
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    }))
  );

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const positions = particlesRef.current.geometry.attributes.position;
    if (!positions) return;

    const opacity = clearing ? 0.05 : 0.3;
    const mat = particlesRef.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, 0.02);

    particleData.current.forEach((p, i) => {
      const y = p.y + Math.sin(clock.elapsedTime * p.speed + p.offset) * 0.5;
      positions.setXYZ(i, p.x, y, p.z);
    });
    positions.needsUpdate = true;
  });

  const positions = new Float32Array(200 * 3);
  particleData.current.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={200}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aaaaaa"
        size={0.4}
        transparent
        opacity={0.3}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
