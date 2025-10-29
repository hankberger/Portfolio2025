// App.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./App.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Fish from "./classes/Fish";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import MouseShader from "./shaders/MouseShader";

function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ---------------------------- Scene / Camera / Renderer ----------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0052a3);

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

    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { depthBuffer: true }
    );

    // ---------------------------- Lights / Helpers ----------------------------
    const hemiLight = new THREE.HemisphereLight(0xbcd7ff, 0x223355, 1.0);
    hemiLight.position.set(0, 2, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // scene.add(new THREE.AxesHelper(0.5));
    // const grid = new THREE.GridHelper(100, 100);
    // (grid.material as THREE.Material).opacity = 0.2;
    // (grid.material as THREE.Material).transparent = true;
    // grid.position.y = -0.001;
    // scene.add(grid);

    // ---------------------------- Post (Dither) ----------------------------
    const fsQuadScene = new THREE.Scene();
    const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const ditherMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: renderTarget.texture },
        levels: { value: 4.0 },
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        time: { value: 0 },
        tint: { value: new THREE.Color(0xffffff) }, // BLUE
        tintStrength: { value: 1.0 }, // 0..1
      },
      vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
      fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float levels;
    uniform vec2 resolution;
    uniform float time;
    uniform vec3  tint;
    uniform float tintStrength;
    varying vec2 vUv;

    float bayerDither(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      const int bayer[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
      return float(bayer[index]) / 16.0;
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float d = bayerDither(gl_FragCoord.xy + time * 30.0);

      // quantize
      vec3 qColor = floor(color.rgb * levels + d * 2.0) / levels;

      // safer than pure multiply: mix towards a tinted version
      vec3 tinted = qColor * tint;
      qColor = mix(qColor, tinted, clamp(tintStrength, 0.0, 1.0));

      // keep energy reasonable
      qColor = clamp(qColor, 0.0, 1.0);
      gl_FragColor = vec4(qColor, 1.0);
    }
  `,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ditherMaterial);
    fsQuadScene.add(quad);

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
    const MAX_FOLLOW_SPEED = 3.2;
    const MAX_AVOID_SPEED = 12.0;
    const WANDER_STRENGTH = 0.55;
    const PLAYER_AVOID_RADIUS = 12;
    const PLAYER_AVOID_STRENGTH = 30;
    const PLAYER_AVOID_TURN_MULT = 5.5;
    const PLAYER_AVOID_SPEED_LERP_MULT = 12.0;

    const setRandomFollowerOffset = (target: THREE.Vector3) => {
      target.set(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(2)
      );

      if (target.lengthSq() < 1e-4) {
        target.set(1, 0, 0);
      }

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

        // We'll create 15 clones from the template
        const COUNT = 15;

        for (let i = 0; i < COUNT; i++) {
          // Properly clone skinned meshes/skeletons
          const fish = clone(template) as THREE.Object3D;

          // Match your material + culling tweaks
          fish.traverse((o: any) => {
            if (o.isMesh) {
              o.frustumCulled = false;
              o.castShadow = o.receiveShadow = true;
              if (o.material) {
                if (Array.isArray(o.material)) {
                  o.material.forEach(
                    (m: THREE.Material) => (m.side = THREE.DoubleSide)
                  );
                } else {
                  (o.material as THREE.Material).side = THREE.DoubleSide;
                }
              }
            }
          });

          // Randomize position/rotation/scale a bit
          fish.position.set(
            THREE.MathUtils.randFloatSpread(10), // x in [-5,5]
            THREE.MathUtils.randFloat(-5, 5), // y
            THREE.MathUtils.randFloatSpread(10) // z in [-5,5]
          );
          fish.rotation.y = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
          const s = THREE.MathUtils.randFloat(0.4, 1);
          fish.scale.setScalar(s);

          // Push to array and add to scene
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

          // Give each fish its own mixer & play the first animation (if present)
          if (clip) {
            const m = new THREE.AnimationMixer(fish);
            const action = m.clipAction(clip);
            action.play();
            mixers.push(m);
          }
        }

        // Keep "player" pointing at the first fish (if you rely on it elsewhere)
        player = fishes[0];

        // Also keep your original 'mixer' variable referencing the first one
        mixer = mixers.length > 0 ? mixers[0] : null;
      },
      undefined,
      (err) => console.error("GLB load error", "./fish3.glb", err)
    );
    // ---------------------------- Update Loop ----------------------------
    const clock = new THREE.Clock();
    const target = new THREE.Vector3(0, 2, 0);

    const sphereGeo = new THREE.SphereGeometry(0.1, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(sphereGeo, material);

    sphereMesh.position.copy(target);
    scene.add(sphereMesh);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // a math plane: y = 0 (horizontal ground)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // sphere visualization
    const visualGeo = new THREE.SphereGeometry(0.1, 16, 12);
    const visualMat = new THREE.MeshBasicMaterial({ color: 0x55aaff });
    const sphere = new THREE.Mesh(visualGeo, visualMat);
    sphere.visible = false; // hide until we have a hit
    //scene.add(sphere);

    // vector to store target position
    const mouseTarget = new THREE.Vector3();

    function ndcFromEvent(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onMouseMove(e: MouseEvent) {
      ndcFromEvent(e);
      raycaster.setFromCamera(mouse, camera);

      if (raycaster.ray.intersectPlane(groundPlane, mouseTarget)) {
        sphere.position.copy(mouseTarget);
        sphere.visible = true;
      } else {
        sphere.visible = false;
      }
    }

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // ---------- shared temps (no GC) ----------
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const up = new THREE.Vector3();
    const qTarget = new THREE.Quaternion();
    const m4 = new THREE.Matrix4();

    // ---------- tuning ----------
    const TURN_LEADER = 0.006; // slerp factor per frame
    const SPEED_LEADER = 6.0; // units/sec (arrive with slowdown)
    const ARRIVE_RADIUS = 8.0;

    const TURN_FOLLOW = 0.002; // slerp factor per frame
    const FOLLOW_UP = new THREE.Vector3(0, 1, 0);

    // ---------- fixed target for followers ----------
    const FIXED_TARGET = new THREE.Vector3(0, 0, 0); // <— change as needed

    // ---------- animate ----------
    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.033);
      ditherMaterial.uniforms.time.value += dt;

      // ---------------- Leader (index 0) -> mouseTarget ----------------
      if (sphere.visible) {
        // direction to mouse target
        v1.copy(mouseTarget).sub(player.position);
        const dist = v1.length();

        if (dist > 1e-3) {
          v1.multiplyScalar(1 / dist); // normalize

          // arrive: slow as we approach
          const speedFactor = dist < ARRIVE_RADIUS ? dist / ARRIVE_RADIUS : 1.0;
          const step = SPEED_LEADER * speedFactor * dt;

          if (mixer) mixer.update(Math.max(step, 0.005));

          // move forward along local -Z
          v2.set(0, 0, -1)
            .applyQuaternion(player.quaternion)
            .multiplyScalar(step);
          player.position.add(v2);

          // face desired direction (lookAt -> quat -> slerp)
          v3.copy(player.position).add(v1); // point ahead along desired dir
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

      // ---------------- Followers (index 1..N) -> FIXED_TARGET ----------------
      const offsetLerp = 1 - Math.exp(-OFFSET_SMOOTH * dt);
      const speedLerp = 1 - Math.exp(-SPEED_SMOOTH * dt);

      for (let i = 1; i < fishes.length; i++) {
        const f = fishes[i];
        const mix = mixers[i];
        if (mix) mix.update(dt);

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

        const forward = v2.set(0, 0, -1).applyQuaternion(f.quaternion);
        f.position.addScaledVector(forward, followerSpeeds[i] * dt);
      }

      controls.update();

      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(fsQuadScene, fsCamera);

      requestAnimationFrame(animate);
    };
    animate();

    // ---------------------------- Resize ----------------------------
    const handleResize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderTarget.setSize(w, h);
      ditherMaterial.uniforms.resolution.value.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ---------------------------- Cleanup ----------------------------
    return () => {
      window.removeEventListener("resize", handleResize);
      renderTarget.dispose();
      quad.geometry.dispose();
      (ditherMaterial as THREE.ShaderMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div ref={mountRef} />
    </>
  );
}

export default App;
