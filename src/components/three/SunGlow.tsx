import { useMemo } from 'react';
import * as THREE from 'three';
import { SunPosition } from '@/types/solar';

interface SunGlowProps {
  position: SunPosition;
}

/**
 * Additive radial-gradient billboard that sits at the sun's location.
 * Combined with the Bloom pass it produces a soft, photographic sun disc.
 */
export function SunGlow({ position }: SunGlowProps) {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 245, 220, 1)');
    grad.addColorStop(0.18, 'rgba(255, 220, 160, 0.85)');
    grad.addColorStop(0.45, 'rgba(255, 180, 110, 0.25)');
    grad.addColorStop(1, 'rgba(255, 160, 90, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  if (position.altitude <= 0) return null;

  // Scale glow with altitude — bigger/redder near horizon
  const altDeg = (position.altitude * 180) / Math.PI;
  const scale = altDeg < 10 ? 14 : altDeg < 25 ? 11 : 9;

  return (
    <sprite position={[position.x, position.y, position.z]} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}