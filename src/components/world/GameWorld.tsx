import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WorldMap, ZONES } from "./WorldMap";
import { PlayerAvatar } from "./PlayerAvatar";
import { ZonePrompt } from "./ZonePrompt";
import { ZoneOverlay } from "./ZoneOverlay";

const MOVE_SPEED = 1.2; // % per tick
const TICK_MS = 50;

interface OtherPlayer {
  profile_id: string;
  x: number;
  y: number;
  name: string;
  current_zone: string | null;
}

function getZoneAt(x: number, y: number) {
  return ZONES.find(
    (z) => x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height
  ) ?? null;
}

export function GameWorld({ profileId, playerName }: { profileId: string; playerName: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const keysRef = useRef(new Set<string>());
  const posRef = useRef(pos);
  posRef.current = pos;

  // Check for auto-enter zone from URL
  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) {
      const zone = ZONES.find((z) => z.id === zoneParam);
      if (zone) {
        setPos({ x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 });
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
      }
      if (key === "enter" || key === " ") {
        const zone = getZoneAt(posRef.current.x, posRef.current.y);
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
      let dx = 0, dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= MOVE_SPEED;
      if (keys.has("s") || keys.has("arrowdown")) dy += MOVE_SPEED;
      if (keys.has("a") || keys.has("arrowleft")) dx -= MOVE_SPEED;
      if (keys.has("d") || keys.has("arrowright")) dx += MOVE_SPEED;
      if (dx !== 0 || dy !== 0) {
        setPos((p) => ({
          x: Math.max(2, Math.min(98, p.x + dx)),
          y: Math.max(2, Math.min(98, p.y + dy)),
        }));
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [activeZone]);

  // Broadcast position via Presence
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
          if (p) players.push({ profile_id: key, x: p.x, y: p.y, name: p.name, current_zone: p.current_zone });
        });
        setOtherPlayers(players);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ x: pos.x, y: pos.y, name: playerName, current_zone: activeZone });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [profileId, playerName]);

  // Throttled presence track update
  const lastTrackRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastTrackRef.current < 200) return;
    lastTrackRef.current = now;
    const channel = supabase.channel("world-presence");
    channel.track({ x: pos.x, y: pos.y, name: playerName, current_zone: activeZone }).catch(() => {});
  }, [pos, activeZone]);

  // Touch/click movement
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeZone) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) });
  }, [activeZone]);

  const currentZone = getZoneAt(pos.x, pos.y);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" onClick={handleMapClick}>
      <WorldMap />

      {/* Other players */}
      {otherPlayers.map((p) => (
        <PlayerAvatar key={p.profile_id} x={p.x} y={p.y} name={p.name} />
      ))}

      {/* Current player */}
      <PlayerAvatar x={pos.x} y={pos.y} name={playerName} isCurrentPlayer />

      {/* Zone entry prompt */}
      <ZonePrompt
        zoneName={currentZone?.label ?? ""}
        zoneIcon={currentZone?.icon ?? ""}
        visible={!!currentZone && !activeZone}
        onEnter={() => currentZone && setActiveZone(currentZone.id)}
      />

      {/* Zone overlay */}
      <ZoneOverlay
        zoneId={activeZone}
        zoneName={ZONES.find((z) => z.id === activeZone)?.label ?? ""}
        onClose={() => setActiveZone(null)}
      />

      {/* Controls hint */}
      {!activeZone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 rounded-lg bg-[hsl(0,0%,0%)]/70 backdrop-blur px-5 py-2 font-fredoka text-xs text-white shadow-lg border border-white/10">
          <span className="inline-flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">WASD</kbd> Move
            <span className="text-white/40">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">Click</kbd> Walk
            <span className="text-white/40">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">Enter</kbd> Interact
          </span>
        </div>
      )}
    </div>
  );
}
