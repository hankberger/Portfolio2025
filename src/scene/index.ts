import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createCamera, frameCamera } from "./camera";
import { createDitherRegistry } from "./dither";
import { createFlock, type Flock } from "./flock";
import { createPointerTarget } from "./pointer";
import { createXRSupport } from "./xr";
import { createDebugHelpers } from "./debug";
import { FISH, FLOCK, LIGHTS, RENDERER, VR } from "./config";

// The fish scene. Owns the renderer, the camera, and the frame loop, and wires
// the pointer / XR / flock modules together. Framework-free on purpose — React
// touches this only through src/hooks/useFishScene.ts.
//
// This is the foreground half of the site's three-layer stack:
//
//   bg canvas (z 0) — pointer surface, nothing is drawn to it
//   DOM/UI    (z 1) — React components
//   fg canvas (z 2) — this scene, alpha-transparent so the UI shows through
//
// Rendering the fish *over* the UI is what gives the page its sense of depth,
// so the foreground canvas must stay transparent and non-interactive.

export interface SceneOptions {
  /** Background canvas — used only as the pointer coordinate surface. */
  bgCanvas: HTMLCanvasElement;
  /** Foreground canvas — the actual render target. */
  fgCanvas: HTMLCanvasElement;
  /** Fired on pointer movement, for UI that reacts to activity. */
  onPointerInput?: () => void;
  onVRActiveChange?: (active: boolean) => void;
}

export interface SceneHandle {
  /** True sends the swarm fleeing offscreen so the UI has room. */
  setScatter(scatter: boolean): void;
  /** Enters immersive VR, or exits the running session. */
  toggleVR(): void;
  dispose(): void;
}

export function createScene(options: SceneOptions): SceneHandle {
  const { bgCanvas, fgCanvas, onPointerInput, onVRActiveChange } = options;

  let disposed = false;

  const camera = createCamera();

  const renderer = new THREE.WebGLRenderer({
    canvas: fgCanvas,
    antialias: true,
    // Must stay transparent so the DOM layer underneath remains visible.
    alpha: true,
    premultipliedAlpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0.0);
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();

  const hemiLight = new THREE.HemisphereLight(
    LIGHTS.hemisphere.sky,
    LIGHTS.hemisphere.ground,
    LIGHTS.hemisphere.intensity
  );
  hemiLight.position.copy(LIGHTS.hemisphere.position);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(
    LIGHTS.directional.color,
    LIGHTS.directional.intensity
  );
  dirLight.position.copy(LIGHTS.directional.position);
  scene.add(dirLight);

  // ---------------------------- Scene state ----------------------------
  // Values the flock reads each frame. VR overrides several of them, which is
  // why they are mutable rather than constants.
  let scatter = false;
  let hasLeaderTarget = false;
  let scaleMultiplier = 1;
  let swarmRadiusMin = FLOCK.offsetRadiusMin;
  let swarmRadiusMax = FLOCK.offsetRadiusMax;
  const flockCenter = new THREE.Vector3();

  let flock: Flock | null = null;

  // ---------------------------- Modules ----------------------------
  const dither = createDitherRegistry();

  const pointer = createPointerTarget({
    canvas: bgCanvas,
    camera,
    onInput: () => {
      hasLeaderTarget = true;
      onPointerInput?.();
    },
  });

  const debug = createDebugHelpers({
    scene,
    camera,
    groundPlane: pointer.groundPlane,
    verticalPlane: pointer.verticalPlane,
  });

  const xr = createXRSupport({
    renderer,
    scene,
    onSessionStart: () => {
      if (disposed) return;

      // The DOM layer doesn't exist inside a headset, so the transparent canvas
      // becomes an opaque site-blue void with fog standing in for depth.
      scene.background = new THREE.Color(VR.backgroundColor);
      scene.fog = new THREE.Fog(VR.backgroundColor, VR.fogNear, VR.fogFar);

      flockCenter.copy(VR.flockCenter);
      swarmRadiusMin = VR.offsetRadiusMin;
      swarmRadiusMax = VR.offsetRadiusMax;
      scaleMultiplier = VR.fishScale;
      flock?.setSwarmRadius(swarmRadiusMin, swarmRadiusMax);
      flock?.setScaleMultiplier(scaleMultiplier);

      // There is no card UI in VR, so never leave the fish stuck in scatter.
      scatter = false;
      // Wait for controller aim before steering the leader.
      hasLeaderTarget = false;

      onVRActiveChange?.(true);
    },
    onSessionEnd: () => {
      if (disposed) return;

      scene.background = null;
      scene.fog = null;

      flockCenter.set(0, 0, 0);
      swarmRadiusMin = FLOCK.offsetRadiusMin;
      swarmRadiusMax = FLOCK.offsetRadiusMax;
      scaleMultiplier = 1;
      flock?.setSwarmRadius(swarmRadiusMin, swarmRadiusMax);
      flock?.setScaleMultiplier(scaleMultiplier);

      hasLeaderTarget = false;
      handleResize(); // restore the desktop camera framing and aspect

      onVRActiveChange?.(false);
    },
  });

  // ---------------------------- Load the swarm ----------------------------
  new GLTFLoader().load(
    FISH.modelUrl,
    (gltf) => {
      // The effect may have torn down while the model was in flight.
      if (disposed) return;

      flock = createFlock({
        scene,
        template: gltf.scene,
        clip: gltf.animations?.[0],
        dither,
        swarmRadiusMin,
        swarmRadiusMax,
        scaleMultiplier,
      });
    },
    undefined,
    (error) => console.error("GLB load error", FISH.modelUrl, error)
  );

  // ---------------------------- Frame loop ----------------------------
  const clock = new THREE.Clock();

  const renderFrame = () => {
    const dt = Math.min(clock.getDelta(), RENDERER.maxFrameDelta);

    dither.tick(dt);

    // In VR the leader follows the controller's pointing ray, not the mouse.
    if (xr.isPresenting() && xr.readAimTarget(pointer.target)) {
      hasLeaderTarget = true;
    }

    flock?.update(dt, {
      leaderTarget: pointer.target,
      hasLeaderTarget,
      center: flockCenter,
      scatter,
    });

    debug.update(pointer.target);

    renderer.render(scene, camera);
  };

  // setAnimationLoop rather than requestAnimationFrame: inside a WebXR session
  // the headset drives frame timing, and rAF would stop being called.
  renderer.setAnimationLoop(renderFrame);

  // ---------------------------- Resize ----------------------------
  function handleResize() {
    // WebXR owns the render size for the duration of a session.
    if (renderer.xr.isPresenting) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    frameCamera(camera);
  }

  window.addEventListener("resize", handleResize);

  // ---------------------------- Handle ----------------------------
  return {
    setScatter(value) {
      scatter = value;
    },

    toggleVR() {
      xr.toggle();
    },

    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", handleResize);
      pointer.dispose();
      debug.dispose();
      xr.dispose();
      flock?.dispose();
      dither.dispose();
      renderer.dispose();
    },
  };
}
