import { useEffect, useMemo, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { Group } from 'three';

interface PVUnitArrayProps {
  rows: number;
  columns: number;
}

// PV unit footprint in meters (1500x1480 mm)
const UNIT_WIDTH = 1.5;  // 1500mm = 1.5m (x-axis)
const UNIT_DEPTH = 1.48; // 1480mm = 1.48m (z-axis)

// Scale factor to convert OBJ units (mm) to scene units (m)
const SCALE = 0.001;

export function PVUnitArray({ rows, columns }: PVUnitArrayProps) {
  const materials = useLoader(MTLLoader, '/models/Assembly_simplified_v7.mtl');
  const obj = useLoader(OBJLoader, '/models/Assembly_simplified_v7.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  // Clone the original object for instancing
  const clonedObjects = useMemo(() => {
    const clones: Group[] = [];
    
    // Calculate total array dimensions
    const totalWidth = columns * UNIT_WIDTH;
    const totalDepth = rows * UNIT_DEPTH;
    
    // Center the array on the roof
    const startX = -totalWidth / 2 + UNIT_WIDTH / 2;
    const startZ = -totalDepth / 2 + UNIT_DEPTH / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const clone = obj.clone(true);
        
        // Position each unit
        const x = startX + col * UNIT_WIDTH;
        const z = startZ + row * UNIT_DEPTH;
        
        clone.position.set(x, 0.01, z); // Slightly above roof
        clone.scale.set(SCALE, SCALE, SCALE);
        
        // Enable shadows
        clone.traverse((child) => {
          if ('castShadow' in child) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        clones.push(clone);
      }
    }
    
    return clones;
  }, [obj, rows, columns]);

  return (
    <group>
      {clonedObjects.map((clone, index) => (
        <primitive key={index} object={clone} />
      ))}
    </group>
  );
}
