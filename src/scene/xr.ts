import * as THREE from "three";
import { VR } from "./config";

// WebXR plumbing. This module owns the controllers and the session lifecycle;
// what the scene *does* on entering/leaving VR (background, fog, swarm radius)
// is decided by the caller through the session callbacks, since those are scene
// concerns rather than XR ones.

export interface XRSupportOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
}

export interface XRSupport {
  isPresenting(): boolean;
  /** Starts a session, or ends the current one. */
  toggle(): void;
  /**
   * Writes the point the active controller is aiming at into `out`.
   * Returns false when no controller is connected.
   */
  readAimTarget(out: THREE.Vector3): boolean;
  dispose(): void;
}

/** Reports whether this browser can present immersive VR at all. */
export async function isVRSupported(): Promise<boolean> {
  try {
    return (await navigator.xr?.isSessionSupported("immersive-vr")) ?? false;
  } catch {
    return false;
  }
}

export function createXRSupport(options: XRSupportOptions): XRSupport {
  const { renderer, scene, onSessionStart, onSessionEnd } = options;

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const orientation = new THREE.Quaternion();

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const rayMaterial = new THREE.LineBasicMaterial({
    color: VR.controllerRayColor,
    transparent: true,
    opacity: VR.controllerRayOpacity,
  });

  // Added up front — they simply receive no poses until a session is running.
  const controllers = [0, 1].map((index) => {
    const controller = renderer.xr.getController(index);
    const ray = new THREE.Line(rayGeometry, rayMaterial);
    ray.scale.z = VR.rayTargetDistance;
    controller.add(ray);

    controller.addEventListener("connected", () => {
      controller.userData.connected = true;
    });
    controller.addEventListener("disconnected", () => {
      controller.userData.connected = false;
    });

    scene.add(controller);
    return controller;
  });

  const handleSessionStart = () => onSessionStart?.();
  const handleSessionEnd = () => onSessionEnd?.();

  renderer.xr.addEventListener("sessionstart", handleSessionStart);
  renderer.xr.addEventListener("sessionend", handleSessionEnd);

  return {
    isPresenting() {
      return renderer.xr.isPresenting;
    },

    toggle() {
      const session = renderer.xr.getSession();
      if (session) {
        session.end();
        return;
      }

      navigator.xr
        ?.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] })
        .then((newSession) => renderer.xr.setSession(newSession))
        .catch((error) => console.error("Failed to start VR session", error));
    },

    readAimTarget(out) {
      const controller = controllers.find((c) => c.userData.connected);
      if (!controller) return false;

      controller.getWorldPosition(origin);
      direction.set(0, 0, -1).applyQuaternion(controller.getWorldQuaternion(orientation));
      out.copy(origin).addScaledVector(direction, VR.rayTargetDistance);
      return true;
    },

    dispose() {
      renderer.xr.removeEventListener("sessionstart", handleSessionStart);
      renderer.xr.removeEventListener("sessionend", handleSessionEnd);
      renderer.xr.getSession()?.end();

      for (const controller of controllers) {
        controller.clear();
        scene.remove(controller);
      }
      rayGeometry.dispose();
      rayMaterial.dispose();
    },
  };
}
