import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PlayerCharacter3D } from "./PlayerCharacter3D";

interface OtherPlayer3DProps {
  x: number;
  z: number;
  name: string;
}

export function OtherPlayer3D({ x, z, name }: OtherPlayer3DProps) {
  const targetPos = useRef(new THREE.Vector3(x, 0, z));
  const currentPos = useRef(new THREE.Vector3(x, 0, z));
  const prevPos = useRef(new THREE.Vector3(x, 0, z));
  const rotation = useRef(0);
  const moving = useRef(false);

  // Update target when props change
  targetPos.current.set(x, 0, z);

  useFrame(() => {
    prevPos.current.copy(currentPos.current);
    currentPos.current.lerp(targetPos.current, 0.1);

    const dx = currentPos.current.x - prevPos.current.x;
    const dz = currentPos.current.z - prevPos.current.z;
    moving.current = Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001;
    if (moving.current) {
      rotation.current = Math.atan2(dx, dz);
    }
  });

  return (
    <PlayerCharacter3D
      position={currentPos.current}
      name={name}
      rotation={rotation.current}
      moving={moving.current}
    />
  );
}
