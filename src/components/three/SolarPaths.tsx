import { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import SunCalc from 'suncalc';

interface SolarPathsProps {
  latitude: number;
  longitude: number;
  radius?: number;
}

// Key dates for solar paths
const SUMMER_SOLSTICE = { month: 5, day: 21, label: 'Summer Solstice' }; // June 21
const WINTER_SOLSTICE = { month: 11, day: 21, label: 'Winter Solstice' }; // December 21
const EQUINOX = { month: 2, day: 21, label: 'Equinox' }; // March 21 (same path as September)

const PATH_COLOR = '#f59e0b'; // Orange/yellow for all paths

interface PathData {
  points: THREE.Vector3[];
  highPoint: THREE.Vector3 | null;
  label: string;
}

function calculateSolarPath(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  label: string,
  radius: number
): PathData {
  const points: THREE.Vector3[] = [];
  const year = new Date().getFullYear();
  
  let highPoint: THREE.Vector3 | null = null;
  let maxAltitude = -Infinity;
  
  // Sample sun positions throughout the full 24h cycle (every 10 minutes)
  // Include below-horizon points to create continuous arcs
  for (let hour = 0; hour < 24; hour += 1/6) {
    const date = new Date(year, month, day, Math.floor(hour), (hour % 1) * 60);
    const sunPos = SunCalc.getPosition(date, latitude, longitude);
    
    // Convert altitude/azimuth to 3D coordinates
    // Match the coordinate system used in useSunPosition.ts:
    // Azimuth: 0 = south, positive = west, negative = east
    // This places the sun paths on the south side (+Z direction)
    const x = -Math.sin(sunPos.azimuth) * Math.cos(sunPos.altitude) * radius;
    const y = Math.sin(sunPos.altitude) * radius;
    const z = Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude) * radius;
    
    points.push(new THREE.Vector3(x, y, z));
    
    // Track the highest point for label placement
    if (sunPos.altitude > maxAltitude) {
      maxAltitude = sunPos.altitude;
      highPoint = new THREE.Vector3(x, y, z);
    }
  }
  
  // Close the loop by adding the first point at the end
  if (points.length > 0) {
    points.push(points[0].clone());
  }
  
  return { points, highPoint, label };
}

export function SolarPaths({ latitude, longitude, radius = 40 }: SolarPathsProps) {
  const paths = useMemo(() => {
    const summerPath = calculateSolarPath(
      latitude,
      longitude,
      SUMMER_SOLSTICE.month,
      SUMMER_SOLSTICE.day,
      SUMMER_SOLSTICE.label,
      radius
    );
    
    const winterPath = calculateSolarPath(
      latitude,
      longitude,
      WINTER_SOLSTICE.month,
      WINTER_SOLSTICE.day,
      WINTER_SOLSTICE.label,
      radius
    );
    
    const equinoxPath = calculateSolarPath(
      latitude,
      longitude,
      EQUINOX.month,
      EQUINOX.day,
      EQUINOX.label,
      radius
    );
    
    return [summerPath, winterPath, equinoxPath];
  }, [latitude, longitude, radius]);

  return (
    <group>
      {paths.map((path, index) => (
        <group key={index}>
          {/* Solar path arc */}
          {path.points.length > 2 && (
            <Line
              points={path.points}
              color={PATH_COLOR}
              lineWidth={1.5}
              dashed
              dashScale={3}
              dashSize={0.8}
              gapSize={0.4}
            />
          )}
          
          {/* Label at high point */}
          {path.highPoint && (
            <group position={path.highPoint}>
              {/* Small marker sphere */}
              <mesh>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshBasicMaterial color={PATH_COLOR} />
              </mesh>
              
              {/* Text label */}
              <Text
                position={[0, 1.5, 0]}
                fontSize={1.2}
                color={PATH_COLOR}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.08}
                outlineColor="#000000"
              >
                {path.label}
              </Text>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
