import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneHandle } from "../scene";

// The only bridge between React and the Three.js scene. The scene is created
// once on mount and driven imperatively after that — it must never be rebuilt
// by a re-render, so nothing here belongs in a dependency array.

export interface UseFishSceneOptions {
  /** Called on pointer movement over the scene. */
  onPointerInput?: () => void;
}

export interface FishScene {
  bgCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  fgCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** True once the browser reports immersive-vr support. */
  vrSupported: boolean;
  vrActive: boolean;
  /** True sends the swarm fleeing offscreen so the UI has room. */
  setScatter: (scatter: boolean) => void;
  toggleVR: () => void;
}

export function useFishScene(options: UseFishSceneOptions = {}): FishScene {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const scatterRef = useRef(false);

  const [vrSupported, setVrSupported] = useState(false);
  const [vrActive, setVrActive] = useState(false);

  // Held in a ref so a caller passing an inline callback doesn't tear down and
  // rebuild the whole scene on every render.
  const onPointerInputRef = useRef(options.onPointerInput);
  onPointerInputRef.current = options.onPointerInput;

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !fgCanvas) return;

    let cancelled = false;
    // Let essential content paint before loading the optional graphics bundle.
    const timer = window.setTimeout(async () => {
      try {
        const { createScene } = await import("../scene");
        if (cancelled) return;
        const scene = createScene({
          bgCanvas,
          fgCanvas,
          onPointerInput: () => onPointerInputRef.current?.(),
          onVRActiveChange: setVrActive,
        });
        sceneRef.current = scene;
        scene.setScatter(scatterRef.current);
        const supported = await navigator.xr?.isSessionSupported("immersive-vr");
        if (!cancelled) setVrSupported(supported ?? false);
      } catch (error) {
        // A missing graphics chunk or unavailable WebGL must not unmount React.
        console.warn("Fish graphics unavailable; portfolio remains usable.", error);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const setScatter = useCallback((scatter: boolean) => {
    scatterRef.current = scatter;
    sceneRef.current?.setScatter(scatter);
  }, []);

  const toggleVR = useCallback(() => {
    sceneRef.current?.toggleVR();
  }, []);

  return {
    bgCanvasRef,
    fgCanvasRef,
    vrSupported,
    vrActive,
    setScatter,
    toggleVR,
  };
}
