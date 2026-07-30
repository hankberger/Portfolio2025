// Temporary headless smoke test for the refactored flock simulation.
// Run with: npm run smoke
import * as THREE from "three";
import { createDitherRegistry } from "../src/scene/dither";
import { createFlock } from "../src/scene/flock";
import { FISH, LEADER_LOOK, SCATTER } from "../src/scene/config";

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}`, detail ?? "");
  }
}

/** Stand-in for fish3.glb: one skinned-ish mesh under a root. */
function makeTemplate() {
  const root = new THREE.Object3D();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 2),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  root.add(mesh);
  return root;
}

const scene = new THREE.Scene();
const dither = createDitherRegistry();
const flock = createFlock({
  scene,
  template: makeTemplate(),
  clip: undefined,
  dither,
  swarmRadiusMin: 2,
  swarmRadiusMax: 8,
  scaleMultiplier: 1,
});

console.log("\n-- construction --");
check(`spawns ${FISH.count} fish`, flock.fish.length === FISH.count, flock.fish.length);
check("leader is fish 0", flock.leader === flock.fish[0]);
check("all fish added to scene", scene.children.length === FISH.count, scene.children.length);
check(
  "one tracked material per fish (no orphans)",
  dither.size === FISH.count,
  dither.size
);
check(
  "all spawn positions finite",
  flock.fish.every((f) => Number.isFinite(f.object.position.lengthSq()))
);
check(
  "followers scaled into range",
  flock.fish
    .slice(1)
    .every(
      (f) =>
        f.baseScale >= FISH.followerScaleMin && f.baseScale <= FISH.followerScaleMax
    )
);
check("leader unscaled", flock.leader!.baseScale === 1, flock.leader!.baseScale);

console.log("\n-- material routing --");
const leaderMat = (flock.leader!.object.children[0] as THREE.Mesh)
  .material as THREE.MeshStandardMaterial;
const followerMat = (flock.fish[5].object.children[0] as THREE.Mesh)
  .material as THREE.MeshStandardMaterial;
check(
  "leader is emissive",
  leaderMat.emissiveIntensity === LEADER_LOOK.emissiveIntensity,
  leaderMat.emissiveIntensity
);
check("followers are not emissive", followerMat.emissiveIntensity === 0);
check("materials are per-fish clones", leaderMat !== followerMat);
check("side is DoubleSide", followerMat.side === THREE.DoubleSide);

console.log("\n-- leader tracking --");
const target = new THREE.Vector3(0, 0, 0);
const input = {
  leaderTarget: target,
  hasLeaderTarget: true,
  center: new THREE.Vector3(0, 0, 0),
  scatter: false,
};
const startDist = flock.leader!.object.position.distanceTo(target);
for (let i = 0; i < 600; i++) flock.update(1 / 60, input);
const endDist = flock.leader!.object.position.distanceTo(target);
check(
  "leader closes on its target",
  endDist < startDist - 1,
  `${startDist.toFixed(2)} -> ${endDist.toFixed(2)}`
);
check(
  "leader settles near target",
  endDist < 3,
  endDist.toFixed(2)
);

console.log("\n-- follower stability --");
check(
  "no NaN positions after 600 frames",
  flock.fish.every((f) => Number.isFinite(f.object.position.lengthSq())),
  flock.fish.filter((f) => !Number.isFinite(f.object.position.lengthSq())).length
);
check(
  "no NaN quaternions",
  flock.fish.every((f) => Number.isFinite(f.object.quaternion.lengthSq()))
);
check(
  "followers converge near the swarm",
  flock.fish
    .slice(1)
    .every((f) => f.object.position.distanceTo(input.center) < 40),
  Math.max(
    ...flock.fish.slice(1).map((f) => f.object.position.distanceTo(input.center))
  ).toFixed(1)
);
check(
  "follower speeds stay bounded",
  flock.fish.slice(1).every((f) => f.speed >= 0 && f.speed <= 12),
  Math.max(...flock.fish.slice(1).map((f) => f.speed)).toFixed(2)
);
check(
  "followers actually moved from spawn",
  flock.fish.slice(1).some((f) => f.object.position.z !== FISH.followerSpawnZ)
);

console.log("\n-- scatter --");
const scatterInput = { ...input, scatter: true };
const beforeScatter = flock.leader!.object.position.distanceTo(
  SCATTER.leaderTarget
);
for (let i = 0; i < 600; i++) flock.update(1 / 60, scatterInput);
const afterScatter = flock.leader!.object.position.distanceTo(
  SCATTER.leaderTarget
);
check(
  "leader flees to the scatter point",
  afterScatter < beforeScatter,
  `${beforeScatter.toFixed(2)} -> ${afterScatter.toFixed(2)}`
);
check(
  "still no NaN after scatter",
  flock.fish.every((f) => Number.isFinite(f.object.position.lengthSq()))
);

console.log("\n-- VR transitions --");
flock.setSwarmRadius(3.5, 10);
flock.setScaleMultiplier(0.6);
check(
  "scale multiplier applied to all fish",
  flock.fish.every(
    (f) => Math.abs(f.object.scale.x - f.baseScale * 0.6) < 1e-9
  )
);
for (let i = 0; i < 300; i++) flock.update(1 / 60, input);
check(
  "stable after VR-style radius change",
  flock.fish.every((f) => Number.isFinite(f.object.position.lengthSq()))
);
flock.setScaleMultiplier(1);
check(
  "scale restored on exit",
  flock.fish.every((f) => Math.abs(f.object.scale.x - f.baseScale) < 1e-9)
);

console.log("\n-- variable frame rate --");
for (const dt of [1 / 144, 1 / 60, 1 / 30, 0.033]) {
  for (let i = 0; i < 100; i++) flock.update(dt, input);
}
check(
  "stable across mixed frame deltas",
  flock.fish.every((f) => Number.isFinite(f.object.position.lengthSq()))
);

console.log("\n-- teardown --");
dither.tick(0.016); // no-op headless, but must not throw
flock.dispose();
check("fish removed from scene", scene.children.length === 0, scene.children.length);
dither.dispose();
check("registry emptied", dither.size === 0, dither.size);

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`
);
process.exit(failures === 0 ? 0 : 1);
