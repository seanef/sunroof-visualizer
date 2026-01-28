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

// Get the X offset for the road curve at a given Z position
// Road comes from positive z edge (z=50) and ends at parking in front of door (z=10-14)
function getRoadCurveX(z: number): number {
  if (z <= 14) return 0; // Parking area is straight
  // Gentle S-curve using sine waves (road goes from z=14 to z=50)
  const t = (z - 14) / 36; // Normalize to 0-1 for the road portion
  return Math.sin(t * Math.PI * 1.5) * 2.5 + Math.sin(t * Math.PI * 3) * 0.8;
}

// Get terrain height at a given position
function getTerrainHeight(x: number, z: number): number {
  const noise1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5;
  const noise2 = Math.sin(x * 0.1 + 1) * Math.cos(z * 0.08) * 0.3;
  const noise3 = Math.sin(x * 0.2) * Math.sin(z * 0.15) * 0.15;
  
  // Flatten near the building and road area
  const distFromCenter = Math.sqrt(x * x + z * z);
  const flattenFactor = Math.min(1, distFromCenter / 15);
  
  // Extra flattening for road corridor (positive z)
  const roadFlatten = z > 8 ? Math.max(0, 1 - Math.abs(x - getRoadCurveX(z)) / 6) * 0.7 : 0;
  
  return (noise1 + noise2 + noise3) * flattenFactor * (1 - roadFlatten);
}

// Check if a point is on the road or parking area (with curve)
function isOnRoad(x: number, z: number): boolean {
  // Parking area in front of door (centered at x=0, z=10 to z=14)
  const parkingWidth = 8;
  const parkingStart = 10;
  const parkingEnd = 14;
  
  if (Math.abs(x) <= parkingWidth / 2 && z >= parkingStart && z <= parkingEnd) {
    return true;
  }
  
  // Curved road from parking to edge of scene (z=14 to z=50)
  if (z > parkingEnd && z <= 50) {
    const roadCenterX = getRoadCurveX(z);
    const roadWidth = 4;
    if (Math.abs(x - roadCenterX) <= roadWidth / 2 + 0.5) {
      return true;
    }
  }
  
  return false;
}

export function Ground({ quality = 'high' }: GroundProps) {
  const isLow = quality === 'low';

  // Generate rock positions - avoid road area
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
        
        // Skip if on road
        if (isOnRoad(x, z)) continue;
        
        const scale = 0.3 + Math.random() * 0.8;
        const terrainY = getTerrainHeight(x, z);
        
        rockData.push({
          position: [x, -4 + terrainY + scale * 0.3, z],
          scale,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    });

    return rockData;
  }, [isLow]);

  // Generate grass cluster positions - avoid road area
  const grassClusters = useMemo(() => {
    if (isLow) return [];
    const clusters: { position: [number, number, number]; density: number }[] = [];
    
    for (let x = -25; x <= 25; x += 2) {
      for (let z = -25; z <= 25; z += 2) {
        // Skip areas near the building
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 12) continue;
        
        // Skip road area
        if (isOnRoad(x, z)) continue;
        
        // Random chance to place grass
        if (Math.random() > 0.4) {
          const offsetX = (Math.random() - 0.5) * 1.5;
          const offsetZ = (Math.random() - 0.5) * 1.5;
          const terrainY = getTerrainHeight(x + offsetX, z + offsetZ);
          
          clusters.push({
            position: [x + offsetX, -4 + terrainY + 0.05, z + offsetZ],
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
      
      const height = getTerrainHeight(x, z);
      positions.setZ(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, [isLow]);

  // Create curved road geometry that follows terrain
  // Road goes from z=14 (parking edge) to z=50 (scene edge)
  const roadGeometry = useMemo(() => {
    const segmentsZ = 50;
    const segmentsX = 4;
    const roadWidth = 4;
    const roadLength = 36;
    
    const geo = new THREE.PlaneGeometry(roadWidth, roadLength, segmentsX, segmentsZ);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i); // -2 to 2
      const localZ = positions.getY(i); // -18 to 18
      
      // Map to world coordinates (center at z=32, so range is z=14 to z=50)
      const worldZ = 32 + localZ;
      const curveX = getRoadCurveX(worldZ);
      const worldX = curveX + localX;
      
      // Get terrain height and add larger offset to stay above ground
      const terrainY = getTerrainHeight(worldX, worldZ);
      
      positions.setX(i, worldX);
      positions.setY(i, worldZ);
      positions.setZ(i, terrainY + 0.08);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Create parking area geometry - positioned in front of door (z=10 to z=14)
  const parkingGeometry = useMemo(() => {
    const segmentsX = 8;
    const segmentsZ = 4;
    const geo = new THREE.PlaneGeometry(8, 4, segmentsX, segmentsZ);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i);
      const localZ = positions.getY(i);
      
      const worldX = localX;
      const worldZ = 12 + localZ; // Center at z=12, so range is z=10 to z=14
      
      const terrainY = getTerrainHeight(worldX, worldZ);
      
      positions.setX(i, worldX);
      positions.setY(i, worldZ);
      positions.setZ(i, terrainY + 0.08);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  const stones = useMemo(() => {
    if (isLow) return [] as Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>;

    return Array.from({ length: 30 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Skip if on road
      if (isOnRoad(x, z)) return null;
      
      const baseScale = 0.08 + Math.random() * 0.15;
      const terrainY = getTerrainHeight(x, z);

      return {
        position: [x, -4 + terrainY + baseScale, z] as [number, number, number],
        rotation: [Math.random(), Math.random(), Math.random()] as [number, number, number],
        scale: [baseScale * 1.5, baseScale, baseScale * 1.2] as [number, number, number],
      };
    }).filter(Boolean) as Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>;
  }, [isLow]);

  // Generate gravel stones for road texture - only on door side (positive z)
  const roadGravel = useMemo(() => {
    if (isLow) return [];
    
    const gravel: Array<{ position: [number, number, number]; scale: number }> = [];
    
    // Parking area gravel (z=10 to z=14)
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 7.5;
      const z = 10 + Math.random() * 4;
      const terrainY = getTerrainHeight(x, z);
      const scale = 0.03 + Math.random() * 0.05;
      gravel.push({ position: [x, -4 + terrainY + 0.1, z], scale });
    }
    
    // Road gravel - follow curve (z=14 to z=50)
    for (let i = 0; i < 300; i++) {
      const z = 14 + Math.random() * 36;
      const curveX = getRoadCurveX(z);
      const x = curveX + (Math.random() - 0.5) * 3.5;
      const terrainY = getTerrainHeight(x, z);
      const scale = 0.03 + Math.random() * 0.05;
      gravel.push({ position: [x, -4 + terrainY + 0.1, z], scale });
    }
    
    return gravel;
  }, [isLow]);

  return (
    <group>
      {/* Main terrain */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#3d5c35"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Grass detail layer - slightly above terrain, excludes road area */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.99, 0]}
        receiveShadow
      >
        <ringGeometry args={[0, 45, 64]} />
        <meshStandardMaterial
          color="#4a6b3f"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Curved gravel road from edge to parking - follows terrain */}
      <mesh
        geometry={roadGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#9a8b7a"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Parking area in front of door - follows terrain */}
      <mesh
        geometry={parkingGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#9a8b7a"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Gravel texture on road */}
      {!isLow && roadGravel.map((stone, i) => (
        <mesh
          key={`gravel-${i}`}
          position={stone.position}
          rotation={[Math.random(), Math.random(), Math.random()]}
          scale={stone.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={Math.random() > 0.5 ? '#8b7355' : '#a09080'} 
            roughness={0.9} 
          />
        </mesh>
      ))}

      {/* Rocks */}
      {rocks.map((rock, i) => (
        <Rock key={`rock-${i}`} {...rock} />
      ))}

      {/* Large boulders */}
      {!isLow && (
        <>
          <Rock position={[-22, -3, -15]} scale={2.5} rotation={0.5} />
          <Rock position={[25, -3, 10]} scale={2.2} rotation={1.2} />
          <Rock position={[15, -3.2, -20]} scale={1.8} rotation={2.1} />
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
