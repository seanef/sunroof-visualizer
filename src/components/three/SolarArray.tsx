import { SolarPanel } from './SolarPanel';

interface SolarArrayProps {
  rows: number;
  spacing: number;
  panelsPerRow?: number;
}

export function SolarArray({ rows, spacing, panelsPerRow = 8 }: SolarArrayProps) {
  const panels = [];
  const panelWidth = 1.0;
  const totalWidth = panelsPerRow * panelWidth;
  const startX = -totalWidth / 2 + panelWidth / 2;
  const startZ = -((rows - 1) * spacing) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < panelsPerRow; col++) {
      const x = startX + col * panelWidth;
      const z = startZ + row * spacing;
      const y = 1.05; // Height above roof (half panel height + leg)

      panels.push(
        <SolarPanel
          key={`panel-${row}-${col}`}
          position={[x, y, z]}
        />
      );
    }
  }

  return <group>{panels}</group>;
}
