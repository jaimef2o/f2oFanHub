import { getSkinType } from '@/constants/skinTypes';
import { getSituation, SUNSCREEN_OPTIONS, type SunscreenId } from '@/constants/situations';

/**
 * Core vitamin D IU calculation engine.
 *
 * Formula: Base IU/min = (UV_index × 40) × skin_multiplier × bsa_multiplier × sunscreen_multiplier
 * Returns 0 if UV < 3 (no meaningful synthesis below UV 3).
 *
 * All IU values should be displayed as ±15% ranges to account for biological variance.
 */

export function calculateIUPerMinute(
  uvIndex: number,
  skinTypeId: number,
  situationId: string,
  sunscreenId: SunscreenId
): number {
  if (uvIndex < 3) return 0;

  const skin = getSkinType(skinTypeId);
  const situation = getSituation(situationId);
  const sunscreen = SUNSCREEN_OPTIONS.find((s) => s.id === sunscreenId) ?? SUNSCREEN_OPTIONS[0];

  return uvIndex * 40 * skin.iuMultiplier * situation.bsaMultiplier * sunscreen.multiplier;
}

export function calculateSessionIU(
  uvIndex: number,
  durationMinutes: number,
  skinTypeId: number,
  situationId: string,
  sunscreenId: SunscreenId
): number {
  const iuPerMin = calculateIUPerMinute(uvIndex, skinTypeId, situationId, sunscreenId);
  return Math.round(iuPerMin * durationMinutes);
}

/** Returns [low, high] range with ±15% biological variance */
export function iuRange(iu: number): [number, number] {
  return [Math.round(iu * 0.85), Math.round(iu * 1.15)];
}

/** Format IU as display range string: "~850–1,150 IU" */
export function formatIURange(iu: number): string {
  if (iu === 0) return '0 IU';
  const [low, high] = iuRange(iu);
  return `~${low.toLocaleString()}\u2013${high.toLocaleString()} IU`;
}

/** Calculate Minimal Erythemal Dose (burn time) in minutes */
export function calculateMED(uvIndex: number, skinTypeId: number): number {
  if (uvIndex <= 0) return Infinity;
  const skin = getSkinType(skinTypeId);
  // MED base is calibrated at UV 6
  return Math.round((skin.medBaseMinutes * 6) / uvIndex);
}

/** Returns 0–1 representing how close to sunburn (fraction of MED) */
export function burnProgress(
  durationMinutes: number,
  uvIndex: number,
  skinTypeId: number,
  sunscreenId: SunscreenId
): number {
  const med = calculateMED(uvIndex, skinTypeId);
  if (med === Infinity) return 0;
  const sunscreen = SUNSCREEN_OPTIONS.find((s) => s.id === sunscreenId) ?? SUNSCREEN_OPTIONS[0];
  // Sunscreen extends MED
  const effectiveMED = med / sunscreen.multiplier;
  return Math.min(durationMinutes / effectiveMED, 1);
}

/** Calculate minutes needed for a target IU */
export function minutesForTargetIU(
  targetIU: number,
  uvIndex: number,
  skinTypeId: number,
  situationId: string,
  sunscreenId: SunscreenId
): number {
  const iuPerMin = calculateIUPerMinute(uvIndex, skinTypeId, situationId, sunscreenId);
  if (iuPerMin <= 0) return Infinity;
  return Math.ceil(targetIU / iuPerMin);
}
