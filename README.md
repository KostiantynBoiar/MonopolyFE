# Monopoly Frontend

Frontend application for a multiplayer Monopoly-style game. The app includes
authentication, lobby and room management, a real-time game room, chat,
stickers, trades, auctions, property management, and localized UI.

## Tech Stack

| Area | Tooling |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Validation | Zod 3 |
| Localization | next-intl |
| Animation | lottie-web |

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app is served at `http://localhost:3000` by default.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after a build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run TypeScript without emitting files |

## Configuration

Runtime configuration is read in `src/shared/config/env.ts`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8002` | Backend HTTP API base URL |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Empty string | Telegram Login Widget bot name |
| `NEXT_PUBLIC_LOG_LEVEL` | Environment-based default | Client logger verbosity |
| `NEXT_PUBLIC_DEBUG_GAME_ROOM` | `0` | Set to `1` to log committed game snapshots in development |

The WebSocket base URL is derived from `NEXT_PUBLIC_API_URL` by replacing
`http` with `ws` and `https` with `wss`.

## Project Structure

```text
src/
├── app/                 # Next.js routes, layouts, loading, and error states
├── features/            # Domain-oriented feature modules
├── i18n/                # next-intl request configuration
├── shared/              # Cross-feature config, UI, hooks, transport, and protocol code
└── stores/              # Zustand stores and command bus

messages/                # Locale message files
public/                  # Static assets, sounds, and sticker packs
```

Important route groups:

| Path | Purpose |
| --- | --- |
| `src/app/(auth)` | Login and registration pages |
| `src/app/home` | Authenticated home screen |
| `src/app/lobby` | Session browser, room details, and room creation |
| `src/app/game/room` | Main game room experience |
| `src/app/leaderboard` | Leaderboard page |
| `src/app/me` | Profile page |
| `src/app/debug` | Development and debugging route |

Feature modules live under `src/features/<name>`. Use the existing files in a
feature as the local pattern before adding new code. Common conventions are:

```text
features/<name>/
├── <name>.enums.ts
├── <name>.types.ts
├── <name>.schema.ts
├── components/
├── hooks/
└── index.ts
```

Not every feature needs every file. Add only the files that match the feature's
responsibility.

## Shared Code

| Directory | Purpose |
| --- | --- |
| `src/shared/config` | Board layout, constants, and environment configuration |
| `src/shared/protocol` | Backend-facing game state, selectors, logs, permissions, and schemas |
| `src/shared/socket` | WebSocket client integration |
| `src/shared/transport` | Backend state adaptation and command serialization |
| `src/shared/ui` | Reusable UI primitives |
| `src/shared/lib` | Small shared utilities |
| `src/shared/hooks` | Cross-feature React hooks |
| `src/shared/mocks` | Local mock data and fixtures |

## Coding Conventions

- Keep feature code inside the owning `src/features/<name>` module when possible.
- Put cross-feature contracts and backend-facing models in `src/shared/protocol`.
- Put app-wide configuration and constants in `src/shared/config`.
- Prefer enums over string literals for repeated domain values.
- Keep functions focused on one responsibility.
- Prefer explicit handlers over large conditional branches for domain actions.
- Use `cn()` from `src/shared/lib/cn` for class name composition.
- Keep locale text in `messages/en.json` and `messages/uk.json`.

## Verification

Before opening a pull request or committing behavior changes, run:

```bash
npm run typecheck
npm run lint
npm run build
```
