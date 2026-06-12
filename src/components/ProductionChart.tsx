import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { SolarConfig } from '@/types/solar';
import { computeDayProduction } from '@/lib/solarProduction';
import { cn } from '@/lib/utils';

interface ProductionChartProps {
  config: SolarConfig;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTimeChange: (time: number) => void;
}

const formatTime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function ProductionChart({
  config,
  isPlaying,
  onTogglePlay,
  onTimeChange,
}: ProductionChartProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const production = useMemo(
    () =>
      computeDayProduction({
        date: config.date,
        latitude: config.latitude,
        longitude: config.longitude,
        arrayAzimuth: config.arrayAzimuth,
        roofMaterial: config.roofMaterial,
        rows: config.unitRows,
        columns: config.unitColumns,
      }),
    [
      config.date,
      config.latitude,
      config.longitude,
      config.arrayAzimuth,
      config.roofMaterial,
      config.unitRows,
      config.unitColumns,
    ]
  );

  // Current output, interpolated from the curve at the scene's time.
  const currentKW = useMemo(() => {
    const pts = production.points;
    const i = pts.findIndex((p) => p.time >= config.time);
    if (i <= 0) return pts[0]?.total ?? 0;
    const a = pts[i - 1];
    const b = pts[i];
    const f = (config.time - a.time) / (b.time - a.time || 1);
    return a.total + (b.total - a.total) * f;
  }, [production, config.time]);

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header: playback + key numbers */}
      <div className="flex items-center gap-3 px-4 py-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 shrink-0"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause day simulation' : 'Play day simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-solar-gold shrink-0" />
          <div className="leading-tight">
            <p className="text-sm font-mono">
              {currentKW.toFixed(2)} kW
              <span className="text-muted-foreground"> @ {formatTime(config.time)}</span>
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {production.energyKWh} kWh/day · {production.kWp} kWp clear-sky estimate
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <Switch checked={showReference} onCheckedChange={setShowReference} />
            vs 35° tilted
          </label>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand chart' : 'Collapse chart'}
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'h-0' : 'h-36 sm:h-44'
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={production.points}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            onClick={(e) => {
              if (e && e.activeLabel != null) onTimeChange(Number(e.activeLabel));
            }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="frontFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--solar-orange))" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(var(--solar-orange))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="rearFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--solar-blue))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--solar-blue))" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              type="number"
              domain={[3, 23]}
              ticks={[6, 9, 12, 15, 18, 21]}
              tickFormatter={(t) => `${t}:00`}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={36}
              unit=" kW"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} kW`,
                name,
              ]}
              labelFormatter={(t) => formatTime(Number(t))}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />

            {/* Stacked faces: sunlit face + opposite face = total */}
            <Area
              type="monotone"
              dataKey="front"
              stackId="pv"
              name="Sunlit face"
              stroke="hsl(var(--solar-orange))"
              fill="url(#frontFill)"
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="rear"
              stackId="pv"
              name="Opposite face"
              stroke="hsl(var(--solar-blue))"
              fill="url(#rearFill)"
              strokeWidth={1.5}
              isAnimationActive={false}
            />

            {showReference && (
              <Line
                type="monotone"
                dataKey="reference"
                name="35° south tilted (same kWp)"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Current scene time */}
            <ReferenceLine
              x={config.time}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              ifOverflow="extendDomain"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!collapsed && (
        <p className="px-4 pb-2 text-[10px] text-muted-foreground">
          Idealized clear-sky model — click the curve to jump the scene to that time.
          {showReference &&
            ` Tilted reference: ${production.referenceEnergyKWh} kWh/day.`}
        </p>
      )}
    </div>
  );
}
