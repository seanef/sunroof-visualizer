import { Slider } from '@/components/ui/slider';

interface UnitControlsProps {
  unitRows: number;
  unitColumns: number;
  arrayAzimuth: number;
  onUnitRowsChange: (rows: number) => void;
  onUnitColumnsChange: (columns: number) => void;
  onArrayAzimuthChange: (azimuth: number) => void;
}

// Helper to get cardinal direction from azimuth
const getCardinalDirection = (azimuth: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
};

export function UnitControls({
  unitRows,
  unitColumns,
  arrayAzimuth,
  onUnitRowsChange,
  onUnitColumnsChange,
  onArrayAzimuthChange,
}: UnitControlsProps) {
  return (
    <div className="space-y-5">
      {/* Unit rows */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Unit Rows</label>
          <span className="text-sm font-mono text-primary">{unitRows}</span>
        </div>
        <Slider
          value={[unitRows]}
          min={1}
          max={6}
          step={1}
          onValueChange={([v]) => onUnitRowsChange(v)}
          className="py-2"
        />
      </div>

      {/* Unit columns */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Unit Columns</label>
          <span className="text-sm font-mono text-primary">{unitColumns}</span>
        </div>
        <Slider
          value={[unitColumns]}
          min={1}
          max={8}
          step={1}
          onValueChange={([v]) => onUnitColumnsChange(v)}
          className="py-2"
        />
      </div>

      {/* Array Azimuth */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Array Azimuth (Front)</label>
          <span className="text-sm font-mono text-primary">
            {arrayAzimuth}° {getCardinalDirection(arrayAzimuth)}
          </span>
        </div>
        <Slider
          value={[arrayAzimuth]}
          min={0}
          max={359}
          step={1}
          onValueChange={([v]) => onArrayAzimuthChange(v)}
          className="py-2"
        />
        <p className="text-xs text-muted-foreground">
          Direction the panel faces (0° = North, 90° = East)
        </p>
      </div>
    </div>
  );
}
