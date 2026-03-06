# Mobile App Design Document & Known Issues

## 1. Opponent AI Game Loop Missing
**Issue:**
Currently, after creating a game in the mobile app, opponents (`opponent1`, `opponent2`) do not take their turns or discard tiles.

**Root Cause:**
Unlike the Web app which uses a `useEffect` on `gameState` to check whose turn it is, the mobile application does not have any game loop mechanism driving the opponent's turns in `App.tsx` or `gameStore.ts`. The mobile simply handles the player's turn manually without advancing the flow.

**Resolution Plan:**
- Monitor the `gameState.currentTurn` field in `useGameStore`.
- Implement a function `executeOpponentState` in `gameStore` that wraps `executeOpponentTurn` from `@kastar/core-game`.
- Use a timer (e.g. `setTimeout(600)`) in `App.tsx` or the store action to simulate thinking before performing the AI's action. 
- Iterate opponent turns automatically until it returns to `'player'`.
