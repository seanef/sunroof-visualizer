import { useRef } from 'react';
import { Mesh } from 'three';

interface SolarPanelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function SolarPanel({ position, rotation = [0, 0, 0] }: SolarPanelProps) {
  const meshRef = useRef<Mesh>(null);

  // xM3 unit dimensions (approximate - can be updated with actual dimensions)
  const panelWidth = 0.15; // 15cm thickness for bifacial
  const panelHeight = 2.1; // ~2.1m tall
  const panelDepth = 1.0; // ~1m wide

  return (
    <group position={position} rotation={rotation}>
      {/* Main panel frame */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[panelDepth, panelHeight, panelWidth]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Solar cells (front) */}
      <mesh position={[0, 0, panelWidth / 2 + 0.001]} castShadow>
        <boxGeometry args={[panelDepth * 0.9, panelHeight * 0.9, 0.01]} />
        <meshStandardMaterial
          color="#0f1729"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Solar cells (back - bifacial) */}
      <mesh position={[0, 0, -panelWidth / 2 - 0.001]} castShadow>
        <boxGeometry args={[panelDepth * 0.9, panelHeight * 0.9, 0.01]} />
        <meshStandardMaterial
          color="#0f1729"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Frame edges */}
      <mesh position={[0, panelHeight / 2, 0]}>
        <boxGeometry args={[panelDepth + 0.02, 0.03, panelWidth + 0.02]} />
        <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -panelHeight / 2, 0]}>
        <boxGeometry args={[panelDepth + 0.02, 0.03, panelWidth + 0.02]} />
        <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Support legs */}
      <mesh position={[-panelDepth / 3, -panelHeight / 2 - 0.15, 0]} castShadow>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#5a5a6a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[panelDepth / 3, -panelHeight / 2 - 0.15, 0]} castShadow>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshStandardMaterial color="#5a5a6a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
