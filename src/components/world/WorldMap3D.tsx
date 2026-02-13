import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Sky, Html, Grid } from "@react-three/drei";

const ZONE_BUILDINGS = [
  { id: "npc", label: "NPC Hut", icon: "🧙‍♂️", color: "#e8913a", position: [-30, 0, -30] as [number, number, number] },
  { id: "prop-hunt", label: "Prop Hunt", icon: "🔍", color: "#d94fa0", position: [30, 0, -30] as [number, number, number] },
  { id: "pet", label: "Pet Garden", icon: "🐾", color: "#7c4dcc", position: [-30, 0, 30] as [number, number, number] },
  { id: "obby", label: "Obby Track", icon: "🏃", color: "#3dbf8f", position: [30, 0, 30] as [number, number, number] },
];

export { ZONE_BUILDINGS };

function BlockyBuilding({ color, position, label, icon }: { color: string; position: [number, number, number]; label: string; icon: string }) {
  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[10, 2, 10]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.5, 4.01]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      {/* Windows */}
      <mesh position={[-2, 5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#a8d8ea" />
      </mesh>
      <mesh position={[2, 5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial color="#a8d8ea" />
      </mesh>
      {/* Label */}
      <Html position={[0, 12, 0]} center distanceFactor={40}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-black/70 px-3 py-1 backdrop-blur-sm">
          <span className="text-lg">{icon}</span>
          <span className="ml-1 font-fredoka text-sm font-bold text-white">{label}</span>
        </div>
      </Html>
    </group>
  );
}

function BlockyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 4, 6]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      {/* Leaves - stacked boxes */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial color="#2d8a4e" />
      </mesh>
      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color="#3aad5c" />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color="#4cc96e" />
      </mesh>
    </group>
  );
}

function SpawnPad() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 8]} />
        <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={0.3} />
      </mesh>
      <Html position={[0, 0.5, 0]} center distanceFactor={30}>
        <div className="pointer-events-none select-none font-fredoka text-xs font-bold text-white drop-shadow-md">
          ⭐ SPAWN
        </div>
      </Html>
    </group>
  );
}

function DirtPath({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const midX = (from[0] + to[0]) / 2;
  const midZ = (from[2] + to[2]) / 2;
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={[midX, 0.02, midZ]} rotation={[-Math.PI / 2, 0, angle]}>
      <planeGeometry args={[2.5, length]} />
      <meshStandardMaterial color="#a0764a" />
    </mesh>
  );
}

const TREE_POSITIONS: [number, number, number][] = [
  [-15, 0, -10], [10, 0, -20], [-20, 0, 15], [20, 0, 10],
  [-45, 0, -45], [45, 0, -45], [-45, 0, 45], [45, 0, 45],
  [-50, 0, 0], [50, 0, 0], [0, 0, -50], [0, 0, 50],
  [-60, 0, -20], [60, 0, 20], [-25, 0, -60], [25, 0, 60],
  [-70, 0, 30], [70, 0, -30], [-10, 0, 70], [10, 0, -70],
  [-80, 0, -80], [80, 0, 80], [-80, 0, 80], [80, 0, -80],
];

export function WorldMap3D() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 80, 50]} intensity={1} castShadow shadow-mapSize={1024} />

      {/* Sky */}
      <Sky sunPosition={[100, 60, 100]} turbidity={2} rayleigh={0.5} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4a9e3f" />
      </mesh>

      {/* Grid overlay */}
      <Grid
        position={[0, 0.01, 0]}
        args={[200, 200]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#3d8a35"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#357a2e"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Spawn pad */}
      <SpawnPad />

      {/* Dirt paths from spawn to each zone */}
      {ZONE_BUILDINGS.map((z) => (
        <DirtPath key={z.id} from={[0, 0, 0]} to={z.position} />
      ))}

      {/* Zone buildings */}
      {ZONE_BUILDINGS.map((z) => (
        <BlockyBuilding key={z.id} color={z.color} position={z.position} label={z.label} icon={z.icon} />
      ))}

      {/* Trees */}
      {TREE_POSITIONS.map((pos, i) => (
        <BlockyTree key={i} position={pos} />
      ))}
    </>
  );
}
