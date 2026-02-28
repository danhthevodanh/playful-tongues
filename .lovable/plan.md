

# Remove Login Requirement from Eco Hunter

For testing, we need to allow unauthenticated users to play. Two changes:

### 1. `src/components/eco-hunter/useEcoRoom.ts`
- Generate a temporary anonymous `profileId` (random UUID) when no user is logged in, so all room logic still works
- Keep the existing auth flow so logged-in users still get their real profile

### 2. `src/components/eco-hunter/EcoHunterLobby.tsx`
- Remove the login gate (the 🔒 "Please log in" screen) so the lobby always renders

