import * as THREE from "three";
import { DITHER } from "./config";

// The dither look is achieved by injecting a Bayer-matrix quantization step
// into Three.js' own material shaders via onBeforeCompile, rather than as a
// post-process pass. That keeps it per-object — each fish can have its own
// quantization level and tint — and leaves the canvas alpha intact so the DOM
// layer stays visible underneath.

export interface DitherOptions {
  /** Quantization steps. Lower is chunkier. */
  levels?: number;
  tint?: THREE.ColorRepresentation;
  /** 0 = untinted, 1 = fully tinted. */
  tintStrength?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
}

/** Materials that may expose native emissive fields (i.e. the PBR-ish family). */
interface MaybeEmissiveMaterial extends THREE.Material {
  isMeshStandardMaterial?: boolean;
  isMeshPhysicalMaterial?: boolean;
  isMeshLambertMaterial?: boolean;
  isMeshPhongMaterial?: boolean;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}

function hasNativeEmissive(material: MaybeEmissiveMaterial): boolean {
  return Boolean(
    material.isMeshStandardMaterial ||
      material.isMeshPhysicalMaterial ||
      material.isMeshLambertMaterial ||
      material.isMeshPhongMaterial
  );
}

const BAYER_HEADER = `
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

const QUANTIZE_BLOCK = `
{
  float d = bayerDither(gl_FragCoord.xy + time * ${DITHER.scrollSpeed.toFixed(1)});
  vec3 qColor = floor(gl_FragColor.rgb * levels + d * 2.0) / levels;
  vec3 tinted = qColor * tint;
  qColor = mix(qColor, tinted, clamp(tintStrength, 0.0, 1.0));
  gl_FragColor.rgb = clamp(qColor, 0.0, 1.0);
}
`;

/**
 * Splices the quantize block into whichever output stage the generated shader
 * happens to expose. Three.js moves these chunks around between versions, so we
 * try the known anchors in order of preference and fall back to appending
 * before the closing brace of main().
 */
function injectQuantize(fragmentShader: string): string {
  if (fragmentShader.includes("#include <colorspace_fragment>")) {
    return fragmentShader.replace(
      "#include <colorspace_fragment>",
      `#include <colorspace_fragment>\n${QUANTIZE_BLOCK}`
    );
  }
  if (fragmentShader.includes("#include <dithering_fragment>")) {
    return fragmentShader.replace(
      "#include <dithering_fragment>",
      `${QUANTIZE_BLOCK}\n#include <dithering_fragment>`
    );
  }
  if (fragmentShader.includes("#include <opaque_fragment>")) {
    return fragmentShader.replace(
      "#include <opaque_fragment>",
      `#include <opaque_fragment>\n${QUANTIZE_BLOCK}`
    );
  }
  return fragmentShader.replace(/}\s*$/m, `${QUANTIZE_BLOCK}\n}`);
}

/** Injects an emissive term for materials with no native emissive support. */
function injectEmissive(fragmentShader: string): string {
  let frag = fragmentShader.replace(
    /void\s+main\s*\(\s*\)\s*{/,
    (match) =>
      `${match}\n  vec3 emissiveTerm = uEmissive.rgb * uEmissiveIntensity;\n`
  );

  if (frag.includes("gl_FragColor = vec4(")) {
    frag = frag.replace(
      /gl_FragColor\s*=\s*vec4\(\s*([^)]+)\s*,\s*([^)]+)\s*\)\s*;/,
      "gl_FragColor = vec4(($1) + emissiveTerm, $2);"
    );
  } else if (frag.includes("#include <output_fragment>")) {
    frag = frag.replace(
      "#include <output_fragment>",
      `#include <output_fragment>\n  gl_FragColor.rgb += emissiveTerm;`
    );
  } else {
    frag = frag.replace(/}\s*$/, `  gl_FragColor.rgb += emissiveTerm;\n}\n`);
  }

  return frag;
}

/**
 * Clones `baseMat` and injects the dither pass into the clone. The original is
 * left untouched — important because SkeletonUtils.clone() shares materials
 * between fish, so mutating in place would affect the whole swarm.
 */
function ditherizeMaterial<T extends THREE.Material>(
  baseMat: T,
  options: DitherOptions = {}
): T {
  const {
    levels = DITHER.defaultLevels,
    tint = DITHER.defaultTint,
    tintStrength = DITHER.defaultTintStrength,
  } = options;

  const mat = baseMat.clone() as T;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.levels = { value: levels };
    shader.uniforms.time = { value: 0.0 };
    shader.uniforms.tint = { value: new THREE.Color(tint) };
    shader.uniforms.tintStrength = { value: tintStrength };

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>\n${BAYER_HEADER}`
    );
    shader.fragmentShader = injectQuantize(shader.fragmentShader);

    // Stashed so the registry can advance the `time` uniform each frame. Only
    // available once the material has actually been compiled by a render.
    mat.userData._shader = shader;
  };

  mat.needsUpdate = true;
  return mat;
}

export interface DitherRegistry {
  /** Replaces every material under `root` with a dithered clone. */
  apply(root: THREE.Object3D, options?: DitherOptions): void;
  /** Advances the scrolling dither pattern. Call once per frame. */
  tick(dt: number): void;
  /** How many materials are being ticked. Should equal the meshes on screen. */
  readonly size: number;
  dispose(): void;
}

/**
 * Tracks every dithered material so their shared `time` uniform can be advanced
 * from one place. Materials that get replaced by a later apply() are dropped
 * from tracking, so we never tick a material that is no longer rendered.
 */
export function createDitherRegistry(): DitherRegistry {
  const materials = new Set<THREE.Material>();

  function wrap(source: THREE.Material, options: DitherOptions): THREE.Material {
    const wrapped = ditherizeMaterial(source, options) as MaybeEmissiveMaterial;

    // The material we are replacing may itself be tracked from an earlier
    // apply() on the same object. Stop ticking it.
    materials.delete(source);
    materials.add(wrapped);

    const emissive = options.emissive ?? 0x000000;
    const emissiveIntensity = options.emissiveIntensity ?? 0.0;

    if (hasNativeEmissive(wrapped)) {
      if (!wrapped.emissive) wrapped.emissive = new THREE.Color(0x000000);
      wrapped.emissive.set(emissive);
      wrapped.emissiveIntensity = emissiveIntensity;
      wrapped.needsUpdate = true;
      return wrapped;
    }

    // Non-PBR material: chain an emissive injection after the dither pass.
    const applyDitherPass = wrapped.onBeforeCompile;
    wrapped.onBeforeCompile = (shader, renderer) => {
      applyDitherPass.call(wrapped, shader, renderer);

      shader.uniforms.uEmissive = { value: new THREE.Color(emissive) };
      shader.uniforms.uEmissiveIntensity = { value: emissiveIntensity };
      shader.fragmentShader = injectEmissive(shader.fragmentShader);
    };

    wrapped.needsUpdate = true;
    return wrapped;
  }

  return {
    apply(root, options = {}) {
      root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;

        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => wrap(m, options))
          : wrap(mesh.material, options);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
    },

    tick(dt) {
      for (const material of materials) {
        const shader = material.userData._shader;
        if (shader?.uniforms?.time) shader.uniforms.time.value += dt;
      }
    },

    get size() {
      return materials.size;
    },

    dispose() {
      for (const material of materials) material.dispose();
      materials.clear();
    },
  };
}
