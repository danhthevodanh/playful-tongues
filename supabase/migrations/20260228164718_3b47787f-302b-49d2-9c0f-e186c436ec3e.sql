
-- Allow anon users full access to eco_rooms for testing
CREATE POLICY "Anon can read rooms" ON public.eco_rooms FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create rooms" ON public.eco_rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update rooms" ON public.eco_rooms FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete rooms" ON public.eco_rooms FOR DELETE TO anon USING (true);

-- Allow anon users full access to eco_room_players for testing
CREATE POLICY "Anon can read players" ON public.eco_room_players FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can join rooms" ON public.eco_room_players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update players" ON public.eco_room_players FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can leave rooms" ON public.eco_room_players FOR DELETE TO anon USING (true);

-- Drop foreign key constraints that require profiles to exist
ALTER TABLE public.eco_rooms DROP CONSTRAINT IF EXISTS eco_rooms_host_profile_id_fkey;
ALTER TABLE public.eco_rooms DROP CONSTRAINT IF EXISTS eco_rooms_hunter_profile_id_fkey;
ALTER TABLE public.eco_room_players DROP CONSTRAINT IF EXISTS eco_room_players_profile_id_fkey;
