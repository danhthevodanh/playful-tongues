import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorldMap3D, ZONE_BUILDINGS, BRIDGE_DEFS, isOnLand } from "./WorldMap3D";
import { PlayerCharacter3D, animationState } from "./PlayerCharacter3D";
import { OtherPlayer3D } from "./OtherPlayer3D";
import { ZonePrompt } from "./ZonePrompt";
import { ZoneOverlay } from "./ZoneOverlay";
import { ChestManager, chestProximityState } from "./ChestManager";
import { Bridge3D } from "./Bridge3D";
import { ThoughtBubble } from "./ThoughtBubble";
import { useDeepgramRecognition } from "@/hooks/useDeepgramRecognition";
import { motion, AnimatePresence } from "framer-motion";

function AudioPulse({ isListening, volume, playerPos }: { isListening: boolean, volume: number, playerPos: THREE.Vector3 }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (pulseRef.current) {
      const s = isListening ? 1 + volume * 5 : 0;
      pulseRef.current.scale.set(s, s, s);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isListening ? 0.2 + (volume * 0.8) : 0;
    }
  });

  return (
    <mesh ref={pulseRef} position={[playerPos.x, 0.05, playerPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0} />
    </mesh>
  );
}

const MOVE_SPEED = 15;
const ZONE_TRIGGER_DIST = 12;
const ISLAND_BOUND = 100;
const BRIDGE_DISSOLVE_MS = 10000;

// Module-level bridge states readable by PlayerController (no React overhead)
const worldBridgeStates: Record<string, string> = {
  "left-bridge": "hidden",
  "right-bridge": "hidden",
};
// Speed boost flag readable by PlayerController
const speedBoostState = { active: false, until: 0 };

type BridgeState = "hidden" | "forming" | "solid" | "dissolving";

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
    if (Math.sqrt(dx * dx + dz * dz) < ZONE_TRIGGER_DIST) return zone;
  }
  return null;
}

// ─── PlayerController ─────────────────────────────────────────────────────────
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
  const lastValidPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (movementState.activeZone) { movementState.moving = false; return; }

    const keys = movementState.keys;
    let dx = 0, dz = 0;

    if (keys.has("w") || keys.has("arrowup")) dz -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dz += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    if (dx !== 0 && dz !== 0) { const l = Math.sqrt(dx * dx + dz * dz); dx /= l; dz /= l; }

    if (dx === 0 && dz === 0 && movementState.target) {
      const tdx = movementState.target.x - movementState.pos.x;
      const tdz = movementState.target.z - movementState.pos.z;
      const dist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (dist < 0.5) { movementState.target = null; }
      else { dx = tdx / dist; dz = tdz / dist; }
    }

    const boost = Date.now() < speedBoostState.until ? 2.2 : 1;
    const speed = MOVE_SPEED * boost * delta;

    if (dx !== 0 || dz !== 0) {
      movementState.moving = true;
      animationState.moving = true;
      movementState.rotation = Math.atan2(dx, dz);
      animationState.rotation = movementState.rotation;

      // Island collision: try axis-separately to avoid corner locking
      const nextX = Math.max(-ISLAND_BOUND, Math.min(ISLAND_BOUND, movementState.pos.x + dx * speed));
      const nextZ = Math.max(-ISLAND_BOUND, Math.min(ISLAND_BOUND, movementState.pos.z + dz * speed));

      if (isOnLand(nextX, movementState.pos.z, worldBridgeStates)) {
        movementState.pos.x = nextX;
      }
      if (isOnLand(movementState.pos.x, nextZ, worldBridgeStates)) {
        movementState.pos.z = nextZ;
      }
      lastValidPos.current.copy(movementState.pos);
    } else {
      movementState.moving = false;
      animationState.moving = false;
    }

    const now = Date.now();
    if (now - lastBroadcast.current > 500) {
      lastBroadcast.current = now;
      onPositionChange(movementState.pos.x, movementState.pos.z);
    }
  });

  return <PlayerCharacter3D position={movementState.pos} name={playerName} isCurrentPlayer useAnimationState />;
}

// ─── Ground click handler ─────────────────────────────────────────────────────
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
      const hit = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane, hit)) {
        // Only set target if destination is on land
        if (isOnLand(hit.x, hit.z, worldBridgeStates)) {
          movementState.target = hit.clone();
          movementState.keys.clear();
        }
      }
    };
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [camera, gl]);
  return null;
}

// ─── Floating reward popup ────────────────────────────────────────────────────
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

// ─── Volume/Clarity Meter ─────────────────────────────────────────────────────
function VolumeMeter({ volume, label }: { volume: number; label: string }) {
  const bars = 8;
  const filled = Math.round(volume * bars);
  const getColor = (i: number) => {
    if (i >= bars - 2) return "bg-green-400";
    if (i >= bars - 4) return "bg-yellow-400";
    return "bg-red-400";
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-fredoka text-[11px] font-bold text-white/80 uppercase tracking-widest">{label}</span>
      <div className="flex items-end gap-0.5 h-7">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={`w-2 rounded-sm transition-all duration-75 ${i < filled ? getColor(i) : "bg-white/15"}`}
            style={{ height: `${55 + i * 5}%` }}
          />
        ))}
      </div>
      {volume > 0.75 && <span className="text-xs animate-bounce">✨</span>}
    </div>
  );
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
interface GameHUDProps {
  sessionCoins: number; sessionXP: number;
  rewardPopups: { id: number; text: string }[];
  nearChest: boolean; nearBridge: string | null;
  isListening: boolean; transcript: string; volume: number; isSupported: boolean;
  activeZone: string | null; currentZone: any;
  speedBoostActive: boolean;
  onEnterZone: () => void; onToggleMic: () => void;
  removePopup: (id: number) => void;
  onCloseZone: () => void;
  handleSpellResult: (text: string, clarity: number) => void;
}

const GameHUD = ({
  sessionCoins, sessionXP, rewardPopups,
  nearChest, nearBridge,
  isListening, transcript, volume, isSupported,
  activeZone, currentZone,
  speedBoostActive,
  onEnterZone, onToggleMic, removePopup, onCloseZone,
  handleSpellResult,
}: GameHUDProps) => {
  // Determine spell context for display
  const spellContext = nearBridge ? { word: "Bridge", icon: "🌉" }
    : nearChest ? { word: "Open", icon: "🗝️" }
      : null;

  return (
    <>
      <ZonePrompt zoneName={currentZone?.label ?? ""} zoneIcon={currentZone?.icon ?? ""} visible={!!currentZone && !activeZone} onEnter={onEnterZone} />
      <ZoneOverlay zoneId={activeZone} zoneName={ZONE_BUILDINGS.find(z => z.id === activeZone)?.label ?? ""} onClose={onCloseZone} />

      <AnimatePresence>
        {rewardPopups.map(p => <RewardPopup key={p.id} text={p.text} onDone={() => removePopup(p.id)} />)}
      </AnimatePresence>

      {/* Rewards & speed HUD */}
      {!activeZone && (
        <div className="fixed right-4 top-4 z-30 rounded-xl border border-yellow-500/20 bg-black/70 px-4 py-2 font-fredoka text-sm text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <span>🪙 {sessionCoins}</span>
            <span>⭐ {sessionXP} XP</span>
            {speedBoostActive && <span className="text-yellow-300 animate-pulse">⚡ SPEED!</span>}
          </div>
        </div>
      )}

      {/* Echo-Power voice HUD — shows near chest or bridge gap */}
      {!activeZone && spellContext && isSupported && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onPointerDown={() => !isListening && onToggleMic()}
              onPointerUp={() => isListening && onToggleMic()}
              className={`flex items-center gap-3 rounded-2xl px-6 py-4 font-fredoka text-sm font-bold shadow-2xl transition-all border-2
                ${isListening ? "bg-red-500 scale-110 text-white animate-pulse border-red-300 ring-4 ring-red-500/20" : "bg-purple-600 text-white hover:bg-purple-500 border-purple-400"}`}
            >
              {isListening ? (
                <div className="flex items-center gap-3">
                  <VolumeMeter volume={volume} label="" />
                  <div className="flex flex-col items-start translate-y-0.5">
                    <span className="text-[13px] uppercase tracking-tighter font-extrabold text-white animate-bounce">Listening...</span>
                    <span className="text-yellow-200 text-sm font-mono font-black drop-shadow-sm">
                      {transcript ? `"${transcript.toUpperCase()}"` : `Say "${spellContext.word}"!`}
                    </span>
                    <span className="text-[8px] text-white/40 font-mono mt-1">LATEST: {transcript || "---"}</span>
                  </div>
                  <span className="text-3xl animate-pulse">{spellContext.icon}</span>
                </div>
              ) : (
                <span>🎤 Hold V — Say "{spellContext.word}!" {spellContext.icon}</span>
              )}
            </button>

            {/* Manual Backup Button */}
            {!isListening && (
              <button
                onClick={() => handleSpellResult(spellContext.word, 1.0)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-4 py-4 text-xs font-bold transition-all backdrop-blur"
                title="Click if Voice fails"
              >
                🖱️ CAST
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls HUD */}
      {!activeZone && (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-5 py-2 font-fredoka text-xs text-white shadow-lg backdrop-blur">
          <span className="inline-flex items-center gap-2">
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">WASD</kbd> Move
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">V</kbd> 🎤 Spell
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Enter</kbd> Interact
          </span>
        </div>
      )}
    </>
  );
};

// ─── GameWorld3D ─────────────────────────────────────────────────────────────
export function GameWorld3D({ profileId, playerName }: { profileId: string; playerName: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);

  // Rewards
  const [sessionCoins, setSessionCoins] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [rewardPopups, setRewardPopups] = useState<{ id: number; text: string }[]>([]);
  const [nearChest, setNearChest] = useState(false);
  const popupCounter = useRef(0);

  // Bridges
  const [bridgeStates, setBridgeStates] = useState<Record<string, BridgeState>>({
    "left-bridge": "hidden",
    "right-bridge": "hidden",
  });
  const [bridgeCountdowns, setBridgeCountdowns] = useState<Record<string, number>>({
    "left-bridge": 1,
    "right-bridge": 1,
  });
  const bridgeTimers = useRef<Record<string, ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>>>({});

  // Speed boost
  const [speedBoostActive, setSpeedBoostActive] = useState(false);

  // Proximity state for HUD
  const [nearBridgeId, setNearBridgeId] = useState<string | null>(null);

  // Thought bubble
  const [thoughtBubble, setThoughtBubble] = useState<{ icon: string; hint: string; showTryAgain?: boolean } | null>(null);

  const lastTriggerTime = useRef(0);

  // Sync bridgeStates to module-level for PlayerController
  useEffect(() => {
    Object.assign(worldBridgeStates, bridgeStates);
  }, [bridgeStates]);

  // ── Bridge spell ──────────────────────────────────────────────────────────
  const castBridge = useCallback((bridgeId: string) => {
    const now = Date.now();
    if (bridgeStates[bridgeId] === "forming" || bridgeStates[bridgeId] === "solid") return;
    if (now - lastTriggerTime.current < 600) return;
    lastTriggerTime.current = now;

    console.log("Bridge forming:", bridgeId);
    setBridgeStates(prev => ({ ...prev, [bridgeId]: "forming" }));

    // After forming animation, mark as solid and start 10s timer
    const formTimeout = setTimeout(() => {
      setBridgeStates(prev => ({ ...prev, [bridgeId]: "solid" }));
      setBridgeCountdowns(prev => ({ ...prev, [bridgeId]: 1.0 }));
      const startTime = Date.now();

      const countdownInterval = setInterval(() => {
        const remaining = 1 - (Date.now() - startTime) / BRIDGE_DISSOLVE_MS;
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setBridgeStates(prev => ({ ...prev, [bridgeId]: "dissolving" }));
          setBridgeCountdowns(prev => ({ ...prev, [bridgeId]: 0 }));
          setTimeout(() => setBridgeStates(prev => ({ ...prev, [bridgeId]: "hidden" })), 1200);
        } else {
          setBridgeCountdowns(prev => ({ ...prev, [bridgeId]: remaining }));
        }
      }, 250);
      bridgeTimers.current[`${bridgeId}-interval`] = countdownInterval;
    }, 450); // Faster assembly sync
    bridgeTimers.current[`${bridgeId}-form`] = formTimeout;
  }, [bridgeStates]);

  // ── Speed boost ───────────────────────────────────────────────────────────
  const applySpeedBoost = useCallback(() => {
    speedBoostState.active = true;
    speedBoostState.until = Date.now() + 3000;
    setSpeedBoostActive(true);
    setTimeout(() => { speedBoostState.active = false; setSpeedBoostActive(false); }, 3000);
    const id = ++popupCounter.current;
    setRewardPopups(prev => [...prev, { id, text: "⚡ Speed Boost!" }]);
  }, []);

  // ── Shared Spell Handler ──────────────────────────────────────────────────
  const handleSpellResult = useCallback((rawText: string, clarity: number) => {
    let t = rawText.toLowerCase();
    const now = Date.now();
    if (now - lastTriggerTime.current < 400) return;

    // Determine spell context from current position
    const pX = movementState.pos.x;
    const pZ = movementState.pos.z;
    // Continuous proximity: covers entry points and the gap itself (Extra wide)
    const nearLeftBridge = pX < -10 && pX > -65 && Math.abs(pZ) < 10;
    const nearRightBridge = pX > 10 && pX < 65 && Math.abs(pZ) < 10;
    const nearBridgeNow = nearLeftBridge ? "left-bridge" : nearRightBridge ? "right-bridge" : null;
    const nearChestNow = !!chestProximityState.nearestChestId;

    const isBridge = t.includes("bridge");
    const isOpen = t.includes("open");
    const isSpeed = t.includes("speed");

    // ── Bridge spell ──
    if (isBridge) {
      if (nearBridgeNow) {
        if (clarity >= 0.1 || t.includes("bridge")) {
          lastTriggerTime.current = now;
          castBridge(nearBridgeNow);
          setThoughtBubble({ icon: "✨", hint: "BRIDGE!", showTryAgain: false });
        } else {
          setThoughtBubble({ icon: "🌉", hint: "Bridge? Speak louder!", showTryAgain: true });
        }
        return;
      }
    }

    // ── Open / break (chest) ──
    if (isOpen) {
      if (nearChestNow) {
        lastTriggerTime.current = now;
        if (clarity >= 0.1 || t.includes("open")) {
          window.dispatchEvent(new CustomEvent("chest-break", { detail: { id: chestProximityState.nearestChestId } }));
          setThoughtBubble({ icon: "✨", hint: "OPEN!", showTryAgain: false });
        } else {
          setThoughtBubble({ icon: "🗝️", hint: "Open? Speak louder!", showTryAgain: true });
        }
        return;
      }
    }

    // ── Speed spell ──
    if (isSpeed) {
      if (clarity >= 0.1) {
        lastTriggerTime.current = now;
        applySpeedBoost();
        setThoughtBubble({ icon: "✨", hint: "SPEED!", showTryAgain: false });
      }
      return;
    }

    // ── No match / unclear near interactive ──
    if (nearChestNow) setThoughtBubble({ icon: "🗝️", hint: "Say 'Open'!", showTryAgain: true });
    else if (nearBridgeNow) setThoughtBubble({ icon: "🌉", hint: "Say 'Bridge'!", showTryAgain: true });
  }, [applySpeedBoost, castBridge]);

  // ── Voice keywords ────────────────────────────────────────────────────────
  const voiceKeywords = useMemo(() => ["open", "bridge", "rich", "fridge", "ridge", "witch", "reach", "teach", "speed", "break", "cross"], []);

  const { isListening, transcript, volume, isSupported, startListening, stopListening } = useDeepgramRecognition({
    onResult: (rawText, _wc, clarity) => {
      console.log(`Voice Raw: "${rawText}" clarity=${clarity.toFixed(2)}`);
      handleSpellResult(rawText, clarity);
    },
    keywords: voiceKeywords,
    transcriptMapping: {
      "rich": "bridge",
      "fridge": "bridge",
      "ridge": "bridge",
      "witch": "bridge",
      "reach": "bridge",
      "teach": "bridge",
      "brich": "bridge",
      "rudge": "bridge",
      "break": "open",
      "brake": "open",
      "broke": "open",
      "brick": "open",
      "opin": "open",
      "broken": "open",
      "fast": "speed",
      "sprint": "speed",
      "go": "speed",
      "wait": "bridge", // Extreme phonetic leeway
      "which": "bridge",
      "bitch": "bridge",
      "brij": "bridge"
    }
  });

  // ── V key hold-to-talk ─────────────────────────────────────────────────────
  const startRef = useRef(startListening);
  const stopRef = useRef(stopListening);
  startRef.current = startListening;
  stopRef.current = stopListening;

  useEffect(() => {
    let vDown = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v" && !e.repeat && !vDown) {
        vDown = true; startRef.current();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v") { vDown = false; stopRef.current(); }
    };
    const onBlur = () => { if (vDown) { vDown = false; stopRef.current(); } };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // ── Poll proximity state ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setNearChest(!!chestProximityState.nearestChestId);
      const pX = movementState.pos.x;
      const pZ = movementState.pos.z;
      const leftNear = pX < -22 && pX > -38 && Math.abs(pZ) < 8;
      const rightNear = pX > 22 && pX < 38 && Math.abs(pZ) < 8;
      setNearBridgeId(leftNear ? "left-bridge" : rightNear ? "right-bridge" : null);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // ── Zone detection ────────────────────────────────────────────────────────
  useEffect(() => { movementState.activeZone = activeZone; }, [activeZone]);
  useEffect(() => {
    const interval = setInterval(() => {
      const zone = getZoneAt(movementState.pos.x, movementState.pos.z);
      setCurrentZoneId(zone?.id ?? null);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
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
    const onUp = (e: KeyboardEvent) => movementState.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // ── URL zone auto-enter ───────────────────────────────────────────────────
  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) {
      const zone = ZONE_BUILDINGS.find(z => z.id === zoneParam);
      if (zone) { movementState.pos.set(zone.position[0], 0, zone.position[2]); setActiveZone(zoneParam); setSearchParams({}, { replace: true }); }
    }
  }, []);

  // ── Chest break reward ────────────────────────────────────────────────────
  const handleChestBreak = useCallback(() => {
    const coins = 10, xp = 25;
    setSessionCoins(c => c + coins);
    setSessionXP(x => x + xp);
    const id1 = ++popupCounter.current, id2 = ++popupCounter.current;
    setRewardPopups(prev => [...prev, { id: id1, text: `+${coins} 🪙 Coins` }, { id: id2, text: `+${xp} ⭐ XP` }]);
    supabase.from("game_progress").select("id,score").eq("profile_id", profileId).eq("game_mode", "prop-hunt").maybeSingle().then(({ data }) => {
      if (data) supabase.from("game_progress").update({ score: (data.score || 0) + coins }).eq("id", data.id).then(() => { });
      else supabase.from("game_progress").insert({ profile_id: profileId, game_mode: "prop-hunt", score: coins }).then(() => { });
    });
  }, [profileId]);

  // ── Presence ──────────────────────────────────────────────────────────────
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    const channel = supabase.channel("world-presence", { config: { presence: { key: profileId } } });
    presenceChannelRef.current = channel;
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const players: OtherPlayer[] = [];
      Object.entries(state).forEach(([key, presences]) => {
        if (key === profileId) return;
        const p = (presences as any[])[0];
        if (p) players.push({ profile_id: key, x: p.x, z: p.z, name: p.name, current_zone: p.current_zone });
      });
      setOtherPlayers(players);
    }).subscribe(async status => {
      if (status === "SUBSCRIBED") await channel.track({ x: movementState.pos.x, z: movementState.pos.z, name: playerName, current_zone: activeZone });
    });
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null; };
  }, [profileId, playerName]);

  const handlePositionChange = useCallback((x: number, z: number) => {
    presenceChannelRef.current?.track({ x, z, name: playerName, current_zone: movementState.activeZone }).catch(() => { });
  }, [playerName]);

  const currentZone = currentZoneId ? ZONE_BUILDINGS.find(z => z.id === currentZoneId) : null;
  const removePopup = useCallback((id: number) => setRewardPopups(prev => prev.filter(p => p.id !== id)), []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Canvas shadows camera={{ position: [0, 10, 14], fov: 58 }}>
        <WorldMap3D />
        <GroundClickHandler />
        <PlayerController playerName={playerName} onPositionChange={handlePositionChange} />
        <ChestManager playerPos={movementState.pos} onChestBreak={handleChestBreak} />

        <AudioPulse isListening={isListening} volume={volume} playerPos={movementState.pos} />

        {/* Bridges */}
        {BRIDGE_DEFS.map(b => (
          <Bridge3D
            key={b.id}
            midX={b.midX}
            midZ={b.midZ}
            length={b.length}
            state={bridgeStates[b.id] as BridgeState}
            countdown={bridgeCountdowns[b.id] ?? 1}
          />
        ))}

        {otherPlayers.map(p => <OtherPlayer3D key={p.profile_id} x={p.x} z={p.z} name={p.name} />)}
      </Canvas>

      <GameHUD
        sessionCoins={sessionCoins} sessionXP={sessionXP}
        rewardPopups={rewardPopups}
        nearChest={nearChest} nearBridge={nearBridgeId}
        isListening={isListening} transcript={transcript} volume={volume} isSupported={isSupported}
        activeZone={activeZone} currentZone={currentZone}
        speedBoostActive={speedBoostActive}
        onEnterZone={() => currentZone && setActiveZone(currentZone.id)}
        onToggleMic={isListening ? stopListening : startListening}
        removePopup={removePopup}
        onCloseZone={() => setActiveZone(null)}
        handleSpellResult={handleSpellResult}
      />

      {/* Thought bubble (No-Judgment Twist) */}
      <AnimatePresence>
        {thoughtBubble && (
          <ThoughtBubble
            key={`${thoughtBubble.hint}-${Date.now()}`}
            icon={thoughtBubble.icon}
            hint={thoughtBubble.hint}
            showTryAgain={thoughtBubble.showTryAgain}
            onDismiss={() => setThoughtBubble(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
