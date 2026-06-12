import SunCalc from 'suncalc';
import { RoofMaterial } from '@/types/solar';

/**
 * Clear-sky production model for the vertical bifacial array.
 *
 * Intentionally simple and transparent: the goal is an honest, illustrative
 * curve that responds correctly to date, latitude, array azimuth and roof
 * albedo — not a PV*Sol replacement. All assumptions are named constants
 * below so they can be tuned to match measured/simulated data.
 */

// ---------------------------------------------------------------------------
// Tunable system constants — adjust to actual product data
// ---------------------------------------------------------------------------

/** STC rating per PV unit in watts. TODO: set to the actual unit rating. */
export const WP_PER_UNIT = 400;

/** Rear-face bifaciality factor (rear STC power / front STC power). */
export const BIFACIALITY = 0.9;

/** System performance ratio lumping wiring, inverter, soiling, mismatch. */
export const PERFORMANCE_RATIO = 0.85;

/** Active PV height of a unit above the roof, in meters (for row shading). */
export const PANEL_HEIGHT_M = 0.45;

/** Row pitch in meters — must match UNIT_SPACING_Z in PVUnitArray. */
export const ROW_PITCH_M = 1.451;

/** Albedo of each roof surface — drives the ground-reflected component. */
export const ROOF_ALBEDO: Record<RoofMaterial, number> = {
  green: 0.2,
  gravel: 0.18,
  pvc: 0.6,
  bitumen: 0.08,
};

/** Reference system for comparison: south-facing monofacial at 35° tilt. */
const REF_TILT_DEG = 35;
const REF_AZIMUTH_DEG = 180; // south

// ---------------------------------------------------------------------------
// Irradiance model (clear sky)
// ---------------------------------------------------------------------------

const SOLAR_CONSTANT = 1361; // W/m²

/** Kasten–Young air mass (same formula as Sun.tsx so light & chart agree). */
function airMass(altitudeRad: number): number {
  const altDeg = (altitudeRad * 180) / Math.PI;
  if (altDeg <= 0) return Infinity;
  const term = 0.50572 * Math.pow(altDeg + 6.07995, -1.6364);
  return 1 / (Math.sin(altitudeRad) + term);
}

/** Direct normal irradiance via the Meinel transmittance approximation. */
function clearSkyDNI(altitudeRad: number): number {
  const am = airMass(altitudeRad);
  if (!isFinite(am)) return 0;
  return SOLAR_CONSTANT * Math.pow(0.7, Math.pow(am, 0.678));
}

/** Diffuse horizontal irradiance — simple clear-sky fraction of extraterrestrial. */
function clearSkyDHI(altitudeRad: number): number {
  if (altitudeRad <= 0) return 0;
  return 0.1 * SOLAR_CONSTANT * Math.sin(altitudeRad);
}

// ---------------------------------------------------------------------------
// Plane-of-array irradiance
// ---------------------------------------------------------------------------

const deg2rad = (d: number) => (d * Math.PI) / 180;

interface SunAngles {
  altitude: number; // rad
  /** Compass azimuth in degrees: 0 = N, 90 = E, 180 = S, 270 = W. */
  azimuthDeg: number;
}

function sunAngles(date: Date, lat: number, lon: number): SunAngles {
  const p = SunCalc.getPosition(date, lat, lon);
  // SunCalc azimuth: 0 = south, positive towards west → convert to compass.
  const azimuthDeg = ((p.azimuth * 180) / Math.PI + 180 + 360) % 360;
  return { altitude: p.altitude, azimuthDeg };
}

/** POA irradiance on a vertical plane facing `faceAzimuthDeg` (compass). */
function poaVertical(
  sun: SunAngles,
  dni: number,
  dhi: number,
  ghi: number,
  faceAzimuthDeg: number,
  albedo: number,
  beamShadeFactor: number
): number {
  // Incidence on a vertical plane: cosθ = cos(alt)·cos(Δaz)
  const dAz = deg2rad(sun.azimuthDeg - faceAzimuthDeg);
  const cosInc = Math.cos(sun.altitude) * Math.cos(dAz);
  const beam = dni * Math.max(0, cosInc) * (1 - beamShadeFactor);
  const diffuse = dhi * 0.5; // vertical plane sees half the sky dome
  const reflected = ghi * albedo * 0.5; // ...and half the ground
  return beam + diffuse + reflected;
}

/** POA irradiance on the tilted reference plane. */
function poaTilted(
  sun: SunAngles,
  dni: number,
  dhi: number,
  ghi: number,
  tiltDeg: number,
  faceAzimuthDeg: number,
  albedo: number
): number {
  const tilt = deg2rad(tiltDeg);
  const dAz = deg2rad(sun.azimuthDeg - faceAzimuthDeg);
  const cosInc =
    Math.sin(sun.altitude) * Math.cos(tilt) +
    Math.cos(sun.altitude) * Math.sin(tilt) * Math.cos(dAz);
  const beam = dni * Math.max(0, cosInc);
  const diffuse = dhi * ((1 + Math.cos(tilt)) / 2);
  const reflected = ghi * albedo * ((1 - Math.cos(tilt)) / 2);
  return beam + diffuse + reflected;
}

/**
 * Fraction of beam irradiance lost to row-to-row shading (interior rows).
 * Geometric: a row of height H casts a shadow of length H/tan(alt); the
 * across-row component determines how much of the next row is shaded.
 */
function rowShadeFactor(
  sun: SunAngles,
  arrayAzimuthDeg: number,
  rows: number
): number {
  if (rows <= 1 || sun.altitude <= 0) return 0;
  const dAz = deg2rad(sun.azimuthDeg - arrayAzimuthDeg);
  const acrossRow = Math.abs(Math.cos(dAz)); // 0 when sun travels along rows
  if (acrossRow < 1e-3) return 0;
  const shadowAcross = (PANEL_HEIGHT_M / Math.tan(sun.altitude)) * acrossRow;
  if (shadowAcross <= ROW_PITCH_M) return 0;
  const shadedFraction = Math.min(1, 1 - ROW_PITCH_M / shadowAcross);
  // Only interior rows are affected; the sun-side row is always clear.
  return shadedFraction * ((rows - 1) / rows);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ProductionPoint {
  /** Hours, local clock time of the supplied Date (0–24). */
  time: number;
  /** kW from the face at `arrayAzimuth` (the "front" face). */
  front: number;
  /** kW from the opposite face. */
  rear: number;
  /** kW total for the vertical bifacial array. */
  total: number;
  /** kW for the same-kWp tilted monofacial reference. */
  reference: number;
}

export interface DayProduction {
  points: ProductionPoint[];
  /** kWh/day, vertical bifacial array. */
  energyKWh: number;
  /** kWh/day, tilted reference. */
  referenceEnergyKWh: number;
  /** Installed DC capacity in kWp. */
  kWp: number;
}

export interface ProductionParams {
  date: Date;
  latitude: number;
  longitude: number;
  /** Compass azimuth the front face points towards (0 = N, 90 = E). */
  arrayAzimuth: number;
  roofMaterial: RoofMaterial;
  rows: number;
  columns: number;
  /** Curve resolution in hours (default 0.25). */
  stepHours?: number;
}

export function computeDayProduction({
  date,
  latitude,
  longitude,
  arrayAzimuth,
  roofMaterial,
  rows,
  columns,
  stepHours = 0.25,
}: ProductionParams): DayProduction {
  const albedo = ROOF_ALBEDO[roofMaterial];
  const units = rows * columns;
  const kWp = (units * WP_PER_UNIT) / 1000;
  const points: ProductionPoint[] = [];

  for (let t = 0; t <= 24 + 1e-9; t += stepHours) {
    const d = new Date(date);
    d.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0);
    const sun = sunAngles(d, latitude, longitude);

    let front = 0;
    let rear = 0;
    let reference = 0;

    if (sun.altitude > 0) {
      const dni = clearSkyDNI(sun.altitude);
      const dhi = clearSkyDHI(sun.altitude);
      const ghi = dni * Math.sin(sun.altitude) + dhi;
      const shade = rowShadeFactor(sun, arrayAzimuth, rows);

      const poaFront = poaVertical(sun, dni, dhi, ghi, arrayAzimuth, albedo, shade);
      const poaRear = poaVertical(
        sun, dni, dhi, ghi, (arrayAzimuth + 180) % 360, albedo, shade
      );
      const poaRef = poaTilted(sun, dni, dhi, ghi, REF_TILT_DEG, REF_AZIMUTH_DEG, 0.2);

      // Convention: report the more-irradiated side as "front" so the two
      // chart series read as morning/afternoon faces regardless of which
      // physical face has the higher bifaciality.
      const hi = Math.max(poaFront, poaRear);
      const lo = Math.min(poaFront, poaRear);
      const toKW = (poa: number, bf: number) =>
        (poa / 1000) * kWp * bf * PERFORMANCE_RATIO;

      front = toKW(hi, 1);
      rear = toKW(lo, BIFACIALITY);
      reference = toKW(poaRef, 1);
    }

    points.push({
      time: t,
      front: round3(front),
      rear: round3(rear),
      total: round3(front + rear),
      reference: round3(reference),
    });
  }

  const energyKWh = integrate(points.map((p) => p.total), stepHours);
  const referenceEnergyKWh = integrate(points.map((p) => p.reference), stepHours);

  return { points, energyKWh, referenceEnergyKWh, kWp };
}

function integrate(values: number[], stepHours: number): number {
  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    sum += ((values[i - 1] + values[i]) / 2) * stepHours;
  }
  return Math.round(sum * 10) / 10;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
