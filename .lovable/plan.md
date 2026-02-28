

# The Island of Rewritten Fate — /npc Zone

## Overview

Replace the placeholder NPC page with a full 3D scene featuring Elder Kong, AI dialogue, merit rewards, environmental transformation, and a Shadow Mirror challenge.

## Architecture

```text
src/
  pages/Npc.tsx                    -- 3D Canvas wrapper (like Obby.tsx)
  components/npc/
    IslandScene.tsx                -- Main scene: camera, lights, orchestration
    useIslandState.ts              -- State hook: merit, transformation, cape
    ElderKong3D.tsx                -- Grey/colored NPC model (box figure, sitting)
    IslandGround.tsx               -- Ground plane: dark dirt -> green grass lerp
    IslandTrees.tsx                -- Trees that "grow" when transformation triggers
    ShadowMirror3D.tsx             -- Mirror object with proximity detection
    IslandHUD.tsx                  -- Chat bubbles, merit counter, quest hints
supabase/functions/
    npc-chat/index.ts              -- Edge function for Elder Kong AI dialogue
```

## Detailed Plan

### 1. Edge Function: `npc-chat/index.ts`

- Modeled after existing `pet-chat/index.ts`
- System prompt: Elder Kong is a sad elder on a cursed island who believes fate cannot change. He speaks in short, wise sentences.
- Accepts `{ spokenText, currentMerit }` from client
- AI instruction: respond in character; if the player's words contain kindness keywords (`respect`, `help`, `kindness`, `please`, `thank`, `sorry`, `forgive`), include a special JSON-parseable tag `[MERIT:X]` in the response (X = points to award, 5-10)
- Returns `{ reply, meritAwarded }` after parsing the tag out of the AI response

### 2. State Hook: `useIslandState.ts`

- Tracks:
  - `localMerit: number` (session merit earned on this island)
  - `transformed: boolean` (triggers at localMerit >= 50)
  - `hasCape: boolean` (shadow mirror reward)
  - `chatHistory: {role, content}[]`
  - `elderMood: 'sad' | 'hopeful' | 'happy'` (changes at 20, 40 merit)
  - `isThinking: boolean` (AI loading state)
- `sendMessage(text)` calls the edge function, appends to history, awards merit via `meritStore.addMerit()`
- When `localMerit >= 50` and not yet transformed, sets `transformed = true`
- `claimCape(text)` checks for positive affirmation keywords ("good child", "kind", "brave", "help others") and sets `hasCape = true`

### 3. 3D Components

**ElderKong3D.tsx**
- Blocky humanoid (boxes for body, head, arms, legs) — same art style as existing BlockyBuilding/BlockyTree
- When `mood === 'sad'`: grey desaturated material, slumped posture (slight forward rotation)
- When `mood === 'hopeful'`: slight color tint, upright
- When `mood === 'happy'`: full warm color, subtle bounce animation
- Html label above head: "Elder Kong"

**IslandGround.tsx**
- Large circular platform
- Uses `useFrame` to lerp material color from dark grey/brown (`#3a3a3a`) to green (`#4a9e3f`) when `transformed` is true
- Emissive golden glow pulse when fully transformed

**IslandTrees.tsx**
- 5-6 tree positions around the island
- Each tree's scale lerps from 0 to 1 when `transformed` triggers, staggered by index (100ms apart)
- Same BlockyTree style as WorldMap3D

**ShadowMirror3D.tsx**
- Tall rectangular reflective surface (box with metallic material)
- Decorative frame (darker boxes)
- Html prompt when player is nearby: "Stand before the mirror and speak a positive affirmation"
- Glowing particle effect when cape is claimed

### 4. Scene: `IslandScene.tsx`

- Canvas with OrbitControls (like TempleScene)
- Grey fog/mist that clears on transformation (reuse TempleMist pattern)
- V-key hold-to-talk with `useSpeechRecognition`
- Voice transcript processing:
  - If near Elder Kong (default): send to AI chat
  - If near Mirror: check for affirmation keywords for cape
- Ambient light shifts from dim grey to warm golden on transformation

### 5. HUD: `IslandHUD.tsx`

- Chat panel (right side): scrollable chat bubbles showing Elder Kong's dialogue and player's speech
- Merit counter: "Merit Earned: X/50" with progress bar
- Quest tracker: checkboxes for "Convince Elder Kong (50 Merit)", "Claim Kindness Cape"
- Hold V indicator and transcript display
- Cape earned notification with sparkle animation

### 6. Page: `Npc.tsx`

- Same structure as `Obby.tsx`: full-screen div with back button overlay and `<IslandScene />`

## Merit Integration

- Uses existing `meritStore.addMerit()` so points persist globally and the MeritLedger widget updates
- The local `localMerit` counter tracks island-specific progress toward the 50-point transformation threshold

## Technical Notes

- No new dependencies needed (React Three Fiber, drei, framer-motion already installed)
- Edge function follows exact same pattern as `pet-chat` (Lovable AI gateway, Gemini Flash)
- Voice recognition reuses existing `useSpeechRecognition` hook with V-key hold-to-talk pattern

