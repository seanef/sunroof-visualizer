import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, Grid } from '@react-three/drei';
import { Roof } from './Roof';
import { SolarArray } from './SolarArray';
import { Sun } from './Sun';
import { Ground } from './Ground';
import { SolarConfig, SunPosition } from '@/types/solar';

interface SceneProps {
  config: SolarConfig;
  sunPosition: SunPosition;
}

export function Scene({ config, sunPosition }: SceneProps) {
  const isDay = sunPosition.altitude > 0;

  return (
    <Canvas
      shadows
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: true }}
    >
      {/* Sky */}
      {isDay && (
        <Sky
          distance={450000}
          sunPosition={[sunPosition.x, sunPosition.y, sunPosition.z]}
          inclination={0.5}
          azimuth={0.25}
        />
      )}

      {/* Night sky */}
      {!isDay && <color attach="background" args={['#0a0a1a']} />}

      {/* Sun and lighting */}
      <Sun position={sunPosition} />

      {/* Roof */}
      <Roof material={config.roofMaterial} />

      {/* Solar panels */}
      <SolarArray
        rows={config.panelRows}
        spacing={config.panelSpacing}
      />

      {/* Ground with terrain, grass, and rocks */}
      <Ground />

      {/* Grid helper */}
      <Grid
        position={[0, 0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#718096"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
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

      {/* Environment for reflections */}
      <Environment preset="city" />
    </Canvas>
  );
}
