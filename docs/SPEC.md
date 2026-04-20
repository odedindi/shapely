# Shapely — Implementation Spec

> **This is the single source of truth for the Shapely project.**
> Hand this document to any LLM or developer to kick off or continue implementation.
> Every architectural decision, package choice, and design rule lives here.
> Keep this file updated whenever decisions change — never let it go stale.
>
> Last updated: 2026-04-20

---

## Project Overview

Build a fully functional Progressive Web App (PWA) educational game called **Shapely**. The game trains visual-spatial perception by asking players to match shape combinations on a dynamic grid board. The app must be production-quality: beautiful, accessible, touch-native, responsive across all device types (phone portrait/landscape, tablet, desktop), and offline-capable.

---

## Tech Stack

**Rule: never pin version numbers in `package.json`. Always use `"latest"` and let the package manager resolve at install time.**

**Package manager: Yarn 4** — always use `yarn add` (runtime) and `yarn add -D` (dev). Never use `npm install`.

Install the following packages (no version numbers):

```bash
# Runtime
yarn add react react-dom react-router framer-motion zustand @fontsource/nunito react-i18next i18next i18next-browser-languagedetector

# Dev
yarn add -D vite @vitejs/plugin-react @tailwindcss/vite tailwindcss typescript vite-plugin-pwa sharp
```

### Package notes (verify before use — APIs change fast)

| Package | Key facts |
|---|---|
| `react-router` | **v7+** — `react-router-dom` no longer exists as a separate package. Everything imports from `"react-router"` directly. Use `createBrowserRouter` + `RouterProvider` (data router pattern, recommended). `BrowserRouter` still works for simple cases but data router is preferred. |
| `tailwindcss` | **v4** — no `tailwind.config.ts` needed. Use `@tailwindcss/vite` plugin in `vite.config.ts`. Configure design tokens via `@theme {}` block in CSS. |
| `zustand` | **v5** — `persist` middleware imported from `zustand/middleware`. |
| `framer-motion` | **v12** — `LazyMotion` + `domAnimation` features loaded at app root. Always import `m` (not `motion`) from `framer-motion` in components. `AnimatePresence` for exit animations. |
| `@dnd-kit/core` | Drag-and-drop. `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`. `PointerSensor` with `distance: 8` constraint so taps don't accidentally start drags. |
| `@dnd-kit/utilities` | `CSS.Transform.toString()` for applying dnd-kit transform to draggable elements. |
| `vite-plugin-pwa` | Set `manifest: false` to use `public/manifest.json` directly. Use Workbox `generateSW` strategy. |
| `react-i18next` | Use `useTranslation()` hook. Init in `src/i18n/index.ts`, import before rendering in `main.tsx`. |
| `sharp` | Dev-only. Used by `scripts/generate-icons.mjs` to rasterise SVG icons to PNG. |

**Before writing any import, verify the package's current API.** If something feels off, check npm or the package docs — do not assume v5/v6 APIs still apply.

---

## UI Component System

The project uses **shadcn/ui** as its base component system, with **Magic UI** for animated effects.

### shadcn/ui
- Primitive components (Button, Card, Dialog, Sheet, Tabs, Slider, Badge) live in `src/components/ui/`
- Components are installed as source files — we own the code
- Uses a CSS var bridge (`--background`, `--primary`, etc.) that maps to our `--color-*` system
- Install new components: `npx shadcn@latest add <component>`

### Magic UI
- Animated components live in `src/components/magic/`
- Copy-paste approach — no npm runtime dependency
- Used for: `Confetti` (correct answer burst), `Sparkles` (streak milestones), `ScorePop` (score increase animation)

### Theme Bridge
shadcn/ui uses its own var names (`:root { --primary: ...; }`). We bridge them to our theme system in `globals.css`:
```css
:root, [data-theme] {
  --background: var(--color-surface);
  --foreground: var(--color-content);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-fg);
  /* ... etc */
}
```
**Never modify `--color-*` vars** — those belong to our theme system. shadcn owns `--background`, `--primary`, etc.

---

## Core Game Mechanic

The game board is a **2D matrix grid**:

- **Column headers** — each column is labeled with one shape
- **Row headers** — each row is labeled with one shape
- **Each cell** — the visual **combination** of its column shape + row shape, rendered as a composite SVG

The player holds a **card** showing **two shapes separately** (the column shape and the row shape). They must identify the correct cell at the intersection of those two shapes by recognizing what their combination looks like.

### Dual Input Model (both always active simultaneously)

| Input | Behaviour |
|---|---|
| **Drag and drop** | Player drags the card onto the correct cell. Uses **@dnd-kit/core** `DndContext` + `useDraggable` / `useDroppable`. `DragOverlay` renders a ghost card at 1.1× scale, 4° rotation. `onDragEnd` parses `event.over?.id` → `cell-{col}-{row}`. |
| **Tap / click** | Player taps card → card enters `isSelected` state. Player taps a cell → answer submitted via `handleCellSelect`. |

Never disable one mode to enable the other. Both must work at the same time on all devices.

## Logging Infrastructure

### Overview

Structured dev-only logging that is **completely tree-shaken in production** (guarded by `import.meta.env.DEV`). In dev: POSTs JSON entries to a Vite middleware at `/__dev-log` which appends timestamped lines to `logs/dev.log`. In prod: all logging calls compile to nothing.

### Logger (`src/lib/logger.ts`)

```ts
import { log } from '@/lib/logger'

log.game.info('answer submitted', { col, row, correct })
log.game.warn('wrong answer', { correctCol, correctRow })
log.board.error('generateBoard failed', { gridSize, required })
log.ui.info('navigate', { to: '/game' })
log.perf.info('web vital', { name: 'LCP', value: 1234 })
```

Four namespaced loggers: `log.game`, `log.perf`, `log.board`, `log.ui`. Each has `.debug()`, `.info()`, `.warn()`, `.error()`.

### Vite Plugin (`plugins/devLogger.ts`)

`apply: 'serve'` — only active during `yarn dev`. Handles `POST /__dev-log`, writes timestamped JSON lines to `logs/dev.log`. The `logs/` directory is gitignored.

### Performance (`src/lib/perf.ts`)

Web Vitals reporting (CLS, INP, LCP, FCP, TTFB) via `web-vitals` package. All routed through `log.perf`. Also exports `markGameStart()` and `markBoardReady()` performance marks called from `useGameLogic`.

### What Is Logged

| Location | What |
|---|---|
| `settingsStore.ts` `updateSetting` | key, old value, new value |
| `gameStore.ts` `submitAnswer` | col, row, correct, streak, score |
| `gameStore.ts` `resetGame` | reset event |
| `boardGenerator.ts` `generateBoard` | gridSize + shapeCount on success; error details before throw |
| `difficultyEngine.ts` | reveal mode transitions (`visible→peek`, etc.) |
| `useShapeRegistry.ts` | shape count on mount load; all CRUD ops (add/update/remove); missing-record warn |
| All screens | `navigate` calls with `to` + `from` + reason |
| `GameScreen` | settings panel open/close |
| `ShapeEditorScreen` | shape delete |
| `ShapeEditor.tsx` | FileReader `onerror`; save `catch` with actual error |

---

## Performance Decisions

- **`LazyMotion`** — loaded at app root with `domAnimation` features. All components use `m` (not `motion`). Saves ~46kb raw / ~13kb gzip.
- **`whileHover`/`whileTap` on BoardCell** — removed; replaced with CSS `hover:scale-[1.06]` and `active:scale-[0.96]`. Eliminates 25+ JS pointer listeners per board.
- **CSS `@keyframes` for feedback** — `cell-correct-ring` and `cell-wrong-flash` run on the compositor; no JS animation loop.
- **`useMemo` for `paramsA`/`paramsB`** — in `BoardCell` and `PlayerCard` to avoid `getComputedStyle` on every render.
- **`will-change: transform`** — on `PlayerCard` only (draggable element).

---



### Core Types (`src/shapes/types.ts`)

```ts
export interface ShapeRenderParams {
  size?: number        // optional — shapes use CSS sizing; ignored by most renderers
  fillColor: string    // CSS color or 'none'
  strokeColor: string  // CSS color
  strokeWidth: number  // relative to viewBox 0 0 100 100
  rotation: number     // degrees, around center (50, 50)
  opacity: number      // 0–1
}

export interface ShapeDefinition {
  id: string
  name: string
  source: 'builtin' | 'custom'
  render: (params: ShapeRenderParams) => ReactElement
}

export interface CustomShapeRecord {
  id: string
  name: string
  svgContent: string   // inner SVG markup only (no outer <svg> tag)
  createdAt: number
  updatedAt: number
}
```

### SVG Rendering Convention

All shapes render with `width="100%" height="100%"` and `viewBox="0 0 100 100"`. Shapes are sized by their CSS container — no `size` prop is passed or used. Rotation via `transform="rotate(deg, 50, 50)"`.

### Built-in Shape Library (`src/shapes/definitions/`)

One file per shape. All 15 must be implemented:

`circle`, `square`, `triangle-equilateral`, `triangle-right`, `star`, `pentagon`, `hexagon`, `diamond`, `cross`, `arrow`, `crescent`, `heart`, `parallelogram`, `trapezoid`, `oval`

### Shape Registry (`src/shapes/registry.ts`)

```ts
export const BUILTIN_SHAPES: ShapeDefinition[] = [ circle, square, /* ... */ ]
```

Adding a new built-in shape = one new file + one import + one array entry. No other changes.

### Shape Combiner (`src/components/ShapeCombiner.tsx`)

Renders two shapes in a shared SVG viewport. The mode is a runtime setting. **Pure CSS sizing — no `size` prop.** Shapes fill their container via CSS (`w-full h-full`).

| Mode | Description |
|---|---|
| `overlay` | Both centered, semi-transparent fill, both outlines visible — **default** |
| `silhouette` | SVG `<clipPath>`/`<mask>` union — single merged filled silhouette |
| `nested` | Smaller shape at ~50% scale inside the bounding box of the larger |
| `side-by-side` | Adjacent with divider — easiest, for young children |

```tsx
interface ShapeCombinerProps {
  shapeA: ShapeDefinition
  shapeB: ShapeDefinition
  paramsA: ShapeRenderParams
  paramsB: ShapeRenderParams
  mode: CombinationStyle
  // NOTE: No size prop — component uses CSS sizing exclusively
}
```

---

## Custom Shape System

Players and admins can create custom shapes beyond the 15 built-ins. Three entry points:

### 1. SVG Upload

- Drag-and-drop or file-picker (`.svg` files only)
- Parse the uploaded file, strip the outer `<svg>` wrapper, store the inner markup
- Preview the parsed shape live before saving
- Validate: must contain at least one renderable SVG element

### 2. SVG Code Editor

- Split-pane layout: **left = code editor**, **right = live preview**
- Code editor: a `<textarea>` with monospace font and line numbers (lightweight — no Monaco or heavy editors)
- User writes raw SVG inner markup (no outer `<svg>` tag — the preview wraps it)
- Preview updates live as the user types (debounced 300ms)
- Preview renders the shape in all four combination modes side by side
- Save button → writes to IndexedDB

### 3. Storage: IndexedDB

All custom shapes are stored in IndexedDB via the native API (no third-party lib). Schema:

```
Database: "shapely"    Version: 1
Store: "custom-shapes"  keyPath: "id"
```

CRUD operations in `src/db/customShapes.ts`:
- `saveCustomShape(record)` — put (upsert)
- `getAllCustomShapes()` — getAll
- `getCustomShape(id)` — get
- `deleteCustomShape(id)` — delete

### 4. Future: Server Sync

The IndexedDB layer must be wrapped in a service interface so it can be swapped to a REST API without touching the rest of the app:

```ts
// src/db/shapeStorage.ts
export interface ShapeStorage {
  save(record: CustomShapeRecord): Promise<void>
  getAll(): Promise<CustomShapeRecord[]>
  get(id: string): Promise<CustomShapeRecord | undefined>
  delete(id: string): Promise<void>
}
```

Implement `IndexedDBShapeStorage` now. Leave `RemoteShapeStorage` as a typed stub with `// TODO: implement REST calls`.

### 5. Custom Shape → ShapeDefinition Adapter (`src/shapes/customShapeAdapter.tsx`)

Converts a `CustomShapeRecord` into a `ShapeDefinition`. Sanitizes SVG content (applies fill/stroke/strokeWidth from render params) and renders via `dangerouslySetInnerHTML` inside a controlled SVG viewport.

### 6. useShapeRegistry Hook (`src/hooks/useShapeRegistry.ts`)

Loads built-in shapes + all custom shapes from IndexedDB on mount. Exposes `allShapes`, `addCustomShape`, `updateCustomShape`, `removeCustomShape`. This is the single source of shapes used everywhere in the app.

---

## Internationalization (i18n)

### Packages

```bash
yarn add react-i18next i18next i18next-browser-languagedetector
```

### Setup

- Initialize in `src/i18n/index.ts`, imported in `src/main.tsx` before `createRoot`
- Language auto-detected from browser via `i18next-browser-languagedetector`
- Fallback language: `en`
- All user-visible strings go through `useTranslation()` — zero hardcoded UI text anywhere

### Supported Languages (launch)

| Code | Language | Direction |
|---|---|---|
| `en` | English | LTR |
| `he` | Hebrew | RTL |
| `fr` | French | LTR |
| `de` | German | LTR |
| `es` | Spanish | LTR |
| `ar` | Arabic | RTL |
| `zh` | Chinese (Simplified) | LTR |
| `ja` | Japanese | LTR |
| `pt` | Portuguese | LTR |
| `ru` | Russian | LTR |

### Locale File Structure (`src/i18n/locales/<code>.json`)

> **Note:** The canonical key list is `src/i18n/locales/en.json`. The template below is a reference — actual keys in the codebase may differ (e.g. `home.play` instead of `home.quickStart`). Always refer to `en.json` as the source of truth for key names.

```json
{
  "home.title": "Shapely",
  "home.tagline": "Train your perception",
  "home.quickStart": "Quick Start",
  "home.newGame": "New Game",
  "home.settings": "Settings",
  "game.score": "Score",
  "game.streak": "Streak",
  "game.correct": "Correct!",
  "game.wrong": "Try again",
  "game.complete": "Well done!",
  "settings.title": "Settings",
  "settings.gridSize": "Grid Size",
  "settings.combinationStyle": "Combination Style",
  "settings.cellRevealMode": "Cell Reveal",
  "settings.theme": "Theme",
  "settings.language": "Language",
  "settings.darkMode": "Dark Mode",
  "settings.timer": "Timer",
  "settings.adaptiveDifficulty": "Adaptive Difficulty",
  "settings.shapeEditor": "Shape Editor",
  "shapeEditor.title": "Shape Editor",
  "shapeEditor.upload": "Upload SVG",
  "shapeEditor.draw": "Draw SVG",
  "shapeEditor.save": "Save Shape",
  "shapeEditor.preview": "Preview",
  "shapeEditor.name": "Shape Name",
  "shapeEditor.delete": "Delete",
  "shapeEditor.cancel": "Cancel"
}
```

### RTL Support

- Detect RTL languages (`he`, `ar`) and set `dir="rtl"` on `<html>` element reactively
- Use CSS logical properties throughout: `margin-inline-start` not `margin-left`, `padding-inline-end` not `padding-right`, `inset-inline-start` not `left`, etc.
- Framer Motion drag direction respects RTL

---

## Theme System

### Architecture

Themes are CSS custom property sets applied via `data-theme` + `data-mode` attributes on `<html>`. `App.tsx` applies both reactively from the settings store.

```html
<html data-theme="ocean" data-mode="dark">
```

### CSS Token Structure

Each theme × mode combination defines:

```css
/* UI surface colors */
--color-surface
--color-surface-alt
--color-surface-raised
--color-content
--color-content-muted
--color-border

/* Brand / accent */
--color-primary
--color-primary-hover
--color-primary-fg

/* Semantic */
--color-success
--color-error
--color-warning

/* Shape palette — 8 distinct colors used when randomising shape fill/stroke */
--shape-color-1  through  --shape-color-8
```

### Built-in Themes (6 total, each with light + dark)

#### `default` — Indigo / Violet
Primary: `#6366f1` → `#8b5cf6`. Shape palette: indigo, violet, sky, emerald, amber, rose, orange, teal.

#### `sunset` — Coral / Amber
Primary: `#f97316` → `#ef4444`. Shape palette: orange, coral, rose, amber, yellow, red, pink, cream.

#### `forest` — Emerald / Teal
Primary: `#10b981` → `#14b8a6`. Shape palette: emerald, teal, lime, cyan, green, sage, moss, jade.

#### `ocean` — Blue / Cyan
Primary: `#3b82f6` → `#06b6d4`. Shape palette: blue, cyan, sky, indigo, navy, cerulean, aqua, cobalt.

#### `candy` — Pink / Purple
Primary: `#ec4899` → `#a855f7`. Shape palette: pink, fuchsia, purple, rose, magenta, lavender, lilac, peach.

#### `monochrome` — Grayscale
Primary: `#374151` → `#111827`. Shape palette: 8 shades from `#111827` to `#d1d5db`. Shapes use stroke-only (no fill) for maximum contrast.

### Shape Color Assignment

`boardGenerator.ts` reads the active theme's shape palette via `getComputedStyle(document.documentElement)` and assigns one unique palette color per shape for the duration of a game. Colors do not flicker or reassign mid-game.

### Settings Store Shape

```ts
type Theme = 'default' | 'sunset' | 'forest' | 'ocean' | 'candy' | 'monochrome'
type DarkMode = 'auto' | 'light' | 'dark'

interface SettingsState {
  // ...existing fields...
  theme: Theme
  darkMode: DarkMode
  language: string
}
```

### Theme Switcher UI

Visual grid of 6 circular swatches showing primary + 2 shape colors. Tapping switches instantly with a brief cross-fade on `--color-surface`. Available from both the Home screen and the Settings panel.

---

## PWA Icons

### Source SVG Files (`public/icons/`)

| File | Description |
|---|---|
| `icon.svg` | Master icon — rounded-square, indigo gradient background, circle + rotated square interlocking, representing the combination mechanic |
| `icon-maskable.svg` | Full-bleed version — same design, no rounded corners, all content within 80% safe zone |
| `favicon.svg` | 32px-optimized simplified version |

### PNG Generation Script

```bash
node scripts/generate-icons.mjs
```

Requires `sharp` (already in devDependencies). Generates all PNG sizes from SVG sources into `public/icons/` and splash screens into `public/splash/`.

| Generated file | Size | Use |
|---|---|---|
| `favicon-16.png` / `favicon-32.png` | 16, 32 | Browser tab |
| `icon-48.png` → `icon-512.png` | All standard sizes | PWA manifest, home screen |
| `icon-maskable-512.png` | 512 | Android adaptive icon |
| `public/splash/*.png` | Various | iOS splash screens |

### manifest.json Key Fields

```json
{
  "theme_color": "#6366f1",
  "background_color": "#6366f1",
  "display": "standalone",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## Game Modes & Configuration

### Settings Table

| Setting | Type | Default | Options |
|---|---|---|---|
| Grid size | number | 3 | 2, 3, 4, 5 |
| Cell reveal mode | string | `visible` | `visible`, `hidden`, `peek` |
| Combination style | string | `overlay` | `overlay`, `silhouette`, `nested`, `side-by-side` |
| Adaptive difficulty | boolean | `true` | |
| Timer | boolean | `false` | |
| Theme | string | `default` | `default`, `sunset`, `forest`, `ocean`, `candy`, `monochrome` |
| Dark mode | string | `auto` | `auto`, `light`, `dark` |
| Language | string | auto-detect | `en`, `he`, `fr`, `de`, `es`, `ar`, `zh`, `ja`, `pt`, `ru` |
| Shape editor enabled | boolean | `false` | Unlocks `/shape-editor` route |

### Difficulty Presets

| Level | Grid | Style | Reveal | Timer | Shape variation |
|---|---|---|---|---|---|
| Easy | 2×2 | side-by-side | visible | off | uniform size, no rotation |
| Medium | 3×3 | overlay | visible | optional | varied colors, mild rotation |
| Hard | 4×4+ | overlay/silhouette | hidden | on | varied size, opacity, strokeWidth, arbitrary rotation |

### Adaptive Difficulty

- 3 correct in a row → increase challenge (reveal mode harder)
- 2 wrong in a row → decrease challenge (reveal mode easier)
- **Grid size is NOT changed mid-game** — changing grid size is too disruptive during an active session. Only `cellRevealMode` adjusts adaptively.
- Implemented in `src/utils/difficultyEngine.ts`

---

## App Screens & Routes

Use `createBrowserRouter` + `RouterProvider` from `"react-router"` (v7 data router pattern):

```ts
import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  { path: '/',             element: <HomeScreen /> },
  { path: '/game',         element: <GameScreen /> },
  { path: '/settings',     element: <SettingsScreen /> },
  { path: '/shape-editor', element: <ShapeEditorScreen /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
```

### Navigation Pattern (all screens)

All screens use a consistent header:
- **Back arrow (←)** on the left → navigates to parent route
- **Title** centered
- **Optional action** on the right (e.g., settings gear in GameScreen)

HomeScreen has no back button (it is the root). GameScreen replaces the title with a ScoreBar but still has a back arrow.

### Home Screen (`/`)

- Large fluid "Shapely" logo + translated tagline
- Animated background: shapes floating + rotating via Framer Motion
- **Quick Start** (last settings), **New Game** (settings first), **Settings**
- Theme switcher (6 swatches) and language switcher accessible directly from home

### Game Screen (`/game`)

#### Layout

```
┌──────────────────────────────────────┐
│  ←  Score  Streak  [Timer]    [⚙️]   │  ← header / score bar
├───────┬──────┬──────┬──────┐         │
│       │  🔵  │  ⭐  │  🔺  │         │  ← column headers
├───────┼──────┼──────┼──────┤         │
│  🟥   │ cell │ cell │ cell │         │  ← row header + cells
├───────┼──────┼──────┼──────┤         │
│  💠   │ cell │ cell │ cell │         │
└───────┴──────┴──────┴──────┴─────────┘

[ Card:  🔵  +  🟥 ]   ← card tray
```

**Auto-start**: GameScreen auto-starts a new game on mount as soon as shapes are loaded — no "Start Game" button.

#### Responsive Layout

| Viewport | Card tray | Grid |
|---|---|---|
| Mobile portrait | Fixed bottom | Fills remaining vertical space |
| Tablet / landscape | Right side panel | Centered |
| Desktop | Right side panel | Centered, generous padding |

#### Feedback Animations

| Event | Animation |
|---|---|
| Correct | Cell pulses success color, confetti burst (`triggerConfetti()`), score number pop (`ScorePop`) |
| Wrong | Card spring-shake, cell flashes error color, card returns |
| Streak milestone | Streak counter particle burst (`Sparkles`) |
| Level up | Full-screen overlay, next difficulty label |
| Complete | Victory screen: score, time, accuracy, replay / share |

#### Haptics

```ts
navigator.vibrate(50)           // correct
navigator.vibrate([30, 50, 30]) // wrong
navigator.vibrate(10)           // tap
```

### Settings Panel (`/settings`)

Route uses `<SettingsScreen />` — a wrapper component with a consistent back-arrow header + `<SettingsPanel />` content inside.

Sections: Game · Appearance (theme + dark mode) · Language · Shapes · About

### Shape Editor Screen (`/shape-editor`)

Gated by `shapeEditorEnabled` setting. Two tabs:

**Library tab** — grid of all shapes (built-in + custom), edit/delete actions on custom shapes, "Add new" button.

**Editor tab:**
- Split-pane: left = SVG code editor (`<textarea>`, monospace, line numbers), right = live preview
- Upload button: file picker + drag-and-drop zone for `.svg` files
- Preview: shape rendered in all 4 combination modes
- Parameter sliders: size, strokeWidth, rotation, fillColor, strokeColor, opacity — all live-updating
- Name input + Save + Cancel + Delete (custom only)

---

## State Management (Zustand)

### Game Store (`src/store/gameStore.ts`) — not persisted

```ts
interface GameState {
  board: BoardState | null
  currentCard: CardState | null
  score: number
  streak: number
  timeElapsed: number
  difficulty: Difficulty
  phase: GamePhase
  startGame: (board: BoardState) => void
  submitAnswer: (col: number, row: number) => void
  nextCard: (card: CardState) => void
  tickTimer: () => void
  resetGame: () => void
}
```

### Settings Store (`src/store/settingsStore.ts`) — persisted to localStorage key `"shapely-settings"`

```ts
interface SettingsState {
  gridSize: 2 | 3 | 4 | 5
  cellRevealMode: CellRevealMode
  combinationStyle: CombinationStyle
  adaptiveDifficulty: boolean
  timerEnabled: boolean
  theme: Theme
  darkMode: DarkMode
  language: string
  shapeEditorEnabled: boolean
  updateSetting: <K extends keyof Omit<SettingsState, 'updateSetting'>>(
    key: K, value: SettingsState[K]
  ) => void
}
```

---

## File Structure

```
shapely/
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon.svg
│   │   ├── icon-maskable.svg
│   │   ├── favicon.svg
│   │   ├── icon-192.png           ← generated
│   │   ├── icon-512.png           ← generated
│   │   └── icon-maskable-512.png  ← generated
│   └── splash/                    ← generated iOS/Android splash screens
├── docs/
│   └── SPEC.md                    ← THIS FILE — always keep updated
├── scripts/
│   └── generate-icons.mjs
├── src/
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json  he.json  fr.json  de.json  es.json
│   │       └── ar.json  zh.json  ja.json  pt.json  ru.json
│   ├── shapes/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── customShapeAdapter.tsx
│   │   └── definitions/
│   │       └── (15 files — one per shape)
│   ├── db/
│   │   ├── customShapes.ts        ← raw IndexedDB CRUD
│   │   └── shapeStorage.ts        ← ShapeStorage interface + implementations
│   ├── lib/
│   │   └── utils.ts               ← cn() helper (clsx + tailwind-merge)
│   ├── components/
│   │   ├── ui/                    ← shadcn/ui components (Button, Card, Dialog, etc.)
│   │   ├── magic/                 ← Magic UI animated components (Confetti, Sparkles, ScorePop)
│   │   ├── ShapeCombiner.tsx
│   │   ├── GameBoard.tsx
│   │   ├── BoardCell.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── ScoreBar.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── ShapeEditor.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── SettingsScreen.tsx     ← wrapper with consistent back-arrow header
│   │   └── ShapeEditorScreen.tsx
│   ├── store/
│   │   ├── gameStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useShapeRegistry.ts
│   │   ├── useGameLogic.ts
│   │   ├── useDragDrop.ts
│   │   └── useHaptics.ts
│   ├── utils/
│   │   ├── boardGenerator.ts
│   │   └── difficultyEngine.ts
│   ├── styles/
│   │   └── globals.css            ← all theme tokens, @theme config, shadcn bridge
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

---

## Responsive & Touch Design

- **Mobile-first** breakpoints: base (mobile), `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px
- **Touch targets**: minimum 48×48px for ALL interactive elements
- **No hover-only interactions** — every hover has a tap/long-press equivalent
- **Drag on touch**: Framer Motion `drag` with `dragConstraints`, `dragElastic`, proper touch events
- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- **Safe areas**: `env(safe-area-inset-*)` for notch and home indicator padding
- **Orientation**: layout adapts dynamically between portrait and landscape
- **Fluid typography**: `clamp()` everywhere — never fixed `px` for body text
- **RTL**: CSS logical properties throughout; `dir` set on `<html>` based on active language
- **Grid cells**: auto-size to fill space, maintain square aspect ratio via aspect-ratio CSS

---

## Visual Design Language

- **Aesthetic**: clean, modern, playful but not childish — works for all ages
- **Typography**: Nunito via `@fontsource/nunito` (weights 400, 600, 700, 800)
- **Colors**: entirely via CSS custom properties — never hardcoded in components
- **Spacing**: strict 4/8/16/24/32/48px scale (Tailwind default)
- **Grid cells**: `rounded-xl`, subtle shadow, clear hover/active/selected/correct/wrong states
- **Card**: `shadow-xl`, `rounded-2xl`, elevated, visually heavier than cells
- **Icons**: inline SVG only — no icon fonts, no external icon libraries
- **Animations**: `150–200ms` micro-interactions, `300–400ms` layout transitions
- **Theme transitions**: brief cross-fade when switching themes (CSS transition on `--color-surface`)

---

## PWA Requirements

- **manifest.json**: all required fields, all icon sizes including maskable
- **Service worker**: Workbox via `vite-plugin-pwa`, cache-first for assets, precache at install
- **Offline**: full offline play after first load — all JS, CSS, fonts, SVGs precached
- **Installable**: Chrome install prompt + iOS "Add to Home Screen"
- **iOS meta tags**: `apple-mobile-web-app-capable`, status bar, touch icon, splash screens
- **Lighthouse targets**: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA ✓

---

## Implementation Status

### ✅ Implemented

- All 15 built-in shapes
- ShapeCombiner (all 4 modes, pure CSS sizing — no size prop)
- GameBoard, BoardCell, PlayerCard (CSS-based, fully responsive)
- Home screen (animated background, nav buttons, shadcn Buttons)
- Game screen (responsive board + card tray, score bar, settings modal, auto-start on mount, back button)
- Settings screen (`SettingsScreen` wrapper with consistent back-nav header)
- Shape editor screen (library tab + SVG code editor tab)
- Zustand stores (gameStore, settingsStore with persistence)
- useGameLogic (answer evaluation, score/streak, adaptive difficulty)
- useShapeRegistry (built-ins + custom shapes from IndexedDB)
- IndexedDB CRUD (`customShapes.ts`)
- Theme system (6 themes × light/dark, all CSS custom properties)
- i18n setup (react-i18next, en.json complete)
- RTL support (`dir="rtl"` on html, CSS logical properties)
- **dnd-kit drag-and-drop** (`@dnd-kit/core` + `@dnd-kit/utilities`) — `DndContext` in GameScreen, `useDraggable` in PlayerCard, `useDroppable` in BoardCell, `DragOverlay` ghost card
- Tap-to-select (card selected state → tap cell) — both DnD and tap active simultaneously
- PWA manifest + service worker
- shadcn/ui components (Button, Card, Dialog, Sheet, Tabs, Slider, Badge)
- Magic UI components (Confetti, Sparkles, ScorePop)
- Confetti burst on correct answer
- ScorePop animation on score increase
- **Structured dev logging** (`src/lib/logger.ts`, `plugins/devLogger.ts`, `src/lib/perf.ts`) — tree-shaken in prod
- **Web Vitals reporting** (CLS, INP, LCP, FCP, TTFB) via `web-vitals` package
- **Performance optimizations** (LazyMotion, CSS hover/feedback animations, useMemo for shape params)
- **Game UX glow-up** — floating card idle animation, drag ghost overlay, drop-zone highlights, checkmark fly-in, frosted glass hidden cells, animated ScoreBar streak, board dot pattern

### ❌ Not Yet Implemented

- Level-up full-screen overlay (mid-game difficulty increase notification)
- Victory screen with time, accuracy, and share (currently shows only score + Play Again)
- Streak milestone particle burst (`Sparkles` component exists but not yet wired to streak milestones)
- Shape editor parameter sliders (size, strokeWidth, rotation, fillColor, strokeColor, opacity)
- Shape editor 4-mode preview side-by-side
- `ShapeStorage` interface + `IndexedDBShapeStorage` abstraction (`customShapes.ts` uses raw IndexedDB directly)
- 9 locale files (only `en.json` exists; he, fr, de, es, ar, zh, ja, pt, ru missing)

---

## Implementation Order

1. **Scaffold** — Vite + React + TS + Tailwind v4 + PWA. Dev server runs. PWA installable.
2. **Theme system** — all 6 themes × light/dark in CSS. `data-theme` + `data-mode` wired. Switcher UI.
3. **i18n** — react-i18next init, all 10 locale files, language switcher, RTL wired.
4. **Shape system** — types, registry, all 15 definitions. Temporary debug page to verify.
5. **ShapeCombiner** — all 4 modes. Test all combinations.
6. **Custom shape system** — IndexedDB CRUD, SVG upload, code editor, live preview, useShapeRegistry.
7. **Board generator** — valid NxN grids, shape color assignment from active theme palette.
8. **Game screen layout** — responsive board + card tray at all breakpoints. Hardcoded data.
9. **Game store** — Zustand state, board generation wired, card dealing logic.
10. **Interaction layer** — tap-to-select + drag-and-drop. Both on touch AND mouse simultaneously.
11. **Game logic** — answer evaluation, score/streak, adaptive difficulty.
12. **Feedback animations** — correct/wrong/streak/levelup/complete. Haptics.
13. **Settings panel** — all options, persist, theme/language switchers.
14. **Home screen** — animated background, full polish.
15. **Shape editor screen** — library tab + editor tab (upload + SVG editor).
16. **PWA finalization** — `node scripts/generate-icons.mjs`, splash screens, offline test on real device.
17. **Polish pass** — all themes × dark/light, accessibility audit, Lighthouse audit, fix all issues.

---

## Hard Constraints

| Rule | Detail |
|---|---|
| TypeScript strict | No `any`, `@ts-ignore`, `@ts-expect-error` |
| No empty catch blocks | Always handle errors meaningfully |
| No hardcoded version numbers | `"latest"` in package.json; verify API before use |
| No hardcoded UI strings | Everything through `useTranslation()` |
| No hardcoded colors in components | Always via CSS custom properties |
| Shapes extensible | New built-in = 1 file + 1 registry entry. No other changes. |
| Custom shapes | New custom shape = IndexedDB save. Instantly available in game. |
| Runtime configurable | Combination style, reveal mode, grid size, theme, language — all runtime, no code changes |
| Icons inline SVG only | No icon fonts, no external icon libraries |
| Keyboard accessible | All interactive elements work with keyboard; proper ARIA roles/labels |
| RTL correct | CSS logical properties throughout; layout mirrors under `dir="rtl"` |
| Package manager | Yarn 4 — always `yarn add`, never `npm install` |
| Prompt stays current | Update `docs/SPEC.md` whenever any decision changes — this is the law |
