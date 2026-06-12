import { useCallback, useEffect, useRef, useState } from 'react';
import SunCalc from 'suncalc';

/**
 * Animates the time-of-day value so the sun (and therefore the shadows in
 * the 3D scene) sweep across the day. Loops from just before sunrise to
 * just after sunset for the configured date/location.
 */
export function useTimeAnimation(
  time: number,
  date: Date,
  latitude: number,
  longitude: number,
  onTimeChange: (time: number) => void
) {
  const [isPlaying, setIsPlaying] = useState(false);
  /** Simulated hours advanced per real second. */
  const [speed, setSpeed] = useState(0.75);

  const timeRef = useRef(time);
  timeRef.current = time;

  // Daylight window with a small margin, so the loop shows dawn/dusk.
  const windowRef = useRef<{ start: number; end: number }>({ start: 4, end: 22 });
  useEffect(() => {
    const times = SunCalc.getTimes(date, latitude, longitude);
    const toHours = (d: Date) =>
      isNaN(d.getTime()) ? NaN : d.getHours() + d.getMinutes() / 60;
    const sunrise = toHours(times.sunrise);
    const sunset = toHours(times.sunset);
    windowRef.current = {
      start: isNaN(sunrise) ? 0 : Math.max(0, sunrise - 0.5),
      end: isNaN(sunset) ? 24 : Math.min(24, sunset + 0.5),
    };
  }, [date, latitude, longitude]);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const { start, end } = windowRef.current;
      let next = timeRef.current + dt * speed;
      if (next > end || next < start) next = start;
      onTimeChange(Math.round(next * 100) / 100);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, onTimeChange]);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  return { isPlaying, togglePlay, speed, setSpeed };
}
