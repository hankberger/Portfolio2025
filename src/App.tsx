// App.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./App.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Fish from "./classes/Fish";
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
    const fishes: THREE.Object3D[] = [];

    const loader = new GLTFLoader();
    loader.load(
      "./fish3.glb",
      (gltf) => {
        const base = gltf.scene;
        scene.add(base);
        mixer = new THREE.AnimationMixer(base);

        base.traverse((o: any) => {
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

        fishes.push(base);

        if (gltf.animations && gltf.animations.length > 0) {
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => console.error("GLB load error", "./fish3.glb", err)
    );
    // ---------------------------- Update Loop ----------------------------
    const clock = new THREE.Clock();
    const target = new THREE.Vector3(0, 2, 0);

    const sphereGeo = new THREE.SphereGeometry(1, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(sphereGeo, material);

    sphereMesh.position.copy(target);
    //scene.add(sphereMesh);

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

    // --- temps to avoid GC each frame ---
    const tmpDir = new THREE.Vector3();
    const tmpUp = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();
    const targetQuat = new THREE.Quaternion();
    const tmpMat4 = new THREE.Matrix4();

    const MAX_SPEED = 5.0; // units per second
    const ARRIVE_RADIUS = 10; // start slowing within this distance
    const TURN_SMOOTH = 0.005; // 0..1, higher = faster turning

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.033);
      ditherMaterial.uniforms.time.value += dt;

      // only steer when we have a valid target
      const haveTarget = sphere.visible; // set true when ray hits plane
      if (haveTarget) {
        for (const fish of fishes) {
          // desired direction: mouseTarget - fish.position
          tmpDir.copy(mouseTarget).sub(fish.position);
          const dist = tmpDir.length();

          if (dist > 1e-3) {
            tmpDir.multiplyScalar(1 / dist); // normalize

            // arrive: slow down as we get close
            const speedFactor =
              dist < ARRIVE_RADIUS ? dist / ARRIVE_RADIUS : 1.0;
            const step = MAX_SPEED * speedFactor * dt;

            if (mixer) mixer.update(Math.max(step, 0.005));

            // move toward target
            const forward = new THREE.Vector3(0, 0, 0);
            const movementVec = fish.getWorldDirection(forward);
            movementVec.multiplyScalar(-step);
            fish.position.add(movementVec);

            // face movement direction (use lookAt with a POINT, not a direction)
            tmpLook.copy(fish.position).add(tmpDir); // a point ahead along desired dir
            // ensure a stable up (use fish.up or world up)
            tmpUp.copy(
              fish.up.lengthSq() ? fish.up : new THREE.Vector3(0, 1, 0)
            );

            tmpMat4.lookAt(fish.position, tmpLook, tmpUp);
            targetQuat.setFromRotationMatrix(tmpMat4);

            // smooth rotation toward target
            fish.quaternion.slerp(targetQuat, TURN_SMOOTH);
          }
        }
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
