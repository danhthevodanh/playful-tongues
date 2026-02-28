
-- Create eco_rooms table
CREATE TABLE public.eco_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  host_profile_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'waiting',
  hunter_profile_id uuid REFERENCES public.profiles(id),
  round_timer_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create eco_room_players table
CREATE TABLE public.eco_room_players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.eco_rooms(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  role text NOT NULL DEFAULT 'monster',
  disguise text,
  is_alive boolean NOT NULL DEFAULT true,
  x double precision NOT NULL DEFAULT 0,
  z double precision NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eco_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_room_players ENABLE ROW LEVEL SECURITY;

-- RLS for eco_rooms
CREATE POLICY "Authenticated can read all rooms" ON public.eco_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create rooms" ON public.eco_rooms
  FOR INSERT WITH CHECK (
    host_profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "Host can update own room" ON public.eco_rooms
  FOR UPDATE USING (
    host_profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "Host can delete own room" ON public.eco_rooms
  FOR DELETE USING (
    host_profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

-- RLS for eco_room_players
CREATE POLICY "Authenticated can read room players" ON public.eco_room_players
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join rooms" ON public.eco_room_players
  FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can update own player row" ON public.eco_room_players
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can leave rooms" ON public.eco_room_players
  FOR DELETE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

-- Updated_at trigger for eco_rooms
CREATE TRIGGER update_eco_rooms_updated_at
  BEFORE UPDATE ON public.eco_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.eco_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eco_room_players;
