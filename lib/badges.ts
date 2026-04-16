/**
 * Badge definitions and earning logic for HELIO.
 */

export interface BadgeDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const ALL_BADGES: BadgeDef[] = [
  {
    id: 'first_session',
    emoji: '\uD83C\uDF05',
    title: 'First Session',
    description: 'Log your first sun session',
  },
  {
    id: 'week_warrior',
    emoji: '\uD83D\uDD25',
    title: 'Week Warrior',
    description: '7-day streak',
  },
  {
    id: 'top3',
    emoji: '\uD83C\uDFC6',
    title: 'Leaderboard Top 3',
    description: 'Finish top 3 any week',
  },
  {
    id: 'blood_test',
    emoji: '\uD83E\uDDEC',
    title: 'Blood Test Hero',
    description: 'Log a blood test result',
  },
  {
    id: 'med_myth',
    emoji: '\u2600\uFE0F',
    title: 'Mediterranean Myth Buster',
    description: 'Hit optimal D while in Spain',
  },
];

/** Check which badges should be earned based on current state */
export function checkBadgeEligibility(params: {
  sessionsCount: number;
  currentStreak: number;
  leaderboardRank: number;
  bloodTestCount: number;
  city: string;
  latestBloodTest?: number; // nmol/L
  alreadyEarned: string[];
}): string[] {
  const newBadges: string[] = [];

  if (params.sessionsCount >= 1 && !params.alreadyEarned.includes('first_session')) {
    newBadges.push('first_session');
  }

  if (params.currentStreak >= 7 && !params.alreadyEarned.includes('week_warrior')) {
    newBadges.push('week_warrior');
  }

  if (params.leaderboardRank <= 3 && params.leaderboardRank > 0 && !params.alreadyEarned.includes('top3')) {
    newBadges.push('top3');
  }

  if (params.bloodTestCount >= 1 && !params.alreadyEarned.includes('blood_test')) {
    newBadges.push('blood_test');
  }

  // Mediterranean Myth Buster: optimal D (>= 100 nmol/L) while in Spain
  const spanishCities = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga'];
  if (
    params.latestBloodTest &&
    params.latestBloodTest >= 100 &&
    spanishCities.some((c) => params.city.includes(c)) &&
    !params.alreadyEarned.includes('med_myth')
  ) {
    newBadges.push('med_myth');
  }

  return newBadges;
}
