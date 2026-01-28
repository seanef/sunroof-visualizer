import { Text } from '@react-three/drei';

export function Compass() {
  const radius = 4;
  const labelOffset = radius + 0.75;
  const arrowLength = 1;

  return (
    <group position={[-10, 0.02, 10]} scale={0.5}>
      {/* Compass circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 64]} />
        <meshStandardMaterial color="#1a1a2e" opacity={0.8} transparent />
      </mesh>

      {/* Inner fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[radius - 0.3, 64]} />
        <meshStandardMaterial color="#0f0f1a" opacity={0.6} transparent />
      </mesh>

      {/* Cardinal direction arrows and labels */}
      {/* North (-Z direction) */}
      <group position={[0, 0.05, -labelOffset]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={1.2}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          N
        </Text>
      </group>
      <mesh position={[0, 0.05, -radius + arrowLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, arrowLength, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* South (+Z direction) */}
      <group position={[0, 0.05, labelOffset]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={1}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          S
        </Text>
      </group>
      <mesh position={[0, 0.05, radius - arrowLength / 2]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <coneGeometry args={[0.3, arrowLength * 0.8, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* East (+X direction) */}
      <group position={[labelOffset, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={1}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          E
        </Text>
      </group>
      <mesh position={[radius - arrowLength / 2, 0.05, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.3, arrowLength * 0.8, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* West (-X direction) */}
      <group position={[-labelOffset, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={1}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          W
        </Text>
      </group>
      <mesh position={[-radius + arrowLength / 2, 0.05, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <coneGeometry args={[0.3, arrowLength * 0.8, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Cross lines */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, radius * 1.8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.1, radius * 1.8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Diagonal lines */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.05, radius * 1.6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.05, radius * 1.6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Center point */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
