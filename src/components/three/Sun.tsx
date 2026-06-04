import { useRef, useEffect } from 'react';
import { DirectionalLight, Vector3 } from 'three';
import { SunPosition, LightingConfig } from '@/types/solar';

interface SunProps {
  position: SunPosition;
  quality?: 'high' | 'low';
  lighting: LightingConfig;
}

// Calculate air mass using Kasten-Young formula (more accurate near horizon)
function getAirMass(altitudeRad: number): number {
  const altDeg = (altitudeRad * 180) / Math.PI;
  if (altDeg <= 0) return Infinity;
  
  // Kasten-Young formula: AM = 1 / (sin(h) + 0.50572 * (h + 6.07995)^-1.6364)
  const sinAlt = Math.sin(altitudeRad);
  const term = 0.50572 * Math.pow(altDeg + 6.07995, -1.6364);
  return 1 / (sinAlt + term);
}

// Calculate atmospheric attenuation using Meinel approximation of Beer-Lambert
// Returns fraction of light transmitted (0-1)
function getAtmosphericTransmittance(airMass: number): number {
  if (!isFinite(airMass) || airMass <= 0) return 0;
  // Meinel model: I/I₀ ≈ 0.7^(AM^0.678)
  return Math.pow(0.7, Math.pow(airMass, 0.678));
}

export function Sun({ position, quality = 'high', lighting }: SunProps) {
  const lightRef = useRef<DirectionalLight>(null);

  // Calculate intensity using air mass attenuation (physically accurate)
  const airMass = getAirMass(position.altitude);
  const transmittance = getAtmosphericTransmittance(airMass);
  const intensity = transmittance * lighting.sunIntensity;
  const isNight = position.altitude < 0;

  // Sun color based on altitude (more orange at sunset/sunrise)
  const getColor = () => {
    const altDeg = (position.altitude * 180) / Math.PI;
    if (altDeg < 5) return '#ff8c42';
    if (altDeg < 15) return '#ffb347';
    if (altDeg < 30) return '#ffe4b5';
    return '#fffaf0';
  };

  // Calculate a closer light position for proper shadow casting
  // The light should be positioned relative to the scene center (0, 0, 0)
  const lightDistance = 25;
  const normalizedDir = new Vector3(position.x, position.y, position.z).normalize();
  const lightPos: [number, number, number] = [
    normalizedDir.x * lightDistance,
    normalizedDir.y * lightDistance,
    normalizedDir.z * lightDistance,
  ];

  // Update shadow camera to follow light position
  useEffect(() => {
    if (lightRef.current) {
      // Target the scene center (where building/roof is)
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
      
      // Update shadow camera
      lightRef.current.shadow.camera.updateProjectionMatrix();
    }
  }, [position]);

  return (
    <>
      {/* Main sun light - positioned closer for proper shadow mapping */}
      <directionalLight
        ref={lightRef}
        position={lightPos}
        intensity={intensity}
        color={getColor()}
        castShadow
        shadow-mapSize-width={quality === 'low' ? 2048 : 4096}
        shadow-mapSize-height={quality === 'low' ? 2048 : 4096}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={quality === 'low' ? -15 : -20}
        shadow-camera-right={quality === 'low' ? 15 : 20}
        shadow-camera-top={quality === 'low' ? 15 : 20}
        shadow-camera-bottom={quality === 'low' ? -15 : -20}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />

      {/* Night fill light ("moon") so the scene isn't pitch black */}
      {isNight && (
        <directionalLight
          position={[15, 20, 10]}
          intensity={0.35}
          color={'hsl(210 25% 85%)'}
        />
      )}

      {/* Sun sphere visual - at actual sun position for visualization */}
      {!isNight && (
        <mesh position={[position.x, position.y, position.z]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial color={getColor()} />
        </mesh>
      )}

      {/* Ambient light for fill - balanced for shadow visibility */}
      <ambientLight intensity={isNight ? 0.12 : lighting.ambientIntensity} color={'hsl(210 35% 85%)'} />

      {/* Hemisphere light for sky/ground color */}
      <hemisphereLight
        color={'hsl(200 60% 75%)'}
        groundColor={'hsl(120 20% 25%)'}
        intensity={isNight ? 0.08 : lighting.hemisphereIntensity}
      />
    </>
  );
}
