export type RoofMaterial = 'green' | 'gravel' | 'pvc' | 'bitumen';

export interface SolarConfig {
  roofMaterial: RoofMaterial;
  date: Date;
  time: number; // hours in 24h format (0-24)
  latitude: number;
  longitude: number;
  panelRows: number;
  panelSpacing: number;
}

export interface SunPosition {
  azimuth: number; // radians
  altitude: number; // radians
  x: number;
  y: number;
  z: number;
}

export const ROOF_MATERIALS: { value: RoofMaterial; label: string; color: string }[] = [
  { value: 'green', label: 'Green Roof', color: '#3d8b4f' },
  { value: 'gravel', label: 'Gravel Roof', color: '#8b7355' },
  { value: 'pvc', label: 'PVC Membrane', color: '#d9d9d9' },
  { value: 'bitumen', label: 'Bitumen Roof', color: '#404040' },
];

export const DEFAULT_CONFIG: SolarConfig = {
  roofMaterial: 'gravel',
  date: new Date(),
  time: 12,
  latitude: 52.52, // Berlin
  longitude: 13.405,
  panelRows: 4,
  panelSpacing: 2.5,
};
