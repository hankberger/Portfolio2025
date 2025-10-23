// DitherShader.ts
import * as THREE from "three";

export const DitherShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(800, 600) },
    levels: { value: 4.0 }, // number of brightness steps
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float levels;
    varying vec2 vUv;

    // 4x4 Bayer matrix
    float bayerDither(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      int bayer[16];
      bayer[0]=0; bayer[1]=8; bayer[2]=2; bayer[3]=10;
      bayer[4]=12; bayer[5]=4; bayer[6]=14; bayer[7]=6;
      bayer[8]=3; bayer[9]=11; bayer[10]=1; bayer[11]=9;
      bayer[12]=15; bayer[13]=7; bayer[14]=13; bayer[15]=5;
      return float(bayer[index]) / 16.0;
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 pixelPos = gl_FragCoord.xy;
      float d = bayerDither(pixelPos);

      // quantize each color channel
      vec3 qColor = floor(color.rgb * levels + d) / levels;
      gl_FragColor = vec4(qColor, 1.0);
    }
  `
};
