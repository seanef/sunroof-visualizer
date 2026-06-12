import { useState, useCallback } from 'react';
import { Scene } from '@/components/three/Scene';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { MobileControlSheet } from '@/components/controls/MobileControlSheet';
import { QuickControls } from '@/components/controls/QuickControls';
import { useSunPosition } from '@/hooks/useSunPosition';
import { useTimeAnimation } from '@/hooks/useTimeAnimation';
import { ProductionChart } from '@/components/ProductionChart';
import { useIsMobile } from '@/hooks/use-mobile';
import { SolarConfig, DEFAULT_CONFIG } from '@/types/solar';

const Index = () => {
  const [config, setConfig] = useState<SolarConfig>(DEFAULT_CONFIG);
  const isMobile = useIsMobile();

  const sunPosition = useSunPosition(
    config.date,
    config.time,
    config.latitude,
    config.longitude
  );

  const handleConfigChange = useCallback((updates: Partial<SolarConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleTimeChange = useCallback((time: number) => {
    setConfig((prev) => ({ ...prev, time }));
  }, []);

  const { isPlaying, togglePlay } = useTimeAnimation(
    config.time,
    config.date,
    config.latitude,
    config.longitude,
    handleTimeChange
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Scene config={config} sunPosition={sunPosition} />
      </div>

      {/* Desktop: Side panel */}
      {!isMobile && (
        <div className="absolute top-4 left-4 z-10">
          <ControlPanel
            config={config}
            sunPosition={sunPosition}
            onConfigChange={handleConfigChange}
          />
        </div>
      )}

      {/* Mobile: Settings button + Quick controls */}
      {isMobile && (
        <>
          <div className="absolute top-4 left-4 z-10">
            <MobileControlSheet
              config={config}
              sunPosition={sunPosition}
              onConfigChange={handleConfigChange}
            />
          </div>
          <div className="absolute top-4 left-20 right-4 z-10">
            <QuickControls
              date={config.date}
              time={config.time}
              onDateChange={(date) => handleConfigChange({ date })}
              onTimeChange={(time) => handleConfigChange({ time })}
            />
          </div>
        </>
      )}

      {/* Production chart + day playback */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[560px] z-10">
        <ProductionChart
          config={config}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onTimeChange={handleTimeChange}
        />
      </div>

      {/* Logo/Brand */}
      <div className="absolute bottom-20 right-4 z-10 hidden md:block">
        <div className="glass-panel px-4 py-2">
          <span className="text-xs text-muted-foreground">Powered by </span>
          <span className="text-xs font-semibold gradient-text">Over Easy Solar</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
