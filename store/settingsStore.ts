import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UVForecastResponse } from '@/lib/openMeteoApi';

interface SettingsState {
  notificationsEnabled: boolean;
  units: 'nmol' | 'ng';
  premiumStatus: 'free' | 'trial' | 'premium';
  hasCompletedFirstSession: boolean;
  uvData: UVForecastResponse | null;
  uvDataLastFetch: string | null; // ISO string
  showPaywall: boolean;

  // Actions
  setNotifications: (enabled: boolean) => void;
  setUnits: (units: 'nmol' | 'ng') => void;
  setPremium: (status: 'free' | 'trial' | 'premium') => void;
  setFirstSessionComplete: () => void;
  setUVData: (data: UVForecastResponse) => void;
  setShowPaywall: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: false,
      units: 'nmol',
      premiumStatus: 'free',
      hasCompletedFirstSession: false,
      uvData: null,
      uvDataLastFetch: null,
      showPaywall: false,

      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
      setUnits: (units) => set({ units }),
      setPremium: (status) => set({ premiumStatus: status }),
      setFirstSessionComplete: () => set({ hasCompletedFirstSession: true }),
      setUVData: (data) =>
        set({
          uvData: data,
          uvDataLastFetch: new Date().toISOString(),
        }),
      setShowPaywall: (show) => set({ showPaywall: show }),
    }),
    {
      name: 'helio-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
