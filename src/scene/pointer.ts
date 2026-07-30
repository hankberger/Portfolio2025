import * as THREE from "three";
import { POINTER } from "./config";

// Turns pointer movement into a world-space point for the leader fish to chase.
//
// A single plane would make the fish track a flat sheet, which reads badly at
// the edges of the screen. Instead the ray is intersected against two planes —
// one horizontal, one tilted — and the nearer hit wins, so the target sweeps
// across a bent surface that stays in front of the camera.

export interface PointerTargetOptions {
  /** The background canvas. Used only to map client coords into NDC. */
  canvas: HTMLCanvasElement;
  camera: THREE.Camera;
  /** Fired on every accepted move, after `target` has been updated. */
  onInput?: () => void;
}

export interface PointerTarget {
  /** Live world-space target. Mutated in place; do not reassign. */
  readonly target: THREE.Vector3;
  readonly groundPlane: THREE.Plane;
  readonly verticalPlane: THREE.Plane;
  dispose(): void;
}

export function createPointerTarget(
  options: PointerTargetOptions
): PointerTarget {
  const { canvas, camera, onInput } = options;

  const target = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const groundHit = new THREE.Vector3();
  const verticalHit = new THREE.Vector3();

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
  groundPlane.constant = POINTER.groundPlaneConstant;

  const verticalPlane = new THREE.Plane();
  {
    const normal = new THREE.Vector3(0, 1, 0);
    normal.applyAxisAngle(new THREE.Vector3(1, 0, 0), POINTER.verticalPlaneTilt);
    verticalPlane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3());
  }

  function readNdc(event: MouseEvent | TouchEvent | PointerEvent): boolean {
    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return false;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return true;
  }

  function updateTarget() {
    raycaster.setFromCamera(ndc, camera);

    const hitGround = raycaster.ray.intersectPlane(groundPlane, groundHit);
    const hitVertical = raycaster.ray.intersectPlane(
      verticalPlane,
      verticalHit
    );

    if (hitGround && hitVertical) {
      // Whichever surface is nearer the camera is the one the user means.
      const groundDist = raycaster.ray.origin.distanceToSquared(groundHit);
      const verticalDist = raycaster.ray.origin.distanceToSquared(verticalHit);
      target.copy(groundDist < verticalDist ? groundHit : verticalHit);
    } else if (hitGround) {
      target.copy(groundHit);
    } else if (hitVertical) {
      target.copy(verticalHit);
    }
  }

  function onPointerMove(event: MouseEvent | TouchEvent | PointerEvent) {
    // Moving over interactive UI shouldn't drag the fish out from under it.
    const element = event.target as HTMLElement | null;
    if (element?.closest?.(POINTER.ignoreSelector)) return;

    if (!readNdc(event)) return;
    updateTarget();
    onInput?.();
  }

  // Listening on window rather than the canvas — Safari does not reliably
  // deliver these to a canvas sitting under other stacking contexts.
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("mousemove", onPointerMove, { passive: false });
  window.addEventListener("touchmove", onPointerMove, { passive: true });

  return {
    target,
    groundPlane,
    verticalPlane,
    dispose() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
    },
  };
}
