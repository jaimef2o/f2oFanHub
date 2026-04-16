export interface DailyLog {
  date: string; // YYYY-MM-DD
  sunIU: number;
  supplementIU: number;
  totalIU: number;
  streakActive: boolean;
  cloudDay: boolean;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  recoveryTokensUsedThisWeek: number;
  lastRecoveryTokenReset: string; // YYYY-MM-DD (Monday)
}

/** Check if today (or a given date) is a cloud day (max UV < 2) */
export function isCloudDay(maxUV: number): boolean {
  return maxUV < 2;
}

/** Get the Monday of the current week */
export function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/** Check if recovery token is available */
export function hasRecoveryToken(streak: StreakState): boolean {
  const currentMonday = getCurrentMonday();
  if (streak.lastRecoveryTokenReset !== currentMonday) {
    // New week, token is fresh
    return true;
  }
  return streak.recoveryTokensUsedThisWeek < 1;
}

/** Calculate streak from daily logs */
export function calculateStreak(logs: DailyLog[], streak: StreakState): StreakState {
  if (logs.length === 0) return streak;

  // Sort logs by date descending
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let current = 0;

  for (const log of sorted) {
    if (log.streakActive || log.cloudDay) {
      current++;
    } else {
      break;
    }
  }

  return {
    ...streak,
    currentStreak: current,
    longestStreak: Math.max(streak.longestStreak, current),
  };
}

/** Check if a session or supplement was logged for today */
export function hasLoggedToday(logs: DailyLog[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find((l) => l.date === today);
  return todayLog ? todayLog.streakActive : false;
}

/** Get today's date string */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Check if a streak milestone was reached */
export function isStreakMilestone(streak: number): boolean {
  return [7, 14, 30, 90, 365].includes(streak);
}

/** Get streak milestone message */
export function getStreakMilestoneMessage(streak: number): string | null {
  switch (streak) {
    case 7:
      return 'One week strong! You earned Week Warrior!';
    case 14:
      return 'Two weeks of consistent sun tracking!';
    case 30:
      return '30 days! You are a true sun seeker!';
    case 90:
      return '90 days! Quarterly champion!';
    case 365:
      return 'ONE YEAR! You are a Solar Legend!';
    default:
      return null;
  }
}
