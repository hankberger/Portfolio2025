// App.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./App.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Fish from "./classes/Fish";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ---------------------------- Scene / Camera / Renderer ----------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101015);

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
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 2, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // scene.add(new THREE.AxesHelper(0.5));
    const grid = new THREE.GridHelper(10, 10);
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = -0.001;
    scene.add(grid);

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
    scene.add(sphereMesh);

    const animate = () => {
      const delta = clock.getDelta();
      ditherMaterial.uniforms.time.value += delta;

      const velocity = delta * 1.5;

      if (mixer) mixer.update(velocity);

      for (const fish of fishes) {
        const world = new THREE.Vector3();
        const forward = fish.getWorldDirection(world);
        forward.normalize();
        forward.multiplyScalar(-0.01);
        fish.position.add(forward);

        const currentQuat = fish.quaternion.clone();
        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            fish.position, // from
            target.clone().normalize(), // to (direction)
            fish.up // up vector
          )
        );

        fish.quaternion.slerp(targetQuat, 0.001);
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

  return <div ref={mountRef} />;
}

export default App;
