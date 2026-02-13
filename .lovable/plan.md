

# Fix Movement Glitching, Voice Duration, and Speech Detection

## 3 Issues Found

### Issue 1: Movement Glitching
**Cause**: `ChestManager`'s `useFrame` calls `setNearestId(closest)` every single frame (60fps), triggering React re-renders constantly. This causes the entire component tree to re-render, which interferes with smooth movement rendering.

**Fix** (`ChestManager.tsx`): Only call `setNearestId` when the value actually changes. Compare against the ref before setting state.

### Issue 2: "Listening" Turns Off Too Quickly
**Cause**: `SpeechRecognition` is configured with `continuous = false` (line 32 of `useSpeechRecognition.ts`). The browser's speech recognition automatically stops after detecting a short pause in speech, often within 1-2 seconds. The `onend` callback fires and sets `isListening = false`, hiding the UI.

**Fix** (`useSpeechRecognition.ts`): 
- Set `continuous = true` so recognition keeps listening
- Add an auto-stop timeout (5 seconds) that starts when `startListening` is called
- Clear the timeout if `stopListening` is called manually or on a successful result

### Issue 3: Saying "Break" Does Nothing
**Cause**: The `onResult` callback checks `chestProximityState.nearestChestId`, but the `chest-break` event handler in `ChestManager` has a stale `breakingId` closure (the effect depends on `[breakingId]`). Also, with `continuous = false`, recognition may end before processing the final transcript. Additionally, the interim results should also be checked for the "break" keyword, not just the final transcript.

**Fix**:
- In `useSpeechRecognition.ts`: Also trigger `onResult` on interim transcripts that contain the keyword (or better, trigger the callback for both interim and final)
- In `ChestManager.tsx`: Use a ref for `breakingId` too, so the event handler never has stale state
- In `GameWorld3D.tsx`: Also check interim transcript in the `onResult` handler -- actually, better to add a separate `onInterim` callback or check transcript in the existing flow

**Simplified approach**: Check for "break" in both interim and final results within the speech hook, and use a ref for `breakingId` in ChestManager.

## Files to Edit

### 1. `src/components/world/ChestManager.tsx`
- Only call `setNearestId()` when value changes (fix movement glitch from constant re-renders)
- Use a `breakingIdRef` alongside state so the event handler is never stale

### 2. `src/hooks/useSpeechRecognition.ts`
- Set `continuous = true`
- Add a 5-second auto-stop timer started in `startListening`, cleared in `stopListening`
- Fire `onResult` for interim transcripts too (so "break" is caught immediately, even before the browser finalizes)

### 3. `src/components/world/GameWorld3D.tsx`
- No structural changes needed -- the `onResult` callback already checks for "break". The fixes in the hook and manager will make it work.

## Technical Details

### ChestManager setState throttling
```
// In useFrame, only update React state when value changes:
if (closest !== nearestIdRef.current) {
  nearestIdRef.current = closest;
  setNearestId(closest);
}
chestProximityState.nearestChestId = closest; // always update shared state
```

### Speech Recognition continuous + auto-timeout
```
recognition.continuous = true;  // keep listening
// In startListening: set a 5s timeout that calls stopListening
// In stopListening / onResult with "break": clear the timeout
```

### Interim transcript matching
In the `onresult` handler, call `onResultRef.current` with interim text too, so "break" is caught the moment it's partially recognized -- not just after the browser finalizes. Use a flag or separate callback to differentiate.

