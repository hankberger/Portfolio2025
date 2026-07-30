import * as THREE from "three";
import { DEBUG } from "./config";

// Press `d` to visualize what the pointer raycaster is actually hitting:
// the two targeting planes plus a marker on the chosen point.

export interface DebugHelpersOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  groundPlane: THREE.Plane;
  verticalPlane: THREE.Plane;
}

export interface DebugHelpers {
  /** Moves the target marker. Cheap no-op while debug is off. */
  update(target: THREE.Vector3): void;
  dispose(): void;
}

export function createDebugHelpers(
  options: DebugHelpersOptions
): DebugHelpers {
  const { scene, camera, groundPlane, verticalPlane } = options;

  const groundHelper = new THREE.PlaneHelper(
    groundPlane,
    DEBUG.planeHelperSize,
    DEBUG.groundPlaneColor
  );
  const verticalHelper = new THREE.PlaneHelper(
    verticalPlane,
    DEBUG.planeHelperSize,
    DEBUG.verticalPlaneColor
  );
  const markerGeometry = new THREE.SphereGeometry(DEBUG.markerRadius);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: DEBUG.markerColor,
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);

  let enabled = false;

  function toggle() {
    enabled = !enabled;

    if (enabled) {
      scene.add(groundHelper, verticalHelper, marker);
    } else {
      scene.remove(groundHelper, verticalHelper, marker);
    }

    console.log("[debug]", enabled ? "on" : "off", {
      position: camera.position,
      rotation: camera.rotation,
    });
  }

  // Named handler so cleanup can actually remove it — the previous version
  // registered an inline arrow and leaked a listener on every remount.
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === DEBUG.toggleKey) toggle();
  }

  window.addEventListener("keydown", onKeyDown);

  return {
    update(target) {
      if (enabled) marker.position.copy(target);
    },

    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      scene.remove(groundHelper, verticalHelper, marker);
      groundHelper.dispose();
      verticalHelper.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
    },
  };
}
