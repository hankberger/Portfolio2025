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

# Linting
npm run lint             # Run ESLint on the codebase

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

**Critical**: Both canvases share a single `camera` object. The foreground scene renders the fish **over** the UI layer to create depth.

### Key Rendering Patterns

- **Dithering System** (`ditherizeMaterial`, `applyDitherToObject3D` in `src/App.tsx:62-285`)
  - Custom shader injection using `onBeforeCompile`
  - Applies Bayer matrix dithering to Three.js materials
  - Supports color tinting, emissive lighting, and quantization levels
  - All dithered materials are tracked in `ditherMats` Set for time uniform updates

- **Fish Animation** (`src/App.tsx:298-434`)
  - Leader fish (index 0) follows mouse via raycaster + dual-plane intersection
  - Follower fish use offset-based flocking with avoidance behavior
  - Each fish has a GLTF animation mixer with randomized playback speed
  - Vivid procedural colors via seeded HSL generation (`vividColorVariant`)

- **Mouse Targeting** (`src/App.tsx:436-505`)
  - Uses raycaster to intersect with two planes: ground (horizontal) and vertical
  - Chooses the closest intersection point to camera as target
  - Supports both mouse (`mousemove`) and touch (`touchmove`) events

### Shader Files

- `src/shaders/DitherShader.ts` - Standalone Bayer dither post-processing shader (not currently used in App.tsx)
- `src/shaders/MouseShader.tsx` - Orange glow effect with simplex noise turbulence (currently unused component)

The active dithering implementation is **inline in App.tsx** via `onBeforeCompile`, not using these shader files.

### Component Structure

- `src/App.tsx` - Main Three.js setup and animation loop
- `src/components/HankCard.tsx` - Portfolio card with expand/collapse animation
  - Uses `anime.js` for stagger text reveals
  - Triggers fish scatter behavior on expand via `scatterCallback`
- `src/components/ButtonContent.tsx` - Content inside the expandable card button
- `src/util/isPortrait.ts` - Orientation detection utility

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

The `isPortrait()` utility detects orientation - use it for responsive adjustments.

### Debug Mode

Press `d` key to toggle debug mode:
- Enables OrbitControls for camera manipulation
- Shows visual helpers for raycaster planes (ground plane = green, vertical plane = red)
- Displays chosen mouse target marker (red sphere)
- Logs camera position/rotation to console

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
- Utilities go in `src/util/`
- Shaders go in `src/shaders/`

## Code Style & Consistency

The codebase currently has some inconsistent patterns. When modifying or adding code:

### General Guidelines

- **Match existing patterns** in the file you're editing
- **Prioritize readability** over clever one-liners
- **Remove dead code** - if you see commented-out code or unused imports, clean them up
- **TypeScript strictness** - The project uses strict TypeScript, but some areas have `any` types. Improve types when you touch the code.

### Known Patterns

- **Event listeners**: Set up in `useEffect` with proper cleanup in the return function (see `HankCard.tsx:59-83`)
- **Animations**: Use anime.js with `animate()` and `stagger()` for entrance effects
- **Three.js patterns**: Materials are modified via `onBeforeCompile` for shader injection (see dithering system)
- **CSS**: Mix of inline styles and CSS files. For new components, prefer CSS files in `src/components/styles/`

### Areas That Need Cleanup

- **App.tsx** is quite long (800+ lines) but functional. When adding Three.js features, keep the existing structure.
- Some debug code and console.logs can be removed in production
- Unused shader files (`DitherShader.ts`, `MouseShader.tsx`) exist but aren't currently used

## Important Notes

- Debug mode can be toggled with the `d` key (enables OrbitControls and visual helpers)
- The `scatter` variable controls whether fish flee or follow (toggled by HankCard expansion)
- Fish cloning uses `SkeletonUtils.clone()` to properly duplicate animated GLTF models
- All fish materials are set to `THREE.DoubleSide` to prevent backface culling issues
- Current content in `HankCard` and related components is placeholder - needs replacement with real portfolio content
