import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GroundProps {
  quality?: 'high' | 'low';
}

interface RockProps {
  position: [number, number, number];
  scale: number;
  rotation: number;
}

function Rock({ position, scale, rotation }: RockProps) {
  const zRotation = useMemo(() => Math.random() * 0.3, []);
  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const positions = geo.attributes.position;
    
    // Distort vertices for natural rock look
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const noise = (Math.sin(x * 3) * Math.cos(y * 2) * Math.sin(z * 4)) * 0.2;
      positions.setXYZ(i, x + noise, y + noise * 0.5, z + noise);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={[0, rotation, zRotation]}
      scale={[scale * 1.2, scale * 0.6, scale]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#6b7280"
        roughness={0.9}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}

function GrassBlade({ position, height, rotation }: { position: [number, number, number]; height: number; rotation: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle wind sway
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.z = Math.sin(time * 2 + position[0] + position[2]) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
    >
      <coneGeometry args={[0.02, height, 4]} />
      <meshStandardMaterial
        color="#4a7c3f"
        roughness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GrassCluster({ position, density = 8 }: { position: [number, number, number]; density?: number }) {
  const blades = useMemo(() => {
    const result = [];
    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() - 0.5) * 0.4;
      const offsetZ = (Math.random() - 0.5) * 0.4;
      const height = 0.15 + Math.random() * 0.2;
      const rotation = Math.random() * Math.PI * 2;
      
      result.push({
        position: [position[0] + offsetX, position[1] + height / 2, position[2] + offsetZ] as [number, number, number],
        height,
        rotation,
      });
    }
    return result;
  }, [position, density]);

  return (
    <group>
      {blades.map((blade, i) => (
        <GrassBlade key={i} {...blade} />
      ))}
    </group>
  );
}

export function Ground({ quality = 'high' }: GroundProps) {
  const isLow = quality === 'low';

  // Generate rock positions
  const rocks = useMemo(() => {
    const rockData: RockProps[] = [];
    const rockClusters = isLow
      ? [
          { center: [-14, -10], count: 2 },
          { center: [16, -8], count: 2 },
          { center: [-8, 14], count: 2 },
          { center: [12, 12], count: 2 },
        ]
      : [
          { center: [-15, -12], count: 5 },
          { center: [18, -8], count: 4 },
          { center: [-8, 15], count: 6 },
          { center: [12, 14], count: 4 },
          { center: [-20, 5], count: 3 },
          { center: [22, 2], count: 5 },
        ];

    rockClusters.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const x = cluster.center[0] + (Math.random() - 0.5) * 8;
        const z = cluster.center[1] + (Math.random() - 0.5) * 8;
        const scale = 0.3 + Math.random() * 0.8;
        
        rockData.push({
          position: [x, -4.7 + scale * 0.3, z],
          scale,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    });

    return rockData;
  }, [isLow]);

  // Generate grass cluster positions
  const grassClusters = useMemo(() => {
    if (isLow) return [];
    const clusters: { position: [number, number, number]; density: number }[] = [];
    
    for (let x = -25; x <= 25; x += 2) {
      for (let z = -25; z <= 25; z += 2) {
        // Skip areas near the building
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 12) continue;
        
        // Random chance to place grass
        if (Math.random() > 0.4) {
          const offsetX = (Math.random() - 0.5) * 1.5;
          const offsetZ = (Math.random() - 0.5) * 1.5;
          
          clusters.push({
            position: [x + offsetX, -4.95, z + offsetZ],
            density: 5 + Math.floor(Math.random() * 6),
          });
        }
      }
    }

    return clusters;
  }, [isLow]);

  // Create terrain geometry with gentle undulation
  const terrainGeometry = useMemo(() => {
    const segments = isLow ? 24 : 64;
    const geo = new THREE.PlaneGeometry(100, 100, segments, segments);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // Y in plane geometry before rotation

      // Create gentle hills and valleys
      const noise1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5;
      const noise2 = Math.sin(x * 0.1 + 1) * Math.cos(z * 0.08) * 0.3;
      const noise3 = Math.sin(x * 0.2) * Math.sin(z * 0.15) * 0.15;
      
      // Flatten near the building
      const distFromCenter = Math.sqrt(x * x + z * z);
      const flattenFactor = Math.min(1, distFromCenter / 15);
      
      const height = (noise1 + noise2 + noise3) * flattenFactor;
      positions.setZ(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, [isLow]);

  const stones = useMemo(() => {
    if (isLow) return [] as Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>;

    return Array.from({ length: 30 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const baseScale = 0.08 + Math.random() * 0.15;

      return {
        position: [x, -4.95 + baseScale, z] as [number, number, number],
        rotation: [Math.random(), Math.random(), Math.random()] as [number, number, number],
        scale: [baseScale * 1.5, baseScale, baseScale * 1.2] as [number, number, number],
      };
    });
  }, [isLow]);

  return (
    <group>
      {/* Main terrain */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#3d5c35"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Grass detail layer - slightly above terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4.98, 0]}
        receiveShadow
      >
        <circleGeometry args={[45, 64]} />
        <meshStandardMaterial
          color="#4a6b3f"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Dirt/path areas near building */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4.97, 8]}
        receiveShadow
      >
        <planeGeometry args={[6, 12]} />
        <meshStandardMaterial
          color="#8b7355"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Rocks */}
      {rocks.map((rock, i) => (
        <Rock key={`rock-${i}`} {...rock} />
      ))}

      {/* Large boulders */}
      {!isLow && (
        <>
          <Rock position={[-22, -4, -15]} scale={2.5} rotation={0.5} />
          <Rock position={[25, -4, 10]} scale={2.2} rotation={1.2} />
          <Rock position={[15, -4.2, -20]} scale={1.8} rotation={2.1} />
        </>
      )}

      {/* Grass clusters */}
      {!isLow &&
        grassClusters.map((cluster, i) => (
          <GrassCluster key={`grass-${i}`} {...cluster} />
        ))}

      {/* Small stones scattered around */}
      {!isLow &&
        stones.map((stone, i) => (
          <mesh
            key={`stone-${i}`}
            position={stone.position}
            rotation={stone.rotation}
            scale={stone.scale}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}
    </group>
  );
}
