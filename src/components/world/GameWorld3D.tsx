import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorldMap3D, ZONE_BUILDINGS } from "./WorldMap3D";
import { PlayerCharacter3D, animationState } from "./PlayerCharacter3D";
import { OtherPlayer3D } from "./OtherPlayer3D";
import { ZonePrompt } from "./ZonePrompt";
import { ZoneOverlay } from "./ZoneOverlay";
import { ChestManager, chestProximityState } from "./ChestManager";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { motion, AnimatePresence } from "framer-motion";

const MOVE_SPEED = 15;
const ZONE_TRIGGER_DIST = 12;
const WORLD_BOUND = 90;

interface OtherPlayer {
  profile_id: string;
  x: number;
  z: number;
  name: string;
  current_zone: string | null;
}

function getZoneAt(x: number, z: number) {
  for (const zone of ZONE_BUILDINGS) {
    const dx = x - zone.position[0];
    const dz = z - zone.position[2];
    if (Math.sqrt(dx * dx + dz * dz) < ZONE_TRIGGER_DIST) {
      return zone;
    }
  }
  return null;
}

// Shared movement state
const movementState = {
  keys: new Set<string>(),
  pos: new THREE.Vector3(0, 0, 0),
  target: null as THREE.Vector3 | null,
  rotation: 0,
  moving: false,
  activeZone: null as string | null,
};

function PlayerController({ playerName, onPositionChange }: { playerName: string; onPositionChange: (x: number, z: number) => void }) {
  const lastBroadcast = useRef(0);

  useFrame((_, delta) => {
    if (movementState.activeZone) {
      movementState.moving = false;
      return;
    }

    const keys = movementState.keys;
    let dx = 0, dz = 0;

    if (keys.has("w") || keys.has("arrowup")) dz -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dz += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    if (dx !== 0 && dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx /= len;
      dz /= len;
    }

    if (dx === 0 && dz === 0 && movementState.target) {
      const tdx = movementState.target.x - movementState.pos.x;
      const tdz = movementState.target.z - movementState.pos.z;
      const dist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (dist < 0.5) {
        movementState.target = null;
      } else {
        dx = tdx / dist;
        dz = tdz / dist;
      }
    }

    const speed = MOVE_SPEED * delta;

    if (dx !== 0 || dz !== 0) {
      movementState.moving = true;
      animationState.moving = true;
      movementState.rotation = Math.atan2(dx, dz);
      animationState.rotation = movementState.rotation;
      movementState.pos.x = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, movementState.pos.x + dx * speed));
      movementState.pos.z = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, movementState.pos.z + dz * speed));
    } else {
      movementState.moving = false;
      animationState.moving = false;
    }

    const now = Date.now();
    if (now - lastBroadcast.current > 200) {
      lastBroadcast.current = now;
      onPositionChange(movementState.pos.x, movementState.pos.z);
    }
  });

  return (
    <PlayerCharacter3D
      position={movementState.pos}
      name={playerName}
      isCurrentPlayer
      useAnimationState
    />
  );
}

function GroundClickHandler() {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const handleClick = (e: MouseEvent) => {
      if (movementState.activeZone) return;
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.current.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane, intersection)) {
        movementState.target = intersection.clone();
        movementState.keys.clear();
      }
    };
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [camera, gl]);

  return null;
}

// Rewards floating text
function RewardPopup({ text, onDone }: { text: string; onDone: () => void }) {
  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 top-1/3 z-50 -translate-x-1/2 font-fredoka text-2xl font-bold text-yellow-300 drop-shadow-lg"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      transition={{ duration: 1.2 }}
      onAnimationComplete={onDone}
    >
      {text}
    </motion.div>
  );
}

export function GameWorld3D({ profileId, playerName }: { profileId: string; playerName: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);

  // Chest/rewards state
  const [sessionCoins, setSessionCoins] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [rewardPopups, setRewardPopups] = useState<{ id: number; text: string }[]>([]);
  const [nearChest, setNearChest] = useState(false);
  const popupCounter = useRef(0);

  // Voice
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: (text) => {
      if (text.toLowerCase().includes("break") && chestProximityState.nearestChestId) {
        window.dispatchEvent(new Event("chest-break"));
      }
    },
  });

  // Poll chest proximity for HUD
  useEffect(() => {
    const interval = setInterval(() => {
      setNearChest(!!chestProximityState.nearestChestId);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // V key for voice
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v" && !activeZone) {
        if (isListening) {
          stopListening();
        } else if (nearChest) {
          startListening();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isListening, nearChest, activeZone, startListening, stopListening]);

  const handleChestBreak = useCallback(() => {
    const coins = 10;
    const xp = 25;
    setSessionCoins(prev => prev + coins);
    setSessionXP(prev => prev + xp);

    const id1 = ++popupCounter.current;
    const id2 = ++popupCounter.current;
    setRewardPopups(prev => [...prev, { id: id1, text: `+${coins} 🪙 Coins` }, { id: id2, text: `+${xp} ⭐ XP` }]);

    // Save to DB
    supabase
      .from("game_progress")
      .select("id, score")
      .eq("profile_id", profileId)
      .eq("game_mode", "prop-hunt")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          supabase.from("game_progress").update({ score: (data.score || 0) + coins }).eq("id", data.id).then(() => {});
        } else {
          supabase.from("game_progress").insert({ profile_id: profileId, game_mode: "prop-hunt", score: coins }).then(() => {});
        }
      });

    stopListening();
  }, [profileId, stopListening]);

  // Sync activeZone to movementState
  useEffect(() => { movementState.activeZone = activeZone; }, [activeZone]);

  // Poll zone detection
  useEffect(() => {
    const interval = setInterval(() => {
      const zone = getZoneAt(movementState.pos.x, movementState.pos.z);
      setCurrentZoneId(zone?.id ?? null);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // URL zone auto-enter
  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) {
      const zone = ZONE_BUILDINGS.find((z) => z.id === zoneParam);
      if (zone) {
        movementState.pos.set(zone.position[0], 0, zone.position[2]);
        setActiveZone(zoneParam);
        setSearchParams({}, { replace: true });
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (movementState.activeZone) return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        movementState.keys.add(key);
        movementState.target = null;
      }
      if (key === "enter" || key === " ") {
        const zone = getZoneAt(movementState.pos.x, movementState.pos.z);
        if (zone) setActiveZone(zone.id);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      movementState.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Presence broadcast
  useEffect(() => {
    const channel = supabase.channel("world-presence", {
      config: { presence: { key: profileId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const players: OtherPlayer[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          if (key === profileId) return;
          const p = (presences as any[])[0];
          if (p) players.push({ profile_id: key, x: p.x, z: p.z, name: p.name, current_zone: p.current_zone });
        });
        setOtherPlayers(players);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ x: movementState.pos.x, z: movementState.pos.z, name: playerName, current_zone: activeZone });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [profileId, playerName]);

  const handlePositionChange = useCallback((x: number, z: number) => {
    const channel = supabase.channel("world-presence");
    channel.track({ x, z, name: playerName, current_zone: movementState.activeZone }).catch(() => {});
  }, [playerName]);

  const currentZone = currentZoneId ? ZONE_BUILDINGS.find(z => z.id === currentZoneId) : null;

  const removePopup = useCallback((id: number) => {
    setRewardPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }}>
        <WorldMap3D />
        <GroundClickHandler />
        <PlayerController playerName={playerName} onPositionChange={handlePositionChange} />
        <ChestManager
          playerPos={movementState.pos}
          onChestBreak={handleChestBreak}
        />
        {otherPlayers.map((p) => (
          <OtherPlayer3D key={p.profile_id} x={p.x} z={p.z} name={p.name} />
        ))}
      </Canvas>

      <ZonePrompt
        zoneName={currentZone?.label ?? ""}
        zoneIcon={currentZone?.icon ?? ""}
        visible={!!currentZone && !activeZone}
        onEnter={() => currentZone && setActiveZone(currentZone.id)}
      />

      <ZoneOverlay
        zoneId={activeZone}
        zoneName={ZONE_BUILDINGS.find((z) => z.id === activeZone)?.label ?? ""}
        onClose={() => setActiveZone(null)}
      />

      {/* Reward popups */}
      <AnimatePresence>
        {rewardPopups.map(p => (
          <RewardPopup key={p.id} text={p.text} onDone={() => removePopup(p.id)} />
        ))}
      </AnimatePresence>

      {/* Rewards HUD */}
      {!activeZone && (
        <div className="fixed right-4 top-4 z-30 rounded-xl border border-yellow-500/20 bg-black/70 px-4 py-2 font-fredoka text-sm text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <span>🪙 {sessionCoins}</span>
            <span>⭐ {sessionXP} XP</span>
          </div>
        </div>
      )}

      {/* Voice/mic HUD when near chest */}
      {!activeZone && nearChest && isSupported && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center gap-2 rounded-full px-5 py-3 font-fredoka text-sm font-bold shadow-lg transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-yellow-500 text-black hover:bg-yellow-400"
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {isListening ? `Listening... ${transcript || ""}` : 'Press V or Tap — Shout "BREAK!"'}
          </button>
        </div>
      )}

      {/* Controls HUD */}
      {!activeZone && (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-5 py-2 font-fredoka text-xs text-white shadow-lg backdrop-blur">
          <span className="inline-flex items-center gap-2">
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">WASD</kbd> Move
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Click</kbd> Walk
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Enter</kbd> Interact
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">V</kbd> 🎤 Voice
          </span>
        </div>
      )}
    </div>
  );
}
