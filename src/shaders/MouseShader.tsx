// GlowMouse.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MouseShader() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // --- renderer / scene / camera ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const pr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current!.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // --- uniforms ---
    const uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uMouse: { value: new THREE.Vector2(-9999, -9999) }, // start off-screen
      uGlowRadius: { value: 0.18 }, // normalized (0..1) relative to min(resolution)
      uIntensity: { value: 1.0 },
      uHueShift: { value: 0.0 }, // tweak if you want different orange hues
    };

    // --- geometry covering the screen ---
    const geo = new THREE.PlaneGeometry(2, 2);

    // --- shaders ---
    const vert = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Simplex noise + fBm for turbulence
    const frag = /* glsl */ `
      precision highp float;

      uniform vec2 uResolution;
      uniform vec2 uMouse;       // in pixels
      uniform float uTime;
      uniform float uGlowRadius;  // normalized to min(res)
      uniform float uIntensity;
      uniform float uHueShift;

      varying vec2 vUv;

      // --- helpers ---
      // Convert pixel coords to normalized space where shorter side = 1.0
      vec2 normCoord(vec2 fragCoord) {
        float s = min(uResolution.x, uResolution.y);
        vec2 centered = (fragCoord - 0.5 * uResolution) / s; // -+ around center
        return centered; // [-aspect/2.., aspect/2..], shorter side normalized to 1
      }

      // https://iquilezles.org/articles/simplexnoise/
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v   - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //  x0 = x0 - 0. + 0.0 * C
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
        i = mod(i, 289.0 );
        vec4 p = permute( permute( permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 g0 = vec3(a0.xy,h.x);
        vec3 g1 = vec3(a1.xy,h.y);
        vec3 g2 = vec3(a0.zw,h.z);
        vec3 g3 = vec3(a1.zw,h.w);

        // Normalise gradients
        vec4 norm = 1.79284291400159 - 0.85373472095314 *
          vec4( dot(g0,g0), dot(g1,g1), dot(g2,g2), dot(g3,g3) );
        g0 *= norm.x;
        g1 *= norm.y;
        g2 *= norm.z;
        g3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4( dot(x0,x0), dot(x1,x1),
                                  dot(x2,x2), dot(x3,x3) ), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(g0,x0), dot(g1,x1),
                                      dot(g2,x2), dot(g3,x3) ) );
      }

      float fbm(vec3 p) {
        float a = 0.5;
        float f = 0.0;
        for (int i = 0; i < 5; i++) {
          f += a * snoise(p);
          p *= 2.02;
          a *= 0.5;
        }
        return f;
      }

      // Cheap HSV to RGB (only need oranges)
      vec3 hsv2rgb(vec3 c){
        vec3 rgb = clamp( abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0 );
        rgb = rgb*rgb*(3.0-2.0*rgb);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }

      void main() {
        vec2 fragCoord = vUv * uResolution;
        vec2 p = normCoord(fragCoord);
        vec2 m = normCoord(uMouse);

        float d = length(p - m); // distance to mouse in normalized space

        // Base radial falloff for a small glow
        float r = uGlowRadius;
        float base = smoothstep(r, 0.0, d); // 1 at center, 0 at edge

        // Turbulent edge using fBm; animate slowly
        float edgeNoise = fbm(vec3((p - m) * 4.0, uTime * 0.25));
        // Sharpen turbulence near the edge
        float ring = smoothstep(0.0, 1.0, base) * (0.5 + 0.5 * edgeNoise);

        // Core brighter
        float core = smoothstep(0.35*r, 0.0, d);

        float glow = clamp(core * 1.15 + ring * 0.6, 0.0, 1.0) * uIntensity;

        // Orange color (around 30° hue), slight shift
        float hue = 0.08 + 0.02 * sin(uTime * 0.5) + uHueShift; // ~orange
        vec3 col = hsv2rgb(vec3(hue, 0.85, 1.0));

        // Subtle outer halo
        float halo = smoothstep(0.9, 0.0, d / (r * 2.2)) * 0.25;

        vec3 finalCol = col * glow + col * halo * 0.5;

        // Slight vignette to make the glow pop
        float vign = smoothstep(1.1, 0.2, length(p) );
        finalCol *= mix(0.85, 1.0, vign);

        // Premultiplied style fade so it overlays nicely if page has a bg
        gl_FragColor = vec4(finalCol, clamp(glow + halo, 0.0, 1.0));
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // --- mouse handling (pixels) ---
    const handlePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) * (uniforms.uResolution.value.x / rect.width);
      const y =
        (e.clientY - rect.top) * (uniforms.uResolution.value.y / rect.height);
      uniforms.uMouse.value.set(x, y);
    };
    renderer.domElement.addEventListener("pointermove", handlePointer, {
      passive: true,
    });

    // --- resize ---
    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    }
    window.addEventListener("resize", onResize);

    // --- animate ---
    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      uniforms.uTime.value += clock.getDelta();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // --- cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", handlePointer);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-auto" />;
}
