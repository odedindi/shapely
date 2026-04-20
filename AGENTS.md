# Shapely — AI Agent Instructions

> This file is the entry point for any AI agent (opencode, Claude, Cursor, etc.) working on this repo.
> Read this **before** touching any code. Keep it updated when conventions change.

---

## What Is This

**Shapely** is a shape-recognition PWA game. Players match shape combinations on a grid by dragging or tapping a card onto the correct cell. It is a production-quality app: beautiful, touch-native, offline-capable, multi-language.

Full product spec: **`docs/SPEC.md`** — the single source of truth. Update it whenever architectural decisions change.

---

## Non-Negotiable Rules

| Rule | Detail |
|---|---|
| **Package manager** | Yarn 4 — always `yarn add` / `yarn add -D`. Never `npm install`. |
| **TypeScript strict** | No `any`, `@ts-ignore`, `@ts-expect-error`. Ever. |
| **No empty catch blocks** | Always log or handle errors meaningfully. |
| **No hardcoded colors** | All colors via CSS custom properties: `var(--color-*)` or `var(--shape-color-*)`. Never hex in components. |
| **No hardcoded UI strings** | All user-visible text through `useTranslation()` from `react-i18next`. |
| **No hardcoded version numbers** | `"latest"` in package.json. Verify API before use — packages change fast. |
| **CSS logical properties** | `ps-`, `pe-`, `ms-`, `me-`, `inset-inline-*` — never `pl-`, `pr-`, `ml-`, `mr-`, `left`, `right`. RTL must work. |
| **Icons: inline SVG only** | No icon fonts, no lucide-react (except as shadcn internal dep). |
| **Framer Motion: use `m`** | `LazyMotion` is set up at app root. Always `import { m } from 'framer-motion'`. Never `motion`. |
| **Shape editor stays LTR** | `dir="ltr"` on the shape editor container regardless of app language. |
| **SPEC.md is the law** | Update `docs/SPEC.md` whenever any decision changes. |
| **No commits without being asked** | Never commit unless the user explicitly requests it. |

---

## Stack at a Glance

```
React 18 + TypeScript (strict)
Vite 8 + @tailwindcss/vite (Tailwind v4 — NO tailwind.config.ts)
Framer Motion v12 (LazyMotion, use m not motion)
@dnd-kit/core + @dnd-kit/utilities (drag-and-drop)
Zustand v5 (state — gameStore, settingsStore)
react-router v7 (import from "react-router", not "react-router-dom")
react-i18next + i18next (i18n, 10 languages planned)
shadcn/ui (src/components/ui/) + Magic UI (src/components/magic/)
vite-plugin-pwa + Workbox (PWA, offline-first)
web-vitals (perf monitoring, dev-only logging)
IndexedDB (custom shape storage, no third-party lib)
```

---

## Tailwind v4 — Critical Differences

- **No `tailwind.config.ts`** — configure design tokens in CSS via `@theme {}` block in `src/styles/globals.css`
- **Plugin**: `@tailwindcss/vite` in `vite.config.ts`
- **CSS vars in classes**: bracket notation only — `bg-[var(--color-surface)]`, `text-[var(--color-primary)]`
- **No `@apply` with custom tokens** — use inline bracket notation

---

## Color System

Never hardcode hex. Every color is a CSS custom property applied via `data-theme` + `data-mode` on `<html>`:

```
--color-surface          main background
--color-surface-alt      secondary panels, headers
--color-surface-raised   cards, elevated elements
--color-content          primary text
--color-content-muted    secondary text, placeholders
--color-border           borders, dividers
--color-primary          brand/accent color
--color-primary-hover    hover state of primary
--color-primary-fg       text on primary backgrounds
--color-success          correct answers, success states
--color-error            wrong answers, errors
--color-warning          warnings, caution states
--shape-color-1 … --shape-color-8   vivid palette for shapes
```

6 themes × light/dark: `default`, `sunset`, `forest`, `ocean`, `candy`, `monochrome`.

---

## File Structure (key paths)

```
src/
├── lib/
│   ├── logger.ts          ← log.game / log.perf / log.board / log.ui (dev-only)
│   ├── perf.ts            ← Web Vitals + markGameStart/markBoardReady
│   └── utils.ts           ← cn() helper (clsx + tailwind-merge)
├── store/
│   ├── gameStore.ts       ← game state (board, card, score, streak, phase)
│   └── settingsStore.ts   ← persisted settings (gridSize, theme, language, etc.)
├── hooks/
│   ├── useGameLogic.ts    ← answer eval, score/streak, adaptive difficulty, logging
│   ├── useShapeRegistry.ts← built-in + custom shapes merged, IndexedDB load
│   ├── useDragDrop.ts     ← legacy stub (dnd-kit handles DnD now)
│   └── useHaptics.ts      ← navigator.vibrate patterns
├── utils/
│   ├── boardGenerator.ts  ← generateBoard(gridSize, shapes) + dealCard(board)
│   └── difficultyEngine.ts← stepDifficulty, increaseChallenge, decreaseChallenge
├── shapes/
│   ├── types.ts           ← ShapeRenderParams, ShapeDefinition, CustomShapeRecord
│   ├── registry.ts        ← BUILTIN_SHAPES array
│   ├── customShapeAdapter.tsx
│   └── definitions/       ← one file per shape (15 built-ins)
├── db/
│   └── customShapes.ts    ← IndexedDB CRUD (saveCustomShape, getAllCustomShapes, etc.)
├── components/
│   ├── ui/                ← shadcn/ui primitives
│   ├── magic/             ← Confetti, Sparkles, ScorePop
│   ├── GameBoard.tsx      ← grid with column/row headers, passes board to cells
│   ├── BoardCell.tsx      ← useDroppable (dnd-kit), isOver highlight, correct/wrong feedback
│   ├── PlayerCard.tsx     ← useDraggable (dnd-kit), floating idle animation, drag ghost
│   ├── ScoreBar.tsx       ← HUD: score, streak fire, timer, settings button
│   ├── ShapeCombiner.tsx  ← overlay/silhouette/nested/side-by-side rendering
│   ├── ShapeEditor.tsx    ← SVG code editor (CodeMirror) + file upload + preview
│   └── SettingsPanel.tsx  ← all settings controls
├── screens/
│   ├── HomeScreen.tsx     ← animated floating shapes, Play/Settings/ShapeEditor buttons
│   ├── GameScreen.tsx     ← DndContext wraps everything; wires DnD + tap-to-select
│   ├── SettingsScreen.tsx ← back-nav header + SettingsPanel
│   └── ShapeEditorScreen.tsx
├── i18n/
│   ├── index.ts
│   └── locales/en.json    ← canonical key source (other languages TBD)
├── styles/
│   └── globals.css        ← @theme, all 6 themes × 2 modes, shadcn bridge, keyframes
├── App.tsx
└── main.tsx

plugins/
└── devLogger.ts           ← Vite serve-only middleware → logs/dev.log

docs/
└── SPEC.md                ← SINGLE SOURCE OF TRUTH — always keep updated
```

---

## Drag-and-Drop Architecture (dnd-kit)

`GameScreen` wraps everything in `<DndContext sensors={sensors} onDragEnd={handleDragEnd}>`.

- **Sensors**: `PointerSensor` with `activationConstraint: { distance: 8 }` — prevents taps from triggering drag.
- **Draggable**: `PlayerCard` uses `useDraggable({ id: 'player-card', disabled: phase !== 'playing' })`. The card itself goes opacity-0 while dragging; the ghost lives in `DragOverlay`.
- **DragOverlay**: rendered inside `DndContext`, shows `<PlayerCard isGhost>` at 1.1× scale, 4° tilt, heavy shadow, `dropAnimation={null}`.
- **Droppable**: each `BoardCell` uses `useDroppable({ id: \`cell-\${col}-\${row}\` })`. `isOver` drives the drop-zone highlight.
- **`onDragEnd`**: parses `event.over?.id` → `cell-{col}-{row}` → calls `submitAnswer(col, row)` + `setSelectedCell`.
- **Tap flow** (unchanged): `onPointerUp` on `PlayerCard` → `onSelect` → `cardSelected = true`. Then `handleCellSelect` on a `BoardCell` → `submitAnswer`.

Both flows are always active simultaneously.

---

## Logging (dev-only, tree-shaken in prod)

```ts
import { log } from '@/lib/logger'

log.game.info('message', { data })   // gameplay events
log.board.info('message', { data })  // board generation
log.ui.info('message', { data })     // navigation, settings, UI interactions
log.perf.info('message', { data })   // performance marks, web vitals
```

In dev: posts to `/__dev-log` → `logs/dev.log` (gitignored).
In prod: entire module is dead code (guarded by `import.meta.env.DEV`).

Add `log.*` calls anywhere they add signal. Do not log on every tick or render — only meaningful state transitions.

---

## Game State Machine

```
idle → playing → correct/wrong → playing (loop) → complete
```

Phase lives in `gameStore.phase`. Transitions:
- `startGame(board)` → `playing`
- `submitAnswer(col, row)` → `correct` or `wrong`
- `nextCard(card)` → `playing`
- `resetGame()` → `idle`

`complete` phase is rendered in `GameScreen` but not yet triggered (victory logic TBD).

---

## CSS Keyframes (in globals.css)

| Class | Effect |
|---|---|
| `.cell-correct-ring` | Ring border expands + fades (0.55s) — applied to overlay div on correct answer |
| `.cell-wrong-flash` | Red overlay flashes in/out (0.45s) — applied on wrong answer |
| `.card-float` | Gentle y-bob for PlayerCard idle state |
| `.board-dot-bg` | Subtle animated dot pattern on board background |

---

## Development Commands

```bash
yarn dev          # dev server with devLogger middleware (logs/ created at runtime)
yarn build        # production build — must exit 0 before any PR/commit
yarn preview      # preview production build locally
```

**Always run `yarn build` and verify exit 0 before reporting any task done.**

---

## What's Done vs. What's Not

See `docs/SPEC.md` → **Implementation Status** section for the canonical list.

**Short version of what's missing:**
- Victory screen (score + time + accuracy + share)
- Level-up full-screen overlay
- Sparkles wired to streak milestones
- Shape editor parameter sliders + 4-mode preview
- 9 locale translation files (only `en.json` exists)
- `ShapeStorage` interface abstraction over raw IndexedDB

---

## Common Pitfalls

- **`motion` vs `m`**: always `m` — using `motion` bypasses LazyMotion and bloats the bundle.
- **Tailwind v4 config**: there is no `tailwind.config.ts`. Add design tokens in `@theme {}` in `globals.css`.
- **react-router imports**: from `"react-router"` not `"react-router-dom"` — that package no longer exists separately in v7.
- **`yarn add` not `npm install`**: Yarn 4 is configured; npm will create a conflicting lockfile.
- **Color in components**: `var(--color-primary)` in Tailwind → `text-[var(--color-primary)]`. Never `text-indigo-500`.
- **CSS logical props**: `ps-4` not `pl-4`, `me-2` not `mr-2`, etc. RTL support depends on this everywhere.
- **Shape editor dir**: always `dir="ltr"` on the shape editor container, regardless of app language.
- **dnd-kit sensor distance**: the `distance: 8` constraint is intentional — do not remove it or taps will accidentally start drags on mobile.
