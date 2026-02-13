import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Chest3D } from "./Chest3D";
import { ZONE_BUILDINGS } from "./WorldMap3D";

interface ChestData {
  id: string;
  position: [number, number, number];
}

// Shared state for reading from outside Canvas
export const chestProximityState = {
  nearestChestId: null as string | null,
};

function generateChestPositions(count: number): ChestData[] {
  const chests: ChestData[] = [];
  const buildingPositions = ZONE_BUILDINGS.map(z => z.position);
  let attempts = 0;

  while (chests.length < count && attempts < 200) {
    attempts++;
    const x = (Math.random() - 0.5) * 140; // -70 to 70
    const z = (Math.random() - 0.5) * 140;

    // Avoid spawn area
    if (Math.sqrt(x * x + z * z) < 10) continue;

    // Avoid buildings
    const tooCloseToBuilding = buildingPositions.some(bp => {
      const dx = x - bp[0];
      const dz = z - bp[2];
      return Math.sqrt(dx * dx + dz * dz) < 15;
    });
    if (tooCloseToBuilding) continue;

    chests.push({
      id: `chest-${Date.now()}-${chests.length}`,
      position: [x, 0, z],
    });
  }

  return chests;
}

interface ChestManagerProps {
  playerPos: { x: number; z: number };
  onChestBreak: () => void;
}

export function ChestManager({ playerPos, onChestBreak }: ChestManagerProps) {
  const [chests, setChests] = useState<ChestData[]>(() => generateChestPositions(6));
  const [breakingId, setBreakingId] = useState<string | null>(null);
  const [nearestId, setNearestId] = useState<string | null>(null);
  const respawnTimer = useRef(0);

  const PROXIMITY = 6;

  useFrame((_, delta) => {
    // Check proximity
    let closest: string | null = null;
    let closestDist = Infinity;

    for (const chest of chests) {
      const dx = playerPos.x - chest.position[0];
      const dz = playerPos.z - chest.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < PROXIMITY && dist < closestDist) {
        closest = chest.id;
        closestDist = dist;
      }
    }

    setNearestId(closest);
    chestProximityState.nearestChestId = closest;

    // Respawn timer
    respawnTimer.current += delta;
    if (respawnTimer.current > 30) {
      respawnTimer.current = 0;
      setChests(prev => {
        if (prev.length < 6) {
          const newChests = generateChestPositions(6 - prev.length);
          return [...prev, ...newChests];
        }
        return prev;
      });
    }
  });

  const handleBreakComplete = useCallback((id: string) => {
    setChests(prev => prev.filter(c => c.id !== id));
    setBreakingId(null);
    onChestBreak();
  }, [onChestBreak]);

  // Expose break trigger
  useEffect(() => {
    const handler = () => {
      if (nearestId && !breakingId) {
        setBreakingId(nearestId);
      }
    };
    window.addEventListener("chest-break", handler);
    return () => window.removeEventListener("chest-break", handler);
  }, [nearestId, breakingId]);

  return (
    <>
      {chests.map(chest => (
        <Chest3D
          key={chest.id}
          id={chest.id}
          position={chest.position}
          isNear={chest.id === nearestId}
          breaking={chest.id === breakingId}
          onBreakComplete={handleBreakComplete}
        />
      ))}
    </>
  );
}
