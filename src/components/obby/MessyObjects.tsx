import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface MessyObjectsProps {
  tidiedCount: number;
  onFocusObject: (index: number) => void;
  focusedIndex: number | null;
}

interface ObjectData {
  type: "book" | "shoes" | "scroll";
  label: string;
  voiceCommand: string;
  scatteredPos: THREE.Vector3;
  scatteredRot: THREE.Euler;
  tidyPos: THREE.Vector3;
  tidyRot: THREE.Euler;
  color: string;
  tidyColor: string;
}

/** 3D messy objects (books, shoes, scroll) that fly to correct positions on voice command */
export function MessyObjects({ tidiedCount, onFocusObject, focusedIndex }: MessyObjectsProps) {
  const objects = useMemo<ObjectData[]>(() => [
    {
      type: "book",
      label: "📚 Messy Books",
      voiceCommand: "Put the books on the shelf",
      scatteredPos: new THREE.Vector3(4, 0.2, -3),
      scatteredRot: new THREE.Euler(0.3, 0.8, -0.2),
      tidyPos: new THREE.Vector3(8, 2.5, -6),
      tidyRot: new THREE.Euler(0, 0, 0),
      color: "#8B4513",
      tidyColor: "#a0522d",
    },
    {
      type: "shoes",
      label: "👟 Scattered Shoes",
      voiceCommand: "Put the shoes on the shelf",
      scatteredPos: new THREE.Vector3(-3, 0.15, 4),
      scatteredRot: new THREE.Euler(0, 1.2, 0.1),
      tidyPos: new THREE.Vector3(8, 1, -6),
      tidyRot: new THREE.Euler(0, 0, 0),
      color: "#4a4a4a",
      tidyColor: "#5a5a5a",
    },
    {
      type: "scroll",
      label: "📜 Fallen Scroll",
      voiceCommand: "Roll up the scroll",
      scatteredPos: new THREE.Vector3(2, 0.1, 5),
      scatteredRot: new THREE.Euler(Math.PI / 2, 0.5, 0.3),
      tidyPos: new THREE.Vector3(8, 3.5, -6),
      tidyRot: new THREE.Euler(0, 0, Math.PI / 2),
      color: "#d4c5a0",
      tidyColor: "#e8d9b0",
    },
  ], []);

  const meshRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    objects.forEach((obj, i) => {
      const group = meshRefs.current[i];
      if (!group) return;

      const isTidied = i < tidiedCount;
      const targetPos = isTidied ? obj.tidyPos : obj.scatteredPos;
      const targetRot = isTidied ? obj.tidyRot : obj.scatteredRot;

      group.position.lerp(targetPos, delta * (isTidied ? 3 : 0.01));
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRot.x, delta * 3);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRot.y, delta * 3);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRot.z, delta * 3);
    });
  });

  return (
    <group>
      {/* Shelf (target location) */}
      <group position={[8, 0, -6]}>
        {/* Shelf frame */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[3, 4, 0.8]} />
          <meshStandardMaterial color="#6b5b3a" roughness={0.8} />
        </mesh>
        {/* Shelf levels */}
        {[1, 2, 3].map(level => (
          <mesh key={level} position={[0, level, 0.1]}>
            <boxGeometry args={[2.6, 0.1, 0.6]} />
            <meshStandardMaterial color="#7a6a4a" roughness={0.7} />
          </mesh>
        ))}
        <Text
          position={[0, 4.5, 0]}
          fontSize={0.3}
          color="#b8a878"
          anchorX="center"
          font="https://fonts.gstatic.com/s/fredoka/v14/X7nP6b87HGSp0bEqlAfaJg.woff"
        >
          Sacred Shelf
        </Text>
      </group>

      {objects.map((obj, i) => {
        const isTidied = i < tidiedCount;
        const isFocused = focusedIndex === i;

        return (
          <group
            key={obj.type}
            ref={(el) => { meshRefs.current[i] = el; }}
            position={obj.scatteredPos.clone()}
            rotation={obj.scatteredRot.clone()}
            onClick={() => !isTidied && onFocusObject(i)}
          >
            {/* Object mesh */}
            {obj.type === "book" && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.8, 0.15, 1.1]} />
                  <meshStandardMaterial color={isTidied ? obj.tidyColor : obj.color} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.15, 0]} castShadow>
                  <boxGeometry args={[0.75, 0.12, 1.0]} />
                  <meshStandardMaterial color="#2d5a1e" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.27, 0]} castShadow>
                  <boxGeometry args={[0.7, 0.1, 0.95]} />
                  <meshStandardMaterial color="#1a3a6e" roughness={0.6} />
                </mesh>
              </group>
            )}
            {obj.type === "shoes" && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.3, 0.2, 0.7]} />
                  <meshStandardMaterial color={isTidied ? obj.tidyColor : obj.color} roughness={0.5} />
                </mesh>
                <mesh position={[0.5, 0.05, 0.3]} rotation={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[0.3, 0.2, 0.7]} />
                  <meshStandardMaterial color={isTidied ? obj.tidyColor : obj.color} roughness={0.5} />
                </mesh>
              </group>
            )}
            {obj.type === "scroll" && (
              <mesh castShadow>
                <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
                <meshStandardMaterial color={isTidied ? obj.tidyColor : obj.color} roughness={0.4} />
              </mesh>
            )}

            {/* Highlight ring when focused */}
            {isFocused && !isTidied && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <ringGeometry args={[0.8, 1.0, 32]} />
                <meshBasicMaterial color="#ffd700" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Label */}
            {!isTidied && (
              <Text
                position={[0, 1, 0]}
                fontSize={0.2}
                color={isFocused ? "#ffd700" : "#cccccc"}
                anchorX="center"
                font="https://fonts.gstatic.com/s/fredoka/v14/X7nP6b87HGSp0bEqlAfaJg.woff"
              >
                {obj.label}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}
