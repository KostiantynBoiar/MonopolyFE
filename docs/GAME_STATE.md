# Game State Contract

The frontend is a pure renderer of the `GameState` object emitted by the backend over WebSocket. This document defines that object completely. The backend owns all game logic; the frontend owns zero authoritative state.

---

## Transport

| Channel | Direction | When |
|---------|-----------|------|
| WebSocket (`/ws/game/{gameId}`) | server → client | on connect: full snapshot; on change: delta patch |
| WebSocket (`/ws/game/{gameId}`) | client → server | player intents (roll, buy, chat, etc.) |

The server sends a full `GameState` snapshot on connection and after any state transition. Clients **do not** compute derived state — they receive it.

---

## Root object: `GameState`

```json
{
  "gameId": "gm_01HXYZ4ABCDEF",
  "sessionCode": "TYC-A7X2",
  "status": "in_progress",
  "createdAt": "2026-05-29T18:00:00Z",
  "startedAt": "2026-05-29T18:02:15Z",
  "finishedAt": null,
  "winnerId": null,
  "viewerId": "alice",
  "players": [ ...PlayerState ],
  "turn": { ...TurnState },
  "spaces": [ ...SpaceOwnership ],
  "auction": null,
  "trade": null,
  "activeCard": null,
  "log": [ ...LogEntry ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `gameId` | `string` | Stable UUID-like identifier |
| `sessionCode` | `string` | Human-readable invite code, e.g. `TYC-A7X2` |
| `status` | `"lobby" \| "in_progress" \| "finished"` | Game lifecycle phase |
| `createdAt` | ISO 8601 | When the room was created |
| `startedAt` | ISO 8601 \| null | When the first turn began |
| `finishedAt` | ISO 8601 \| null | When a winner was declared |
| `winnerId` | `string` \| null | Player id of the last solvent player |
| `viewerId` | `string` | Which player this client controls |
| `players` | `PlayerState[]` | Ordered by `turnOrder` |
| `turn` | `TurnState` | Current turn details |
| `spaces` | `SpaceOwnership[40]` | One entry per board position (index = position) |
| `auction` | `AuctionState` \| null | Non-null only during `auction` phase |
| `trade` | `TradeState` \| null | Non-null only during `trade_negotiation` phase |
| `activeCard` | `ActiveCard` \| null | Non-null only during `drawing_card` phase |
| `log` | `LogEntry[]` | Append-only event + chat history, newest last |

---

## `PlayerState`

```json
{
  "id": "alice",
  "userId": "usr_alice",
  "displayName": "Alice",
  "token": "blue",
  "avatarUrl": null,
  "turnOrder": 0,
  "position": 9,
  "balance": 1240,
  "ownedPositions": [1, 3, 5, 6, 8, 9],
  "getOutOfJailCards": 0,
  "jailStatus": null,
  "isBankrupt": false,
  "isConnected": true,
  "netWorth": 2840
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Player id (stable within a game) |
| `userId` | `string` | Auth user id |
| `displayName` | `string` | Shown in UI |
| `token` | `TokenColor` | One of `blue red green yellow orange pink cyan brown gold ink` |
| `avatarUrl` | `string` \| null | Optional profile picture URL |
| `turnOrder` | `number` | 0-based index; determines play order |
| `position` | `0–39` | Current board space |
| `balance` | `number` | Cash on hand (never negative; bankruptcy triggers before that) |
| `ownedPositions` | `number[]` | Board positions this player owns |
| `getOutOfJailCards` | `number` | Count of held Get Out of Jail Free cards |
| `jailStatus` | `JailStatus` \| null | null when not in jail |
| `isBankrupt` | `boolean` | Eliminated from the game |
| `isConnected` | `boolean` | WebSocket connection status |
| `netWorth` | `number` | Computed by server: cash + unmortgaged property values + building values |

### `JailStatus`

```json
{ "turnsRemaining": 2 }
```

Counts down from 3. When it reaches 0 on entry to `jail_decision` phase, the player is forced to pay the $50 fine.

---

## `TurnState`

```json
{
  "phase": "pre_roll",
  "currentPlayerId": "alice",
  "turnNumber": 18,
  "roundNumber": 5,
  "diceRoll": null,
  "doublesStreak": 0,
  "actionsAvailable": { ...ActionSet }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `TurnPhase` | See phase table below |
| `currentPlayerId` | `string` | Whose turn it is |
| `turnNumber` | `number` | Increments every time the active player changes (including extra doubles turns) |
| `roundNumber` | `number` | Increments after all players have gone once |
| `diceRoll` | `DiceRoll` \| null | null before the active player rolls |
| `doublesStreak` | `0–2` | Consecutive doubles this turn; hitting 3 sends the player to jail |
| `actionsAvailable` | `ActionSet` | Scoped to `viewerId`; drives button enabled/disabled state |

### Turn phases

| Phase | Who acts | What happens |
|-------|----------|--------------|
| `pre_roll` | Active player | Must roll (or take a jail-exit action if in jail) |
| `jail_decision` | Active player (in jail) | Choose: roll for doubles / pay $50 / use card |
| `post_roll` | Active player | Optional: buy / build / mortgage / trade; then end turn |
| `must_pay_rent` | Active player | Owes rent; all other actions blocked until paid |
| `drawing_card` | Active player | Resolving a Chance or Community Chest card effect |
| `auction` | All non-bankrupt players | Bidding on an unowned property |
| `trade_negotiation` | Proposer + target | Reviewing / countering a trade offer |
| `bankrupt_resolution` | Server | Distributing assets from a bankrupt player |
| `game_over` | — | Final state; `winnerId` is set |

### `DiceRoll`

```json
{ "die1": 4, "die2": 3, "isDoubles": false }
```

### `ActionSet`

```json
{
  "canRoll": true,
  "canBuy": false,
  "canBuild": false,
  "canMortgage": true,
  "canUnmortgage": true,
  "canTrade": true,
  "canEndTurn": false,
  "canPayJailFine": false,
  "canUseJailCard": false,
  "canBid": false
}
```

The server computes this set based on the game rules and the viewer's identity. The UI must not recompute it — just reflect it.

---

## `SpaceOwnership`

Array of 40 objects, index equals board position. Non-purchasable spaces (GO, Community Chest, Chance, Tax, corners) always have `ownerId: null`.

```json
{
  "position": 9,
  "ownerId": "alice",
  "houses": 2,
  "hasHotel": false,
  "isMortgaged": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `position` | `0–39` | Board position |
| `ownerId` | `string` \| null | null = unowned or non-purchasable |
| `houses` | `0–4` | Number of houses; `hasHotel` takes precedence |
| `hasHotel` | `boolean` | A hotel (5th house) is present; `houses` is 0 when true |
| `isMortgaged` | `boolean` | Mortgaged properties collect no rent |

---

## `AuctionState`

Present only during the `auction` turn phase.

```json
{
  "propertyPosition": 6,
  "bids": [
    { "playerId": "bob",   "amount": 80 },
    { "playerId": "dave",  "amount": 110 }
  ],
  "highestBid": 110,
  "highestBidderId": "dave",
  "timeRemainingMs": 24500
}
```

---

## `TradeState`

Present only during `trade_negotiation` phase.

```json
{
  "id": "trade_01HX",
  "proposerId": "alice",
  "targetId": "bob",
  "proposerOffer": {
    "money": 200,
    "positions": [1, 3],
    "getOutOfJailCards": 0
  },
  "targetRequest": {
    "money": 0,
    "positions": [11],
    "getOutOfJailCards": 0
  },
  "status": "pending",
  "expiresAt": "2026-05-29T18:30:00Z"
}
```

`proposerOffer` = what Alice gives. `targetRequest` = what Alice asks for from Bob.

---

## `ActiveCard`

Present only during `drawing_card` phase.

```json
{
  "id": "chance_advance_boardwalk",
  "kind": "chance",
  "text": "Advance to Boardwalk.",
  "effect": { "type": "advance_to", "position": 39, "collectGoBonus": true },
  "drawerId": "alice"
}
```

### Card effect types

| `type` | Extra fields | Meaning |
|--------|-------------|---------|
| `advance_to` | `position`, `collectGoBonus` | Move to position; collect $200 if passing GO |
| `advance_to_nearest` | `spaceType`, `payDouble` | Move to nearest railroad or utility |
| `go_to_jail` | — | Go directly to Jail |
| `go_back` | `spaces` | Move back N spaces |
| `collect` | `amount` | Collect from bank |
| `pay` | `amount` | Pay bank |
| `collect_from_each_player` | `amount` | Each other player pays you |
| `pay_each_player` | `amount` | You pay each other player |
| `get_out_of_jail_free` | — | Gain one Get Out of Jail Free card |
| `repairs` | `perHouse`, `perHotel` | Pay per house/hotel owned |

---

## `LogEntry`

```json
{
  "id": "log_007",
  "kind": "sticker",
  "playerId": "carol",
  "playerName": "Carol",
  "playerToken": "green",
  "text": "[sticker:/stickers/kolobki/012___.tgs]",
  "stickerUrl": "/stickers/kolobki/012___.tgs",
  "ts": "2026-05-29T18:19:55Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable log entry id |
| `kind` | `"event" \| "chat" \| "sticker"` | — |
| `playerId` | `string` \| undefined | Absent for system events |
| `playerName` | `string` \| undefined | Display name at time of message |
| `playerToken` | `TokenColor` \| undefined | Token color for avatar dot |
| `text` | `string` | Human-readable text; for stickers it's `[sticker:<url>]` |
| `stickerUrl` | `string` \| undefined | Absolute path to the sticker file |
| `ts` | ISO 8601 | Server timestamp |

---

## Player intents (client → server)

These are the WebSocket messages the client sends to express player actions. The server validates, applies, and broadcasts a new `GameState` snapshot.

| Intent | Payload | Allowed when |
|--------|---------|--------------|
| `roll_dice` | `{}` | `turn.actionsAvailable.canRoll === true` |
| `buy_property` | `{ position }` | `canBuy === true` |
| `pass_buy` | `{}` | `canBuy === true` (triggers auction) |
| `build_house` | `{ position }` | `canBuild === true` |
| `sell_house` | `{ position }` | always allowed on own properties |
| `mortgage` | `{ position }` | `canMortgage === true` |
| `unmortgage` | `{ position }` | `canUnmortgage === true` |
| `pay_jail_fine` | `{}` | `canPayJailFine === true` |
| `use_jail_card` | `{}` | `canUseJailCard === true` |
| `end_turn` | `{}` | `canEndTurn === true` |
| `propose_trade` | `{ targetId, proposerOffer, targetRequest }` | `canTrade === true` |
| `respond_trade` | `{ tradeId, response: "accept" \| "reject" \| "counter", counterOffer? }` | active trade exists |
| `place_bid` | `{ amount }` | `canBid === true` |
| `send_chat` | `{ text }` | any time |
| `send_sticker` | `{ stickerUrl }` | any time |

---

## Status transitions

```
lobby
  └─► in_progress   (host starts game; turn order decided by initial dice roll)
        └─► finished (all but one player bankrupt; winnerId set)
```

A player becomes bankrupt when they cannot pay a debt (rent, tax, fine) even after mortgaging all properties and selling all buildings. Their assets go to the creditor (or the bank for taxes/fines). Bankrupt players remain in `players[]` with `isBankrupt: true` and are skipped in turn rotation.

---

## Sticker packs

Sticker assets live under `/public/stickers/` and are described by `/public/stickers/manifest.json`:

```json
{
  "packs": [
    {
      "id": "kolobki",
      "name": "Kolobki",
      "stickers": ["001___.tgs", "002___.tgs", "..."]
    }
  ]
}
```

Sticker URLs are constructed as `/stickers/{packId}/{filename}`. `.tgs` files are gzip-compressed Lottie animations rendered by `TgsPlayer`.
