import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { DitherRegistry } from "./dither";
import { levelsVariant, tintStrengthVariant, vividColorVariant } from "./colors";
import { FISH, FLOCK, LEADER_LOOK, SCATTER } from "./config";

// The swarm. Fish 0 is the leader — it chases the pointer (or, in VR, the
// controller ray). Every other fish holds a slowly-drifting slot around the
// swarm center and flees the leader when it gets close, which is what makes
// chasing them feel like scattering real fish.

export interface Fish {
  /** Stable identity. Drives both appearance and this fish's wander signature. */
  readonly index: number;
  readonly object: THREE.Object3D;
  readonly mixer: THREE.AnimationMixer | null;
  /** Scale before any presentation multiplier (VR shrinks the whole swarm). */
  readonly baseScale: number;
  speed: number;
  /** Current and desired offset from the swarm center. */
  offset: THREE.Vector3;
  offsetTarget: THREE.Vector3;
  /** Seconds until this fish picks a new slot. */
  offsetTimer: number;
  wanderPhase: number;
  wanderSpeed: number;
}

export interface FlockInput {
  /** Where the leader is headed. */
  leaderTarget: THREE.Vector3;
  /** False until the first pointer/controller input, so the leader eases in. */
  hasLeaderTarget: boolean;
  /** Point the followers swarm around. */
  center: THREE.Vector3;
  /** True while the UI needs the fish out of the way. */
  scatter: boolean;
}

export interface FlockOptions {
  scene: THREE.Scene;
  /** The loaded GLTF scene, cloned once per fish. */
  template: THREE.Object3D;
  /** Swim cycle, if the model shipped one. */
  clip: THREE.AnimationClip | undefined;
  dither: DitherRegistry;
  swarmRadiusMin: number;
  swarmRadiusMax: number;
  scaleMultiplier: number;
}

export interface Flock {
  readonly fish: readonly Fish[];
  readonly leader: Fish | undefined;
  update(dt: number, input: FlockInput): void;
  /** Widens or tightens the swarm. VR pushes it further out for comfort. */
  setSwarmRadius(min: number, max: number): void;
  setScaleMultiplier(multiplier: number): void;
  dispose(): void;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Frame-loop scratch. Reused rather than reallocated — this runs 60+ times a
// second per fish, so allocating here would mean constant GC churn.
const toTargetVec = new THREE.Vector3();
const lookAtPoint = new THREE.Vector3();
const scratch = new THREE.Vector3();
const upVec = new THREE.Vector3();
const targetQuat = new THREE.Quaternion();
const lookMatrix = new THREE.Matrix4();

/** Random unit direction scaled into the current swarm radius band. */
function randomOffset(
  target: THREE.Vector3,
  radiusMin: number,
  radiusMax: number
): THREE.Vector3 {
  target.set(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(2)
  );
  // Guard against normalizing a zero-length vector.
  if (target.lengthSq() < 1e-4) target.set(1, 0, 0);
  return target
    .normalize()
    .multiplyScalar(THREE.MathUtils.randFloat(radiusMin, radiusMax));
}

/** Prepares a freshly cloned fish for rendering. */
function prepareMeshes(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    // Fish swim well outside the frustum bounds Three.js computes from the
    // rest pose, so culling them produces visible pop-in.
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Fins are single-sided geometry; without this they vanish at angles.
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (material) material.side = THREE.DoubleSide;
    }
  });
}

function spawnPosition(index: number, target: THREE.Vector3): THREE.Vector3 {
  if (index === 0) return target.copy(FISH.leaderSpawn);

  const spread = () =>
    (Math.random() > 0.5 ? 1 : -1) *
    THREE.MathUtils.randFloat(
      FISH.followerSpawnSpreadMin,
      FISH.followerSpawnSpreadMax
    );

  return target.set(spread(), spread(), FISH.followerSpawnZ);
}

export function createFlock(options: FlockOptions): Flock {
  const { scene, template, clip, dither } = options;

  let radiusMin = options.swarmRadiusMin;
  let radiusMax = options.swarmRadiusMax;
  let scaleMultiplier = options.scaleMultiplier;

  const fish: Fish[] = [];

  for (let index = 0; index < FISH.count; index++) {
    // SkeletonUtils.clone() (not Object3D.clone()) is required to duplicate a
    // rigged model — it rebinds the skeleton instead of sharing bones.
    const object = clone(template);
    prepareMeshes(object);

    spawnPosition(index, object.position);
    object.rotation.y = THREE.MathUtils.randFloat(-Math.PI, Math.PI);

    const isLeader = index === 0;
    if (!isLeader) {
      object.scale.setScalar(
        THREE.MathUtils.randFloat(FISH.followerScaleMin, FISH.followerScaleMax)
      );
    }
    const baseScale = object.scale.x;
    object.scale.setScalar(baseScale * scaleMultiplier);

    // The leader reads as a bright white glowing fish; followers get seeded
    // vivid colors. See LEADER_LOOK.variantIndex for why it borrows index 1.
    dither.apply(
      object,
      isLeader
        ? {
            levels: levelsVariant(LEADER_LOOK.variantIndex),
            tint: LEADER_LOOK.tint,
            tintStrength: tintStrengthVariant(LEADER_LOOK.variantIndex),
            emissive: LEADER_LOOK.emissive,
            emissiveIntensity: LEADER_LOOK.emissiveIntensity,
          }
        : {
            levels: levelsVariant(index),
            tint: vividColorVariant(index),
            tintStrength: tintStrengthVariant(index),
          }
    );

    let mixer: THREE.AnimationMixer | null = null;
    if (clip) {
      mixer = new THREE.AnimationMixer(object);
      mixer.clipAction(clip).play();
    }

    scene.add(object);

    fish.push({
      index,
      object,
      mixer,
      baseScale,
      speed: THREE.MathUtils.randFloat(
        FLOCK.minFollowSpeed,
        FLOCK.maxFollowSpeed
      ),
      offset: randomOffset(new THREE.Vector3(), radiusMin, radiusMax),
      offsetTarget: randomOffset(new THREE.Vector3(), radiusMin, radiusMax),
      offsetTimer: THREE.MathUtils.randFloat(
        FLOCK.offsetTimeMin,
        FLOCK.offsetTimeMax
      ),
      wanderPhase: Math.random() * Math.PI * 2,
      wanderSpeed: THREE.MathUtils.randFloat(
        FLOCK.wanderSpeedMin,
        FLOCK.wanderSpeedMax
      ),
    });
  }

  /**
   * Steers the leader toward its target, easing off inside the arrive radius so
   * it settles rather than jittering on top of the cursor.
   */
  function updateLeader(leader: Fish, dt: number, input: FlockInput) {
    const { object, mixer } = leader;

    // Scatter wins over pointer input — the fish clear the UI regardless.
    const target = input.scatter
      ? SCATTER.leaderTarget
      : input.hasLeaderTarget
        ? input.leaderTarget
        : input.center;

    toTargetVec.copy(target).sub(object.position);
    const distance = toTargetVec.length();

    if (distance <= 1e-3) {
      mixer?.update(dt);
      return;
    }

    // Normalize, then amplify when very close so the turn stays responsive.
    toTargetVec.multiplyScalar(1 / (distance * Math.min(1, distance)));

    const speedFactor =
      distance < FLOCK.leaderArriveRadius
        ? (distance / FLOCK.leaderArriveRadius) * Math.min(1, distance)
        : 1.0;
    const step = FLOCK.leaderSpeed * speedFactor * dt;

    // Tail-wag speed tracks swim speed, with a floor so it never freezes.
    mixer?.update(Math.max(step, FLOCK.leaderAnimationMinStep));

    // Move along the fish's own forward axis, not straight at the target, so
    // it banks into turns instead of sliding sideways.
    scratch.set(0, 0, -1).applyQuaternion(object.quaternion).multiplyScalar(step);
    object.position.add(scratch);

    lookAtPoint.copy(object.position).add(toTargetVec);
    upVec.copy(object.up.lengthSq() ? object.up : WORLD_UP);
    lookMatrix.lookAt(object.position, lookAtPoint, upVec);
    targetQuat.setFromRotationMatrix(lookMatrix);
    object.quaternion.slerp(targetQuat, FLOCK.leaderTurn);
  }

  function updateFollower(
    follower: Fish,
    leader: Fish | undefined,
    dt: number,
    input: FlockInput,
    offsetLerp: number,
    speedLerp: number
  ) {
    const { object, mixer, index } = follower;

    // Periodically claim a new slot in the swarm.
    follower.offsetTimer -= dt;
    if (follower.offsetTimer <= 0) {
      randomOffset(follower.offsetTarget, radiusMin, radiusMax);
      follower.offsetTimer = THREE.MathUtils.randFloat(
        FLOCK.offsetTimeMin,
        FLOCK.offsetTimeMax
      );
    }
    follower.offset.lerp(follower.offsetTarget, offsetLerp);

    // Per-fish wander, offset by index so no two fish move in sync.
    follower.wanderPhase += follower.wanderSpeed * dt;
    const wander = scratch
      .set(
        Math.sin(follower.wanderPhase * 1.1 + index),
        Math.cos(follower.wanderPhase * 0.8 + index * 0.37),
        Math.sin(follower.wanderPhase * 1.3 - index)
      )
      .multiplyScalar(FLOCK.wanderStrength);

    const targetPoint = lookAtPoint
      .copy(input.scatter ? SCATTER.followerCenter : input.center)
      .add(follower.offset)
      .add(wander);

    // Flee the leader. `avoidance` ramps 0..1 as the leader closes in and also
    // drives the turn rate and speed boost below.
    let avoidance = 0;
    if (leader) {
      const fromLeader = toTargetVec
        .copy(object.position)
        .sub(leader.object.position);
      const distToLeader = fromLeader.length();
      const radius = input.scatter ? SCATTER.avoidRadius : FLOCK.avoidRadius;

      if (distToLeader > 1e-5 && distToLeader < radius) {
        const falloff = 1 - distToLeader / radius;
        avoidance = THREE.MathUtils.clamp(
          Math.pow(falloff, FLOCK.avoidFalloffExponent),
          0,
          1
        );
        targetPoint.addScaledVector(
          fromLeader.multiplyScalar(1 / distToLeader),
          FLOCK.avoidStrength * avoidance * avoidance
        );
      }
    }

    const toTarget = toTargetVec.copy(targetPoint).sub(object.position);
    const distance = toTarget.length();

    if (distance > 1e-5) {
      toTarget.multiplyScalar(1 / distance);
      scratch.copy(object.position).add(toTarget);
      upVec.copy(object.up.lengthSq() ? object.up : WORLD_UP);
      lookMatrix.lookAt(object.position, scratch, upVec);
      targetQuat.setFromRotationMatrix(lookMatrix);
      // Fleeing fish turn much harder than cruising ones.
      const turnGain = THREE.MathUtils.lerp(1, FLOCK.avoidTurnMult, avoidance);
      object.quaternion.slerp(targetQuat, FLOCK.followerTurn * turnGain);
    }

    let desiredSpeed =
      distance > FLOCK.catchUpDistance
        ? FLOCK.catchUpSpeed
        : THREE.MathUtils.lerp(
            FLOCK.minFollowSpeed,
            FLOCK.maxFollowSpeed,
            THREE.MathUtils.clamp(distance / radiusMax, 0, 1)
          );

    if (avoidance > 0) {
      const speedEase =
        1 - Math.pow(1 - avoidance, FLOCK.avoidSpeedEaseExponent);
      desiredSpeed +=
        (FLOCK.maxAvoidSpeed - desiredSpeed) *
        THREE.MathUtils.clamp(speedEase, 0, 1);
    }

    // Fleeing fish also accelerate faster, not just to a higher top speed.
    const dynamicSpeedLerp =
      avoidance > 0
        ? 1 -
          Math.exp(
            -FLOCK.speedSmooth *
              dt *
              (1 + avoidance * FLOCK.avoidSpeedLerpMult)
          )
        : speedLerp;

    follower.speed += (desiredSpeed - follower.speed) * dynamicSpeedLerp;

    // See FLOCK.followerAnimationScale — deliberately not a time delta.
    mixer?.update(dynamicSpeedLerp * FLOCK.followerAnimationScale);

    const forward = scratch.set(0, 0, -1).applyQuaternion(object.quaternion);
    object.position.addScaledVector(forward, follower.speed * dt);
  }

  return {
    fish,

    get leader() {
      return fish[0];
    },

    update(dt, input) {
      const leader = fish[0];
      if (leader) updateLeader(leader, dt, input);

      // Exponential smoothing factors, computed once per frame rather than
      // per fish since they only depend on dt.
      const offsetLerp = 1 - Math.exp(-FLOCK.offsetSmooth * dt);
      const speedLerp = 1 - Math.exp(-FLOCK.speedSmooth * dt);

      for (let i = 1; i < fish.length; i++) {
        updateFollower(fish[i], leader, dt, input, offsetLerp, speedLerp);
      }
    },

    setSwarmRadius(min, max) {
      radiusMin = min;
      radiusMax = max;
    },

    setScaleMultiplier(multiplier) {
      scaleMultiplier = multiplier;
      for (const f of fish) {
        f.object.scale.setScalar(f.baseScale * multiplier);
      }
    },

    dispose() {
      for (const f of fish) {
        f.mixer?.stopAllAction();
        scene.remove(f.object);
        f.object.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.isMesh) mesh.geometry?.dispose();
        });
      }
      fish.length = 0;
    },
  };
}
