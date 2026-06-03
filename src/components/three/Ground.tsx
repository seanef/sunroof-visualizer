import { useEffect, useMemo, useRef } from 'react';
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

// Road/parking configuration constants
// Door is on the +Z side (z ≈ +7.65 with wall thickness), so road/parking/gravel go on positive Z
const PARKING_Z_START = 7.65; // At the building wall (depth/2 + wallThickness/2 = 7.5 + 0.15)
const PARKING_Z_END = 12;     // Parking extends outward
const ROAD_Z_START = 11;      // Road starts overlapping with parking
const ROAD_Z_END = 50;        // Road extends to edge of scene

// Road/parking surface height above terrain. Small offset to sit visibly on ground.
const ROAD_SURFACE_OFFSET = 0.08;

// Get the X offset for the road curve at a given Z position
function getRoadCurveX(z: number): number {
  // Parking area is straight
  if (z <= PARKING_Z_END) return 0;

  // Gentle S-curve using sine waves
  const t = (z - PARKING_Z_END) / (ROAD_Z_END - PARKING_Z_END);
  return Math.sin(t * Math.PI * 1.5) * 2.5 + Math.sin(t * Math.PI * 3) * 0.8;
}

// Get terrain height at a given position
function getTerrainHeight(x: number, z: number): number {
  // Layered fbm-style noise — broader rolling hills + medium undulation + fine detail
  const hills    = Math.sin(x * 0.035 + 0.7) * Math.cos(z * 0.04) * 1.4;
  const hills2   = Math.sin(x * 0.022 - 1.3) * Math.cos(z * 0.028 + 0.4) * 1.1;
  const medium   = Math.sin(x * 0.09 + 1.1) * Math.cos(z * 0.075) * 0.55;
  const medium2  = Math.cos(x * 0.13 - 0.6) * Math.sin(z * 0.11 + 2.0) * 0.35;
  const fine     = Math.sin(x * 0.27) * Math.sin(z * 0.23) * 0.18;
  const microbump= Math.sin(x * 0.55 + z * 0.4) * Math.cos(z * 0.6 - x * 0.3) * 0.08;

  // Flatten near the building and road area
  const distFromCenter = Math.sqrt(x * x + z * z);
  const flattenFactor = Math.min(1, Math.max(0, (distFromCenter - 10) / 12));

  // Extra flattening for road corridor (positive z, door side)
  const roadFlatten = z > PARKING_Z_START ? Math.max(0, 1 - Math.abs(x - getRoadCurveX(z)) / 6) * 0.85 : 0;

  return (hills + hills2 + medium + medium2 + fine + microbump) * flattenFactor * (1 - roadFlatten);
}

// Check if a point is on the road or parking area (with curve)
function isOnRoad(x: number, z: number): boolean {
  const parkingWidth = 8;
  const roadWidth = 4;
  
  // Parking area (positive z, adjacent to door)
  if (Math.abs(x) <= parkingWidth / 2 && z >= PARKING_Z_START && z <= PARKING_Z_END) {
    return true;
  }
  
  // Curved road from parking to edge of scene
  if (z >= ROAD_Z_START && z <= ROAD_Z_END) {
    const roadCenterX = getRoadCurveX(z);
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
    const segments = isLow ? 48 : 128;
    const geo = new THREE.PlaneGeometry(100, 100, segments, segments);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const worldZ = -y;
      
      const height = getTerrainHeight(x, worldZ);
      positions.setZ(i, height);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [isLow]);

  // Procedural grass color map (patches + broad gradients) to ensure visible variation
  const grassColorMap = useMemo(() => {
    // Always generate a map so the terrain never falls back to white on low quality.
    // Use a lower resolution for mobile/low quality to keep it cheap.
    const size = isLow ? 96 : 256;
    const data = new Uint8Array(size * size * 4);

    // World extents for the plane (100x100 centered at origin)
    const worldMin = -50;
    const worldSize = 100;

    const patchCenters = [
      { x: -15, z: -20, radius: 12, hue: 0.10 },
      { x: 20, z: 15, radius: 10, hue: -0.06 },
      { x: -25, z: 10, radius: 8, hue: 0.12 },
      { x: 10, z: -25, radius: 15, hue: -0.04 },
      { x: 30, z: -10, radius: 9, hue: 0.08 },
      { x: -10, z: 25, radius: 11, hue: -0.05 },
      { x: 25, z: 25, radius: 7, hue: 0.14 },
      { x: -30, z: -15, radius: 10, hue: 0.06 },
    ];

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const u = px / (size - 1);
        const v = py / (size - 1);

        // Map UVs to world X/Z
        const x = worldMin + u * worldSize;
        const z = worldMin + v * worldSize;

        // Broad gradients
        const gradient1 = Math.sin(x * 0.04 + z * 0.03) * 0.5 + 0.5;
        const gradient2 = Math.cos(x * 0.025 - z * 0.04 + 1.5) * 0.5 + 0.5;

        // Medium patches
        const patch1 = Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.5 + 0.5;
        const patch2 = Math.cos(x * 0.08 + 2) * Math.sin(z * 0.15 - 1) * 0.5 + 0.5;

        // Fine detail
        const detail = Math.sin(x * 0.32 + z * 0.28) * Math.cos(x * 0.22 - z * 0.36) * 0.5 + 0.5;

        // Radial patch influence (smooth falloff)
        let patchInfluence = 0;
        for (const patch of patchCenters) {
          const dx = x - patch.x;
          const dz = z - patch.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < patch.radius) {
            const t = 1 - dist / patch.radius;
            const smooth = t * t * (3 - 2 * t);
            patchInfluence += patch.hue * smooth;
          }
        }

        const combined = gradient1 * 0.22 + gradient2 * 0.18 + patch1 * 0.20 + patch2 * 0.16 + detail * 0.24;
        const variation = (combined - 0.5) * 0.55 + patchInfluence;

        // Base lighter grass in linear-ish space, converted to sRGB via texture.colorSpace
        const baseR = 0.32;
        const baseG = 0.58;
        const baseB = 0.28;

        const r = Math.max(0.22, Math.min(0.55, baseR + variation * 0.60 + patchInfluence * 0.20));
        const g = Math.max(0.40, Math.min(0.75, baseG + variation * 0.45));
        const b = Math.max(0.18, Math.min(0.45, baseB - variation * 0.20));

        const idx = (py * size + px) * 4;
        data[idx] = Math.round(r * 255);
        data[idx + 1] = Math.round(g * 255);
        data[idx + 2] = Math.round(b * 255);
        data[idx + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;

    return tex;
  }, [isLow]);

  useEffect(() => {
    return () => {
      grassColorMap?.dispose();
    };
  }, [grassColorMap]);

  // Create curved road geometry that follows terrain (positive Z, door side)
  // After mesh rotation (-PI/2 on X): localY → -worldZ, localZ → worldY
  // So to place road at worldZ, we need localY = -worldZ
  const roadGeometry = useMemo(() => {
    const segmentsZ = 50;
    const segmentsX = 4;
    const roadWidth = 4;
    const roadLength = ROAD_Z_END - ROAD_Z_START;
    const roadCenterZ = (ROAD_Z_START + ROAD_Z_END) / 2;
    
    const geo = new THREE.PlaneGeometry(roadWidth, roadLength, segmentsX, segmentsZ);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i);
      const localY = positions.getY(i); // ranges from -roadLength/2 to +roadLength/2
      
      // Map localY to world Z coordinate (door side is +Z)
      // localY=0 should map to roadCenterZ, localY ranges ±roadLength/2
      // But after rotation, worldZ = -localY, so we need localY = -worldZ
      // If we want worldZ = roadCenterZ + offset, then localY = -(roadCenterZ + offset)
      // But localY currently = offset (from -roadLength/2 to +roadLength/2)
      // So worldZ after rotation = -localY = -offset
      // To get worldZ = roadCenterZ + offset, we need to shift: set localY = -(roadCenterZ + localY)
      
      const worldZ = roadCenterZ + localY; // where we want this vertex in world space
      const curveX = getRoadCurveX(worldZ);
      const worldX = curveX + localX;
      const terrainHeight = getTerrainHeight(worldX, worldZ);
      
      positions.setX(i, worldX);
      positions.setY(i, -worldZ); // localY = -worldZ so after rotation worldZ = -localY = worldZ
      positions.setZ(i, terrainHeight + ROAD_SURFACE_OFFSET);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [isLow]);

  // Create parking area geometry (positive Z, adjacent to door)
  const parkingGeometry = useMemo(() => {
    const segmentsX = 8;
    const segmentsZ = 4;
    const parkingLength = PARKING_Z_END - PARKING_Z_START;
    const parkingCenterZ = (PARKING_Z_START + PARKING_Z_END) / 2;
    
    const geo = new THREE.PlaneGeometry(8, parkingLength, segmentsX, segmentsZ);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const localX = positions.getX(i);
      const localY = positions.getY(i);
      
      const worldX = localX;
      const worldZ = parkingCenterZ + localY;
      const terrainHeight = getTerrainHeight(worldX, worldZ);
      
      positions.setX(i, worldX);
      positions.setY(i, -worldZ); // After rotation: worldZ = -localY
      positions.setZ(i, terrainHeight + ROAD_SURFACE_OFFSET);
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

  // Generate gravel stones for road texture (positive Z, door side)
  const roadGravel = useMemo(() => {
    if (isLow) return [];
    
    const gravel: Array<{ position: [number, number, number]; scale: number; rotation: [number, number, number]; color: string }> = [];
    
    // Parking area gravel (positive Z)
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 7.5;
      const z = PARKING_Z_START + Math.random() * (PARKING_Z_END - PARKING_Z_START);
      const terrainY = getTerrainHeight(x, z);
      const scale = 0.03 + Math.random() * 0.05;
      gravel.push({ 
        position: [x, -4 + terrainY + ROAD_SURFACE_OFFSET + scale, z], 
        scale,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        color: Math.random() > 0.5 ? '#8b7355' : '#a09080'
      });
    }
    
    // Road gravel - follow curve (positive Z)
    for (let i = 0; i < 300; i++) {
      const z = ROAD_Z_START + Math.random() * (ROAD_Z_END - ROAD_Z_START);
      const curveX = getRoadCurveX(z);
      const x = curveX + (Math.random() - 0.5) * 3.5;
      const terrainY = getTerrainHeight(x, z);
      const scale = 0.03 + Math.random() * 0.05;
      gravel.push({ 
        position: [x, -4 + terrainY + ROAD_SURFACE_OFFSET + scale, z], 
        scale,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        color: Math.random() > 0.5 ? '#8b7355' : '#a09080'
      });
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
          map={grassColorMap}
          // Base tint so even if the map is subtle you still get a grassy green.
          color="#3d5c35"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Grass detail layer removed - was occluding road/parking surfaces */}

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
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
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
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Gravel texture on road - only on negative z side */}
      {!isLow && roadGravel.map((stone, i) => (
        <mesh
          key={`gravel-${i}`}
          position={stone.position}
          rotation={stone.rotation}
          scale={stone.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={stone.color} 
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
