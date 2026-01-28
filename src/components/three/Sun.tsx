import { useRef, useEffect } from 'react';
import { DirectionalLight, Vector3 } from 'three';
import { SunPosition } from '@/types/solar';

interface SunProps {
  position: SunPosition;
  quality?: 'high' | 'low';
}

export function Sun({ position, quality = 'high' }: SunProps) {
  const lightRef = useRef<DirectionalLight>(null);

  // Calculate intensity based on altitude (sun height)
  const intensity = Math.max(0, Math.sin(position.altitude)) * 2.5;
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
        shadow-mapSize-width={quality === 'low' ? 1024 : 4096}
        shadow-mapSize-height={quality === 'low' ? 1024 : 4096}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
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

      {/* Ambient light for fill */}
      <ambientLight intensity={isNight ? 0.28 : 0.3} color={'hsl(210 35% 85%)'} />

      {/* Hemisphere light for sky/ground color */}
      <hemisphereLight
        color={'hsl(200 60% 75%)'}
        groundColor={'hsl(120 20% 25%)'}
        intensity={isNight ? 0.22 : 0.4}
      />
    </>
  );
}
