import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { Box3, Vector3 } from 'three';

interface PVUnitArrayProps {
  rows: number;
  columns: number;
}

// PV unit footprint in meters (1580x1489 mm)
const UNIT_WIDTH = 1.58;  // 1580mm = 1.58m (x-axis after rotation)
const UNIT_DEPTH = 1.489; // 1489mm = 1.489m (z-axis after rotation)

export function PVUnitArray({ rows, columns }: PVUnitArrayProps) {
  const materials = useLoader(MTLLoader, '/models/Assembly_simplified_v7.mtl');
  const obj = useLoader(OBJLoader, '/models/Assembly_simplified_v7.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  // Center the original geometry and calculate proper scale
  const { centeredObj, scale } = useMemo(() => {
    const clone = obj.clone(true);
    
    // Calculate bounding box
    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    
    // Log actual model dimensions for debugging
    console.log('OBJ model size:', size.x, size.y, size.z);
    
    // After -90° X rotation: Y becomes Z, Z becomes -Y
    // So original Y dimension becomes the depth, original Z becomes height
    // We want the footprint to be 1.5m x 1.48m
    // Calculate scale based on the larger horizontal dimension
    const modelFootprint = Math.max(size.x, size.y); // Original horizontal dimensions
    const targetFootprint = Math.max(UNIT_WIDTH, UNIT_DEPTH);
    const calculatedScale = targetFootprint / modelFootprint;
    
    // Offset all children to center the model at origin
    clone.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        (child.geometry as any).translate(-center.x, -center.y, -center.z);
      }
    });
    
    return { centeredObj: clone, scale: calculatedScale };
  }, [obj]);

  // Create tiled instances
  const instances = useMemo(() => {
    const result: JSX.Element[] = [];
    
    // Calculate total array dimensions
    const totalWidth = columns * UNIT_WIDTH;
    const totalDepth = rows * UNIT_DEPTH;
    
    // Center the array on the roof
    const startX = -totalWidth / 2 + UNIT_WIDTH / 2;
    const startZ = -totalDepth / 2 + UNIT_DEPTH / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const clone = centeredObj.clone(true);
        
        // Position each unit edge-to-edge
        const x = startX + col * UNIT_WIDTH;
        const z = startZ + row * UNIT_DEPTH;
        
        clone.position.set(x, 0.05, z);
        clone.scale.set(scale, scale, scale);
        
        // Rotate 90 degrees around X-axis so panels lay flat with lamellas vertical
        clone.rotation.set(-Math.PI / 2, 0, 0);
        
        // Enable shadows
        clone.traverse((child) => {
          if ('castShadow' in child) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        result.push(
          <primitive key={`unit-${row}-${col}`} object={clone} />
        );
      }
    }
    
    return result;
  }, [centeredObj, rows, columns]);

  return <group>{instances}</group>;
}
