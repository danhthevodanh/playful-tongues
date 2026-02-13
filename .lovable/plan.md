

# Unified Interactive World - SpeakWorld

## Overview
Replace the separate game pages with a single **2D top-down world map** where all players exist together. The 4 game activities become **zones** on the map that players walk into. Players see each other moving around in real-time via their pet blob avatars.

## How It Works for Players
1. After login, players enter the world and see a colorful illustrated map
2. Their pet blob avatar appears and they move it by tapping/clicking or using arrow keys
3. Other online players are visible as their own blob pets moving around
4. Walking into a zone (Pet Garden, Obby Track, NPC Hut, Prop Hunt Plaza) opens that activity as an overlay
5. Players can see who else is in each zone via small avatar indicators
6. A chat bubble shows when someone speaks (speech recognition active world-wide)

## World Map Layout

```text
+------------------------------------------+
|              NPC Hut (top-left)           |
|   [Wizard]          Prop Hunt Plaza       |
|                     (top-right) [Objects] |
|                                           |
|            [ Spawn / Center ]             |
|            Players appear here            |
|                                           |
|   Pet Garden        Obby Track            |
|   (bottom-left)     (bottom-right)        |
|   [Flowers]         [Platforms]           |
+------------------------------------------+
```

## Technical Plan

### 1. Database: Real-time player positions
- Create a `player_positions` table with `profile_id`, `x`, `y`, `current_zone`, `is_online`
- Enable Supabase Realtime on this table so all players see each other
- RLS: anyone authenticated can read all positions, but only update their own

### 2. New Components

**GameWorld.tsx** - The main world container
- Renders a full-screen 2D map using absolute-positioned divs (not canvas, for simplicity)
- Colorful illustrated background with 4 distinct zone areas
- Handles keyboard (WASD/arrows) and touch/click movement
- Subscribes to Supabase Realtime for other players' positions
- Updates own position to the database on movement

**PlayerAvatar.tsx** - Each player on the map
- Renders a small BlobPet at the player's (x, y) position
- Shows the player's name below
- Speech bubble when they're talking
- Smooth movement animation via framer-motion

**ZoneOverlay.tsx** - Activity overlay when entering a zone
- When player walks into a zone boundary, shows a "Enter [Zone]?" prompt
- On confirm, opens the activity UI as a modal/overlay (not a page navigation)
- The existing Pet, Obby, NPC, PropHunt logic runs inside the overlay
- Close button to return to the world

**WorldMap.tsx** - The background map
- SVG or div-based illustrated background
- 4 colored regions with labels and icons
- Decorative elements (trees, flowers, paths)

### 3. Refactored Activity Components
- Extract Pet, Obby, NPC, PropHunt logic into reusable components (not full pages)
- They render inside ZoneOverlay rather than as standalone routes
- Keep the existing pages as redirects to the world for backward compatibility

### 4. Real-time Multiplayer
- Use Supabase Realtime Presence channel for lightweight position sync
- Broadcast player position every 200ms while moving (throttled)
- Show up to 20 nearest players on screen
- Player list panel showing who's online and in which zone

### 5. Routing Changes
- `/world` becomes the main game route (replaces individual game pages)
- `/pet`, `/obby`, `/npc`, `/prop-hunt` redirect to `/world` with a query param to auto-enter that zone
- Home page portal buttons navigate to `/world?zone=pet` etc.

### 6. Edge Function Update
- Update `pet-chat` to also work in the world context (no changes needed, already standalone)
- Add a `world-chat` edge function for general world chat between players using AI moderation

### 7. Implementation Order
1. Database migration for `player_positions` table + Realtime
2. `WorldMap.tsx` - static illustrated background with zones
3. `PlayerAvatar.tsx` - movable player blob
4. `GameWorld.tsx` - movement controls, zone detection, position sync
5. `ZoneOverlay.tsx` - activity overlay system
6. Refactor Pet activity into overlay-compatible component
7. Stub the other 3 zones (Obby, NPC, PropHunt) with placeholder content
8. Real-time multiplayer: Presence channel for seeing other players
9. Route updates and home page navigation changes

## What Gets Built Now vs Later
- **Now**: The world map, player movement, zone entry system, Pet zone working inside the world, real-time player visibility
- **Later**: Full Obby gameplay, NPC conversation, Prop Hunt multiplayer mechanics (these remain as "coming soon" inside their zones)

