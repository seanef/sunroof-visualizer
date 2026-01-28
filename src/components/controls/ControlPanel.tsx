import { SolarConfig, SunPosition } from '@/types/solar';
import { RoofMaterialSelector } from './RoofMaterialSelector';
import { SunPositionControls } from './SunPositionControls';
import { PanelControls } from './PanelControls';
import { UnitControls } from './UnitControls';
import { Sun, Layers, Grid3X3, Box, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ControlPanelProps {
  config: SolarConfig;
  sunPosition: SunPosition;
  onConfigChange: (config: Partial<SolarConfig>) => void;
}

export function ControlPanel({ config, sunPosition, onConfigChange }: ControlPanelProps) {
  const altitudeDeg = ((sunPosition.altitude * 180) / Math.PI).toFixed(1);
  const azimuthDeg = ((sunPosition.azimuth * 180) / Math.PI).toFixed(1);

  return (
    <div className="glass-panel p-5 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold gradient-text">Over Easy Solar</h1>
        <p className="text-xs text-muted-foreground mt-1">xM3 Vertical Bifacial System</p>
      </div>

      <Separator className="mb-5" />

      {/* Sun info display */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solar-orange to-solar-gold flex items-center justify-center solar-glow">
          <Sun className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sun Position</p>
          <p className="text-sm font-mono">
            Alt: {altitudeDeg}° | Az: {azimuthDeg}°
          </p>
        </div>
      </div>

      {/* Roof Material */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Roof Configuration</span>
        </div>
        <RoofMaterialSelector
          value={config.roofMaterial}
          onChange={(roofMaterial) => onConfigChange({ roofMaterial })}
        />
      </div>

      <Separator className="mb-5" />

      {/* Sun Position */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Sun Position</span>
        </div>
        <SunPositionControls
          date={config.date}
          time={config.time}
          latitude={config.latitude}
          longitude={config.longitude}
          onDateChange={(date) => onConfigChange({ date })}
          onTimeChange={(time) => onConfigChange({ time })}
          onLatitudeChange={(latitude) => onConfigChange({ latitude })}
          onLongitudeChange={(longitude) => onConfigChange({ longitude })}
        />
      </div>

      <Separator className="mb-5" />

      {/* PV Unit Configuration */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Box className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">xM3 Unit Layout</span>
        </div>
        <UnitControls
          unitRows={config.unitRows}
          unitColumns={config.unitColumns}
          onUnitRowsChange={(unitRows) => onConfigChange({ unitRows })}
          onUnitColumnsChange={(unitColumns) => onConfigChange({ unitColumns })}
        />
      </div>

      <Separator className="mb-5" />

      {/* Panel Configuration */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Panel Layout</span>
        </div>
        <PanelControls
          rows={config.panelRows}
          spacing={config.panelSpacing}
          onRowsChange={(panelRows) => onConfigChange({ panelRows })}
          onSpacingChange={(panelSpacing) => onConfigChange({ panelSpacing })}
        />
      </div>

      <Separator className="mb-5" />

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Drag to rotate view. Scroll to zoom. Shadows update in real-time based on sun position.
        </p>
      </div>
    </div>
  );
}
