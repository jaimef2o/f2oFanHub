import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SunscreenId } from '@/constants/situations';

export interface SunSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  durationMin: number;
  situation: string;
  sunscreen: SunscreenId;
  uvIndex: number;
  iuProduced: number;
}

export interface DailyLog {
  date: string;
  sunIU: number;
  supplementIU: number;
  totalIU: number;
  streakActive: boolean;
  cloudDay: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  recoveryTokensUsedThisWeek: number;
  lastRecoveryTokenReset: string;
}

interface SessionState {
  sessions: SunSession[];
  dailyLogs: DailyLog[];
  streak: StreakData;
  lastSituation: string;
  lastDuration: number;

  // Actions
  addSession: (session: SunSession) => void;
  addSupplement: (date: string, iu: number) => void;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
  setStreak: (streak: Partial<StreakData>) => void;
  useRecoveryToken: () => void;
  setLastSituation: (id: string) => void;
  setLastDuration: (min: number) => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getCurrentMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      dailyLogs: [],
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        recoveryTokensUsedThisWeek: 0,
        lastRecoveryTokenReset: getCurrentMonday(),
      },
      lastSituation: 'face_arms',
      lastDuration: 20,

      addSession: (session) =>
        set((state) => {
          const sessions = [...state.sessions, session];
          const date = session.date;
          const existing = state.dailyLogs.find((l) => l.date === date);
          const sunIU = (existing?.sunIU ?? 0) + session.iuProduced;
          const supplementIU = existing?.supplementIU ?? 0;

          const updatedLog: DailyLog = {
            date,
            sunIU,
            supplementIU,
            totalIU: sunIU + supplementIU,
            streakActive: true,
            cloudDay: existing?.cloudDay ?? false,
          };

          const dailyLogs = existing
            ? state.dailyLogs.map((l) => (l.date === date ? updatedLog : l))
            : [...state.dailyLogs, updatedLog];

          // Update streak
          const streak = { ...state.streak };
          const todayLog = dailyLogs.find((l) => l.date === getTodayStr());
          if (todayLog?.streakActive) {
            // Count streak from today backwards
            let count = 0;
            const sorted = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
            for (const log of sorted) {
              if (log.streakActive || log.cloudDay) {
                count++;
              } else {
                break;
              }
            }
            streak.currentStreak = count;
            streak.longestStreak = Math.max(streak.longestStreak, count);
          }

          return {
            sessions,
            dailyLogs,
            streak,
            lastSituation: session.situation,
            lastDuration: session.durationMin,
          };
        }),

      addSupplement: (date, iu) =>
        set((state) => {
          const existing = state.dailyLogs.find((l) => l.date === date);
          const supplementIU = (existing?.supplementIU ?? 0) + iu;
          const sunIU = existing?.sunIU ?? 0;

          const updatedLog: DailyLog = {
            date,
            sunIU,
            supplementIU,
            totalIU: sunIU + supplementIU,
            streakActive: true,
            cloudDay: existing?.cloudDay ?? false,
          };

          const dailyLogs = existing
            ? state.dailyLogs.map((l) => (l.date === date ? updatedLog : l))
            : [...state.dailyLogs, updatedLog];

          // Update streak
          const streak = { ...state.streak };
          let count = 0;
          const sorted = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
          for (const log of sorted) {
            if (log.streakActive || log.cloudDay) {
              count++;
            } else {
              break;
            }
          }
          streak.currentStreak = count;
          streak.longestStreak = Math.max(streak.longestStreak, count);

          return { dailyLogs, streak };
        }),

      updateDailyLog: (date, updates) =>
        set((state) => {
          const existing = state.dailyLogs.find((l) => l.date === date);
          if (existing) {
            return {
              dailyLogs: state.dailyLogs.map((l) =>
                l.date === date ? { ...l, ...updates } : l
              ),
            };
          }
          return {
            dailyLogs: [
              ...state.dailyLogs,
              {
                date,
                sunIU: 0,
                supplementIU: 0,
                totalIU: 0,
                streakActive: false,
                cloudDay: false,
                ...updates,
              },
            ],
          };
        }),

      setStreak: (updates) =>
        set((state) => ({
          streak: { ...state.streak, ...updates },
        })),

      useRecoveryToken: () =>
        set((state) => {
          const monday = getCurrentMonday();
          const streak = { ...state.streak };
          if (streak.lastRecoveryTokenReset !== monday) {
            streak.recoveryTokensUsedThisWeek = 0;
            streak.lastRecoveryTokenReset = monday;
          }
          streak.recoveryTokensUsedThisWeek++;
          return { streak };
        }),

      setLastSituation: (id) => set({ lastSituation: id }),
      setLastDuration: (min) => set({ lastDuration: min }),
    }),
    {
      name: 'helio-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
