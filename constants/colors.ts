export const Colors = {
  bg: '#07111A',
  surface: '#0E1D2A',
  card: '#142030',
  cardHi: '#1A2A3C',
  border: 'rgba(255,255,255,0.07)',
  orange: '#FF8C00',
  orangeD: '#D97400',
  yellow: '#FFD700',
  green: '#22C55E',
  teal: '#00A89C',
  purple: '#8B5CF6',
  red: '#EF4444',
  blue: '#3B82F6',
  grey: 'rgba(255,255,255,0.45)',
  dim: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof Colors;
