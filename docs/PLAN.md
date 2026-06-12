# Mode-First Board Migration

## Summary
Migrate MonopolyFE to treat board identity as `(gameMode, position)` and remove array-index position assumptions. Use `GameMode.NORMAL` by default, support `GameMode.DUEL`, keep commands sending backend-local 1-based positions unchanged, and commit as `feat: support mode-first board positions`.

## Key Changes
- Add a shared `GameMode` enum and thread it through `SessionSummary`, `SessionDetail`, `CreateSessionInput`, `GameState`, `BeGameState`, `adaptGameStateFrame`, and `emptySnapshot`.
- Add `game_mode` to create-session payload and UI selector; default to normal. Show mode on session cards, keep `max_players` fully API-driven, and pad waiting slots to `session.max_players` so duel shows 2 slots.
- Add `gameMode` and `suddenDeathDeadlineMs` to frontend `GameState`; use `state.gameMode` for in-game rendering and `session.game_mode` for waiting/empty room rendering.
- Refactor tile labels to be mode-aware, for example `Board.tiles.normal.p1..p40` and `Board.tiles.duel.p1..p23`, replacing the current `p0..p39` lookup shape.

## Board And Position Model
- Replace the single `BOARD` export with mode configs: `getBoardConfig(gameMode)`, `NORMAL_BOARD_CONFIG`, `DUEL_BOARD_CONFIG`.
- Normal config shifts existing board positions to `1..40`; duel config uses current backend positions `1..23`, jail `7`, go-to-jail `18`, one die, compact desktop track.
- Represent each board config with ordered `positions`, `spaces`, `spacesByPosition`, `positionIndexByPosition`, `startPosition`, `jailPosition`, `goToJailPosition`, `diceCount`, and mode-specific economics.
- Keep the compact duel desktop layout in the existing board shell using explicit tile coordinates in config, not a computed 40-tile perimeter. Mobile uses the same ordered positions for the horizontal strip.
- Refactor `board-data`, selectors, deed utils, manage overlay, trade overlay/assets, player panel property grid, and room view-model helpers to use `getBoardConfig(game.gameMode)` and `spacesByPosition`.

## UI And Animation Behavior
- Pass `gameMode` or `boardConfig` into `BoardContainer`, `MobileBoardStrip`, `PlayerPanel`, deed/trade/manage helpers, and room view-model functions.
- Replace `BOARD[position]`, `BOARD.map`, raw `position` strip offsets, `% 40`, and hard-coded jail/go-to-jail constants with selected config lookups.
- Update movement replay so forward/backward/card/jail paths use `config.positions`; use config index distance for wrap/teleport detection.
- Add `diceCount` to `DiceWindow` and `JailOverlay`; duel hides the second die and does not render a zero die or doubles chip.
- Keep command serialization position-neutral: buy/build/sell/mortgage/unmortgage/trade send the 1-based position selected from the current mode config.

## Test Plan
- Static audits: `rg "BOARD\\[|% 40|BOARD_SIZE|position: 0|p0|p39|spaces\\[" src messages`.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
- Smoke normal mode: lobby create defaults normal, board renders positions `1..40`, buy/deed/trade/manage commands use selected 1-based positions, two dice render.
- Smoke duel mode with backend/API data: create payload sends `game_mode: "duel"`, waiting room shows `2` slots, board renders `1..23`, one die renders, movement wraps over 23 positions, jail movement targets position `7`, sudden-death deadline is available to UI.

## Assumptions
- Current backend source and this request are authoritative: duel positions are `1..23`; older memory mentioning `41..63` is stale.
- No conversion layer should subtract or add offsets for commands; all UI selections are already backend-local positions.
- Sudden-death display can be limited to threading/storing `suddenDeathDeadlineMs` unless a separate countdown UI is requested.
