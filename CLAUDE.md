# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Vision & Goals

This is a **personal portfolio site** designed to showcase development work with an **experimental/artistic aesthetic**. The current content is **placeholder** - all sections need to be built out with real portfolio content.

**Design Inspiration**: High-end creative studio sites (Active Theory, etc.) - think avant-garde, boundary-pushing WebGL experiences with unconventional layouts and bold visual statements.

**Status**: Early development. The fish animation and three-layer rendering architecture are in place, but UI components, content sections, and styling all need significant work.

## Development Principles

### Critical Requirements

1. **Always test on mobile/touch devices** - The fish interactions rely on touch events. Mobile testing is non-negotiable for any UI changes.

2. **Maintain the three-layer rendering architecture** - The bg canvas/DOM/fg canvas sandwich is the foundation of this project. Do not break it.

### Component Philosophy

- **Self-contained components** - Each component should handle its own effects, animations, and styling. Avoid creating shared utility modules for now.
- **Experimental styling encouraged** - Push creative boundaries. Unconventional layouts and bold visual choices are preferred over "safe" design.
- **Code consistency over cleverness** - The codebase currently has inconsistent patterns. When adding new code, match the existing style in that area, but prioritize readability and consistency.

## Common Development Tasks

The most frequent workflow is **adding new UI components and sections**:
- Project showcase/case studies
- Skills and technologies display
- Work experience/timeline
- Contact and social links
- Additional creative sections as needed

When adding components, focus on:
1. Creating incredible, experimental styling
2. Ensuring mobile/touch compatibility
3. Maintaining code consistency with existing patterns

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server with HMR

# Linting & tests
npm run lint             # Run ESLint on the codebase
npm run smoke            # Headless smoke test of the flock simulation

# Building
npm run build:client     # Build client (TypeScript + Vite)
npm run build:server     # Build server (TypeScript compilation)
npm run build            # Build both client and server

# Production
npm run start:prod       # Build and serve production bundle
npm run serve:dist       # Serve pre-built dist folder (for testing)
npm run preview          # Vite preview of production build
```

## Project Architecture

This is a **React + Three.js portfolio site** with custom shader effects and 3D fish animations. The app uses a unique three-layer rendering architecture.

### Three-Layer Rendering Stack

The app uses an unconventional **three-layer canvas/DOM sandwich**:

1. **Background Canvas** (`bgCanvasRef`) - z-index 0
   - Handles mouse/touch events for fish interaction
   - Currently unused for rendering but essential for pointer tracking

2. **DOM/UI Layer** - z-index 1
   - Contains React components (`HankCard`, etc.)
   - Standard HTML/CSS positioned between the canvases

3. **Foreground Canvas** (`fgCanvasRef`) - z-index 2
   - Renders all Three.js scene content (fish, lighting)
   - Uses alpha transparency (`alpha: true`) so DOM is visible underneath
   - Has `pointerEvents: none` to allow clicks through to UI

**Critical**: The foreground scene renders the fish **over** the UI layer to create depth. The foreground canvas must stay `alpha: true` with `pointerEvents: none`.

Layer styling lives in `src/App.css` (`.stage`, `.stage-bg`, `.stage-fg`), not in inline styles.

### The Scene Layer (`src/scene/`)

**The Three.js code is framework-free.** It knows nothing about React, and React touches it only through `src/hooks/useFishScene.ts`. Keep it that way — it is what makes the simulation possible to reason about and test on its own.

`createScene({ bgCanvas, fgCanvas })` owns the renderer, camera and frame loop, and returns a small handle (`setScatter`, `toggleVR`, `dispose`).

| File | Responsibility |
| --- | --- |
| `scene/index.ts` | Composes the modules, owns the renderer + frame loop, orchestrates VR state changes |
| `scene/config.ts` | **Every tunable number in the scene.** Start here when changing how things look or feel |
| `scene/flock.ts` | The simulation: `Fish[]`, leader steering, follower flocking + avoidance |
| `scene/dither.ts` | Bayer dither injected into Three's shaders via `onBeforeCompile`; tracks materials so their `time` uniform advances |
| `scene/colors.ts` | Seeded per-fish color/level variants (stable across reloads) |
| `scene/pointer.ts` | Pointer → NDC → dual-plane raycast → world-space target |
| `scene/xr.ts` | WebXR session lifecycle and controller rays |
| `scene/camera.ts` | Camera creation and orientation-dependent framing |
| `scene/debug.ts` | Plane helpers, target marker, `d` keybind |

**Rules of thumb when extending the scene:**

- **Never put a bare number in a scene module.** Add it to `config.ts`.
- **Never allocate in the frame loop.** `flock.ts` keeps module-level scratch vectors for this reason; reuse them rather than calling `new THREE.Vector3()` per frame.
- **One fish is one `Fish` object.** Do not reintroduce parallel arrays indexed by fish number.
- Fish appearance is derived from `fish.index` via a seeded RNG, so a given fish looks the same on every load. Use `index`, not `Math.random()`, for anything visual.
- `LEADER_LOOK.variantIndex` is deliberately 1 (not 0) — see the comment in `config.ts` before "fixing" it.
- `FLOCK.followerAnimationScale` advances the mixer by a lerp factor rather than a time delta, so follower tail-wag is frame-rate dependent. Documented and intentional; changing it means re-tuning the look.

### React Layer

- `src/App.tsx` - Layout and the three-layer stack only. Should stay small.
- `src/hooks/useFishScene.ts` - The **only** bridge to `src/scene/`. Creates the scene once on mount; never rebuilds it on re-render.
- `src/hooks/usePointerHint.ts` - State machine for the portrait-only interaction hint.
- `src/components/HankCard.tsx` - Portfolio card; reports expand/collapse via `onExpandChange`, which App turns into fish scatter.
- `src/util/isPortrait.ts` - Orientation detection utility.

Components own their own DOM. If you need to animate an element, animate it from the component that renders it — do not reach across components with `document.querySelector`.

Interactive UI that should **not** steer the fish needs a `data-fish-ignore` attribute (see `POINTER.ignoreSelector` in `scene/config.ts`).

### Server

`server.ts` is an Express server that:
- Serves the built client from `/dist`
- Uses Morgan logging with static asset filtering
- Handles SPA routing (all routes → `index.html`)
- Configured for production deployment

## TypeScript Configuration

- `tsconfig.app.json` - Client-side code (strict mode, React JSX)
- `tsconfig.server.json` - Server code (Node.js ESM)
- `tsconfig.node.json` - Vite config files

## Deployment

**Production Environment**: Custom cloud server running the Express.js server (not static hosting).

**CI/CD Pipeline**: Automatic deployment on merge to `main` branch. The server automatically pulls changes and redeploys.

**Build Process**:
```bash
npm run build           # Builds both client and server
npm run start:prod      # Starts production server
```

The Express server (`server.ts`) serves the built `/dist` folder with:
- Production-grade Morgan logging
- Static asset filtering (suppresses logs for .js, .css, images, .glb files)
- SPA routing (all routes serve `index.html`)

## Testing & Quality Assurance

### Mobile Testing (Critical)

**Before committing any UI changes**, test on actual mobile/touch devices:
- Fish should follow touch events smoothly
- UI components should be responsive and touch-friendly
- Animations should maintain 60fps on mobile
- No layout breaks on portrait/landscape orientation changes

### Orientation (read before touching a media query)

There is **one** definition of portrait and everything must use it: the
`(orientation: portrait)` media query. `src/util/isPortrait.ts` delegates to it
via `matchMedia`, so JS and CSS cannot drift. Use `subscribeToOrientation()`
rather than a `resize` listener when you need to react to rotation.

- **Never use `screen.orientation`.** It describes the physical *device*, not the
  viewport. A pivoted vertical monitor reports `portrait-primary` with a wide
  window on it; a tall narrow window on a landscape monitor reports
  `landscape-primary`. That mismatch made the camera framing disagree with the
  CSS layout on the same screen.
- **Never OR orientation with a width** — `(orientation: portrait), (max-width: N)`
  is a bug waiting to happen. The comma is an OR, so the rules also fire on
  *landscape* viewports under N, and OS display scaling puts ordinary landscape
  monitors there: a 1080p panel at 150% scaling reports a 1280px viewport, 1440p
  at 200% likewise. Browser zoom does the same.

Keep the two concerns in separate queries:

| Concern | Query | Why |
| --- | --- | --- |
| Stacking / layout | `(orientation: portrait), (max-width: 1350px)` | A cramped landscape window must stack or it overflows |
| Type scale, touch sizing | `(orientation: portrait)` | A landscape desktop must never get the mobile type scale |

`scripts/` has no CSS test, but you can verify a change by building and resolving
the cascade per viewport — that is how the split above was checked. Confirm that
the **portrait** rows are byte-identical before and after any change; only
narrow-landscape rows should move.

### Simulation Smoke Test

```bash
npm run smoke            # Headless check of the flock simulation
```

`scripts/flock-smoke.ts` runs the flock without a browser (three.js core needs no WebGL as long as nothing renders) and asserts spawning, material routing, leader tracking, scatter, VR scale transitions, frame-rate stability and teardown. **Run it after any change to `src/scene/flock.ts` or `src/scene/dither.ts`** — it catches NaN positions and scratch-vector aliasing bugs that are very hard to spot by eye.

It does not replace looking at the page. Rendering, shaders and pointer input still need a real browser.

### Debug Mode

Press `d` key to toggle debug mode:
- Shows visual helpers for raycaster planes (ground plane = green, vertical plane = red)
- Displays the chosen pointer target marker (red sphere)
- Logs camera position/rotation to console

There is no OrbitControls integration despite what earlier notes claimed.

## Adding New Components

When creating new UI sections:

1. **Create self-contained components** - Keep effects/animations within the component file
2. **Use anime.js for animations** - Existing components use anime.js with stagger reveals (see `HankCard.tsx:18-57`)
3. **Position in the DOM layer** - New components go between the background and foreground canvases (z-index: 1)
4. **Match the aesthetic** - Experimental, bold, creative. Reference Active Theory-style studios for inspiration
5. **Test touch interactions** - Ensure components work smoothly on mobile devices
6. **Consider the fish** - Your component will have animated fish swimming over it (foreground canvas, z-index: 2)

### Example Component Pattern

```tsx
// Self-contained component with anime.js animations
import { useEffect } from "react";
import { animate, stagger } from "animejs";
import "./styles/YourComponent.css";

export default function YourComponent() {
  useEffect(() => {
    // Entrance animations
    animate(".your-element", {
      opacity: { from: 0, to: 1, duration: 400 },
      y: [{ from: "1rem", to: "0rem", delay: stagger(50) }],
    });
  }, []);

  return <div className="your-component">{/* Content */}</div>;
}
```

### Component File Organization

- Component files go in `src/components/`
- Styles go in `src/components/styles/` with matching names (e.g., `YourComponent.css`)
- React hooks go in `src/hooks/`
- Shared utilities go in `src/util/`
- Anything Three.js goes in `src/scene/` and must not import React

## Code Style & Consistency

The codebase currently has some inconsistent patterns. When modifying or adding code:

### General Guidelines

- **Match existing patterns** in the file you're editing
- **Prioritize readability** over clever one-liners
- **Remove dead code** - if you see commented-out code or unused imports, clean them up
- **TypeScript strictness** - The project uses strict TypeScript, but some areas have `any` types. Improve types when you touch the code.

### Known Patterns

- **Event listeners**: Set up in `useEffect` (or a factory's body) with cleanup that removes *the same function reference* — never register an inline arrow you cannot later remove
- **Animations**: Use anime.js with `animate()` and `stagger()` for entrance effects, targeting a `ref` rather than a global selector where practical
- **Three.js patterns**: Materials are modified via `onBeforeCompile` for shader injection (see `scene/dither.ts`)
- **Scene modules**: Factory functions returning a small handle with an explicit `dispose()`. Every listener, geometry and material a module creates, it also tears down
- **CSS**: Prefer CSS files. `src/App.css` holds the layer stack; component styles go in `src/components/styles/`

### anime.js Typing

`npm run lint` is clean — **keep it that way.** Do not add `as any` to `animate()` calls. Anime v4's types accept the per-property `{ from, to }` and keyframe-array syntax used throughout this codebase; the casts that used to be here were unnecessary, and they were actively hiding a real bug (see below).

**Pass eases by reference, never call them.** `easings.eases.outQuart` is correct; `easings.eases.outQuart(1)` *evaluates* the curve at t=1 and yields a number, which anime.js silently falls back to linear on. Generators like `easings.spring({ ... })` are the exception — those are meant to be called.

Four animations in `HankCard.tsx` / `VRButton.tsx` carry `ease: "linear"` with a comment. That is deliberate: it preserves how they have always rendered. They were written as `easings.eases.inBounce(1)`, so they never bounced. Switching them to `easings.eases.inBounce` gives the intended bounce but changes the intro's look.

### Areas That Need Cleanup

- `.sparkle` and `.socialMenu` rules remain in `HankCard.css` with nothing rendering them.
- Bundle is ~870 kB (mostly three.js) with no code splitting.

## Important Notes

- Debug mode can be toggled with the `d` key (visual helpers for the raycaster planes and target)
- Scatter state lives in the scene; `HankCard` expansion drives it via `App` → `useFishScene().setScatter`
- Fish cloning uses `SkeletonUtils.clone()` to properly duplicate animated GLTF models. **It shares materials between clones**, which is why `dither.ts` clones before modifying
- All fish materials are set to `THREE.DoubleSide` to prevent backface culling issues, and `frustumCulled = false` to prevent pop-in
- Current content in `HankCard` and related components is placeholder - needs replacement with real portfolio content
