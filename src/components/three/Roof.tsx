import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { RoofMaterial } from '@/types/solar';
import * as THREE from 'three';
import gravelTextureImg from '@/assets/textures/gravel-roof.jpg';
import greenTextureImg from '@/assets/textures/green-roof.jpg';

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

// Tile size in meters (400mm x 500mm)
const TILE_WIDTH = 0.4;
const TILE_DEPTH = 0.5;

export function Roof({ material, width = 15, depth = 15 }: RoofProps) {
  // Load texture images
  const gravelTexture = useLoader(THREE.TextureLoader, gravelTextureImg);
  const greenTexture = useLoader(THREE.TextureLoader, greenTextureImg);
  
  const texture = useMemo(() => {
    if (material === 'green') {
      // Use the loaded green roof texture image
      const tex = greenTexture.clone();
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      // Calculate repeats based on tile size (400mm x 500mm)
      tex.repeat.set(width / TILE_WIDTH, depth / TILE_DEPTH);
      tex.needsUpdate = true;
      return tex;
    }
    
    if (material === 'gravel') {
      // Use the loaded gravel texture image
      const tex = gravelTexture.clone();
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      // Calculate repeats based on tile size (400mm x 500mm)
      tex.repeat.set(width / TILE_WIDTH, depth / TILE_DEPTH);
      tex.needsUpdate = true;
      return tex;
    }
    
    if (material === 'pvc') {
      // Create subtle, even texture for PVC membrane
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      // Light grey base
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(0, 0, 256, 256);
      
      // Add subtle, even noise texture
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = Math.floor(Math.random() * 20 - 10);
        const baseGrey = 224; // Light grey base value
        const grey = Math.max(200, Math.min(240, baseGrey + shade));
        ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
        ctx.fillRect(x, y, 1, 1);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);
      return tex;
    }
    
    if (material === 'bitumen') {
      // Create dark texture with color variation for bitumen
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      // Dark base color
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, 256, 256);
      
      // Add varied dark texture
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = Math.floor(Math.random() * 30 - 15);
        const baseValue = 42; // Dark base value
        const value = Math.max(25, Math.min(60, baseValue + shade));
        // Slight color variation (not pure grey)
        const r = value + Math.floor(Math.random() * 8 - 4);
        const g = value + Math.floor(Math.random() * 6 - 3);
        const b = value + Math.floor(Math.random() * 4 - 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 2, 2);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);
      return tex;
    }
    
    return null;
  }, [material, width, depth, gravelTexture, greenTexture]);

  const buildingHeight = 4;
  const wallThickness = 0.3;
  const parapetHeight = 0.3;
  const parapetThickness = 0.2;
  
  // Window configuration
  const windowSize = 1;
  const windowSpacing = 2.5;
  const windowYPosition = 0.3; // Center height relative to wall center
  const doorWidth = 1.8;
  const doorClearance = 1; // 1m from door edge to window edge

  // Generate window positions for a wall segment
  const generateWindowPositions = (wallLength: number, hasDoor: boolean = false): number[] => {
    const positions: number[] = [];
    const halfLength = wallLength / 2;
    
    if (hasDoor) {
      // For wall with door: windows start 1m + half window size from door edges
      const doorHalfWidth = doorWidth / 2 + 0.1; // Include door frame
      const firstWindowOffset = doorHalfWidth + doorClearance + windowSize / 2;
      
      // Left side of door
      for (let x = -firstWindowOffset; x >= -halfLength + windowSize / 2 + 0.5; x -= windowSpacing) {
        positions.push(x);
      }
      // Right side of door
      for (let x = firstWindowOffset; x <= halfLength - windowSize / 2 - 0.5; x += windowSpacing) {
        positions.push(x);
      }
    } else {
      // For walls without door: evenly space windows
      const numWindows = Math.floor((wallLength - 1) / windowSpacing);
      const startOffset = (wallLength - (numWindows - 1) * windowSpacing) / 2 - halfLength;
      
      for (let i = 0; i < numWindows; i++) {
        positions.push(startOffset + i * windowSpacing);
      }
    }
    
    return positions;
  };

  // Window component
  const Window = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      {/* Window frame (outer) */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[windowSize + 0.15, windowSize + 0.15, 0.08]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} />
      </mesh>
      {/* Window glass */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[windowSize - 0.05, windowSize - 0.05, 0.02]} />
        <meshStandardMaterial color="#87ceeb" metalness={0.3} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Window cross frame */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.05, windowSize - 0.05, 0.02]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[windowSize - 0.05, 0.05, 0.02]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} />
      </mesh>
    </group>
  );

  const frontWindowPositions = generateWindowPositions(width, true);
  const sideWindowPositions = generateWindowPositions(depth, false);
  const backWindowPositions = generateWindowPositions(width, false);

  return (
    <group>
      {/* Building walls */}
      {/* Front wall with door and windows */}
      <group position={[0, -buildingHeight / 2, depth / 2]}>
        {/* Solid wall behind openings */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, buildingHeight, wallThickness]} />
          <meshStandardMaterial color="#e8e0d5" roughness={0.9} />
        </mesh>
        
        {/* Door */}
        <mesh position={[0, -0.5, wallThickness / 2 + 0.05]} castShadow>
          <boxGeometry args={[doorWidth, 3, 0.1]} />
          <meshStandardMaterial color="#5a3d2b" roughness={0.7} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, -0.5, wallThickness / 2 + 0.02]}>
          <boxGeometry args={[doorWidth + 0.2, 3.2, 0.05]} />
          <meshStandardMaterial color="#3d2817" roughness={0.8} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.6, -0.5, wallThickness / 2 + 0.15]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} />
        </mesh>
        
        {/* Windows on front wall */}
        {frontWindowPositions.map((x, i) => (
          <Window key={`front-window-${i}`} position={[x, windowYPosition, wallThickness / 2]} />
        ))}
      </group>

      {/* Back wall */}
      <group position={[0, -buildingHeight / 2, -depth / 2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, buildingHeight, wallThickness]} />
          <meshStandardMaterial color="#e8e0d5" roughness={0.9} />
        </mesh>
        {/* Windows on back wall */}
        {backWindowPositions.map((x, i) => (
          <Window key={`back-window-${i}`} position={[x, windowYPosition, -wallThickness / 2]} />
        ))}
      </group>

      {/* Left wall with windows */}
      <group position={[-width / 2, -buildingHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[depth, buildingHeight, wallThickness]} />
          <meshStandardMaterial color="#d8d0c5" roughness={0.9} />
        </mesh>
        {/* Windows on left wall */}
        {sideWindowPositions.map((z, i) => (
          <Window key={`left-window-${i}`} position={[z, windowYPosition, wallThickness / 2]} />
        ))}
      </group>

      {/* Right wall with windows */}
      <group position={[width / 2, -buildingHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[depth, buildingHeight, wallThickness]} />
          <meshStandardMaterial color="#d8d0c5" roughness={0.9} />
        </mesh>
        {/* Windows on right wall */}
        {sideWindowPositions.map((z, i) => (
          <Window key={`right-window-${i}`} position={[z, windowYPosition, wallThickness / 2]} />
        ))}
      </group>

      {/* Main roof surface - extended slightly to go under parapets */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.4, depth + 0.4]} />
        <meshStandardMaterial
          color={ROOF_COLORS[material]}
          roughness={ROOF_ROUGHNESS[material]}
          metalness={material === 'pvc' ? 0.1 : 0}
          map={texture}
        />
      </mesh>

      {/* Roof edge/parapet - properly aligned corners */}
      {/* Front parapet */}
      <mesh position={[0, parapetHeight / 2, depth / 2 + parapetThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + parapetThickness * 2, parapetHeight, parapetThickness]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      {/* Back parapet */}
      <mesh position={[0, parapetHeight / 2, -depth / 2 - parapetThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + parapetThickness * 2, parapetHeight, parapetThickness]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      {/* Left parapet */}
      <mesh position={[-width / 2 - parapetThickness / 2, parapetHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[parapetThickness, parapetHeight, depth]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
      {/* Right parapet */}
      <mesh position={[width / 2 + parapetThickness / 2, parapetHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[parapetThickness, parapetHeight, depth]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>
    </group>
  );
}
