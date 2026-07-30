import { useCallback, useEffect, useRef, useState } from "react";
import { createScene, type SceneHandle } from "../scene";
import { isVRSupported } from "../scene/xr";

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

    const scene = createScene({
      bgCanvas,
      fgCanvas,
      onPointerInput: () => onPointerInputRef.current?.(),
      onVRActiveChange: setVrActive,
    });
    sceneRef.current = scene;

    return () => {
      sceneRef.current = null;
      scene.dispose();
    };
  }, []);

  // Gate the VR button on actual support, so desktop and mobile never see it.
  useEffect(() => {
    let cancelled = false;
    isVRSupported().then((supported) => {
      if (!cancelled) setVrSupported(supported);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setScatter = useCallback((scatter: boolean) => {
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
