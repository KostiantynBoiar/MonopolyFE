# Game State Object

The frontend game state is a server-authoritative snapshot adapted into a stable camelCase shape for React components.

## Canonical Types

The canonical frontend contracts are:

- `src/shared/protocol/game-state.ts`
- `src/shared/protocol/game-state.enums.ts`
- `src/shared/protocol/permissions.ts`

The root object consumed by the UI is `GameSnapshot`:

```ts
interface GameSnapshot {
  game: GameState;
  permissions: PlayerPermissions;
  animationTimeline: AnimationInstruction[];
}
```

`GameSnapshot` is stored in `useGameStore().snapshot`.

## Backend To Frontend Boundary

Backend `game.state` frames are snake_case and are translated in one place:

```text
src/shared/transport/state-adapter.ts
```

Use `adaptGameStateFrame(payload, viewerUserId)` for backend frames. Do not make components consume backend wire fields directly.

The adapter is responsible for:

- snake_case to camelCase mapping
- safe defaults for omitted backend fields
- resolving the viewer player from authenticated user id
- deriving `permissions`
- converting `animation_timeline` to frontend `animationTimeline`
- mapping backend log entries into `LogEntry[]`

This adapter is translation code only. Game rules belong on the backend.

## GameState Shape

`GameState` contains the current board/game data:

- `gameId`, `sessionCode`, lifecycle timestamps, `winnerId`
- `viewerId`
- `players`
- `turn`
- `bank`
- `spaces`
- `debt`
- `auction`
- `trade`
- `activeCard`
- `bankruptcy`
- `decks`
- `log`

Important nested state:

- `PlayerState`: player identity, token, position, balance, jail status, connection, bankruptcy, rating.
- `TurnState`: current player, phase, dice roll, doubles streak, pending buy position, turn deadline.
- `PropertyState`: owner, houses, hotel, mortgage state by board position.
- `AuctionState`, `TradeState`, `DebtState`, `ActiveCard`: nullable overlays that drive room UI.

## Permissions

Components should read `snapshot.permissions`, not recompute action availability.

`PlayerPermissions` is the flat UI-facing action map:

- rolling and ending turn
- buying/building/mortgaging/trading
- auction bidding
- jail actions
- debt/bankruptcy/surrender actions

The adapter derives this from backend `turn.actions_available`, but it gates turn-specific actions by the local viewer. This prevents every client from inheriting the active player's available actions from broadcast frames.

## Store Ownership

`useGameStore` owns the current `GameSnapshot`.

`useSessionStore` owns room/session metadata:

- current session id and members
- session lifecycle status
- viewer bankruptcy marker used by lobby rejoin logic

`useSocketStore` owns transport state:

- socket status
- reconnect attempts
- websocket error payloads
- kick state

Keep these stores separate. Do not put game board state into the session store, and do not put persistent session membership into the socket store.

## Room Flow

The canonical room route is:

```text
/game/room/[sessionId]
```

`src/app/game/room/_hooks/useRoomSession.ts` loads and validates the session by URL id, then stores it in `useSessionStore`.

`src/shared/socket/useGameSocket.ts` subscribes to websocket messages. For `GAME_STATE` frames it:

1. calls `adaptGameStateFrame(...)`
2. passes the adapted snapshot to `enqueueSnapshot(...)`

The snapshot is committed immediately only when no animation needs to run. Otherwise, the animation timeline is replayed first.

## Logs

`GameState.log` contains `LogEntry[]`.

Entries can be:

- chat
- sticker
- event

Event entries may carry structured `event` data. UI renderers should prefer `renderGameEvent(...)` for localization, then fall back to `entry.text` when an event type has no frontend template yet.

## Adding Fields

When the backend adds a game-state field:

1. Add or update the frontend type in `src/shared/protocol/game-state.ts`.
2. Add wire typing in `src/shared/transport/state-adapter.ts`.
3. Map the backend field in `adaptGameStateFrame`.
4. Add safe defaults for missing values if older frames may omit it.
5. Update selectors/components after the adapted contract is stable.

Do not thread backend snake_case fields through components as a shortcut.
