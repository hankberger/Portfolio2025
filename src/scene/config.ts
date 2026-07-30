// Every tunable value for the fish scene lives here.
//
// The point of this file is that tweaking how the scene looks and feels should
// never require reading the simulation code. If you find yourself adding a bare
// number to a module under src/scene/, add it here instead.
//
// Vector3 values are treated as read-only templates — always `.copy()` them
// into your own vector rather than assigning the reference.
import * as THREE from "three";

export const CAMERA = {
  fov: 60,
  near: 0.01,
  far: 1000,
  // Framing differs by orientation: portrait pulls back and looks down so the
  // swarm still reads on a narrow screen.
  portraitPosition: new THREE.Vector3(0, 6, 17),
  landscapePosition: new THREE.Vector3(-4, 2, 13),
  pitch: -Math.PI / 16,
};

export const RENDERER = {
  // Retina is plenty; beyond 2x the dither pattern gets too fine to read.
  maxPixelRatio: 2,
  // Clamps the simulation step so returning to a backgrounded tab doesn't
  // teleport the swarm across the scene.
  maxFrameDelta: 0.033,
};

export const LIGHTS = {
  hemisphere: {
    sky: 0xbcd7ff,
    ground: 0x223355,
    intensity: 1.0,
    position: new THREE.Vector3(0, 2, 0),
  },
  directional: {
    color: 0xffffff,
    intensity: 1,
    position: new THREE.Vector3(2, 5, 6),
  },
};

export const FISH = {
  modelUrl: "./fish3.glb",
  count: 20,
  // The leader spawns behind the camera so it swims into frame on load.
  leaderSpawn: new THREE.Vector3(4, 2, 22),
  // Followers spawn scattered offscreen, then converge on the swarm.
  followerSpawnSpreadMin: 10,
  followerSpawnSpreadMax: 20,
  followerSpawnZ: 12,
  followerScaleMin: 0.4,
  followerScaleMax: 0.9,
};

export const FLOCK = {
  // Each follower holds a slot at a random offset from the swarm center and
  // periodically picks a new one.
  offsetRadiusMin: 2.0,
  offsetRadiusMax: 8.0,
  offsetTimeMin: 1.5,
  offsetTimeMax: 3.5,
  offsetSmooth: 1.8,
  speedSmooth: 3.0,

  minFollowSpeed: 0.6,
  maxFollowSpeed: 1.2,
  wanderStrength: 0.55,
  wanderSpeedMin: 0.6,
  wanderSpeedMax: 1.2,

  leaderTurn: 0.03,
  leaderSpeed: 6.5,
  leaderArriveRadius: 5.0,
  followerTurn: 0.01,

  // Followers flee the leader when it gets close — this is what makes chasing
  // them with the cursor feel alive.
  avoidRadius: 10,
  avoidStrength: 30,
  avoidFalloffExponent: 2.2,
  avoidSpeedEaseExponent: 4,
  avoidTurnMult: 5.5,
  avoidSpeedLerpMult: 10.0,
  maxAvoidSpeed: 10.0,

  // A follower left far behind sprints to catch up rather than crawling in.
  catchUpDistance: 15,
  catchUpSpeed: 10,

  // Tail-wag playback rates.
  //
  // NOTE: followers advance their animation mixer by a *lerp factor*, not a
  // time delta, which makes wag speed frame-rate dependent. That is wrong in
  // principle but it is what the current look is tuned around, so it is
  // preserved deliberately. Fixing it means re-tuning this number.
  followerAnimationScale: 0.33,
  leaderAnimationMinStep: 0.005,
};

export const SCATTER = {
  // Where the swarm bolts to when the card expands, clearing the UI.
  leaderTarget: new THREE.Vector3(0, -12, 8),
  followerCenter: new THREE.Vector3(8, -10, 15),
  // Wide enough that every follower is inside it, so the whole swarm gets
  // pushed away from the leader at once instead of trickling out.
  avoidRadius: 100,
};

export const DITHER = {
  defaultLevels: 4.0,
  defaultTint: 0xffffff,
  defaultTintStrength: 1.0,
  // How fast the Bayer pattern crawls across the screen.
  scrollSpeed: 30.0,
};

// Seeded per-fish color variation. Narrow lightness spread with heavy
// saturation bias keeps every fish vivid rather than muddy.
export const FISH_COLOR = {
  hueCenter: null,
  hueSpread: 0.7,
  satMin: 0.8,
  satMax: 1.0,
  satBias: 8,
  lightMid: 0.5,
  lightSpread: 0.05,
  lightBias: 1.3,
};

export const LEADER_LOOK = {
  // The leader is fish index 0 but draws its dither variant from index 1.
  // That is not a typo — it is the value the current look was tuned against
  // (previously an accident of applying the dither pass twice) and changing it
  // shifts how the leader reads against the swarm.
  variantIndex: 1,
  tint: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 0.3,
};

export const POINTER = {
  // Pointer rays are intersected against two planes; the nearer hit wins, so
  // the swarm target tracks a curved surface rather than a flat one.
  groundPlaneConstant: 2,
  verticalPlaneTilt: Math.PI / 4,
  // UI that should not steer the fish. New interactive elements can opt out by
  // adding a `data-fish-ignore` attribute instead of editing this list.
  ignoreSelector: ".getStarted, .vr-button, [data-fish-ignore]",
};

export const VR = {
  // The DOM layer does not exist inside a headset, so the transparent canvas
  // becomes an opaque site-blue void with fog standing in for depth.
  backgroundColor: 0x0147ff,
  fogNear: 8,
  fogFar: 30,
  flockCenter: new THREE.Vector3(0, 1.4, 0),
  // The leader targets this far along the controller's pointing ray.
  rayTargetDistance: 5,
  // Fish read as oversized at true room scale, so shrink them in VR.
  fishScale: 0.6,
  // Push the swarm further out for comfort at head height.
  offsetRadiusMin: 3.5,
  offsetRadiusMax: 10.0,
  controllerRayColor: 0xffffff,
  controllerRayOpacity: 0.35,
};

export const DEBUG = {
  toggleKey: "d",
  markerRadius: 0.2,
  markerColor: 0xff0000,
  groundPlaneColor: 0x00ff00,
  verticalPlaneColor: 0xff0000,
  planeHelperSize: 100,
};
