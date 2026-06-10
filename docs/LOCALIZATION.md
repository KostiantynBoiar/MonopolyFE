# Localization

This app uses `next-intl` with JSON message files in `messages/`.

## Runtime Setup

- Supported locales are declared in `src/i18n/request.ts`.
- `DEFAULT_LOCALE` is `uk`.
- The active locale is read from the `NEXT_LOCALE` cookie.
- `src/app/layout.tsx` loads messages through `getMessages()` and provides them with `NextIntlClientProvider`.

Current message files:

- `messages/uk.json`
- `messages/en.json`

## Component Usage

Use `next-intl` APIs directly:

- Server components: `getTranslations('Namespace')`
- Client components: `useTranslations('Namespace')`

Example:

```tsx
const t = useTranslations('Lobby');

return <h1>{t('publicGames')}</h1>;
```

Keep UI copy in message files. Do not hardcode user-facing labels in components unless the text is temporary debugging output or protocol data that intentionally comes from the backend.

## Namespace Pattern

Message namespaces generally match the visible domain:

- `Auth`
- `Landing`
- `Lobby`
- `Game`
- `Board`
- `Deed`
- `Trade`
- `Chat`
- `EventLog`
- `Settings`

When adding a feature-owned component, prefer using or extending the feature's namespace instead of creating a generic catch-all namespace.

## Board Tile Names

Board tile display names live in:

```text
messages/{locale}.json -> Board.tiles.p0 ... Board.tiles.p39
```

Use `useBoardTileName()` from `src/features/game-board/board-tile-name.ts` when a component needs to resolve a board position to localized display text.

```tsx
const resolveTileName = useBoardTileName();
const name = resolveTileName(position);
```

Avoid reading `BOARD[position].name` for UI text. `src/shared/config/board-layout.ts` still contains structural board data, but tile labels are localized through `Board.tiles`.

## Cards And Events

Card payloads may contain backend-provided English `text`, but card UI should prefer structured localization:

- `src/features/card/card.text.ts`
- `localizeCardEffect(t, card, resolveTileName)`

Event log entries may include structured `event` data. Render localized event text through:

- `src/shared/protocol/log/render-event.ts`
- `renderGameEvent(event, t, resolveTileName, resolveCardText)`

If `renderGameEvent()` returns `null`, callers can fall back to `entry.text` for forward compatibility.

## Adding Or Changing Copy

1. Add the same key to every locale file.
2. Keep key names semantic, not layout-specific.
3. Use ICU placeholders for dynamic values.
4. Keep validation schemas returning stable codes where possible, and translate those codes at the form/component boundary.
5. Validate JSON after edits.

Useful validation command:

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('messages/uk.json','utf8'))"
```

## Practical Rules

- Do not use localized strings as state or protocol identifiers.
- Do not branch game logic on translated text.
- Keep backend protocol enums and frontend translation keys separate.
- Prefer passing resolvers, such as `resolveTileName`, into shared rendering helpers instead of importing React hooks into protocol utilities.
