

# Eco Hunter — Multiplayer Cleanup Game

## Concept

Replace `/prop-hunt` with a real-time multiplayer "Eco Hunter" game. Up to 16 players join a room. One random player becomes the **Hunter**; the rest become **Monsters** who disguise as trash objects polluting a 3D arena. The Hunter must find and destroy monsters by approaching them and voice-commanding **"Recycle!"**. Monsters try to blend in with real trash and survive until the timer runs out.

## Database Changes

**New table: `eco_rooms`**
- `id` (uuid, PK), `code` (text, unique 6-char room code), `host_profile_id` (uuid), `status` (text: waiting/playing/finished), `hunter_profile_id` (uuid, nullable), `round_timer_end` (timestamptz, nullable), `created_at`, `updated_at`
- RLS: authenticated users can read all rooms, insert own, update if host

**New table: `eco_room_players`**
- `id` (uuid, PK), `room_id` (uuid, FK to eco_rooms), `profile_id` (uuid), `role` (text: hunter/monster/spectator), `disguise` (text, nullable — trash type), `is_alive` (boolean, default true), `x`/`z` (float), `score` (int, default 0), `joined_at` (timestamptz)
- RLS: authenticated can read players in their room, update own row
- Enable realtime on both tables

## Architecture

```text
┌──────────────────────────────────────────────┐
│  /prop-hunt route (PropHunt.tsx)              │
│                                              │
│  ┌─────────────┐    ┌──────────────────────┐ │
│  │ Lobby Screen │───▸│ EcoHunterGame (3D)   │ │
│  │ - Create/Join│    │ - Arena map          │ │
│  │ - Room code  │    │ - Player positions   │ │
│  │ - Player list│    │ - Trash objects      │ │
│  │ - Ready up   │    │ - Voice: "Recycle!"  │ │
│  └─────────────┘    │ - Timer + scoreboard │ │
│                      └──────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create database tables
- `eco_rooms` and `eco_room_players` with RLS policies
- Enable realtime on both tables

### 2. Build Lobby UI (`src/pages/PropHunt.tsx`)
- **Create Room**: generates 6-char code, inserts into `eco_rooms`, subscribes to realtime
- **Join Room**: enter code, insert into `eco_room_players`
- **Player list**: realtime sync showing who's in the room (max 16)
- **Start button** (host only): randomly picks hunter, sets `status=playing`, assigns roles

### 3. Build 3D Arena (`src/components/eco-hunter/EcoHunterArena.tsx`)
- Flat arena with scattered trash objects (bottles, cans, bags — simple box meshes with labels)
- Reuse existing `PlayerCharacter3D` for all players
- Monsters see a "Disguise" button to transform into a trash object (stop moving, become a static mesh)
- Trash objects are a mix of real (static) and monster-disguised

### 4. Game loop & roles
- **Hunter**: moves with WASD, approaches trash, holds V and says "Recycle!" to destroy. If it's a monster → +50 points, monster eliminated. If real trash → +10 points (cleanup). Wrong call on real object: -5 points
- **Monsters**: move with WASD, press E to disguise as a nearby trash type. While disguised, they're frozen but look like trash. Can un-disguise to reposition. If caught → spectator mode
- **Timer**: 90-second rounds synced via `round_timer_end` in the room row

### 5. Real-time sync
- Use Supabase Presence channel per room (`eco-room-{code}`) for player positions (same pattern as world presence)
- Use postgres_changes on `eco_room_players` for role/alive status updates
- Use postgres_changes on `eco_rooms` for game state transitions

### 6. Scoring & end screen
- When timer ends or all monsters eliminated: set `status=finished`
- Show leaderboard overlay with scores
- "Play Again" button: host can restart (re-randomize hunter)

### 7. Environment recovery visual
- As Hunter recycles trash, the arena visually cleans up: grass gets greener, flowers appear, pollution particles fade — reinforcing the eco theme

## Files to Create/Modify

- **Modify**: `src/pages/PropHunt.tsx` — lobby + game container
- **Create**: `src/components/eco-hunter/EcoHunterLobby.tsx` — room create/join UI
- **Create**: `src/components/eco-hunter/EcoHunterArena.tsx` — 3D game arena
- **Create**: `src/components/eco-hunter/EcoHunterHUD.tsx` — timer, scores, role indicator
- **Create**: `src/components/eco-hunter/TrashObject3D.tsx` — 3D trash meshes
- **Create**: `src/components/eco-hunter/useEcoRoom.ts` — hook for room state + realtime
- **DB migration**: create `eco_rooms` and `eco_room_players` tables

