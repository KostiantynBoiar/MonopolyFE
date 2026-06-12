---
name: refactorer
description: >
  Use this skill when asked to refactor, restructure, or migrate a feature in this codebase.
  Triggers: "refactor X", "move X to features level", "extract X into its own feature",
  "clean up X", "restructure X". Encodes the patterns and decisions established during the
  BoardTile extraction (June 2026). Applies to any feature that has grown inside another
  feature's folder and needs to become a first-class citizen under src/features/.
---

# Feature Extraction Refactor Guide

This skill governs how to extract a sub-feature out of an existing feature folder into a
first-class `src/features/<FeatureName>/` module. Follow every phase in order. Do not skip
the analysis phase and go straight to writing code.

---

## Phase 0 — Clarify Scope

Before anything else, resolve:

1. **What is the target feature?** Name it in PascalCase (`BoardTile`, `PlayerPanel`, etc.)
2. **Where does it live now?** Read that folder completely before touching a single file.
3. **Are breaking changes allowed?** If the user hasn't said, ask before importing strategy
   is decided.
4. **Multiple game modes?** This codebase has `GameMode.NORMAL` and `GameMode.DUEL`. Any
   component that renders mode-specific content must accept and thread `gameMode` — never
   hard-code the normal board.

---

## Phase 1 — Deep Read Before Writing

Run these searches before writing a single line of new code.

### 1a. Read every file in the current feature

Do not rely on filenames alone. Read:

- All component files
- All type/schema files
- All enum files
- All utility/helper files
- The existing `index.ts` barrel

### 1b. Map all external consumers

```bash
grep -rn "from.*<current-feature-path>" src/ --include="*.ts" --include="*.tsx"
```

Classify each import by what it actually uses:

- **Component imports** (direct path like `components/BoardTile`) → **must be updated**
- **Type/enum imports** (from the feature's public barrel) → **can be re-exported for compat**
- **Color/constant imports** → **can be re-exported for compat**

### 1c. Identify dead code

Look for:

- Types defined but never imported anywhere (`grep -rn "TypeName"`)
- Enum variants that can never be reached given the routing logic
- Props passed through to a sub-component that ignores them
- Branches guarded by a condition that the router guarantees is always/never true

Document every piece of dead code found. Remove it in the new feature — do not migrate dead
code.

---

## Phase 2 — Design the New Structure

### Standard file layout

```
src/features/<FeatureName>/
├── <featureName>.enums.ts       # Feature-specific enums only
├── <featureName>.schema.ts      # Props interfaces and data shapes
├── <featureName>.colors.ts      # Color maps and CSS-var constants (if feature has them)
├── <featureName>.constants.ts   # Non-color constants, style helpers, layout maps
├── components/
│   ├── <FeatureName>.tsx        # Public entry-point / router
│   ├── <SharedBase>.tsx         # Extracted shared wrapper (see Phase 3 rule)
│   └── ...                      # Variant components
└── index.ts                     # Public barrel
```

### Enum split rule

Enums split across two axes:

| Enum describes...                                  | Goes in...                     |
| -------------------------------------------------- | ------------------------------ |
| The feature's own rendering (edge, flavor, tone)   | `<feature>.enums.ts`           |
| A board/game concept used by adapters & layout too | The **parent** feature's enums |

Example: `TileEdge`, `BoardTileFlavor`, `BoardTileSelectionTone` → `boardTile.enums.ts`.
`SpaceType` (used by adapters, board-layout, deed) → stayed in `game-board.enums.ts`.

### Type split rule

Only types that directly describe the feature's component API belong in
`<feature>.schema.ts`. Types that describe animated state, sidebar lists, or container
configuration belong in the parent feature's types file.

### Color split rule

- Feature-specific **color maps** (property color → CSS var, corner variant → CSS var)
  → `<feature>.colors.ts`
- Board-wide **design tokens** (`GAME_BOARD_COLORS`) used across dozens of unrelated
  components → stay in the parent feature's colors file and are re-exported for compat

---

## Phase 3 — The Shared-Wrapper Rule

**Always check:** do two or more components in the feature share identical boilerplate?

The BoardTile refactor found this pattern duplicated 4×:

```tsx
// Duplicated in CornerTile, JailTile, PropertyTile, SpecialTile:
const isSelectable = Boolean(onSelect);
const handleKeyDown = (event) => { ... };
<article role={...} tabIndex={...} aria-pressed={...} onClick={...} onKeyDown={...}>
  <TileSheen />
  {children}
  {isDimmed && <DimOverlay />}
  <SelectionRing selected={isSelected} tone={selectionTone} />
</article>
```

Extract it into a `<FeatureName>Base.tsx` or `Tile<Base>.tsx` that accepts `className`,
`style`, and the shared state props. Variant components then focus purely on visual content.

**Rule:** if a code pattern appears in 3+ components and contains logic (not just JSX), it
must be extracted. Two identical blocks is a warning; three is a mandate.

---

## Phase 4 — Import Strategy (Minimal Blast Radius)

Choose per import category:

| Category                                                           | Strategy                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Direct component path imports (e.g. `components/BoardTile`)        | Update consumers directly — these are already coupled to the folder |
| Type/enum imports via the old feature barrel                       | Add re-exports in the old barrel → zero consumer changes            |
| Color/token imports from the old colors file                       | Re-export from the new feature → zero consumer changes              |
| Shared config (`shared/config/board-layout.ts`) that imports enums | Re-export old path if possible; otherwise update the shared file    |

**Never** leave a broken import. If you move a file, either update all consumers or add a
re-export shim. A clean `npx tsc --noEmit` with zero errors is the gate to commit.

---

## Phase 5 — Dead Code Removal Checklist

Work through these in the new feature files — never carry them over:

- [ ] Unused types identified in Phase 1c → deleted
- [ ] Unused enum variants → deleted (check all call sites first)
- [ ] Unreachable branches (e.g. `if (corner === JAIL)` in a component the router never
      sends JAIL to) → deleted
- [ ] Overlay/UI code that fires on data that can never exist (e.g. `OwnershipOverlay` on
      CHANCE tiles that are never owned) → deleted
- [ ] Props accepted but never used in the new component → removed from the interface
- [ ] Old `index.ts` re-export that pointed to now-deleted file → removed

---

## Phase 6 — Implementation Order

Write files in dependency order to avoid circular imports:

1. `<feature>.enums.ts` (no imports from own feature)
2. `<feature>.schema.ts` (imports enums + external protocol types)
3. `<feature>.colors.ts` (imports enums + schema for param types)
4. `<feature>.constants.ts` (imports enums + colors)
5. Leaf components: `Overlays.tsx`, `SelectionRing.tsx`, `TileText.tsx`, etc.
6. Sub-components: `BuildingsMarker.tsx`, `PlayerMarker.tsx`, etc.
7. The shared base: `<FeatureName>Base.tsx`
8. Variant components: `CornerTile.tsx`, `PropertyTile.tsx`, etc.
9. Router/entry: `<FeatureName>.tsx`
10. `index.ts` barrel
11. Update parent feature: enums → types → colors → adapters → barrel → container

---

## Phase 7 — Backward Compatibility

Update the **old feature's files** to re-export from the new feature:

```ts
// game-board/game-board.enums.ts — keep SpaceType, re-export moved enums
export {
  BoardTileFlavor,
  TileEdge,
  CornerVariant,
  BoardTileSelectionTone,
} from "@/features/BoardTile/boardTile.enums";

// game-board/game-board.colors.ts — keep GAME_BOARD_COLORS, re-export tile colors
export {
  BOARD_TILE_COLORS,
  PROPERTY_COLOR_MAP,
  getSpaceHeaderColor,
} from "@/features/BoardTile/boardTile.colors";
```

Update the **old feature's `index.ts`** to re-export component + token-shapes from the
new feature:

```ts
export { BoardTile } from "@/features/BoardTile/components/BoardTile";
export {
  TokenShape,
  resolveTokenShape,
} from "@/features/BoardTile/token-shapes";
```

---

## Phase 8 — Verify and Commit

```bash
npx tsc --noEmit
```

Fix every error before committing. Common issues after a feature extraction:

- **"Module declares X locally but it is not exported"** — you imported a symbol from a
  constants file that uses it internally but doesn't `export` it. Move the import to the
  file that owns and exports the symbol.
- **"Expected N arguments, but got M"** — a function signature changed during the move.
  Check all call sites.
- **"Cannot find module"** — a file still references the old path that was deleted. Either
  update the import or add a re-export shim.

Commit message prefix: `refactor:` followed by a description of what was extracted and why.
Include the key wins (e.g. "eliminates 4× duplicated wrapper") in the body.

---

## Checklist Before Closing

- [ ] `npx tsc --noEmit` → zero errors
- [ ] No file in `src/` imports from the deleted old path
- [ ] `game-board/index.ts` (or equivalent parent barrel) still re-exports everything it
      previously exported
- [ ] Dead code confirmed absent in the new feature
- [ ] `gameMode` threaded through any component that renders mode-specific content
- [ ] Commit made with `refactor:` prefix and descriptive body

---

## Reference: BoardTile Extraction (June 2026)

The canonical example of this pattern in this codebase.

**Before:** `src/features/game-board/components/board-tile/` — nested 4 levels deep, mixed
with board container concerns.

**After:** `src/features/BoardTile/` — self-contained feature with its own enums, schema,
colors, constants, and 12 component files.

**Key wins:**

- `TileBase` eliminated 6 patterns × 4 duplicates = 24 boilerplate instances
- Removed ~200 lines of dead code (unused types, unreachable branches, impossible overlays)
- Zero changes required for ~30 color/type consumers (re-export shims)
- Only 4 files with direct component path imports needed updating
