// App.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./App.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ---------------------------- Scene / Camera / Renderer ----------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0147ff);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    camera.position.set(0, 1, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current!.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // ---------------------------- Lights ----------------------------
    const hemiLight = new THREE.HemisphereLight(0xbcd7ff, 0x223355, 1.0);
    hemiLight.position.set(0, 2, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // ---------------------------- Dither helpers ----------------------------
    // keep references so we tick time once per material
    const ditherMats = new Set<THREE.Material>();

    function ditherizeMaterial<T extends THREE.Material>(
      baseMat: T,
      opts?: {
        levels?: number;
        tint?: THREE.Color | number | string;
        tintStrength?: number;
      }
    ): T {
      const { levels = 4.0, tint = 0xffffff, tintStrength = 1.0 } = opts || {};
      const mat = baseMat.clone() as T & {
        userData: any;
        onBeforeCompile?: (shader: any) => void;
      };

      mat.onBeforeCompile = (shader: any) => {
        // JS-side uniforms
        shader.uniforms.levels = { value: levels };
        shader.uniforms.time = { value: 0.0 };
        shader.uniforms.tint = { value: new THREE.Color(tint) };
        shader.uniforms.tintStrength = { value: tintStrength };

        // 1) uniform declarations + helper function OUTSIDE main
        const header = `
uniform float levels;
uniform float time;
uniform vec3  tint;
uniform float tintStrength;

float bayerDither(vec2 pos) {
  int x = int(mod(pos.x, 4.0));
  int y = int(mod(pos.y, 4.0));
  int index = x + y * 4;
  const int bayer[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
  return float(bayer[index]) / 16.0;
}
`;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>\n${header}`
        );

        // 2) operation INSIDE main (after toneMapping/colorspace if present)
        const injectBlock = `
{
  float d = bayerDither(gl_FragCoord.xy + time * 30.0);
  vec3 qColor = floor(gl_FragColor.rgb * levels + d * 2.0) / levels;
  vec3 tinted = qColor * tint;
  qColor = mix(qColor, tinted, clamp(tintStrength, 0.0, 1.0));
  gl_FragColor.rgb = clamp(qColor, 0.0, 1.0);
}
`;

        if (shader.fragmentShader.includes("#include <colorspace_fragment>")) {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <colorspace_fragment>",
            `#include <colorspace_fragment>\n${injectBlock}`
          );
        } else if (
          shader.fragmentShader.includes("#include <dithering_fragment>")
        ) {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `${injectBlock}\n#include <dithering_fragment>`
          );
        } else if (
          shader.fragmentShader.includes("#include <opaque_fragment>")
        ) {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <opaque_fragment>",
            `#include <opaque_fragment>\n${injectBlock}`
          );
        } else {
          shader.fragmentShader = shader.fragmentShader.replace(
            /}\s*$/m,
            `${injectBlock}\n}`
          );
        }

        mat.userData._shader = shader;
      };

      mat.needsUpdate = true;
      return mat;
    }

    // Tiny seeded RNG so each index i is stable across reloads
    function mulberry32(seed: number) {
      return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /**
     * Vivid color with controllable variability & bias toward high saturation.
     * - hueCenter: center hue in [0..1] (e.g. 0.58 ≈ blue). Set null to allow full rainbow.
     * - hueSpread: how wide the hue range around center (0..0.5). 0.5 ~ full wheel.
     * - satMin/satMax: saturation bounds.
     * - satBias: >1 biases toward satMax (more saturated). 1 = uniform, 2-4 = vivid.
     * - lightMid/lightSpread: target mid lightness & spread.
     * - lightBias: >1 biases toward lightMid (contrast control).
     */
    function vividColorVariant(
      i: number,
      opts?: {
        hueCenter?: number | null;
        hueSpread?: number;
        satMin?: number;
        satMax?: number;
        satBias?: number; // >1 => push saturation up
        lightMid?: number; // 0..1
        lightSpread?: number; // 0..0.5
        lightBias?: number; // >1 => pull toward lightMid
      }
    ): THREE.Color {
      const {
        hueCenter = null, // null => full wheel
        hueSpread = 0.5, // 0.5 ~ full wheel
        satMin = 0.65,
        satMax = 1.0,
        satBias = 3.0, // ↑ make larger for more saturated colors
        lightMid = 0.52,
        lightSpread = 0.18, // increase for more variability
        lightBias = 1.5,
      } = opts || {};

      const rnd = mulberry32(0x9e3779b1 ^ (i * 0x85ebca6b)); // stable per i
      const r1 = rnd();
      const r2 = rnd();
      const r3 = rnd();

      // Hue
      let h: number;
      if (hueCenter == null) {
        h = r1; // full 0..1
      } else {
        const delta = (r1 * 2 - 1) * hueSpread; // [-spread..+spread]
        h = (hueCenter + delta + 1) % 1;
      }

      // Saturation (ease-out toward 1): s = satMin..satMax with bias pushing high
      // 1 - (1 - r)^k biases up as k increases
      const sT = 1.0 - Math.pow(1.0 - r2, satBias);
      const s = THREE.MathUtils.lerp(satMin, satMax, sT);

      // Lightness around lightMid with spread and bias pulling back toward mid
      const rawL = THREE.MathUtils.clamp(
        lightMid + (r3 * 2 - 1) * lightSpread,
        0,
        1
      );
      const l = THREE.MathUtils.lerp(lightMid, rawL, 1.0 / lightBias);

      return new THREE.Color().setHSL(h, s, l);
    }

    function applyDitherToObject3D(
      root: THREE.Object3D,
      opts?: {
        levels?: number;
        tint?: THREE.Color | number | string;
        tintStrength?: number;
      }
    ) {
      root.traverse((o: any) => {
        if (!o.isMesh || !o.material) return;

        const wrap = (m: THREE.Material) => {
          const wrapped = ditherizeMaterial(m, opts);
          ditherMats.add(wrapped);
          return wrapped;
        };

        if (Array.isArray(o.material)) o.material = o.material.map(wrap);
        else o.material = wrap(o.material);

        o.castShadow = o.receiveShadow = true;
      });
    }

    function levelsVariant(i: number) {
      return THREE.MathUtils.clamp(
        3 + Math.round((Math.sin(i * 3.1) + 1) * 0.5 * 2),
        3,
        5
      ); // 3..5
    }
    function tintStrengthVariant(i: number) {
      return THREE.MathUtils.lerp(0.35, 0.75, (Math.cos(i * 5.7) + 1) * 0.5);
    }

    // ---------------------------- GLTF load / clones ----------------------------
    let mixer: THREE.AnimationMixer | null = null;
    let player: THREE.Object3D;
    const fishes: THREE.Object3D[] = [];
    const mixers: THREE.AnimationMixer[] = [];
    const followerSpeeds: number[] = [];
    const followerOffsets: THREE.Vector3[] = [];
    const followerOffsetTargets: THREE.Vector3[] = [];
    const followerTimers: number[] = [];
    const followerWanderPhase: number[] = [];
    const followerWanderSpeed: number[] = [];

    const OFFSET_RADIUS_MIN = 2.0;
    const OFFSET_RADIUS_MAX = 6.0;
    const OFFSET_TIME_MIN = 1.5;
    const OFFSET_TIME_MAX = 3.5;
    const OFFSET_SMOOTH = 1.8;
    const SPEED_SMOOTH = 3.0;
    const MIN_FOLLOW_SPEED = 0.9;
    const MAX_FOLLOW_SPEED = 1.5;
    const MAX_AVOID_SPEED = 10.0;
    const WANDER_STRENGTH = 0.55;
    const PLAYER_AVOID_RADIUS = 10;
    const PLAYER_AVOID_STRENGTH = 30;
    const PLAYER_AVOID_TURN_MULT = 5.5;
    const PLAYER_AVOID_SPEED_LERP_MULT = 10.0;

    const setRandomFollowerOffset = (target: THREE.Vector3) => {
      target.set(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(2)
      );
      if (target.lengthSq() < 1e-4) target.set(1, 0, 0);
      target
        .normalize()
        .multiplyScalar(
          THREE.MathUtils.randFloat(OFFSET_RADIUS_MIN, OFFSET_RADIUS_MAX)
        );
      return target;
    };

    const loader = new GLTFLoader();
    loader.load(
      "./fish3.glb",
      (gltf) => {
        const template = gltf.scene;
        const clip = gltf.animations?.[0];

        const COUNT = 20;
        for (let i = 0; i < COUNT; i++) {
          const fish = clone(template) as THREE.Object3D;

          fish.traverse((o: any) => {
            if (o.isMesh) {
              o.frustumCulled = false;
              o.castShadow = o.receiveShadow = true;
              if (o.material) {
                if (Array.isArray(o.material))
                  o.material.forEach(
                    (m: THREE.Material) => (m.side = THREE.DoubleSide)
                  );
                else (o.material as THREE.Material).side = THREE.DoubleSide;
              }
            }
          });

          fish.position.set(
            THREE.MathUtils.randFloatSpread(10),
            THREE.MathUtils.randFloat(-5, 5),
            THREE.MathUtils.randFloatSpread(10)
          );
          fish.rotation.y = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
          if (i !== 0) {
            fish.scale.setScalar(THREE.MathUtils.randFloat(0.4, 0.9));
          }

          // Per-fish dither style
          applyDitherToObject3D(fish, {
            levels: levelsVariant(i),
            tint: vividColorVariant(i, {
              hueCenter: null, // full rainbow; set 0.58 for blue-centric
              hueSpread: 0.5, // wider = more hue variety
              satMin: 0.7,
              satMax: 1.0,
              satBias: 4.0, // ↑ pushes toward highly saturated colors
              lightMid: 0.5,
              lightSpread: 0.22, // ↑ more brightness variety
              lightBias: 1.3, // lower => allow more deviation from mid
            }),
            tintStrength: tintStrengthVariant(i), // keep your existing strength fn
          });

          fishes.push(fish);
          scene.add(fish);

          followerSpeeds.push(
            THREE.MathUtils.randFloat(MIN_FOLLOW_SPEED, MAX_FOLLOW_SPEED)
          );
          followerOffsets.push(setRandomFollowerOffset(new THREE.Vector3()));
          followerOffsetTargets.push(
            setRandomFollowerOffset(new THREE.Vector3())
          );
          followerTimers.push(
            THREE.MathUtils.randFloat(OFFSET_TIME_MIN, OFFSET_TIME_MAX)
          );
          followerWanderPhase.push(Math.random() * Math.PI * 2);
          followerWanderSpeed.push(THREE.MathUtils.randFloat(0.6, 1.2));

          if (clip) {
            const m = new THREE.AnimationMixer(fish);
            const action = m.clipAction(clip);
            action.play();
            mixers.push(m);
          }
        }

        player = fishes[0];

        // Player variant (slightly different look)
        if (player) {
          applyDitherToObject3D(player, {
            levels: levelsVariant(1),
            tint: 0xffffff, // pure white
            tintStrength: tintStrengthVariant(1),
          });
        }

        mixer = mixers.length > 0 ? mixers[0] : null;
      },
      undefined,
      (err) => console.error("GLB load error", "./fish3.glb", err)
    );

    // ---------------------------- Interaction & movement ----------------------------
    // --- ray/time/mouse ---
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- planes ---
    // ground: y = 0 (XZ)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // vertical-ish plane: start with up (0,1,0) and tilt it 45° around X
    const verticalPlane = new THREE.Plane();
    {
      const normal = new THREE.Vector3(0, 1, 0);
      normal.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4); // tilt 45° around X
      verticalPlane.setFromNormalAndCoplanarPoint(
        normal,
        new THREE.Vector3(0, 0, 0)
      );
    }

    // visualize
    // const planeHelper = new THREE.PlaneHelper(groundPlane, 20, 0x00ff88); // green
    // const planeHelper2 = new THREE.PlaneHelper(verticalPlane, 20, 0xff8800); // orange
    // //scene.add(planeHelper, planeHelper2);

    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    // target + temp hit points
    const mouseTarget = new THREE.Vector3();
    const hitGround = new THREE.Vector3();
    const hitVertical = new THREE.Vector3();

    function ndcFromEvent(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onMouseMove(e: MouseEvent) {
      ndcFromEvent(e);
      raycaster.setFromCamera(mouse, camera);

      const gotGround = raycaster.ray.intersectPlane(groundPlane, hitGround);
      const gotVertical = raycaster.ray.intersectPlane(
        verticalPlane,
        hitVertical
      );

      if (gotGround && gotVertical) {
        // pick the nearer intersection along the ray
        const dG2 = raycaster.ray.origin.distanceToSquared(hitGround);
        const dV2 = raycaster.ray.origin.distanceToSquared(hitVertical);
        mouseTarget.copy(dG2 < dV2 ? hitGround : hitVertical);
      } else if (gotGround) {
        mouseTarget.copy(hitGround);
      } else if (gotVertical) {
        mouseTarget.copy(hitVertical);
      } else {
        // no hit; optionally keep previous or hide a marker
        // e.g., mouseTarget.set(NaN, NaN, NaN);
      }
    }

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // temps
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const up = new THREE.Vector3();
    const qTarget = new THREE.Quaternion();
    const m4 = new THREE.Matrix4();

    // tuning
    const TURN_LEADER = 0.006;
    const SPEED_LEADER = 6.0;
    const ARRIVE_RADIUS = 8.0;
    const TURN_FOLLOW = 0.002;
    const FOLLOW_UP = new THREE.Vector3(0, 1, 0);
    const FIXED_TARGET = new THREE.Vector3(0, 0, 0);

    // ---------------------------- Animate ----------------------------
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.033);

      // tick time once per unique material
      ditherMats.forEach((mat: any) => {
        const sh = mat?.userData?._shader;
        if (sh?.uniforms?.time) sh.uniforms.time.value += dt;
      });

      // Leader (index 0) -> mouseTarget
      if (
        typeof player !== "undefined" &&
        (mouseTarget.x || mouseTarget.y || mouseTarget.z)
      ) {
        v1.copy(mouseTarget).sub(player.position);
        const dist = v1.length();

        if (dist > 1e-3) {
          v1.multiplyScalar(1 / dist);
          const speedFactor = dist < ARRIVE_RADIUS ? dist / ARRIVE_RADIUS : 1.0;
          const step = SPEED_LEADER * speedFactor * dt;
          if (mixer) mixer.update(Math.max(step, 0.005));
          v2.set(0, 0, -1)
            .applyQuaternion(player.quaternion)
            .multiplyScalar(step);
          player.position.add(v2);
          v3.copy(player.position).add(v1);
          up.copy(player.up.lengthSq() ? player.up : up.set(0, 1, 0));
          m4.lookAt(player.position, v3, up);
          qTarget.setFromRotationMatrix(m4);
          player.quaternion.slerp(qTarget, TURN_LEADER);
        } else {
          if (mixer) mixer.update(dt);
        }
      } else {
        if (mixer) mixer.update(dt);
      }

      // Followers -> FIXED_TARGET
      const offsetLerp = 1 - Math.exp(-OFFSET_SMOOTH * dt);
      const speedLerp = 1 - Math.exp(-SPEED_SMOOTH * dt);

      for (let i = 1; i < fishes.length; i++) {
        const f = fishes[i];
        const mix = mixers[i];
        if (followerSpeeds[i] === undefined) continue;

        followerTimers[i] -= dt;
        if (followerTimers[i] <= 0) {
          setRandomFollowerOffset(followerOffsetTargets[i]);
          followerTimers[i] = THREE.MathUtils.randFloat(
            OFFSET_TIME_MIN,
            OFFSET_TIME_MAX
          );
        }

        followerOffsets[i].lerp(followerOffsetTargets[i], offsetLerp);
        followerWanderPhase[i] += followerWanderSpeed[i] * dt;

        v2.set(
          Math.sin(followerWanderPhase[i] * 1.1 + i),
          Math.cos(followerWanderPhase[i] * 0.8 + i * 0.37),
          Math.sin(followerWanderPhase[i] * 1.3 - i)
        ).multiplyScalar(WANDER_STRENGTH);

        let avoidanceFactor = 0;
        const targetPoint = v1
          .copy(FIXED_TARGET)
          .add(followerOffsets[i])
          .add(v2);

        if (player) {
          const toPlayer = v3.copy(f.position).sub(player.position);
          const distToPlayer = toPlayer.length();
          if (distToPlayer > 1e-5 && distToPlayer < PLAYER_AVOID_RADIUS) {
            const falloff = 1 - distToPlayer / PLAYER_AVOID_RADIUS;
            avoidanceFactor = THREE.MathUtils.clamp(
              Math.pow(falloff, 2.2),
              0,
              1
            );
            const scaledAvoid =
              PLAYER_AVOID_STRENGTH * avoidanceFactor * avoidanceFactor;
            targetPoint.addScaledVector(
              toPlayer.multiplyScalar(1 / distToPlayer),
              scaledAvoid
            );
          }
        }

        const toTarget = v3.copy(targetPoint).sub(f.position);
        const distance = toTarget.length();

        if (distance > 1e-5) {
          toTarget.multiplyScalar(1 / distance);
          v2.copy(f.position).add(toTarget);
          up.copy(f.up.lengthSq() ? f.up : FOLLOW_UP);
          m4.lookAt(f.position, v2, up);
          qTarget.setFromRotationMatrix(m4);
          const turnGain = THREE.MathUtils.lerp(
            1,
            PLAYER_AVOID_TURN_MULT,
            avoidanceFactor
          );
          f.quaternion.slerp(qTarget, TURN_FOLLOW * turnGain);
        }

        let desiredSpeed = THREE.MathUtils.lerp(
          MIN_FOLLOW_SPEED,
          MAX_FOLLOW_SPEED,
          THREE.MathUtils.clamp(distance / OFFSET_RADIUS_MAX, 0, 1)
        );

        if (avoidanceFactor > 0) {
          const speedEase = 1 - Math.pow(1 - avoidanceFactor, 4);
          desiredSpeed +=
            (MAX_AVOID_SPEED - desiredSpeed) *
            THREE.MathUtils.clamp(speedEase, 0, 1);
        }

        const dynamicSpeedLerp =
          avoidanceFactor > 0
            ? 1 -
              Math.exp(
                -SPEED_SMOOTH *
                  dt *
                  (1 + avoidanceFactor * PLAYER_AVOID_SPEED_LERP_MULT)
              )
            : speedLerp;

        followerSpeeds[i] +=
          (desiredSpeed - followerSpeeds[i]) * dynamicSpeedLerp;

        if (mix) mix.update(dynamicSpeedLerp * 0.33);
        const forward = v2.set(0, 0, -1).applyQuaternion(f.quaternion);
        f.position.addScaledVector(forward, followerSpeeds[i] * dt);
      }

      controls.update();

      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);

      requestAnimationFrame(animate);
    };
    animate();

    // ---------------------------- Resize ----------------------------
    const handleResize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ---------------------------- Cleanup ----------------------------
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} />;
}

export default App;
