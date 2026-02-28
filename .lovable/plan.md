

# Fix RLS Policies for Eco Hunter Testing

The current RLS policies on `eco_rooms` and `eco_room_players` require authenticated users with matching profiles. Since we removed the login gate and use anonymous UUIDs, we need to open these tables for testing.

## Database Migration

Add permissive policies for both `anon` and `authenticated` roles on `eco_rooms` and `eco_room_players`:

1. **`eco_rooms`**: Add INSERT/SELECT/UPDATE/DELETE policies for `anon` role with `WITH CHECK (true)` / `USING (true)`
2. **`eco_room_players`**: Add INSERT/SELECT/UPDATE/DELETE policies for `anon` role with `WITH CHECK (true)` / `USING (true)`
3. Also drop the foreign key constraints on `profile_id` and `host_profile_id` that reference `profiles(id)`, since anonymous users won't have profile rows — or alternatively, make the existing policies permissive instead of restrictive

**Simpler approach**: Change all existing restrictive policies to permissive, and add blanket `anon` access policies. This is for testing only.

### SQL Migration
```sql
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
```

## No Code Changes Needed

The `useEcoRoom.ts` already generates anonymous UUIDs and the lobby gate is already removed. Only the database policies are blocking.

