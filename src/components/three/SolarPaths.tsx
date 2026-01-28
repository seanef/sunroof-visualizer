import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import SunCalc from 'suncalc';

interface SolarPathsProps {
  latitude: number;
  longitude: number;
  radius?: number;
}

// Key dates for solar paths
const SUMMER_SOLSTICE = { month: 5, day: 21 }; // June 21
const WINTER_SOLSTICE = { month: 11, day: 21 }; // December 21
const EQUINOX = { month: 2, day: 21 }; // March 21 (same path as September)

function calculateSolarPath(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  radius: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const year = new Date().getFullYear();
  
  // Sample sun positions throughout the day (every 15 minutes)
  for (let hour = 0; hour < 24; hour += 0.25) {
    const date = new Date(year, month, day, Math.floor(hour), (hour % 1) * 60);
    const sunPos = SunCalc.getPosition(date, latitude, longitude);
    
    // Only include points when sun is above horizon
    if (sunPos.altitude > 0) {
      // Convert altitude/azimuth to 3D coordinates
      // Azimuth: 0 = South, positive = West, negative = East
      // We need to adjust so North is -Z in our scene
      const azimuthAdjusted = sunPos.azimuth + Math.PI; // Shift so 0 = North
      
      const x = Math.sin(azimuthAdjusted) * Math.cos(sunPos.altitude) * radius;
      const y = Math.sin(sunPos.altitude) * radius;
      const z = Math.cos(azimuthAdjusted) * Math.cos(sunPos.altitude) * radius;
      
      points.push(new THREE.Vector3(x, y, z));
    }
  }
  
  return points;
}

export function SolarPaths({ latitude, longitude, radius = 40 }: SolarPathsProps) {
  const paths = useMemo(() => {
    const summerPath = calculateSolarPath(
      latitude,
      longitude,
      SUMMER_SOLSTICE.month,
      SUMMER_SOLSTICE.day,
      radius
    );
    
    const winterPath = calculateSolarPath(
      latitude,
      longitude,
      WINTER_SOLSTICE.month,
      WINTER_SOLSTICE.day,
      radius
    );
    
    const equinoxPath = calculateSolarPath(
      latitude,
      longitude,
      EQUINOX.month,
      EQUINOX.day,
      radius
    );
    
    return { summerPath, winterPath, equinoxPath };
  }, [latitude, longitude, radius]);

  // Don't render if paths are empty (extreme latitudes during polar night/day)
  const hasSummer = paths.summerPath.length > 2;
  const hasWinter = paths.winterPath.length > 2;
  const hasEquinox = paths.equinoxPath.length > 2;

  return (
    <group>
      {/* Summer solstice path - orange/yellow */}
      {hasSummer && (
        <Line
          points={paths.summerPath}
          color="#f59e0b"
          lineWidth={2}
          dashed
          dashScale={2}
          dashSize={0.5}
          gapSize={0.3}
        />
      )}
      
      {/* Winter solstice path - blue */}
      {hasWinter && (
        <Line
          points={paths.winterPath}
          color="#3b82f6"
          lineWidth={2}
          dashed
          dashScale={2}
          dashSize={0.5}
          gapSize={0.3}
        />
      )}
      
      {/* Equinox path (March/September) - white/gray */}
      {hasEquinox && (
        <Line
          points={paths.equinoxPath}
          color="#94a3b8"
          lineWidth={2}
          dashed
          dashScale={2}
          dashSize={0.5}
          gapSize={0.3}
        />
      )}
      
      {/* Labels at path endpoints - East side */}
      {hasSummer && paths.summerPath.length > 0 && (
        <SolarPathLabel
          position={paths.summerPath[0]}
          text="Jun 21"
          color="#f59e0b"
        />
      )}
      {hasWinter && paths.winterPath.length > 0 && (
        <SolarPathLabel
          position={paths.winterPath[0]}
          text="Dec 21"
          color="#3b82f6"
        />
      )}
      {hasEquinox && paths.equinoxPath.length > 0 && (
        <SolarPathLabel
          position={paths.equinoxPath[0]}
          text="Mar/Sep"
          color="#94a3b8"
        />
      )}
    </group>
  );
}

interface SolarPathLabelProps {
  position: THREE.Vector3;
  text: string;
  color: string;
}

function SolarPathLabel({ position, text, color }: SolarPathLabelProps) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
