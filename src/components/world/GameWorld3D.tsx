import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import { WorldMap3D, ZONE_BUILDINGS } from "./WorldMap3D";
import { PlayerCharacter3D } from "./PlayerCharacter3D";
import { OtherPlayer3D } from "./OtherPlayer3D";
import { ZonePrompt } from "./ZonePrompt";
import { ZoneOverlay } from "./ZoneOverlay";

const MOVE_SPEED = 0.3;
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

// Ground click handler component inside Canvas
function GroundClickHandler({ onClickGround }: { onClickGround: (point: THREE.Vector3) => void }) {
  const { raycaster, camera, gl } = useThree();

  useEffect(() => {
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const handleClick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersection);
      if (intersection) {
        onClickGround(intersection);
      }
    };
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [raycaster, camera, gl, onClickGround]);

  return null;
}

export function GameWorld3D({ profileId, playerName }: { profileId: string; playerName: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pos, setPos] = useState({ x: 0, z: 0 });
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const keysRef = useRef(new Set<string>());
  const posRef = useRef(pos);
  const targetRef = useRef<{ x: number; z: number } | null>(null);
  const rotationRef = useRef(0);
  const movingRef = useRef(false);
  posRef.current = pos;

  // URL zone auto-enter
  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) {
      const zone = ZONE_BUILDINGS.find((z) => z.id === zoneParam);
      if (zone) {
        setPos({ x: zone.position[0], z: zone.position[2] });
        setActiveZone(zoneParam);
        setSearchParams({}, { replace: true });
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeZone) return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
        targetRef.current = null; // cancel click-to-move
      }
      if (key === "enter" || key === " ") {
        const zone = getZoneAt(posRef.current.x, posRef.current.z);
        if (zone) setActiveZone(zone.id);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeZone]);

  // Movement loop
  useEffect(() => {
    if (activeZone) return;
    const interval = setInterval(() => {
      const keys = keysRef.current;
      let dx = 0, dz = 0;

      if (keys.has("w") || keys.has("arrowup")) dz -= MOVE_SPEED;
      if (keys.has("s") || keys.has("arrowdown")) dz += MOVE_SPEED;
      if (keys.has("a") || keys.has("arrowleft")) dx -= MOVE_SPEED;
      if (keys.has("d") || keys.has("arrowright")) dx += MOVE_SPEED;

      // Click-to-move
      if (dx === 0 && dz === 0 && targetRef.current) {
        const tdx = targetRef.current.x - posRef.current.x;
        const tdz = targetRef.current.z - posRef.current.z;
        const dist = Math.sqrt(tdx * tdx + tdz * tdz);
        if (dist < 0.5) {
          targetRef.current = null;
        } else {
          dx = (tdx / dist) * MOVE_SPEED;
          dz = (tdz / dist) * MOVE_SPEED;
        }
      }

      if (dx !== 0 || dz !== 0) {
        movingRef.current = true;
        rotationRef.current = Math.atan2(dx, dz);
        setPos((p) => ({
          x: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, p.x + dx)),
          z: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, p.z + dz)),
        }));
      } else {
        movingRef.current = false;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [activeZone]);

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
          await channel.track({ x: pos.x, z: pos.z, name: playerName, current_zone: activeZone });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [profileId, playerName]);

  // Throttled presence update
  const lastTrackRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastTrackRef.current < 200) return;
    lastTrackRef.current = now;
    const channel = supabase.channel("world-presence");
    channel.track({ x: pos.x, z: pos.z, name: playerName, current_zone: activeZone }).catch(() => {});
  }, [pos, activeZone]);

  const handleClickGround = useCallback((point: THREE.Vector3) => {
    if (activeZone) return;
    targetRef.current = {
      x: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, point.x)),
      z: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, point.z)),
    };
  }, [activeZone]);

  const currentZone = getZoneAt(pos.x, pos.z);
  const playerPos = new THREE.Vector3(pos.x, 0, pos.z);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }}>
        <WorldMap3D />
        <GroundClickHandler onClickGround={handleClickGround} />

        {/* Current player */}
        <PlayerCharacter3D
          position={playerPos}
          name={playerName}
          isCurrentPlayer
          rotation={rotationRef.current}
          moving={movingRef.current}
        />

        {/* Other players */}
        {otherPlayers.map((p) => (
          <OtherPlayer3D key={p.profile_id} x={p.x} z={p.z} name={p.name} />
        ))}
      </Canvas>

      {/* HTML Overlays */}
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

      {/* Controls HUD */}
      {!activeZone && (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 px-5 py-2 font-fredoka text-xs text-white shadow-lg backdrop-blur">
          <span className="inline-flex items-center gap-2">
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">WASD</kbd> Move
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Click</kbd> Walk
            <span className="text-white/40">·</span>
            <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Enter</kbd> Interact
          </span>
        </div>
      )}
    </div>
  );
}
