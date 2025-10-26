// Fish.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// If TS complains about types for SkeletonUtils, either add @types/three >= 0.169
// or use the namespace import:
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

type FishTemplate = {
  scene: THREE.Object3D;
  clips: THREE.AnimationClip[];
};

export default class Fish {
  public instance!: THREE.Object3D;        // set when ready
  public mixer: THREE.AnimationMixer | null = null;
  public readonly ready: Promise<void>;

  private static _template: FishTemplate | null = null;
  private static _loader: GLTFLoader | null = null;

  private constructor(instance: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.instance = instance;
    if (clips.length) {
      this.mixer = new THREE.AnimationMixer(this.instance);
      clips.forEach((clip) => this.mixer!.clipAction(clip).play());
    }
    this.ready = Promise.resolve();
  }

  /**
   * Load the GLB once and keep a template we can clone cheaply.
   */
  static async loadOnce(url: string = "/fish3.glb"): Promise<FishTemplate> {
    if (this._template) return this._template;

    if (!this._loader) this._loader = new GLTFLoader();

    const gltf = await new Promise<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>((resolve, reject) => {
      this._loader!.load(
        url,
        resolve,
        undefined,
        reject
      );
    });

    const base = gltf.scene;

    // Normalize, double-sided, shadows, etc.
    base.traverse((o: any) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.castShadow = o.receiveShadow = true;
        if (o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach((m: THREE.Material) => (m.side = THREE.DoubleSide));
          } else {
            (o.material as THREE.Material).side = THREE.DoubleSide;
          }
        }
      }
    });

    // Center and scale to ~1 unit long
    const bbox = new THREE.Box3().setFromObject(base);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    base.position.sub(center);
    base.scale.setScalar(1 / longest);

    this._template = { scene: base, clips: gltf.animations ?? [] };
    return this._template;
  }

  /**
   * Create a Fish by cloning the shared template (fast).
   */
  static async create(url?: string): Promise<Fish> {
    const { scene, clips } = await this.loadOnce(url);
    // Important: clone the *template* (handles skinned meshes/bones).
    const clone = SkeletonUtils.clone(scene);
    return new Fish(clone, clips);
  }

  /**
   * Advance animations (call from your render loop).
   */
  update(dt: number) {
    if (this.mixer) this.mixer.update(dt);
  }

  /**
   * Clean up materials/geometries when removing from scene.
   */
  dispose() {
    this.instance.traverse((o: any) => {
      if (o.isMesh) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose?.());
          else (o.material as any).dispose?.();
        }
      }
    });
    this.mixer?.stopAllAction();
  }
}
