
# Prop Hunt: Voice-Activated Chest Breaking Mechanic

## Overview
Replace the Prop Hunt building/zone with an in-world chest spawning system. Chests appear randomly across the 3D world. When a player walks near a chest, they can activate their microphone and shout **"Break!"** to smash it open, earning coins and XP. This is a live mechanic in the world -- not a separate overlay screen.

## What Changes

### Remove Prop Hunt as a Zone Building
- Remove the `prop-hunt` entry from `ZONE_BUILDINGS` in `WorldMap3D.tsx` so there's no building to walk into
- Remove the `prop-hunt` case from `ZoneOverlay.tsx`

### New Component: `Chest3D.tsx`
A 3D treasure chest rendered in the world scene:
- Blocky chest model (box body + trapezoid lid) with a golden/brown color scheme
- Floating sparkle particles or a subtle glow to attract attention
- A bounce/hover animation (gentle up-down float using `useFrame`)
- When the player is within range (~6 units), show a label via `Html`: "Shout BREAK!"
- Breaking animation: chest shakes, opens, then fades out with coin/XP particle burst
- Each chest has an `id`, `position`, and `broken` state

### New Component: `ChestManager.tsx` (R3F component inside Canvas)
Manages chest spawning and breaking logic:
- Spawns 5-8 chests at random positions across the world (avoiding zone building areas and trees)
- Tracks which chests are broken via local state
- Every 30 seconds, respawns broken chests at new random positions
- Exposes a callback `onChestBreak(chestId)` that awards coins + XP

### Voice Integration
- Use the existing `useSpeechRecognition` hook
- When the player is near a chest (within 6 units), a microphone button appears in the HUD
- Player taps the mic button (or presses `V` key) to start listening
- If the recognized speech contains **"break"** (case-insensitive), the nearest chest breaks
- Show a speech bubble above the player briefly with what they said

### Rewards HUD
- A small overlay in the top-right corner showing current session coins and XP
- When a chest breaks: animate "+10 Coins" and "+25 XP" floating text
- Coins and XP are stored in `game_progress` table with `game_mode = 'prop-hunt'`
- Update score (coins) in the database on each break

### Updated HUD Controls
- Add mic/voice hint to the controls bar: `V` or Mic icon for voice
- Show "Shout BREAK near chests!" hint

## Files to Create / Edit

### New Files
1. **`src/components/world/Chest3D.tsx`** -- The 3D chest model + break animation
2. **`src/components/world/ChestManager.tsx`** -- Spawning logic, proximity detection, voice integration (runs inside Canvas via `useFrame` for proximity, but triggers HTML overlay for mic)

### Modified Files
3. **`src/components/world/WorldMap3D.tsx`** -- Remove `prop-hunt` from `ZONE_BUILDINGS`
4. **`src/components/world/ZoneOverlay.tsx`** -- Remove `prop-hunt` case
5. **`src/components/world/GameWorld3D.tsx`** -- Add `ChestManager` inside Canvas, add rewards HUD overlay, add `V` key binding for voice, pass `movementState.pos` to chest proximity detection

## Technical Details

### Chest Spawning Logic
- Generate random positions: x in [-70, 70], z in [-70, 70]
- Filter out positions too close to zone buildings (within 15 units) or spawn (within 10 units)
- Each chest gets a unique ID (`chest-0`, `chest-1`, etc.)

### Proximity Detection
- Inside `useFrame`, check distance from `movementState.pos` to each active chest
- If any chest is within 6 units, set `nearestChest` state
- This drives the "Shout BREAK!" prompt in the HUD

### Voice Breaking Flow
```text
Player walks near chest
  -> HUD shows "Shout BREAK!" + mic button
  -> Player presses V or taps mic
  -> Speech recognition starts
  -> Player says "Break!"
  -> Transcript matched -> chest breaks
  -> Break animation plays (shake + particles)
  -> Chest removed, rewards shown
  -> Score saved to game_progress
```

### Rewards
- Each chest gives: 10 coins (added to `score`) and 25 XP
- Saved to `game_progress` with `game_mode = 'prop-hunt'` and `profile_id`
- Upsert pattern: if row exists, increment score; otherwise insert new row

### Database
- No new tables needed -- reuse `game_progress` with `game_mode = 'prop-hunt'`
- Score field tracks total coins earned

## Implementation Steps
1. Remove `prop-hunt` from `ZONE_BUILDINGS` and `ZoneOverlay`
2. Create `Chest3D.tsx` with the 3D chest model and break animation
3. Create `ChestManager.tsx` with spawning, proximity, and voice logic
4. Update `GameWorld3D.tsx` to integrate chests, rewards HUD, and voice key binding
5. Wire up `game_progress` upsert for saving coins/XP
