---
name: project-feature-status
description: Which game features are fully implemented vs still stubbed in the frontend (as of the wide-board commit)
metadata: 
  node_type: memory
  type: project
  originSessionId: bc003e5f-ab60-4e53-ae65-6a7158baeb84
---

## Implemented (frontend mock, no real backend calls)

- **Roll dice + walking animation** — full step-by-step animation, bot turns, jail handling
- **Buy property** — deed modal, buy button with mock API call, canEndTurn set after purchase
- **Pay rent** — calcRent() utility mirrors backend rent.py; PayRentPanel shown on landing; funds transferred
- **Auction** — 30 s countdown, Bob auto-bids, viewer can bid, winner awarded property
- **Trade (interactive)** — TradeBuilder lets viewer pick target + compose offer; TradeWindow shows pending proposal; accept executes bilateral exchange
- **Buy houses/hotels** — BuildPanel shows complete colour groups; up to hotel (5th house); BUILDING_COSTS shared constant
- **End Turn button** — shown after buy/pay-rent/card-proceed so viewer controls pace
- **Mock API** — src/shared/mocks/game-api.mock.ts with 280 ms latency shim for all actions

## Not yet implemented

- Real WebSocket command sending (useGameSocket exists but game commands still update local state only)
- Mortgage/unmortgage UI
- Get-Out-of-Jail-Free card use
- Bankruptcy resolution
- Card effects beyond "collect M200" mock
- Go-to-Jail from Chance/Chest cards

**Why:** This is solo-play dev mode; the backend handlers for trade/build/auction are not yet created in MonopolyBE.
