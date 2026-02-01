import { SolarConfig, SunPosition, LightingConfig } from '@/types/solar';
import { RoofMaterialSelector } from './RoofMaterialSelector';
import { SunPositionControls } from './SunPositionControls';
import { UnitControls } from './UnitControls';
import { LightingControls } from './LightingControls';
import { Sun, Layers, Box, Info, Settings, Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MobileControlSheetProps {
  config: SolarConfig;
  sunPosition: SunPosition;
  onConfigChange: (config: Partial<SolarConfig>) => void;
}

export function MobileControlSheet({ config, sunPosition, onConfigChange }: MobileControlSheetProps) {
  const altitudeDeg = ((sunPosition.altitude * 180) / Math.PI).toFixed(1);
  const azimuthDeg = ((sunPosition.azimuth * 180) / Math.PI).toFixed(1);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="glass-panel h-12 w-12 rounded-full"
          variant="ghost"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-background/95 backdrop-blur-md">
        <SheetHeader className="mb-4">
          <SheetTitle className="gradient-text">Over Easy Solar</SheetTitle>
          <p className="text-xs text-muted-foreground">xM3 Vertical Bifacial System</p>
        </SheetHeader>

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
            arrayAzimuth={config.arrayAzimuth}
            onUnitRowsChange={(unitRows) => onConfigChange({ unitRows })}
            onUnitColumnsChange={(unitColumns) => onConfigChange({ unitColumns })}
            onArrayAzimuthChange={(arrayAzimuth) => onConfigChange({ arrayAzimuth })}
          />
        </div>

        <Separator className="mb-5" />

        {/* Advanced Lighting Controls */}
        <Accordion type="single" collapsible className="mb-5">
          <AccordionItem value="lighting" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Advanced Lighting</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <LightingControls
                lighting={config.lighting}
                onLightingChange={(lighting) => onConfigChange({ lighting: { ...config.lighting, ...lighting } })}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Drag to rotate view. Pinch to zoom. Shadows update in real-time.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
