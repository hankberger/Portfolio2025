import type { PerspectiveCamera } from "three";
import { isPortrait } from "./isPortrait";

export function updateCamera(camera: PerspectiveCamera) {
  isPortrait() ? camera.position.set(0, 6, 17) : camera.position.set(-4, 2, 13);
  camera.rotation.set(-Math.PI / 16, 0, 0);
}
