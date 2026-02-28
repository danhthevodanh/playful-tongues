import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DARK = new THREE.Color("#3a3a3a");
const GREEN = new THREE.Color("#4a9e3f");

export function IslandGround({ transformed }: { transformed: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const target = transformed ? GREEN : DARK;

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.color.lerp(target, delta * 1.5);
      if (transformed) {
        matRef.current.emissive.lerp(new THREE.Color("#443300"), delta * 0.5);
        matRef.current.emissiveIntensity = THREE.MathUtils.lerp(matRef.current.emissiveIntensity, 0.15, delta);
      }
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[12, 48]} />
      <meshStandardMaterial ref={matRef} color="#3a3a3a" roughness={0.9} />
    </mesh>
  );
}
