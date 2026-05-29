# Monopoly Frontend — Tycoon

Next.js 15 frontend for the Tycoon multiplayer Monopoly game.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Validation | Zod 3 |
| Animation | Lottie Web (TGS stickers) |

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

```bash
npm run build     # production build
npm run lint      # ESLint
npx tsc --noEmit  # type check
```

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Login / register
│   ├── game/room/              # Main game board page
│   ├── lobby/                  # Room browser + creation
│   └── me/                     # Profile
│
├── features/                   # Domain modules
│   ├── auth/                   # Auth forms, Telegram widget
│   ├── card/                   # Chance / Community Chest card flip overlay
│   ├── chat/                   # Game log, BoardCenterPanel, sticker picker
│   ├── dice/                   # Dice rolling
│   ├── game-board/             # Board tiles, BoardContainer, MonopolyBoard
│   ├── player-panel/           # PlayerSidebar, PlayerCard
│   ├── trade/                  # TradeWindow
│   └── lobby/                  # Lobby components
│
├── shared/
│   ├── config/
│   │   ├── board-layout.ts     # BOARD[], getGridPos(), getTileEdge()
│   │   ├── constants.ts        # Tile sizes, animation durations, space lists
│   │   └── env.ts              # Runtime env vars
│   ├── lib/                    # cn(), formatters, stats
│   ├── mocks/                  # MOCK_GAME_STATE for local dev
│   ├── protocol/               # GameState types, socket message schemas
│   ├── socket/                 # WebSocket client + hooks
│   └── ui/                     # Button, Input, Modal, Avatar, Spinner…
│
├── stores/                     # Zustand stores
└── types/                      # Global ID aliases
```

Each feature follows the same convention:

```
features/<name>/
├── <name>.enums.ts     # Enums (prefer over string unions)
├── <name>.types.ts     # TypeScript types and interfaces
├── <name>.schema.ts    # Zod schemas for runtime validation
├── components/         # React components
├── hooks/              # Feature-specific hooks
└── index.ts            # Barrel export (public API)
```

## Coding conventions

- **Constants** live in `shared/config/constants.ts` — no magic numbers in components.
- **Enums** over string literals — defined in `<module>.enums.ts`.
- **Types** in `<module>.types.ts`; Zod schemas in `<module>.schema.ts`.
- **Board data** canonical location: `shared/config/board-layout.ts`. The `game-board/board-data.ts` file is a re-export shim.
- `cn()` from `shared/lib/cn` for all className composition (clsx + tailwind-merge).

## Key UI features

### Board center panel (`features/chat`)

The board's center grid hosts `BoardCenterPanel`, which has three display modes:

| Mode | Trigger | What shows |
|---|---|---|
| Normal | Default | Game log (left 73%) + action buttons / dice (right 27%) |
| Card draw | `activeCard != null` | Card flip animation overlaid; log fades behind it |
| Trade | `tradeState` is `pending` or `countered` | `TradeWindow` replaces the entire panel |

### Card flip overlay (`features/card`)

CSS 3D flip (`perspective` + `rotateY`) auto-triggers `CARD_FLIP_TRIGGER_DELAY_MS` after mount. The **Proceed** button fades in once the flip completes. The game log dims to `opacity-[0.12]` while the overlay is active.

### Trade window (`features/trade`)

Two-column layout separated by a `⇄` divider. Labels are framed from the viewer's perspective ("You give" / "Bob gives back"). Properties render as color-coded chips. The action bar shows role-appropriate controls: Accept + Reject for the target, Withdraw for the proposer.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | — | Telegram Login Widget bot name |
