import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import { Roof } from './Roof';
import { PVUnitArray } from './PVUnitArray';
import { Sun } from './Sun';
import { Ground } from './Ground';
import { Compass } from './Compass';
import { SolarPaths } from './SolarPaths';
import { SolarConfig, SunPosition } from '@/types/solar';
import { useIsMobile } from '@/hooks/use-mobile';

interface SceneProps {
  config: SolarConfig;
  sunPosition: SunPosition;
}

export function Scene({ config, sunPosition }: SceneProps) {
  const isDay = sunPosition.altitude > 0;
  const isMobile = useIsMobile();

  return (
    <Canvas
      key={isMobile ? 'mobile' : 'desktop'}
      // Shadows must be enabled at the renderer level; otherwise no objects will cast onto receivers
      // (ground/roof), even if castShadow/receiveShadow are set on meshes.
      // Using "soft" enables PCFSoftShadowMap for smoother shadow edges
      shadows={isMobile ? true : 'soft'}
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
      dpr={isMobile ? 1 : [1, 2]}
      style={{ width: '100%', height: '100%' }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
    >
      {/* Sky */}
      {isDay && (
        <Sky
          distance={450000}
          sunPosition={[sunPosition.x, sunPosition.y, sunPosition.z]}
          rayleigh={0.2}
          turbidity={1}
          mieCoefficient={0.001}
          mieDirectionalG={0.99}
        />
      )}

      {/* Night sky */}
      {!isDay && <color attach="background" args={['#0a0a1a']} />}

      {/* Sun and lighting */}
      <Sun position={sunPosition} quality={isMobile ? 'low' : 'high'} lighting={config.lighting} />

      {/* Roof */}
      <Roof material={config.roofMaterial} />

      {/* PV Units from OBJ model */}
      <Suspense fallback={null}>
        <PVUnitArray
          rows={config.unitRows}
          columns={config.unitColumns}
          azimuth={config.arrayAzimuth}
        />
      </Suspense>

      {/* Ground with terrain, grass, and rocks */}
      <Ground quality={isMobile ? 'low' : 'high'} />

      {/* Compass indicator */}
      <Compass />

      {/* Solar paths on sky dome */}
      <SolarPaths 
        latitude={config.latitude} 
        longitude={config.longitude} 
      />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={50}
      />

      {/* Environment for reflections - configurable intensity */}
      {!isMobile && <Environment preset="city" environmentIntensity={config.lighting.environmentIntensity} />}
    </Canvas>
  );
}
