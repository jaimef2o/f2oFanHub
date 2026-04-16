export interface SkinType {
  id: number;
  numeral: string;
  label: string;
  burnDescription: string;
  color: string;
  iuMultiplier: number;
  /** Minimal Erythemal Dose in minutes at UV 6 */
  medBaseMinutes: number;
}

export const SKIN_TYPES: SkinType[] = [
  {
    id: 1,
    numeral: 'I',
    label: 'Type I',
    burnDescription: 'Always burns',
    color: '#FDEBD0',
    iuMultiplier: 1.4,
    medBaseMinutes: 10,
  },
  {
    id: 2,
    numeral: 'II',
    label: 'Type II',
    burnDescription: 'Usually burns',
    color: '#F5CBA7',
    iuMultiplier: 1.2,
    medBaseMinutes: 15,
  },
  {
    id: 3,
    numeral: 'III',
    label: 'Type III',
    burnDescription: 'Sometimes burns',
    color: '#EDBB99',
    iuMultiplier: 1.0,
    medBaseMinutes: 20,
  },
  {
    id: 4,
    numeral: 'IV',
    label: 'Type IV',
    burnDescription: 'Rarely burns',
    color: '#CA8E5B',
    iuMultiplier: 0.7,
    medBaseMinutes: 30,
  },
  {
    id: 5,
    numeral: 'V',
    label: 'Type V',
    burnDescription: 'Very rarely burns',
    color: '#A0704E',
    iuMultiplier: 0.5,
    medBaseMinutes: 45,
  },
  {
    id: 6,
    numeral: 'VI',
    label: 'Type VI',
    burnDescription: 'Never burns',
    color: '#6B4226',
    iuMultiplier: 0.35,
    medBaseMinutes: 60,
  },
];

export function getSkinType(id: number): SkinType {
  return SKIN_TYPES.find((s) => s.id === id) ?? SKIN_TYPES[2];
}
