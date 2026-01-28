import { useRef } from 'react';
import { DirectionalLight } from 'three';
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

  return (
    <>
      {/* Main sun light */}
      <directionalLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        intensity={intensity}
        color={getColor()}
        castShadow
        shadow-mapSize-width={quality === 'low' ? 1024 : 2048}
        shadow-mapSize-height={quality === 'low' ? 1024 : 2048}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Sun sphere visual */}
      {!isNight && (
        <mesh position={[position.x, position.y, position.z]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial color={getColor()} />
        </mesh>
      )}

      {/* Ambient light for fill */}
      <ambientLight intensity={isNight ? 0.1 : 0.3} color="#b4c7e7" />

      {/* Hemisphere light for sky/ground color */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#3d5c3d"
        intensity={isNight ? 0.1 : 0.4}
      />
    </>
  );
}
