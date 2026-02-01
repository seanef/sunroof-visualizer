export type RoofMaterial = 'green' | 'gravel' | 'pvc' | 'bitumen';

export interface LightingConfig {
  sunIntensity: number;      // multiplier for sun directional light (0-10)
  ambientIntensity: number;  // ambient light intensity (0-0.5)
  hemisphereIntensity: number; // hemisphere light intensity (0-0.5)
  environmentIntensity: number; // HDR environment intensity (0-1)
}

export interface SolarConfig {
  roofMaterial: RoofMaterial;
  date: Date;
  time: number; // hours in 24h format (0-24)
  latitude: number;
  longitude: number;
  unitRows: number;
  unitColumns: number;
  arrayAzimuth: number; // degrees, 0 = North, 90 = East (front facing direction)
  lighting: LightingConfig;
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

export const DEFAULT_LIGHTING: LightingConfig = {
  sunIntensity: 6.0,
  ambientIntensity: 0.08,
  hemisphereIntensity: 0.05,
  environmentIntensity: 0.15,
};

export const DEFAULT_CONFIG: SolarConfig = {
  roofMaterial: 'gravel',
  date: new Date(),
  time: 12,
  latitude: 52.52, // Berlin
  longitude: 13.405,
  unitRows: 2,
  unitColumns: 3,
  arrayAzimuth: 90, // Default: front facing East
  lighting: DEFAULT_LIGHTING,
};
