import { Slider } from '@/components/ui/slider';

interface UnitControlsProps {
  unitRows: number;
  unitColumns: number;
  onUnitRowsChange: (rows: number) => void;
  onUnitColumnsChange: (columns: number) => void;
}

export function UnitControls({
  unitRows,
  unitColumns,
  onUnitRowsChange,
  onUnitColumnsChange,
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
    </div>
  );
}
