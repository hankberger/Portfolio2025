import * as THREE from "three";
import { isPortrait } from "../util/isPortrait";
import { CAMERA } from "./config";

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    window.innerWidth / window.innerHeight,
    CAMERA.near,
    CAMERA.far
  );
  frameCamera(camera);
  return camera;
}

/**
 * Positions the camera for the current orientation. Called on init and on every
 * resize, since rotating a phone changes which framing reads better.
 *
 * Not applied during a WebXR session — the headset owns the camera pose there.
 */
export function frameCamera(camera: THREE.PerspectiveCamera) {
  const position = isPortrait()
    ? CAMERA.portraitPosition
    : CAMERA.landscapePosition;
  camera.position.copy(position);
  camera.rotation.set(CAMERA.pitch, 0, 0);
}
