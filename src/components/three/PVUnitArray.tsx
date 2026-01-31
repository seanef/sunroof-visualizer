import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { Box3, Vector3, Mesh } from 'three';

interface PVUnitArrayProps {
  rows: number;
  columns: number;
  azimuth: number; // degrees, 0 = North, 90 = East
}

// Actual PV unit dimensions in meters (for scaling)
const UNIT_ACTUAL_WIDTH = 1.58;  // 1580mm = 1.58m
const UNIT_ACTUAL_DEPTH = 1.489; // 1489mm = 1.489m

// Tiling spacing in meters (actual size minus overlap)
const UNIT_SPACING_X = 1.545;  // 1580mm - 35mm overlap = 1.545m
const UNIT_SPACING_Z = 1.451; // 1489mm - 38mm overlap = 1.451m

export function PVUnitArray({ rows, columns, azimuth }: PVUnitArrayProps) {
  const materials = useLoader(MTLLoader, '/models/Assembly_simplified_v7.mtl');
  const obj = useLoader(OBJLoader, '/models/Assembly_simplified_v7.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  // Center horizontally and lift so bottom sits on ground (Y=0), calculate proper scale
  const { centeredObj, scale, yOffset } = useMemo(() => {
    const clone = obj.clone(true);
    
    // Calculate bounding box
    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    
    // Log actual model dimensions for debugging
    console.log('OBJ model size:', size.x, size.y, size.z);
    console.log('OBJ model bounds min:', box.min.x, box.min.y, box.min.z);
    console.log('OBJ model bounds max:', box.max.x, box.max.y, box.max.z);
    
    // Calculate scale based on actual unit dimensions (not spacing)
    const modelFootprint = Math.max(size.x, size.y); // Original horizontal dimensions
    const targetFootprint = Math.max(UNIT_ACTUAL_WIDTH, UNIT_ACTUAL_DEPTH);
    const calculatedScale = targetFootprint / modelFootprint;
    
    // Center horizontally (X and Z after rotation), but keep Y at bottom
    // We'll translate X and Y (which becomes Z after -90° X rotation) to center
    // And translate Z (which becomes Y after rotation) so bottom is at 0
    clone.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        // Center on X and Y (horizontal centering)
        // For Z: shift so that min.z becomes 0 (bottom of model at origin)
        (child.geometry as any).translate(-center.x, -center.y, -box.min.z);
      }
    });
    
    // After rotation -90° around X: original Z becomes Y
    // The scaled height offset to place bottom on roof surface
    const scaledBottomOffset = 0; // Bottom is now at Z=0 before rotation, becomes Y=0 after
    
    return { centeredObj: clone, scale: calculatedScale, yOffset: scaledBottomOffset };
  }, [obj]);

  // Create tiled instances
  const instances = useMemo(() => {
    const result: JSX.Element[] = [];
    
    // Calculate total array dimensions using spacing
    const totalWidth = columns * UNIT_SPACING_X;
    const totalDepth = rows * UNIT_SPACING_Z;
    
    // Center the array on the roof
    const startX = -totalWidth / 2 + UNIT_SPACING_X / 2;
    const startZ = -totalDepth / 2 + UNIT_SPACING_Z / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const clone = centeredObj.clone(true);
        
        // Position each unit using spacing (creates overlap)
        const x = startX + col * UNIT_SPACING_X;
        const z = startZ + row * UNIT_SPACING_Z;
        
        clone.position.set(x, 0, z);
        clone.scale.set(scale, scale, scale);
        
        // Rotate 90 degrees around X-axis so panels lay flat with lamellas vertical
        clone.rotation.set(-Math.PI / 2, 0, 0);
        
        // Enable shadows on all mesh children
        clone.traverse((child) => {
          if (child instanceof Mesh) {
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
  }, [centeredObj, rows, columns, scale]);

  // Convert azimuth to radians for rotation (0° = North, 90° = East)
  // The model's front face needs to align with the azimuth direction
  // Subtract 90° to correct the initial orientation offset
  const azimuthRadians = ((azimuth - 90) * Math.PI) / 180;

  return <group rotation={[0, azimuthRadians, 0]}>{instances}</group>;
}
