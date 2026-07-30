import * as THREE from "three";
import { FISH_COLOR } from "./config";

/**
 * Tiny seeded RNG. Fish appearance is derived from index rather than
 * Math.random() so a given fish looks the same on every page load.
 */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface VividColorOptions {
  /** Null spreads hues across the full wheel; a number clusters around it. */
  hueCenter?: number | null;
  hueSpread?: number;
  satMin?: number;
  satMax?: number;
  /** Higher values push saturation toward satMax. */
  satBias?: number;
  lightMid?: number;
  lightSpread?: number;
  /** Higher values pull lightness back toward lightMid. */
  lightBias?: number;
}

/**
 * Deterministic vivid color for fish `index`. Biased toward high saturation and
 * a narrow lightness band so no fish comes out washed out or near-black.
 */
export function vividColorVariant(
  index: number,
  options: VividColorOptions = {}
): THREE.Color {
  const {
    hueCenter = FISH_COLOR.hueCenter,
    hueSpread = FISH_COLOR.hueSpread,
    satMin = FISH_COLOR.satMin,
    satMax = FISH_COLOR.satMax,
    satBias = FISH_COLOR.satBias,
    lightMid = FISH_COLOR.lightMid,
    lightSpread = FISH_COLOR.lightSpread,
    lightBias = FISH_COLOR.lightBias,
  } = options;

  const rnd = mulberry32(0x9e3779b1 ^ (index * 0x85ebca6b));
  const r1 = rnd();
  const r2 = rnd();
  const r3 = rnd();

  const hue =
    hueCenter == null
      ? r1
      : (hueCenter + (r1 * 2 - 1) * hueSpread + 1) % 1;

  const satT = 1.0 - Math.pow(1.0 - r2, satBias);
  const saturation = THREE.MathUtils.lerp(satMin, satMax, satT);

  const rawLightness = THREE.MathUtils.clamp(
    lightMid + (r3 * 2 - 1) * lightSpread,
    0,
    1
  );
  const lightness = THREE.MathUtils.lerp(lightMid, rawLightness, 1.0 / lightBias);

  return new THREE.Color().setHSL(hue, saturation, lightness);
}

/** Quantization steps for fish `index`, cycling 3..5 so the swarm isn't uniform. */
export function levelsVariant(index: number): number {
  return THREE.MathUtils.clamp(
    3 + Math.round((Math.sin(index * 3.1) + 1) * 0.5 * 2),
    3,
    5
  );
}

/** How strongly fish `index` takes its tint, cycling 0.35..0.75. */
export function tintStrengthVariant(index: number): number {
  return THREE.MathUtils.lerp(0.35, 0.75, (Math.cos(index * 5.7) + 1) * 0.5);
}
