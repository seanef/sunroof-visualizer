import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

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
  const handleRowsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 6) {
      onUnitRowsChange(value);
    }
  };

  const handleColumnsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 8) {
      onUnitColumnsChange(value);
    }
  };

  const handleAzimuthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 359) {
      onArrayAzimuthChange(value);
    }
  };

  return (
    <div className="space-y-5">
      {/* Unit rows */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Unit Rows</label>
          <Input
            type="number"
            min={1}
            max={6}
            value={unitRows}
            onChange={handleRowsInput}
            className="w-16 h-7 text-sm font-mono text-center px-2"
          />
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
          <Input
            type="number"
            min={1}
            max={8}
            value={unitColumns}
            onChange={handleColumnsInput}
            className="w-16 h-7 text-sm font-mono text-center px-2"
          />
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
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={359}
              value={arrayAzimuth}
              onChange={handleAzimuthInput}
              className="w-16 h-7 text-sm font-mono text-center px-2"
            />
            <span className="text-sm font-mono text-muted-foreground w-6">
              {getCardinalDirection(arrayAzimuth)}
            </span>
          </div>
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