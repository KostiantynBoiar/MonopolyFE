# Monopoly Backend Animation Refactor

## Goal

Move animation sequencing responsibility from the frontend to the backend.

The frontend should no longer infer animations by comparing game snapshots.

Instead, the backend should emit an ordered list of animation instructions alongside the authoritative game state.

---

# Current Problem

Current frontend behavior:

```text
Previous Snapshot
        ↓
Compare State
        ↓
Guess What Happened
        ↓
Animate
        ↓
Apply New Snapshot
```

Examples of frontend inference:

* Did a dice roll happen?
* Was a card drawn?
* Did the card move the player?
* Is this a direct movement or a card movement?
* Should movement be animated?
* Should the card modal pause execution?

This causes:

* complex frontend logic
* duplicated game rules
* fragile edge cases
* difficult maintenance

---

# New Architecture

Backend owns:

* game rules
* state transitions
* animation order
* interaction pauses

Frontend owns:

* rendering
* animations
* sounds
* visual effects

---

# Snapshot Format

Current:

```ts
type GameSnapshot = {
  game: GameState;
  permissions: PlayerPermissions;
};
```

New:

```ts
type GameSnapshot = {
  game: GameState;
  permissions: PlayerPermissions;

  animationTimeline: AnimationInstruction[];
};
```

The snapshot remains authoritative.

The animation timeline is only a visual replay of how the state was reached.

---

# Animation Types

## Roll Dice

```ts
type RollDiceAnimation = {
  type: 'roll_dice';

  playerId: string;

  die1: number;
  die2: number;

  isDoubles: boolean;
};
```

Purpose:

* trigger dice animation
* trigger dice sounds

No game logic attached.

---

## Move Player

```ts
type MoveAnimation = {
  type: 'move';

  playerId: string;

  from: number;
  to: number;

  speed: 'normal' | 'fast';

  reason:
    | 'dice'
    | 'card'
    | 'teleport'
    | 'jail';
};
```

Examples:

Normal move:

```json
{
  "type": "move",
  "playerId": "p1",
  "from": 7,
  "to": 12,
  "speed": "normal",
  "reason": "dice"
}
```

Card move:

```json
{
  "type": "move",
  "playerId": "p1",
  "from": 12,
  "to": 39,
  "speed": "fast",
  "reason": "card"
}
```

---

## Show Card

```ts
type ShowCardAnimation = {
  type: 'show_card';

  card: ActiveCard;
};
```

Purpose:

Display card modal.

No movement occurs automatically.

---

## Wait For Player

```ts
type WaitForPlayerAnimation = {
  type: 'wait_for_player';

  interactionId: string;
};
```

Purpose:

Pause animation execution until player clicks Continue.

Frontend sends:

```json
{
  "type": "animation_continue",
  "interactionId": "abc123"
}
```

Backend resumes execution.

---

## Open Deed (Optional)

```ts
type OpenDeedAnimation = {
  type: 'open_deed';

  position: number;
};
```

Can also remain frontend-only.

---

# Animation Instruction Union

```ts
type AnimationInstruction =
  | RollDiceAnimation
  | MoveAnimation
  | ShowCardAnimation
  | WaitForPlayerAnimation
  | OpenDeedAnimation;
```

---

# Backend Execution Model

The game engine should generate:

1. final authoritative state
2. ordered animation timeline

Example:

Player rolls 5 and lands on Chance.

Generated timeline:

```json
[
  {
    "type": "roll_dice",
    "playerId": "p1",
    "die1": 2,
    "die2": 3,
    "isDoubles": false
  },
  {
    "type": "move",
    "playerId": "p1",
    "from": 7,
    "to": 12,
    "speed": "normal",
    "reason": "dice"
  },
  {
    "type": "show_card",
    "card": {}
  },
  {
    "type": "wait_for_player",
    "interactionId": "card-123"
  }
]
```

---

# Card Example

Card:

"Advance to Boardwalk"

Timeline:

```json
[
  {
    "type": "roll_dice",
    "playerId": "p1",
    "die1": 2,
    "die2": 3,
    "isDoubles": false
  },
  {
    "type": "move",
    "playerId": "p1",
    "from": 7,
    "to": 12,
    "speed": "normal",
    "reason": "dice"
  },
  {
    "type": "show_card",
    "card": {}
  },
  {
    "type": "wait_for_player",
    "interactionId": "card-123"
  },
  {
    "type": "move",
    "playerId": "p1",
    "from": 12,
    "to": 39,
    "speed": "fast",
    "reason": "card"
  }
]
```

Frontend simply executes sequentially.

No state diffing required.

---

# FastAPI Implementation Notes

Recommended Python models:

```python
from pydantic import BaseModel
from typing import Literal, Union
```

Animation models:

```python
class RollDiceAnimation(BaseModel):
    type: Literal["roll_dice"]
    player_id: str
    die1: int
    die2: int
    is_doubles: bool
```

```python
class MoveAnimation(BaseModel):
    type: Literal["move"]
    player_id: str
    from_position: int
    to_position: int
    speed: Literal["normal", "fast"]
    reason: Literal[
        "dice",
        "card",
        "teleport",
        "jail",
    ]
```

```python
class ShowCardAnimation(BaseModel):
    type: Literal["show_card"]
    card: ActiveCard
```

```python
class WaitForPlayerAnimation(BaseModel):
    type: Literal["wait_for_player"]
    interaction_id: str
```

Union:

```python
AnimationInstruction = Union[
    RollDiceAnimation,
    MoveAnimation,
    ShowCardAnimation,
    WaitForPlayerAnimation,
]
```

---

# Expected Benefits

Frontend:

* dramatically simpler animation pipeline
* no snapshot diffing
* no card heuristics
* no movement inference
* easier testing

Backend:

* single source of truth
* deterministic replay
* easier debugging
* future-proof for auctions, trades, jail, bankruptcy, and special events

The game engine becomes responsible for both state transitions and the visual sequence that produced those transitions.