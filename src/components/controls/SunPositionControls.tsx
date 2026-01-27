import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface SunPositionControlsProps {
  date: Date;
  time: number;
  latitude: number;
  longitude: number;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: number) => void;
  onLatitudeChange: (lat: number) => void;
  onLongitudeChange: (lng: number) => void;
}

const formatTime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function SunPositionControls({
  date,
  time,
  latitude,
  longitude,
  onDateChange,
  onTimeChange,
  onLatitudeChange,
  onLongitudeChange,
}: SunPositionControlsProps) {
  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="space-y-2">
        <label className="control-label">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-card border-border hover:bg-secondary"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {format(date, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onDateChange(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="control-label">Time of Day</label>
          <span className="text-sm font-mono text-primary">{formatTime(time)}</span>
        </div>
        <Slider
          value={[time]}
          min={0}
          max={24}
          step={0.25}
          onValueChange={([v]) => onTimeChange(v)}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="control-label flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          Location
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
            <Input
              type="number"
              value={latitude}
              onChange={(e) => onLatitudeChange(parseFloat(e.target.value) || 0)}
              className="bg-card border-border text-sm"
              step="0.01"
              min={-90}
              max={90}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
            <Input
              type="number"
              value={longitude}
              onChange={(e) => onLongitudeChange(parseFloat(e.target.value) || 0)}
              className="bg-card border-border text-sm"
              step="0.01"
              min={-180}
              max={180}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
