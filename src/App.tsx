// App.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./App.css";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// If fish1.glb is under src/assets/, this resolves correctly in Vite:
const MODEL_URL = new URL("/fish1.glb", import.meta.url).href;
// If you instead put it in public/models/, use: const MODEL_URL = "/models/fish1.glb";

function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // --- renderer / scene / camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202025);
    let mixer: THREE.AnimationMixer | null = null;

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

    // ---- render target (where we render the normal scene) ----
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { depthBuffer: true }
    );

    // --- lights ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 2, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // --- helpers (optional but great for debugging size/origin) ---
    scene.add(new THREE.AxesHelper(0.5));
    const grid = new THREE.GridHelper(10, 10);
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = -0.001;
    scene.add(grid);

    // ---- load GLB & make it visible no matter what ----
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        const root = gltf.scene;

        // Ensure renderable, disable frustum culling, double-sided while debugging
        root.traverse((o: any) => {
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
            if (o.scale.x === 0 || o.scale.y === 0 || o.scale.z === 0) {
              o.scale.setScalar(1);
            }
          }
        });

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach((clip) => {
            const action = mixer!.clipAction(clip);
            action.clampWhenFinished = true;
            action.loop = THREE.LoopRepeat; // or THREE.LoopOnce
            action.play();
          });
          console.log(
            "🎬 Playing clips:",
            gltf.animations.map((c) => `${c.name} (${c.duration.toFixed(2)}s)`)
          );
        } else {
          console.warn(
            "⚠️ No glTF animation clips found. The model will be static."
          );
        }

        // Center at origin and auto-scale so longest side ~ 1 unit
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        root.position.sub(center); // center it at (0,0,0)

        const longest = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 1; // 1 meter-ish
        const scale = targetSize / longest;
        root.scale.setScalar(scale);

        scene.add(root);

        // Fit camera nicely to object
        fitCameraToObject(camera, root, controls);

        // kick the loop once model arrives
        if (!isAnimating) {
          isAnimating = true;
          animate();
        }
      },
      (xhr) => {
        // progress (optional)
        // console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(0)}%`);
      },
      (err) => {
        console.error("GLB load error", MODEL_URL, err);
      }
    );

    // ---- full-screen quad scene for dithering ----
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
          vec3 qColor = floor(color.rgb * levels + d * 2.0) / levels;
          gl_FragColor = vec4(qColor, 1.0);
        }
      `,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ditherMaterial);
    fsQuadScene.add(quad);

    // ---- resize handler ----
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderTarget.setSize(w, h);
      ditherMaterial.uniforms.resolution.value.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ---- animation ----
    const clock = new THREE.Clock();

    let isAnimating = false;

    const animate = () => {
      const delta = clock.getDelta();
      ditherMaterial.uniforms.time.value = delta;
      if (mixer) mixer.update(delta);

      controls.update();

      // 1) render 3D scene to target
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);

      // 2) render full-screen quad with dithering
      renderer.render(fsQuadScene, fsCamera);

      requestAnimationFrame(animate);
    };
    isAnimating = true;
    animate();

    // ---- utils ----
    function fitCameraToObject(
      cam: THREE.PerspectiveCamera,
      object: THREE.Object3D,
      ctrls?: OrbitControls,
      offset = 1.25
    ) {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxSize = Math.max(size.x, size.y, size.z);
      const halfFov = THREE.MathUtils.degToRad(cam.fov * 0.5);
      const dist = (maxSize * 0.5) / Math.tan(halfFov);

      const dir = new THREE.Vector3()
        .subVectors(cam.position, ctrls?.target || new THREE.Vector3())
        .normalize();

      cam.position.copy(center).addScaledVector(dir, dist * offset);
      cam.near = Math.max(dist / 100, 0.01);
      cam.far = dist * 100;
      cam.updateProjectionMatrix();

      ctrls?.target.copy(center);
      ctrls?.update();
    }

    // ---- cleanup ----
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

  return <div ref={mountRef} />;
}

export default App;
