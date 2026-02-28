import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PlayerCharacter3D } from "@/components/world/PlayerCharacter3D";
import { TrashObject3D, TRASH_TYPES, type TrashType } from "./TrashObject3D";
import { EcoHunterHUD } from "./EcoHunterHUD";
import { supabase } from "@/integrations/supabase/client";
import type { EcoRoom, EcoPlayer, PlayerRole } from "./useEcoRoom";
import { meritStore } from "@/stores/useMeritStore";

// Generate static trash layout from room id (deterministic)
function generateTrashLayout(seed: string, count: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const items: { position: [number, number, number]; type: TrashType; id: string }[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const x = ((hash % 1000) / 1000) * 50 - 25;
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const z = ((hash % 1000) / 1000) * 50 - 25;
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const type = TRASH_TYPES[hash % TRASH_TYPES.length];
    items.push({ position: [x, 0, z], type, id: `trash-${i}` });
  }
  return items;
}

interface ArenaSceneProps {
  room: EcoRoom;
  players: EcoPlayer[];
  myProfileId: string;
  myRole: PlayerRole;
  onRecycleTarget: (targetId: string, isMonster: boolean) => void;
  recycledIds: Set<string>;
  cleanupProgress: number;
}

function ArenaScene({ room, players, myProfileId, myRole, onRecycleTarget, recycledIds, cleanupProgress }: ArenaSceneProps) {
  const myPlayerRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const keysRef = useRef<Set<string>>(new Set());
  const rotationRef = useRef(0);
  const movingRef = useRef(false);
  const { camera } = useThree();

  const trashItems = useMemo(() => generateTrashLayout(room.id, 30), [room.id]);

  // My player data
  const myPlayer = players.find((p) => p.profile_id === myProfileId);
  const isDisguised = myPlayer?.disguise != null;
  const isAlive = myPlayer?.is_alive !== false;
  const canMove = isAlive && (myRole !== "monster" || !isDisguised);

  // Init position
  useEffect(() => {
    if (myPlayer) {
      myPlayerRef.current.set(myPlayer.x, 0, myPlayer.z);
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());

      // Monster disguise toggle
      if (e.key.toLowerCase() === "e" && myRole === "monster" && isAlive) {
        const newDisguise = isDisguised ? null : TRASH_TYPES[Math.floor(Math.random() * TRASH_TYPES.length)];
        supabase.from("eco_room_players").update({ disguise: newDisguise }).eq("profile_id", myProfileId).eq("room_id", room.id);
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [myRole, isAlive, isDisguised, myProfileId, room.id]);

  // Movement + camera
  useFrame((_, delta) => {
    if (!canMove || myRole === "spectator") return;

    const speed = 8;
    const dir = new THREE.Vector3();
    const keys = keysRef.current;
    if (keys.has("w") || keys.has("arrowup")) dir.z -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dir.z += 1;
    if (keys.has("a") || keys.has("arrowleft")) dir.x -= 1;
    if (keys.has("d") || keys.has("arrowright")) dir.x += 1;

    movingRef.current = dir.lengthSq() > 0;
    if (dir.lengthSq() > 0) {
      dir.normalize();
      rotationRef.current = Math.atan2(dir.x, dir.z);
      myPlayerRef.current.x += dir.x * speed * delta;
      myPlayerRef.current.z += dir.z * speed * delta;

      // Clamp to arena
      myPlayerRef.current.x = Math.max(-28, Math.min(28, myPlayerRef.current.x));
      myPlayerRef.current.z = Math.max(-28, Math.min(28, myPlayerRef.current.z));
    }

    // Camera follow
    const camTarget = new THREE.Vector3(myPlayerRef.current.x, 18, myPlayerRef.current.z + 24);
    camera.position.lerp(camTarget, 0.1);
    camera.lookAt(myPlayerRef.current.x, 0.5, myPlayerRef.current.z);
  });

  // Broadcast position periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!myPlayer || !isAlive) return;
      supabase.from("eco_room_players")
        .update({ x: myPlayerRef.current.x, z: myPlayerRef.current.z })
        .eq("profile_id", myProfileId)
        .eq("room_id", room.id);
    }, 200);
    return () => clearInterval(interval);
  }, [myPlayer, isAlive, myProfileId, room.id]);

  // Find closest trash/monster for hunter recycling
  const findRecycleTarget = useCallback(() => {
    if (myRole !== "hunter") return;
    const pos = myPlayerRef.current;
    const range = 3;

    // Check disguised monsters
    for (const p of players) {
      if (p.profile_id === myProfileId || p.role !== "monster" || !p.is_alive || !p.disguise) continue;
      const dist = Math.sqrt((pos.x - p.x) ** 2 + (pos.z - p.z) ** 2);
      if (dist < range) {
        onRecycleTarget(p.profile_id, true);
        return;
      }
    }

    // Check real trash
    for (const t of trashItems) {
      if (recycledIds.has(t.id)) continue;
      const dist = Math.sqrt((pos.x - t.position[0]) ** 2 + (pos.z - t.position[2]) ** 2);
      if (dist < range) {
        onRecycleTarget(t.id, false);
        return;
      }
    }
  }, [myRole, players, trashItems, recycledIds, myProfileId, onRecycleTarget]);

  // Expose findRecycleTarget for voice command
  useEffect(() => {
    (window as any).__ecoFindRecycleTarget = findRecycleTarget;
    return () => { delete (window as any).__ecoFindRecycleTarget; };
  }, [findRecycleTarget]);

  // Ground color based on cleanup
  const groundColor = useMemo(() => {
    const dirty = new THREE.Color("#8B7355");
    const clean = new THREE.Color("#4a9e3f");
    return dirty.clone().lerp(clean, cleanupProgress);
  }, [cleanupProgress]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      {/* Arena border */}
      {[[-30, 0, 0], [30, 0, 0], [0, 0, -30], [0, 0, 30]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={i < 2 ? [1, 2, 60] : [60, 2, 1]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}

      {/* Trash objects */}
      {trashItems.filter((t) => !recycledIds.has(t.id)).map((t) => (
        <TrashObject3D key={t.id} position={t.position} type={t.type} />
      ))}

      {/* Players */}
      {players.filter((p) => p.is_alive).map((p) => {
        const isMe = p.profile_id === myProfileId;

        // If monster is disguised, show as trash
        if (p.disguise && p.role === "monster" && !isMe) {
          return (
            <TrashObject3D
              key={p.profile_id}
              position={[p.x, 0, p.z]}
              type={p.disguise as TrashType}
              isMonster
            />
          );
        }

        // If monster is disguised and it's me, show ghost trash
        if (p.disguise && isMe) {
          return (
            <group key={p.profile_id}>
              <TrashObject3D position={[myPlayerRef.current.x, 0, myPlayerRef.current.z]} type={p.disguise as TrashType} />
            </group>
          );
        }

        return (
          <PlayerCharacter3D
            key={p.profile_id}
            position={isMe ? myPlayerRef.current : new THREE.Vector3(p.x, 0, p.z)}
            name={p.name || "Player"}
            isCurrentPlayer={false}
            rotation={isMe ? rotationRef.current : 0}
            moving={isMe ? movingRef.current : false}
          />
        );
      })}

      {/* Flowers appear as cleanup progresses */}
      {cleanupProgress > 0.3 && Array.from({ length: Math.floor(cleanupProgress * 20) }).map((_, i) => (
        <mesh key={`flower-${i}`} position={[Math.sin(i * 2.3) * 20, 0.2, Math.cos(i * 3.1) * 20]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ff69b4" : "#ffff00"} />
        </mesh>
      ))}
    </>
  );
}

interface EcoHunterArenaProps {
  room: EcoRoom;
  players: EcoPlayer[];
  profileId: string;
}

export function EcoHunterArena({ room, players, profileId }: EcoHunterArenaProps) {
  const myPlayer = players.find((p) => p.profile_id === profileId);
  const myRole: PlayerRole = myPlayer?.role || "spectator";
  const [recycledIds, setRecycledIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const cleanupProgress = recycledIds.size / 30;

  // Voice recognition for "Recycle!"
  useEffect(() => {
    if (myRole !== "hunter") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "v" || isListening) return;
      setIsListening(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("")
          .toLowerCase();

        if (transcript.includes("recycle") || transcript.includes("clean")) {
          const fn = (window as any).__ecoFindRecycleTarget;
          if (fn) fn();
          recognition.stop();
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v" && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [myRole, isListening]);

  const handleRecycleTarget = useCallback(async (targetId: string, isMonster: boolean) => {
    if (recycledIds.has(targetId)) return;

    if (isMonster) {
      // Eliminate monster
      await supabase.from("eco_room_players")
        .update({ is_alive: false, role: "spectator" })
        .eq("profile_id", targetId)
        .eq("room_id", room.id);

      const newScore = score + 50;
      setScore(newScore);
      meritStore.addEcoVitality(5);
      await supabase.from("eco_room_players")
        .update({ score: newScore })
        .eq("profile_id", profileId)
        .eq("room_id", room.id);
    } else {
      // Recycle real trash
      setRecycledIds((prev) => new Set(prev).add(targetId));
      const newScore = score + 10;
      setScore(newScore);
      meritStore.addEcoVitality(10);
      await supabase.from("eco_room_players")
        .update({ score: newScore })
        .eq("profile_id", profileId)
        .eq("room_id", room.id);
    }
  }, [recycledIds, score, room.id, profileId]);

  const handleGameEnd = useCallback(async () => {
    await supabase.from("eco_rooms").update({ status: "finished" }).eq("id", room.id);
  }, [room.id]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <EcoHunterHUD
        role={myRole}
        score={score}
        roundTimerEnd={room.round_timer_end}
        players={players}
        isDisguised={myPlayer?.disguise != null}
        isListening={isListening}
        onGameEnd={handleGameEnd}
      />

      <Canvas shadows camera={{ position: [0, 18, 24], fov: 50 }}>
        <ArenaScene
          room={room}
          players={players}
          myProfileId={profileId}
          myRole={myRole}
          onRecycleTarget={handleRecycleTarget}
          recycledIds={recycledIds}
          cleanupProgress={cleanupProgress}
        />
      </Canvas>
    </div>
  );
}
