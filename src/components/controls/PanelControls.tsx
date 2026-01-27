import { Slider } from '@/components/ui/slider';

interface PanelControlsProps {
  rows: number;
  spacing: number;
  onRowsChange: (rows: number) => void;
  onSpacingChange: (spacing: number) => void;
}

export function PanelControls({
  rows,
  spacing,
  onRowsChange,
  onSpacingChange,
}: PanelControlsProps) {
  return (
    <div className="space-y-5">
      {/* Panel rows */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Panel Rows</label>
          <span className="text-sm font-mono text-primary">{rows}</span>
        </div>
        <Slider
          value={[rows]}
          min={1}
          max={8}
          step={1}
          onValueChange={([v]) => onRowsChange(v)}
          className="py-2"
        />
      </div>

      {/* Panel spacing */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Row Spacing</label>
          <span className="text-sm font-mono text-primary">{spacing.toFixed(1)}m</span>
        </div>
        <Slider
          value={[spacing]}
          min={1.5}
          max={5}
          step={0.1}
          onValueChange={([v]) => onSpacingChange(v)}
          className="py-2"
        />
      </div>
    </div>
  );
}
