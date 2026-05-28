# Monopoly FE — Initial structure & plan

Target root: `MonopolyFE/monopoly-fe`

Aligned with `.cursor/rules/frontend.mdc` (Next.js App Router, TypeScript strict, **Tailwind CSS**, Zod, Zustand, TanStack Query, native WebSocket).

> **Note:** The repo still has a Create React App bootstrap (`src/App.tsx`, `react-scripts`). This scaffold follows the **Next.js** layout from the rules. Migrate tooling (see [Migration checklist](#migration-checklist)) before implementing features.

---

## Stack (planned)

| Layer | Choice |
|--------|--------|
| Framework | Next.js (App Router) + React + TypeScript `strict` |
| Styling | **Tailwind CSS** only (utilities + `cn()` helper; `dark:` variant; no CSS-in-JS) |
| Validation | Zod (`z.infer` as source of truth for types) |
| Live game state | Zustand (`gameStore`, `sessionStore`, `uiStore`) |
| REST / server resources | TanStack Query |
| Real-time | Single native `WebSocket` client in `shared/socket` |
| Unit / component tests | Vitest + React Testing Library |
| E2E | Playwright |

---

## Directory tree

```
monopoly-fe/
├── docs/
│   └── FRONTEND_STRUCTURE.md          # this file
├── e2e/                               # Playwright specs
├── public/                            # static assets (favicon, board art, etc.)
├── src/
│   ├── app/                           # App Router — RSC shells + route entrypoints
│   │   ├── globals.css                # Tailwind @tailwind directives only
│   │   ├── layout.tsx
│   │   ├── providers.tsx              # QueryClient, theme, client providers
│   │   ├── (marketing)/               # landing & static pages (RSC)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── lobby/                     # session list / create (RSC shell + client widgets)
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── game/
│   │       └── [sessionId]/           # live game room (client island)
│   │           ├── page.tsx
│   │           ├── loading.tsx
│   │           └── error.tsx
│   ├── features/                      # feature-sliced modules (barrel via index.ts)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── auth.schema.ts
│   │   │   ├── api.ts                 # REST
│   │   │   └── index.ts
│   │   ├── lobby/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lobby.schema.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   ├── game-board/
│   │   │   ├── components/            # BoardGrid, Tile, Token, …
│   │   │   ├── hooks/
│   │   │   ├── game-board.schema.ts
│   │   │   └── index.ts
│   │   ├── dice/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── dice.schema.ts
│   │   │   └── index.ts
│   │   ├── player-panel/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── player-panel.schema.ts
│   │   │   └── index.ts
│   │   ├── trade/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── trade.schema.ts
│   │   │   └── index.ts
│   │   └── chat/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── chat.schema.ts
│   │       └── index.ts
│   ├── shared/
│   │   ├── config/
│   │   │   ├── env.ts                 # Zod-parsed env
│   │   │   ├── constants.ts
│   │   │   ├── board-layout.ts        # 11×11 perimeter tile indices (static)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── cn.ts                  # clsx + tailwind-merge
│   │   │   ├── formatters.ts
│   │   │   └── index.ts
│   │   ├── protocol/                  # wire contract (Zod) — mirror backend Pydantic
│   │   │   ├── protocol.schema.ts     # top-level envelope (v, seq, type)
│   │   │   ├── messages.schema.ts     # inbound server → client
│   │   │   ├── intents.schema.ts      # outbound client → server
│   │   │   ├── fixtures/              # valid/invalid JSON for schema tests
│   │   │   └── index.ts
│   │   ├── socket/
│   │   │   ├── GameSocket.ts          # single connection per tab
│   │   │   ├── useGameSocket.ts
│   │   │   ├── reconnect.ts           # backoff + jitter
│   │   │   └── index.ts
│   │   └── ui/                        # design-system primitives (Tailwind only)
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx
│   │       ├── Spinner.tsx
│   │       └── index.ts
│   ├── stores/
│   │   ├── game-store.ts
│   │   ├── session-store.ts
│   │   ├── ui-store.ts
│   │   └── index.ts
│   └── types/
│       ├── ids.ts                     # branded PlayerId, SessionId, TileId
│       └── index.ts
├── tests/                             # Vitest setup + shared test utils
│   ├── setup.ts
│   ├── mocks/
│   │   └── fake-game-socket.ts
│   └── fixtures/
├── next.config.ts
├── postcss.config.mjs                 # Tailwind + autoprefixer
├── tailwind.config.ts                 # theme tokens, darkMode: 'class' | 'media'
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json                      # paths: "@/*" → "./src/*"
└── package.json
```

---

## Tailwind CSS plan

1. **Install** (when migrating off CRA): `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`.
2. **`postcss.config.mjs`** — PostCSS pipeline with `tailwindcss` and `autoprefixer`.
3. **`tailwind.config.ts`** — `content` globs: `./src/**/*.{ts,tsx}`; extend **theme tokens** (colors, spacing, radii) for board/UI; enable `darkMode` per project preference (`'class'` recommended with `next-themes` later).
4. **`src/app/globals.css`** — only:
   - `@tailwind base;`
   - `@tailwind components;`
   - `@tailwind utilities;`
   - optional `@layer` for a11y utilities (e.g. `sr-only` overrides) — no component CSS files elsewhere.
5. **`shared/lib/cn.ts`** — `clsx` + `tailwind-merge` for conditional classes (no string concatenation).
6. **Board** — 11×11 CSS grid via Tailwind (`grid grid-cols-11 grid-rows-11`); token motion via `transform` + `transition` only (see rules).
7. **No** CSS-in-JS, no per-feature `.css` modules except `globals.css`.

---

## Data flow (reference)

```
Inbound WS  → Zod (protocol) → Zustand applyDelta/snapshot → selectors → UI
User action → hook/intent     → Zod (intent)  → GameSocket.send → server
REST        → TanStack Query  → RSC / lobby widgets (not live game state)
```

---

## Import aliases

```json
"paths": { "@/*": ["./src/*"] }
```

Import order: node → external → `@/shared` → `@/features` → relative. Features only via their `index.ts` barrel.

---

## Migration checklist (CRA → Next.js)

- [ ] Replace `react-scripts` with `next`, `react`, `react-dom` versions compatible with Next 15+
- [ ] Add dependencies: `zod`, `zustand`, `@tanstack/react-query`, `clsx`, `tailwind-merge`
- [ ] Add devDependencies: `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@vitejs/plugin-react`, `playwright`, `@playwright/test`
- [ ] Remove or archive CRA entrypoints: `src/index.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`
- [ ] Point `package.json` scripts to `next dev`, `next build`, `vitest`, `playwright test`
- [ ] Wire `src/app/layout.tsx` to import `./globals.css`

---

## What was scaffolded

Empty placeholder files (no implementation) and `.gitkeep` in otherwise-empty folders. Implement logic in a follow-up pass.
