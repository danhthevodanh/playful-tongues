

# Fix Voice-Activated Chest Breaking

## Problems Identified

### 1. Stale Closure in `useSpeechRecognition`
The `onResult` and `onError` callbacks are dependencies of the `useEffect` that creates the `SpeechRecognition` instance (line 68). Every time `GameWorld3D` re-renders, new callback references are created, causing the effect to re-run -- which **aborts and recreates** the recognition instance. This means if recognition is active and React re-renders, the instance gets destroyed mid-listen.

### 2. `onResult` callback recreated every render
In `GameWorld3D.tsx`, the `useSpeechRecognition` hook receives an inline `onResult` that captures `chestProximityState.nearestChestId`. This object reference changes on every render, triggering the destructive re-creation cycle described above.

### 3. `nearestId` stale in event listener
In `ChestManager.tsx`, the `chest-break` event listener (line 98-106) depends on `nearestId` state, but `nearestId` is set via `setNearestId` inside `useFrame` which calls setState every frame. This can cause timing issues where the event fires before React has flushed the state update.

## Solution

### Fix `useSpeechRecognition.ts`
- Store `onResult` and `onError` in refs so the `useEffect` only runs once (on mount)
- Remove `onResult` and `onError` from the `useEffect` dependency array
- This prevents the recognition instance from being destroyed on re-renders

### Fix `ChestManager.tsx`
- Use a ref for `nearestId` alongside the state, so the `chest-break` event handler always reads the latest value without depending on React state timing

### Fix `GameWorld3D.tsx`
- No changes needed -- the root cause is in the hook and manager

## Technical Details

### `useSpeechRecognition.ts` changes
- Add `onResultRef` and `onErrorRef` using `useRef`
- Update refs on each render (outside useEffect)
- In the `useEffect`, reference `onResultRef.current` and `onErrorRef.current` instead of the raw callbacks
- Change the dependency array to `[lang]` only

### `ChestManager.tsx` changes
- Add `nearestIdRef = useRef(null)` 
- Update the ref in `useFrame` alongside `setNearestId`
- In the `chest-break` event handler, read from `nearestIdRef.current` instead of `nearestId` state
- This eliminates the stale closure and removes `nearestId` from the effect dependencies

## Files to Edit
1. `src/hooks/useSpeechRecognition.ts` -- stabilize recognition instance lifecycle
2. `src/components/world/ChestManager.tsx` -- fix stale ref in event handler

