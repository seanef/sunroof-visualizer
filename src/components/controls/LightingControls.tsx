import { LightingConfig, DEFAULT_LIGHTING } from '@/types/solar';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface LightingControlsProps {
  lighting: LightingConfig;
  onLightingChange: (lighting: Partial<LightingConfig>) => void;
}

export function LightingControls({ lighting, onLightingChange }: LightingControlsProps) {
  const handleReset = () => {
    onLightingChange(DEFAULT_LIGHTING);
  };

  return (
    <div className="space-y-4">
      {/* Sun Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Sun Intensity</Label>
          <Input
            type="number"
            value={lighting.sunIntensity.toFixed(1)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 10) {
                onLightingChange({ sunIntensity: val });
              }
            }}
            className="w-16 h-7 text-xs text-right"
            min={0}
            max={10}
            step={0.1}
          />
        </div>
        <Slider
          value={[lighting.sunIntensity]}
          onValueChange={([val]) => onLightingChange({ sunIntensity: val })}
          min={0}
          max={10}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Ambient Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Ambient Light</Label>
          <Input
            type="number"
            value={lighting.ambientIntensity.toFixed(2)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 0.5) {
                onLightingChange({ ambientIntensity: val });
              }
            }}
            className="w-16 h-7 text-xs text-right"
            min={0}
            max={0.5}
            step={0.01}
          />
        </div>
        <Slider
          value={[lighting.ambientIntensity]}
          onValueChange={([val]) => onLightingChange({ ambientIntensity: val })}
          min={0}
          max={0.5}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Hemisphere Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Hemisphere Light</Label>
          <Input
            type="number"
            value={lighting.hemisphereIntensity.toFixed(2)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 0.5) {
                onLightingChange({ hemisphereIntensity: val });
              }
            }}
            className="w-16 h-7 text-xs text-right"
            min={0}
            max={0.5}
            step={0.01}
          />
        </div>
        <Slider
          value={[lighting.hemisphereIntensity]}
          onValueChange={([val]) => onLightingChange({ hemisphereIntensity: val })}
          min={0}
          max={0.5}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Environment Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Environment (HDR)</Label>
          <Input
            type="number"
            value={lighting.environmentIntensity.toFixed(2)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0 && val <= 1) {
                onLightingChange({ environmentIntensity: val });
              }
            }}
            className="w-16 h-7 text-xs text-right"
            min={0}
            max={1}
            step={0.01}
          />
        </div>
        <Slider
          value={[lighting.environmentIntensity]}
          onValueChange={([val]) => onLightingChange({ environmentIntensity: val })}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="w-full mt-2"
      >
        <RotateCcw className="w-3 h-3 mr-2" />
        Reset to Defaults
      </Button>
    </div>
  );
}
