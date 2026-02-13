
-- Create player_positions table for real-time multiplayer
CREATE TABLE public.player_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  x FLOAT NOT NULL DEFAULT 50,
  y FLOAT NOT NULL DEFAULT 50,
  current_zone TEXT DEFAULT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all positions
CREATE POLICY "Authenticated users can view all positions"
ON public.player_positions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert their own position
CREATE POLICY "Users can insert own position"
ON public.player_positions
FOR INSERT
WITH CHECK (is_own_profile(profile_id) OR is_parent_of(profile_id));

-- Users can update their own position
CREATE POLICY "Users can update own position"
ON public.player_positions
FOR UPDATE
USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

-- Users can delete their own position
CREATE POLICY "Users can delete own position"
ON public.player_positions
FOR DELETE
USING (is_own_profile(profile_id) OR is_parent_of(profile_id));

-- Trigger for updated_at
CREATE TRIGGER update_player_positions_updated_at
BEFORE UPDATE ON public.player_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_positions;
