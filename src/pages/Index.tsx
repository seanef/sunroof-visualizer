import { useState, useCallback } from 'react';
import { Scene } from '@/components/three/Scene';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { useSunPosition } from '@/hooks/useSunPosition';
import { SolarConfig, DEFAULT_CONFIG } from '@/types/solar';

const Index = () => {
  const [config, setConfig] = useState<SolarConfig>(DEFAULT_CONFIG);

  const sunPosition = useSunPosition(
    config.date,
    config.time,
    config.latitude,
    config.longitude
  );

  const handleConfigChange = useCallback((updates: Partial<SolarConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Scene config={config} sunPosition={sunPosition} />
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10">
        <ControlPanel
          config={config}
          sunPosition={sunPosition}
          onConfigChange={handleConfigChange}
        />
      </div>

      {/* Logo/Brand */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass-panel px-4 py-2">
          <span className="text-xs text-muted-foreground">Powered by </span>
          <span className="text-xs font-semibold gradient-text">Over Easy Solar</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
