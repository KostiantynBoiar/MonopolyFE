# Animation Timeline Handling

Game animations are driven by backend-authored timelines attached to authoritative game-state frames.

## Canonical Files

- `src/shared/protocol/animation.ts` defines frontend-facing animation instruction types.
- `src/shared/transport/state-adapter.ts` maps backend `animation_timeline` instructions into those types.
- `src/shared/socket/timeline-executor.ts` queues, replays, gates, and commits snapshots.
- `src/shared/socket/useGameSocket.ts` receives websocket frames and calls `enqueueSnapshot(...)`.

Use `src/shared/protocol/animation.ts` as the canonical type source. `src/shared/protocol/animations.ts` is an older shape and should not be used for new timeline work.

## Data Flow

The normal websocket path is:

1. Backend sends `GAME_STATE` with a full authoritative state frame.
2. `useGameSocket` receives the frame.
3. `adaptGameStateFrame(payload, viewerUserId)` maps snake_case backend fields to `GameSnapshot`.
4. The adapted snapshot includes `animationTimeline`.
5. `enqueueSnapshot(snapshot)` sends it through the timeline executor.
6. The executor replays instructions.
7. The final authoritative snapshot is committed to `useGameStore`.

The UI should render from store state and transient animation state. It should not manually replay backend frames.

## Instruction Types

Frontend instruction types:

```ts
type AnimationInstruction =
  | RollDiceAnimation
  | MoveAnimation
  | ShowCardAnimation
  | WaitForPlayerAnimation
  | OpenDeedAnimation;
```

Supported instruction payloads:

- `roll_dice`: animates dice using `die1`, `die2`, and `isDoubles`.
- `move`: moves a player token from `fromPosition` to `toPosition`.
- `show_card`: displays the card overlay.
- `wait_for_player`: pauses the timeline until a matching continue is received or times out.
- `open_deed`: selects a board tile/deed after movement.

Backend wire instructions use snake_case fields such as `from_position`, `to_position`, and `interaction_id`. The adapter maps them to camelCase before the executor sees them.

## Queue Semantics

`timeline-executor.ts` keeps a serial queue of adapted snapshots.

This matters because websocket frames can arrive faster than the UI can animate. The executor guarantees snapshots are animated and committed in order.

Key internal concepts:

- `queue`: pending `GameSnapshot`s.
- `running`: prevents parallel drains.
- `generation`: invalidates old async work after reset.
- `gate`: active `wait_for_player` pause.
- `preResolvedGates`: continue signals that arrive before a local client reaches the gate.
- `acknowledgedCardId`: suppresses already-acknowledged card overlays when backend keeps `active_card` around for an extra frame.

## Commit Timing

If a snapshot has no timeline, the executor commits it immediately.

If a snapshot has a timeline:

1. `isTimelineRunning` is set in `useUiStore`.
2. Instructions run sequentially.
3. Transient UI state is set during each instruction.
4. The final snapshot commits only after the timeline finishes.
5. Transient dice/card/walk state is cleared.

This preserves visual continuity: the board does not jump to the final state before the token movement or card interaction is shown.

## Fallback Inference

When a backend frame omits `animation_timeline`, the executor can infer a minimal timeline from the previous committed state:

- dice changes create a `roll_dice` animation.
- player position changes create `move` animations.

This is a compatibility fallback. New behavior should prefer explicit backend timelines.

## Movement Rules

Movement planning lives in `timeline-executor.ts`, not in board rendering components.

Current rules:

- normal dice movement walks forward.
- card movement uses fast speed when backend marks `speed: 'fast'`.
- `GO_BACK` card effects walk backward.
- jail movement can walk to `GO_TO_JAIL_POSITION` and then drag to jail.
- long inferred reverse paths prefer the shorter backward path.

Board rendering components receive transient walk state and display it. They should not decide route semantics.

## Player Gates

`wait_for_player` pauses replay for an `interactionId`.

The gate can resolve by:

- the affected player clicking Continue locally
- the server broadcasting `game.animation_continue`
- the local timeout fallback

`resolveAnimationGate(interactionId)` is idempotent. If a continue arrives before the local gate opens, it is buffered in `preResolvedGates` and consumed when the gate is reached.

## Reset And Navigation

`resetSnapshotPipeline()` is called on socket cleanup. It:

- clears queued snapshots
- invalidates in-flight timelines
- clears buffered gates
- releases active wait gates
- clears transient UI flags such as rolling, timeline running, walk state, and active animation card

This prevents stale animation locks when leaving a room, reconnecting, or switching sessions.

## Adding A New Animation

1. Add the frontend instruction type in `src/shared/protocol/animation.ts`.
2. Add the backend wire shape in `src/shared/transport/state-adapter.ts`.
3. Map the backend instruction in `mapTimeline`.
4. Add execution behavior in `timeline-executor.ts`.
5. Store transient render state in `useUiStore` if needed.
6. Render that transient state in the relevant UI component.
7. Verify with `npm run typecheck`, `npm run lint`, and `npm run build`.

Do not add test-only animation paths that bypass `adaptGameStateFrame(...)` and `enqueueSnapshot(...)`. Harnesses should exercise the same adapter and queue used in production.
