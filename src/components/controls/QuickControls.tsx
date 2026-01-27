import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Sun } from 'lucide-react';
import { format } from 'date-fns';

interface QuickControlsProps {
  date: Date;
  time: number;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: number) => void;
}

const formatTime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function QuickControls({ date, time, onDateChange, onTimeChange }: QuickControlsProps) {
  return (
    <div className="glass-panel p-3 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Sun className="w-4 h-4 text-solar-orange" />
        <span className="text-xs font-medium text-foreground">{formatTime(time)}</span>
      </div>
      
      <Slider
        value={[time]}
        min={0}
        max={24}
        step={0.25}
        onValueChange={([v]) => onTimeChange(v)}
        className="w-32 md:w-40"
      />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {format(date, 'MMM d')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
