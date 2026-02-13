

# 🎮 SpeakWorld — Voice-Powered English Game for Kids

A browser-based multiplayer game where kids learn English by *playing*, not studying. English is the "energy" that powers the game world — speaking unlocks platforms, grows pets, and drives social quests.

---

## 🏠 1. Home & Onboarding
- **Parent-managed account creation** — parent signs up with email, creates a child profile (name, avatar, native language)
- **Kid-friendly home screen** — colorful hub world showing the 4 game modes as doors/portals
- **Living Pet** displayed prominently on the home screen, showing its current evolution state
- Beginner vocabulary level content throughout

---

## 🐾 2. The Living Pet (Core Progression System)
- Every player starts with a small silent **"Blob"** pet
- The pet **glows and grows** based on how much the child speaks English (not correctness — just participation)
- Evolution stages: Blob → ears → tail → wings → full creature
- Pet repeats the child's favorite words back in a funny voice (via ElevenLabs TTS)
- Pet serves as the emotional anchor across all game modes
- Progress is saved to the player's account

---

## 🗣️ 3. Mumble-to-Magic NPC Assistant
- A friendly **"Foreign Traveler"** NPC who also struggles with language
- When the kid speaks and the AI is unsure, the NPC pulls out a **"Magic Sketchbook"** showing 3 illustrated options (e.g., Cake, Cat, Car)
- The NPC uses ElevenLabs voice to say: *"Oh! Are you looking for the..."* — encouraging the child to confirm
- Creates a **shadowing loop** where the child naturally repeats words
- No judgment, no scores — just a curious conversation partner

---

## 🔍 4. Prop Hunt Social Quests (Multiplayer)
- Real-time multiplayer rooms where kids play together
- One player receives a **"Secret Word"** (e.g., "Blue Umbrella")
- They must find the matching object in a 2D illustrated scene and **say its name aloud**
- Other players can hear and help — social, cooperative play
- Rooms support 2-4 players with voice chat powered by ElevenLabs

---

## 🏃 5. Voice-Activated Obstacle Course ("Obby")
- 2D side-scrolling platform course
- Platforms and obstacles only respond to **voice commands**: "Up!", "Left!", "Jump!", "Go!"
- Silence = no movement — the child *must* speak to progress
- Beginner vocabulary: basic directions and action words
- Timed runs with personal bests (no competitive pressure)

---

## 🔧 6. Backend & Infrastructure
- **Supabase** for authentication (parent accounts), database (profiles, pet state, game progress), and real-time multiplayer sync
- **ElevenLabs** for:
  - Speech-to-text (recognizing what the child says)
  - Text-to-speech (NPC and pet voices)
- Real-time multiplayer rooms using Supabase Realtime for Prop Hunt
- Saved progress: pet evolution, words spoken, games completed

---

## 🎨 7. Visual Style
- **2D cartoon / illustrated** art style — bright, colorful, kid-friendly
- Animated characters and pets using CSS/SVG animations
- Illustrated scene backgrounds for Prop Hunt rooms
- Playful UI with large touch-friendly buttons (tablet-compatible)

---

## 📋 Build Order
1. **Foundation** — Auth, profiles, home hub, basic navigation
2. **Living Pet** — Blob creature with speech-driven evolution + ElevenLabs TTS for pet voice
3. **Voice Obby** — Voice-command obstacle course with ElevenLabs STT
4. **Mumble NPC** — Magic Sketchbook conversation flow
5. **Prop Hunt** — Multiplayer rooms with real-time sync and voice
6. **Polish** — Animations, sound effects, pet personality, content expansion

