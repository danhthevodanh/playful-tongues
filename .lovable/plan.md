

# Merit Ledger -- Global Character Development System

## Overview

Add two persistent global stats -- **Merit Points** (ethical growth inspired by Di Zi Gui / Liao Fan) and **Eco-Vitality** (SDG 13 environmental progress) -- tracked across all game activities. A floating **Merit Ledger** (So Cong Qua) book icon appears as a persistent UI element, glowing when points are earned. Values are saved to the database and loaded on login.

## Database Changes

Add two new columns to the existing `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN merit_points integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN eco_vitality integer NOT NULL DEFAULT 0;
```

No new tables needed. Existing RLS policies on `profiles` already allow users to read/update their own profile.

## New Files

### 1. `src/stores/useMeritStore.ts` -- Global State (Zustand-like pattern with React context)

A lightweight global store using a shared singleton + `useSyncExternalStore`:

- **State**: `meritPoints`, `ecoVitality`, `profileId`, `loaded`, `glowing`
- **Actions**: `addMerit(amount)`, `addEcoVitality(amount)`, `loadFromProfile(profileId)`, `saveToProfile()`
- Auto-saves to the database on every point change (debounced ~2 seconds)
- Sets `glowing = true` for 1.5s whenever points are added (drives the book glow animation)
- Exports `useMeritStore()` hook and standalone `meritStore` for non-React contexts

### 2. `src/components/MeritLedger.tsx` -- Floating 3D Golden Book UI

A fixed-position floating UI component:

- Golden book emoji/icon (📖) in a circular container, bottom-left of screen
- Shows current Merit Points and Eco-Vitality as small badges
- **Glow effect**: golden pulse animation (CSS box-shadow + scale) triggered by `glowing` state
- Click to expand a small panel showing:
  - Merit Points with a virtue icon
  - Eco-Vitality with a leaf icon
  - Next milestone progress bar
- Uses framer-motion for enter/exit animations
- Renders on all pages (added to `App.tsx`)

### 3. `src/lib/milestones.ts` -- Kindness Milestones Definition

Defines milestone thresholds and labels:

```text
Merit:  10 = "First Kindness", 50 = "Virtuous Heart", 100 = "Di Zi Gui Scholar", ...
Eco:    10 = "Seedling", 50 = "Green Guardian", 100 = "Climate Champion", ...
```

Exports a `checkMilestone(type, oldVal, newVal)` function that returns a milestone name if one was just crossed.

## Modified Files

### 4. `src/App.tsx` -- Add MeritLedger globally

- Import and render `<MeritLedger />` alongside the existing Toasters, so it appears on every page.

### 5. `src/pages/World.tsx` -- Initialize store on load

- After loading the profile, call `meritStore.loadFromProfile(profileId)` to hydrate values from the database.

### 6. `src/components/world/GameWorld3D.tsx` -- Award Eco-Vitality

- In `handleChestBreak`: call `meritStore.addEcoVitality(5)` (recycling/cleanup action)
- In `handleSpellResult` for bridge/open spells: call `meritStore.addMerit(2)` (voice interaction reward)
- Check milestones and fire toast notifications using `sonner` toast

### 7. `src/components/activities/PetActivity.tsx` -- Award Merit Points

- In `handleSpeechResult`: call `meritStore.addMerit(wordCount)` (ethical voice interaction)
- Check milestones and fire toast notification

### 8. `src/components/eco-hunter/EcoHunterArena.tsx` -- Award Eco-Vitality

- When hunter recycles trash: call `meritStore.addEcoVitality(10)`
- When monster is caught: `meritStore.addEcoVitality(5)`

## Toast Notifications for Milestones

Use the existing `sonner` toast (already in App.tsx) to celebrate milestones:

```
toast("Kindness Milestone!", { description: "Virtuous Heart -- 50 Merit Points!" })
```

Triggered automatically by the store's `addMerit` / `addEcoVitality` when a threshold is crossed.

## Technical Details

- **No new dependencies** needed -- uses React's `useSyncExternalStore` for the global store pattern
- **Debounced save**: accumulates changes and writes to the database every 2 seconds max to avoid excessive writes
- **Glow animation**: CSS `@keyframes` with `box-shadow` gold glow + subtle scale pulse, toggled by store state
- The Merit Ledger floats at `fixed bottom-4 left-4 z-50` so it never conflicts with game HUD elements (which are top-right and bottom-center)

