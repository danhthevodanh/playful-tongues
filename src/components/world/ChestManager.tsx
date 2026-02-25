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
  const breakingIdRef = useRef<string | null>(null);
  const [nearestId, setNearestId] = useState<string | null>(null);
  const nearestIdRef = useRef<string | null>(null);
  const respawnTimer = useRef(0);
  const chestsRef = useRef(chests);
  const playerPosRef = useRef(playerPos);

  useEffect(() => { chestsRef.current = chests; }, [chests]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);

  const PROXIMITY = 15;
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

    chestProximityState.nearestChestId = closest;
    if (closest !== nearestIdRef.current) {
      if (closest) {
        console.log("Player is now near chest:", closest, "distance:", closestDist);
        nearestIdRef.current = closest;
        setNearestId(closest);
      } else {
        // Add 1s grace period before losing "near" status
        setTimeout(() => {
          if (!chestProximityState.nearestChestId) {
            console.log("Player is no longer near any chest (grace period over).");
            nearestIdRef.current = null;
            setNearestId(null);
          }
        }, 1000);
      }
    }

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
    breakingIdRef.current = null;
    onChestBreak();
  }, [onChestBreak]);

  // Expose break trigger
  useEffect(() => {
    const handler = (e: any) => {
      let targetId = e.detail?.id;
      const currentChests = chestsRef.current;
      const currentPos = playerPosRef.current;

      console.log("Chest break event received. Detail ID:", targetId);

      // If no ID provided via event, find the nearest one right now
      if (!targetId) {
        let closest = null;
        let closestDist = PROXIMITY;

        currentChests.forEach(chest => {
          const dx = currentPos.x - chest.position[0];
          const dz = currentPos.z - chest.position[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < closestDist) {
            closest = chest.id;
            closestDist = dist;
          }
        });
        targetId = closest;
        console.log("No ID in event, finding nearest manually:", targetId);
      }

      if (targetId && !breakingIdRef.current) {
        console.log("EXECUTING BREAK for:", targetId);
        breakingIdRef.current = targetId;
        setBreakingId(targetId);
      }
    };
    window.addEventListener("chest-break", handler);
    return () => window.removeEventListener("chest-break", handler);
  }, []);
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
