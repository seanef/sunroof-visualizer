import * as THREE from 'three';

export interface TileVariationParams {
  /** Tiles per UV unit — must match the textures' `repeat` so tile boundaries align. */
  tileRepeat: THREE.Vector2;
  /** ±hue shift in HSV (0..0.5 sensible; >0.1 is psychedelic). */
  hueJitter?: number;
  /** ±roughness multiplier range (0..1). */
  roughnessJitter?: number;
  /** ±normal-intensity multiplier range (0..1). */
  normalJitter?: number;
  /**
   * Whether to apply 4-way flips per tile (identity, H-flip, V-flip, 180°).
   * These preserve tileable seams for any rectangular tile but visibly mirror
   * directional content — disable for materials with clear linear features.
   */
  flip?: boolean;
}

/**
 * Patches a MeshStandardMaterial to apply hash-based per-tile variation:
 * flip variant, hue shift, roughness jitter, and normal-intensity jitter.
 *
 * Boundaries between tiles stay seamless because we only mirror within each
 * tile and modulate scalar/HSV values — sampled texels at tile edges remain
 * the same texels as the un-flipped neighbour.
 */
export function applyTileVariation(
  material: THREE.MeshStandardMaterial,
  params: TileVariationParams
): THREE.MeshStandardMaterial {
  const uniforms = {
    uTileRepeat: { value: params.tileRepeat.clone() },
    uHueJitter: { value: params.hueJitter ?? 0 },
    uRoughnessJitter: { value: params.roughnessJitter ?? 0 },
    uNormalJitter: { value: params.normalJitter ?? 0 },
    uFlip: { value: params.flip === false ? 0 : 1 },
  };

  material.userData.tileVariationUniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // Shared helpers + per-fragment tile data, declared once at fragment top.
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      /* glsl */ `
      uniform vec2 uTileRepeat;
      uniform float uHueJitter;
      uniform float uRoughnessJitter;
      uniform float uNormalJitter;
      uniform float uFlip;

      float tv_hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      vec3 tv_rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }
      vec3 tv_hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      // Per-fragment tile data, populated inside main() once UVs exist.
      vec2 tv_tileId;
      vec2 tv_localUv;
      vec3 tv_rnd;     // (flipPick, huePick, jitterPick)
      vec2 tv_sampleUv; // texture-space UV after per-tile flip

      void main() {
      `
    );

    // Compute tile data at the very start of main(), before any chunk uses vMapUv.
    // vMapUv already = uv * map.repeat + map.offset, and we require uTileRepeat == map.repeat,
    // so scaledUv == vMapUv and tile boundaries align with the texture's natural repeat.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      /* glsl */ `
      #include <clipping_planes_fragment>
      #if defined( USE_MAP ) || defined( USE_NORMALMAP ) || defined( USE_ROUGHNESSMAP )
        vec2 tv_scaledUv = vMapUv;
        tv_tileId = floor(tv_scaledUv);
        tv_localUv = fract(tv_scaledUv);
        tv_rnd = vec3(
          tv_hash21(tv_tileId + 11.1),
          tv_hash21(tv_tileId + 53.7),
          tv_hash21(tv_tileId + 97.3)
        );
        vec2 flipped = tv_localUv;
        if (uFlip > 0.5) {
          float pick = tv_rnd.x;
          if (pick < 0.25)      flipped = vec2(1.0 - tv_localUv.x, tv_localUv.y);
          else if (pick < 0.5)  flipped = vec2(tv_localUv.x, 1.0 - tv_localUv.y);
          else if (pick < 0.75) flipped = 1.0 - tv_localUv;
          // else identity
        }
        // Integer offset disappears under RepeatWrapping, so sampling at
        // (tileId + flipped) is equivalent to sampling within the original
        // tile but with the chosen flip variant.
        tv_sampleUv = tv_tileId + flipped;
      #endif
      `
    );

    // Replace map sampling: use tv_sampleUv and apply HSV hue jitter to the albedo.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      /* glsl */ `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D(map, tv_sampleUv);
        #ifdef DECODE_VIDEO_TEXTURE
          sampledDiffuseColor = vec4(mix(pow(sampledDiffuseColor.rgb * 0.9478672986 + vec3(0.0521327014), vec3(2.4)), sampledDiffuseColor.rgb * 0.0773993808, vec3(lessThanEqual(sampledDiffuseColor.rgb, vec3(0.04045)))), sampledDiffuseColor.w);
        #endif
        if (uHueJitter > 0.0) {
          vec3 hsv = tv_rgb2hsv(sampledDiffuseColor.rgb);
          hsv.x = fract(hsv.x + (tv_rnd.y - 0.5) * 2.0 * uHueJitter);
          sampledDiffuseColor.rgb = tv_hsv2rgb(hsv);
        }
        diffuseColor *= sampledDiffuseColor;
      #endif
      `
    );

    // Roughness map: sample at tv_sampleUv and jitter the scalar factor.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 texelRoughness = texture2D(roughnessMap, tv_sampleUv);
        roughnessFactor *= texelRoughness.g;
      #endif
      roughnessFactor *= clamp(1.0 + (tv_rnd.z - 0.5) * 2.0 * uRoughnessJitter, 0.0, 2.0);
      roughnessFactor = clamp(roughnessFactor, 0.0, 1.0);
      `
    );

    // Normal map: sample at tv_sampleUv and jitter the tangent-space XY strength.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
      #ifdef OBJECTSPACE_NORMALMAP
        normal = texture2D( normalMap, tv_sampleUv ).xyz * 2.0 - 1.0;
        #ifdef FLIP_SIDED
          normal = - normal;
        #endif
        #ifdef DOUBLE_SIDED
          normal = normal * faceDirection;
        #endif
        normal = normalize( normalMatrix * normal );
      #elif defined( TANGENTSPACE_NORMALMAP )
        vec3 mapN = texture2D( normalMap, tv_sampleUv ).xyz * 2.0 - 1.0;
        float nJit = clamp(1.0 + (tv_rnd.x - 0.5) * 2.0 * uNormalJitter, 0.0, 3.0);
        mapN.xy *= normalScale * nJit;
        #ifdef USE_TANGENT
          normal = normalize( vTBN * mapN );
        #else
          normal = normalize( tbn * mapN );
        #endif
      #elif defined( USE_BUMPMAP )
        normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
      #endif
      `
    );
  };

  // Dedupe compiled programs across re-renders/instances.
  material.customProgramCacheKey = () => 'roof-tile-variation-v1';
  material.needsUpdate = true;
  return material;
}