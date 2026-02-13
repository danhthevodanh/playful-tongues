
# Vast 3D World using React Three Fiber

## Overview
Replace the current flat 2D CSS-based world with a full **3D environment** powered by React Three Fiber. The player character walks around a large, open grassy terrain with Roblox-style blocky buildings for each zone, trees, paths, clouds, and a third-person camera that follows the player. The world will feel expansive -- not confined to a single screen.

## What Changes

### New Dependencies
- `three` (>=0.133)
- `@react-three/fiber` (^8.18)
- `@react-three/drei` (^9.122.0)

### New / Rewritten Components

**`WorldMap3D.tsx`** -- The 3D scene
- A large green plane (200x200 units) as the ground with a grid texture
- Sky/environment using drei's `Sky` component
- 4 blocky buildings (box geometries with colored materials) placed far apart at zone positions
- Decorative blocky trees (cylinder trunk + box leaves) scattered around
- Dirt paths (thin brown planes) connecting the zones
- A glowing spawn pad at the center
- Zone labels using drei's `Html` component floating above each building

**`PlayerCharacter3D.tsx`** -- The player in 3D
- A simple blocky Roblox-style character made from box geometries (head, torso, legs, arms)
- Colors derived from the player name hash (same logic as current)
- Arm swing animation using useFrame
- Name tag above the head using `Html`
- Third-person camera follows behind this character using drei's camera controls

**`GameWorld3D.tsx`** -- Replaces GameWorld.tsx logic
- Wraps everything in a `<Canvas>` from R3F
- Same WASD/arrow key movement but now moves a 3D position (x, z plane)
- Click-to-move: raycasts onto the ground plane to get target position
- Zone detection based on 3D distance to zone center points
- Same Supabase Presence integration for multiplayer
- Same ZonePrompt and ZoneOverlay (these stay as HTML overlays on top of the canvas)
- World boundaries expanded: player can roam -100 to +100 on both axes

**`OtherPlayer3D.tsx`** -- Other players rendered in the 3D scene
- Same blocky character, positioned at their broadcast coordinates
- Smoothly interpolated movement using lerp in useFrame

### Kept As-Is (HTML overlays)
- `ZonePrompt.tsx` -- still floats as an HTML overlay when near a zone
- `ZoneOverlay.tsx` -- still opens as a modal overlay for activities
- `World.tsx` -- just renders GameWorld3D instead of GameWorld

### Camera
- Third-person camera positioned behind and above the player (offset: 0, 8, 12)
- Looks at the player position
- Smooth follow using lerp each frame

## Zone Layout (3D coordinates)
- Spawn: (0, 0, 0) -- center
- NPC Hut: (-30, 0, -30) -- far top-left
- Prop Hunt: (30, 0, -30) -- far top-right
- Pet Garden: (-30, 0, 30) -- far bottom-left
- Obby Track: (30, 0, 30) -- far bottom-right

Zones trigger when the player is within 12 units of a building center.

## Movement
- WASD/Arrows move at 0.3 units per frame on the XZ plane
- Click on ground: raycast hit point becomes the target, player walks toward it
- World bounds: -90 to 90 on both axes (large roaming area)
- Character faces movement direction

## Technical Details

```text
Canvas (full screen)
  |-- ambientLight + directionalLight
  |-- Sky (drei)
  |-- Ground plane (200x200, green)
  |-- Grid overlay (subtle lines)
  |-- Zone buildings (4x BoxGeometry groups)
  |-- Trees (scattered CylinderGeometry + BoxGeometry)
  |-- Paths (thin planes connecting zones)
  |-- Spawn pad (glowing plane at center)
  |-- PlayerCharacter3D (current player, camera follows)
  |-- OtherPlayer3D[] (multiplayer avatars)
  |-- Html labels (zone names, player names)

HTML Overlay (on top of Canvas)
  |-- ZonePrompt
  |-- ZoneOverlay
  |-- Controls HUD
```

## Implementation Steps
1. Install `three`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`
2. Create `WorldMap3D.tsx` with ground, sky, buildings, trees, paths
3. Create `PlayerCharacter3D.tsx` with blocky character + camera follow
4. Create `OtherPlayer3D.tsx` for multiplayer avatars
5. Create `GameWorld3D.tsx` combining everything with movement, zone detection, presence sync
6. Update `World.tsx` to use `GameWorld3D`
7. Keep ZonePrompt and ZoneOverlay as HTML overlays
