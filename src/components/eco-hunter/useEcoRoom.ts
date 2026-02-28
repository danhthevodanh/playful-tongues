import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RoomStatus = "waiting" | "playing" | "finished";
export type PlayerRole = "hunter" | "monster" | "spectator";

export interface EcoRoom {
  id: string;
  code: string;
  host_profile_id: string;
  status: RoomStatus;
  hunter_profile_id: string | null;
  round_timer_end: string | null;
}

export interface EcoPlayer {
  id: string;
  room_id: string;
  profile_id: string;
  role: PlayerRole;
  disguise: string | null;
  is_alive: boolean;
  x: number;
  z: number;
  score: number;
  joined_at: string;
  name?: string;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useEcoRoom() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [room, setRoom] = useState<EcoRoom | null>(null);
  const [players, setPlayers] = useState<EcoPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get current user's profile, or generate anonymous ID for testing
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        if (data) { setProfileId(data.id); return; }
      }
      // Anonymous fallback for testing
      const stored = sessionStorage.getItem("eco-anon-profile-id");
      if (stored) { setProfileId(stored); return; }
      const anonId = crypto.randomUUID();
      sessionStorage.setItem("eco-anon-profile-id", anonId);
      setProfileId(anonId);
    };
    getProfile();
  }, []);

  const subscribeToRoom = useCallback((roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`eco-room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "eco_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setRoom(payload.new as EcoRoom);
          }
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "eco_room_players", filter: `room_id=eq.${roomId}` },
        async () => {
          // Refetch all players with names
          const { data } = await supabase
            .from("eco_room_players")
            .select("*, profiles!eco_room_players_profile_id_fkey(name)")
            .eq("room_id", roomId);
          if (data) {
            setPlayers(data.map((p: any) => ({ ...p, name: p.profiles?.name || "Player" })));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  const createRoom = useCallback(async () => {
    if (!profileId) { setError("Not logged in"); return; }
    setLoading(true);
    setError(null);
    const code = generateCode();
    const { data, error: err } = await supabase
      .from("eco_rooms")
      .insert({ code, host_profile_id: profileId, status: "waiting" })
      .select()
      .single();

    if (err || !data) { setError(err?.message || "Failed to create room"); setLoading(false); return; }

    // Host joins as player
    await supabase.from("eco_room_players").insert({ room_id: data.id, profile_id: profileId, role: "monster" });

    setRoom(data as EcoRoom);
    subscribeToRoom(data.id);

    // Fetch players
    const { data: pData } = await supabase
      .from("eco_room_players")
      .select("*, profiles!eco_room_players_profile_id_fkey(name)")
      .eq("room_id", data.id);
    if (pData) setPlayers(pData.map((p: any) => ({ ...p, name: p.profiles?.name || "Player" })));

    setLoading(false);
  }, [profileId, subscribeToRoom]);

  const joinRoom = useCallback(async (code: string) => {
    if (!profileId) { setError("Not logged in"); return; }
    setLoading(true);
    setError(null);

    const { data: roomData, error: rErr } = await supabase
      .from("eco_rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (rErr || !roomData) { setError("Room not found or already started"); setLoading(false); return; }

    // Check player count
    const { count } = await supabase
      .from("eco_room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomData.id);

    if ((count || 0) >= 16) { setError("Room is full (16/16)"); setLoading(false); return; }

    // Check if already in room
    const { data: existing } = await supabase
      .from("eco_room_players")
      .select("id")
      .eq("room_id", roomData.id)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("eco_room_players").insert({ room_id: roomData.id, profile_id: profileId, role: "monster" });
    }

    setRoom(roomData as EcoRoom);
    subscribeToRoom(roomData.id);

    const { data: pData } = await supabase
      .from("eco_room_players")
      .select("*, profiles!eco_room_players_profile_id_fkey(name)")
      .eq("room_id", roomData.id);
    if (pData) setPlayers(pData.map((p: any) => ({ ...p, name: p.profiles?.name || "Player" })));

    setLoading(false);
  }, [profileId, subscribeToRoom]);

  const startGame = useCallback(async () => {
    if (!room || !profileId) return;
    // Pick random hunter
    const hunterIdx = Math.floor(Math.random() * players.length);
    const hunterId = players[hunterIdx].profile_id;

    // Update all player roles
    for (const p of players) {
      await supabase
        .from("eco_room_players")
        .update({
          role: p.profile_id === hunterId ? "hunter" : "monster",
          is_alive: true,
          score: 0,
          x: Math.random() * 40 - 20,
          z: Math.random() * 40 - 20,
        })
        .eq("id", p.id);
    }

    // Set room to playing with 90s timer
    const timerEnd = new Date(Date.now() + 90_000).toISOString();
    await supabase
      .from("eco_rooms")
      .update({ status: "playing", hunter_profile_id: hunterId, round_timer_end: timerEnd })
      .eq("id", room.id);
  }, [room, profileId, players]);

  const leaveRoom = useCallback(async () => {
    if (!room || !profileId) return;
    await supabase.from("eco_room_players").delete().eq("room_id", room.id).eq("profile_id", profileId);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    setRoom(null);
    setPlayers([]);
  }, [room, profileId]);

  const isHost = room?.host_profile_id === profileId;

  return { profileId, room, players, loading, error, isHost, createRoom, joinRoom, startGame, leaveRoom };
}
