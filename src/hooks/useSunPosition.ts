import { useMemo } from 'react';
import SunCalc from 'suncalc';
import { SunPosition } from '@/types/solar';

export function useSunPosition(
  date: Date,
  time: number,
  latitude: number,
  longitude: number
): SunPosition {
  return useMemo(() => {
    const dateWithTime = new Date(date);
    dateWithTime.setHours(Math.floor(time));
    dateWithTime.setMinutes((time % 1) * 60);

    const sunPos = SunCalc.getPosition(dateWithTime, latitude, longitude);
    
    // Convert to 3D coordinates for Three.js
    // Azimuth: 0 = south, positive = west, negative = east
    // Altitude: 0 = horizon, π/2 = zenith
    const distance = 50;
    const x = distance * Math.sin(sunPos.azimuth) * Math.cos(sunPos.altitude);
    const y = distance * Math.sin(sunPos.altitude);
    const z = distance * Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude);

    return {
      azimuth: sunPos.azimuth,
      altitude: sunPos.altitude,
      x,
      y: Math.max(y, 0.1), // Keep sun above horizon minimum
      z,
    };
  }, [date, time, latitude, longitude]);
}
