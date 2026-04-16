import { getSkinType } from '@/constants/skinTypes';

/**
 * UV-related calculations for the app.
 */

/** Determine if vitamin D synthesis is possible */
export function canSynthesize(uvIndex: number): boolean {
  return uvIndex >= 3;
}

/** Get a human-readable season label */
export function getSeasonLabel(latitude: number): string {
  const month = new Date().getMonth(); // 0-11
  const isNorthern = latitude >= 0;

  if (isNorthern) {
    if (month >= 3 && month <= 5) return 'Spring Ramp-Up';
    if (month >= 6 && month <= 8) return 'Summer Mode';
    if (month >= 9 && month <= 10) return 'Autumn Wind-Down';
    return 'Vitamin D Winter';
  } else {
    if (month >= 9 && month <= 11) return 'Spring Ramp-Up';
    if (month >= 0 && month <= 2) return 'Summer Mode';
    if (month >= 3 && month <= 5) return 'Autumn Wind-Down';
    return 'Vitamin D Winter';
  }
}

/** Estimate days until vitamin D winter ends (UV >= 3 season returns) */
export function daysUntilSeason(latitude: number): { label: string; days: number } {
  const now = new Date();
  const month = now.getMonth();
  const isNorthern = latitude >= 0;
  const absLat = Math.abs(latitude);

  // Rough estimates based on latitude
  if (absLat < 25) {
    return { label: 'Year-round UV', days: 0 };
  }

  if (isNorthern) {
    if (month >= 4 && month <= 9) {
      // In season, calculate days until winter
      const winterStart = new Date(now.getFullYear(), 10, 1); // Nov 1
      const diff = Math.ceil((winterStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { label: 'Days until vitamin D winter', days: Math.max(0, diff) };
    } else {
      // In winter, calculate days until spring
      const springStart = new Date(
        month >= 10 ? now.getFullYear() + 1 : now.getFullYear(),
        3,
        1
      ); // Apr 1
      const diff = Math.ceil((springStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { label: 'Days until spring UV returns', days: Math.max(0, diff) };
    }
  } else {
    if (month >= 10 || month <= 3) {
      const winterStart = new Date(now.getFullYear(), 4, 1);
      const diff = Math.ceil((winterStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { label: 'Days until vitamin D winter', days: Math.max(0, diff) };
    } else {
      const springStart = new Date(now.getFullYear(), 9, 1);
      const diff = Math.ceil((springStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { label: 'Days until spring UV returns', days: Math.max(0, diff) };
    }
  }
}

/** Calculate optimal exposure time for a given skin type and UV */
export function getOptimalExposureMinutes(
  uvIndex: number,
  skinTypeId: number,
  targetIU: number = 1000
): number {
  if (uvIndex < 3) return Infinity;
  const skin = getSkinType(skinTypeId);
  // Using face+arms (baseline) BSA multiplier = 1.0, no sunscreen
  const iuPerMin = uvIndex * 40 * skin.iuMultiplier * 1.0 * 1.0;
  return Math.ceil(targetIU / iuPerMin);
}

/** Format time from hour number (e.g., 14 -> "14:00") */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/** Format time window */
export function formatTimeWindow(startHour: number, endHour: number): string {
  return `${formatHour(startHour)} \u2192 ${formatHour(endHour)}`;
}

/** Latitude label for known cities */
export function getLatitudeLabel(city: string, lat: number): string {
  const latStr = `${Math.abs(lat)}\u00B0${lat >= 0 ? 'N' : 'S'}`;

  // Determine D season
  const absLat = Math.abs(lat);
  let season = '';
  if (absLat < 25) {
    season = 'Year-round D season';
  } else if (absLat < 35) {
    season = 'Good D season Mar\u2013Oct';
  } else if (absLat < 45) {
    season = 'Good D season Apr\u2013Oct';
  } else if (absLat < 55) {
    season = 'Good D season May\u2013Sep';
  } else {
    season = 'Good D season Jun\u2013Aug';
  }

  return `${city} (${latStr} \u2014 ${season})`;
}

/** Known cities for manual fallback */
export const KNOWN_CITIES = [
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', lat: 41.3874, lon: 2.1686 },
  { name: 'Sevilla', lat: 37.3891, lon: -5.9845 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
] as const;
