import { EffectComposer, Bloom, SSAO, Vignette, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface PostFXProps {
  enabled?: boolean;
}

/**
 * Stylized "Unreal-ish" post-processing stack.
 * - SSAO: grounds the PV array and architectural details
 * - Bloom: soft glow on the sun and bright sky
 * - Vignette: subtle filmic edge darkening
 * - SMAA: cleans up edges (cheaper than MSAA at this DPR)
 */
export function PostFX({ enabled = true }: PostFXProps) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        radius={0.08}
        intensity={22}
        luminanceInfluence={0.6}
        worldDistanceThreshold={20}
        worldDistanceFalloff={5}
        worldProximityThreshold={6}
        worldProximityFalloff={2}
      />
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.15} darkness={0.55} />
      <SMAA />
    </EffectComposer>
  );
}