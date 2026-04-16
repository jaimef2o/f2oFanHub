export interface ExposureSituation {
  id: string;
  label: string;
  sub: string;
  emoji: string;
  bsaMultiplier: number;
  description: string;
}

export const SITUATIONS: ExposureSituation[] = [
  {
    id: 'face_only',
    label: 'Solo la cara',
    sub: 'Con abrigo o bufanda',
    emoji: '\uD83E\uDDE5',
    bsaMultiplier: 0.36,
    description: 'Face only',
  },
  {
    id: 'face_arms',
    label: 'Cara + brazos',
    sub: 'Camiseta, manga corta',
    emoji: '\uD83D\uDC55',
    bsaMultiplier: 1.0,
    description: 'Face + arms',
  },
  {
    id: 'face_arms_legs',
    label: 'Cara + brazos + piernas',
    sub: 'Pantal\u00F3n corto',
    emoji: '\uD83E\uDE73',
    bsaMultiplier: 1.4,
    description: 'Face + arms + legs',
  },
  {
    id: 'torso',
    label: 'Torso al descubierto',
    sub: 'Sin camiseta / top',
    emoji: '\uD83C\uDF1E',
    bsaMultiplier: 2.0,
    description: 'Torso exposed',
  },
  {
    id: 'full_body',
    label: 'Casi todo el cuerpo',
    sub: 'Playa / piscina',
    emoji: '\uD83C\uDFD6',
    bsaMultiplier: 3.0,
    description: 'Full body',
  },
];

export type SituationId = (typeof SITUATIONS)[number]['id'];

export function getSituation(id: string): ExposureSituation {
  return SITUATIONS.find((s) => s.id === id) ?? SITUATIONS[1];
}

export const SUNSCREEN_OPTIONS = [
  { id: 'none', label: 'None', multiplier: 1.0 },
  { id: 'spf15', label: 'SPF 15', multiplier: 0.07 },
  { id: 'spf30', label: 'SPF 30+', multiplier: 0.03 },
] as const;

export type SunscreenId = (typeof SUNSCREEN_OPTIONS)[number]['id'];
