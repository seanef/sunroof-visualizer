import { useMemo } from 'react';
import { RoofMaterial } from '@/types/solar';
import * as THREE from 'three';

interface RoofProps {
  material: RoofMaterial;
  width?: number;
  depth?: number;
}

const ROOF_COLORS: Record<RoofMaterial, string> = {
  green: '#3d8b4f',
  gravel: '#8b7355',
  pvc: '#d9d9d9',
  bitumen: '#303030',
};

const ROOF_ROUGHNESS: Record<RoofMaterial, number> = {
  green: 0.9,
  gravel: 0.95,
  pvc: 0.3,
  bitumen: 0.7,
};

export function Roof({ material, width = 20, depth = 15 }: RoofProps) {
  const texture = useMemo(() => {
    if (material === 'green') {
      // Create grass-like texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = ROOF_COLORS.green;
      ctx.fillRect(0, 0, 256, 256);
      
      // Add grass variation
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = Math.random() * 40 - 20;
        ctx.fillStyle = `rgb(${61 + shade}, ${139 + shade}, ${79 + shade})`;
        ctx.fillRect(x, y, 2, 4);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    }
    
    if (material === 'gravel') {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = ROOF_COLORS.gravel;
      ctx.fillRect(0, 0, 256, 256);
      
      // Add gravel stones
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 8 + 2;
        const shade = Math.random() * 60 - 30;
        ctx.fillStyle = `rgb(${139 + shade}, ${115 + shade}, ${85 + shade})`;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);
      return tex;
    }
    
    return null;
  }, [material]);

  return (
    <group>
      {/* Main roof surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={ROOF_COLORS[material]}
          roughness={ROOF_ROUGHNESS[material]}
          metalness={material === 'pvc' ? 0.1 : 0}
          map={texture}
        />
      </mesh>

      {/* Roof edge/parapet */}
      <mesh position={[0, 0.15, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, 0.3, 0.2]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.15, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, 0.3, 0.2]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      <mesh position={[-width / 2, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.3, depth]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      <mesh position={[width / 2, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.3, depth]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
    </group>
  );
}
