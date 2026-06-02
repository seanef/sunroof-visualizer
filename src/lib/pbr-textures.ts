import * as THREE from 'three';

type SourceImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function toCanvas(src: SourceImage): HTMLCanvasElement {
  if (src instanceof HTMLCanvasElement) return src;
  const canvas = document.createElement('canvas');
  canvas.width = (src as HTMLImageElement).naturalWidth || (src as ImageBitmap).width;
  canvas.height = (src as HTMLImageElement).naturalHeight || (src as ImageBitmap).height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(src as CanvasImageSource, 0, 0);
  return canvas;
}

function luminance(r: number, g: number, b: number): number {
  // Rec. 709 luma, 0..255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derive a tangent-space normal map from a source image (luminance as heightfield).
 * Uses a Sobel filter; `strength` scales the perceived bumpiness.
 */
export function deriveNormalMap(src: SourceImage, strength = 2.0): THREE.CanvasTexture {
  const source = toCanvas(src);
  const w = source.width;
  const h = source.height;
  const sctx = source.getContext('2d')!;
  const srcData = sctx.getImageData(0, 0, w, h).data;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d')!;
  const outData = octx.createImageData(w, h);

  const heightAt = (x: number, y: number) => {
    const xi = Math.max(0, Math.min(w - 1, x));
    const yi = Math.max(0, Math.min(h - 1, y));
    const i = (yi * w + xi) * 4;
    return luminance(srcData[i], srcData[i + 1], srcData[i + 2]) / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sobel
      const tl = heightAt(x - 1, y - 1);
      const t = heightAt(x, y - 1);
      const tr = heightAt(x + 1, y - 1);
      const l = heightAt(x - 1, y);
      const r = heightAt(x + 1, y);
      const bl = heightAt(x - 1, y + 1);
      const b = heightAt(x, y + 1);
      const br = heightAt(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      // Tangent-space normal
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;

      const idx = (y * w + x) * 4;
      outData.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      outData.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      outData.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      outData.data[idx + 3] = 255;
    }
  }

  octx.putImageData(outData, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Normal maps must stay in linear space
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

interface RoughnessOptions {
  /** Minimum roughness (0..1) corresponding to brightest pixels. */
  min?: number;
  /** Maximum roughness (0..1) corresponding to darkest pixels. */
  max?: number;
  /** If true, bright pixels become rough instead of smooth. */
  invert?: boolean;
}

/**
 * Derive a single-channel roughness map from an albedo's luminance.
 * Defaults assume bright = smoother (e.g. wet leaves, polished gravel facets).
 */
export function deriveRoughnessMap(
  src: SourceImage,
  { min = 0.55, max = 0.95, invert = false }: RoughnessOptions = {}
): THREE.CanvasTexture {
  const source = toCanvas(src);
  const w = source.width;
  const h = source.height;
  const sctx = source.getContext('2d')!;
  const srcData = sctx.getImageData(0, 0, w, h).data;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d')!;
  const outData = octx.createImageData(w, h);

  for (let i = 0; i < srcData.length; i += 4) {
    let t = luminance(srcData[i], srcData[i + 1], srcData[i + 2]) / 255;
    if (invert) t = 1 - t;
    // Map: bright (t=1) -> min roughness, dark (t=0) -> max roughness
    const rough = max + (min - max) * t;
    const v = Math.round(rough * 255);
    outData.data[i] = v;
    outData.data[i + 1] = v;
    outData.data[i + 2] = v;
    outData.data[i + 3] = 255;
  }

  octx.putImageData(outData, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Apply identical UV repeats to a set of textures (keeps PBR maps aligned). */
export function syncRepeats(textures: (THREE.Texture | null | undefined)[], x: number, y: number) {
  for (const t of textures) {
    if (!t) continue;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(x, y);
    t.needsUpdate = true;
  }
}