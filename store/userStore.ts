import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserGoal = 'deficiency' | 'maintain' | 'biohacker';

export interface BloodTest {
  date: string;
  valueNmol: number;
  notes: string;
}

export interface UserProfile {
  name: string;
  goal: UserGoal;
  city: string;
  latitude: number;
  longitude: number;
  skinType: number; // 1-6 Fitzpatrick
  goalIU: number;
  onboardingComplete: boolean;
  gdprLocationConsent: boolean;
  gdprHealthConsent: boolean;
}

interface UserState {
  profile: UserProfile;
  bloodTests: BloodTest[];
  badgesEarned: string[];
  lifetimeIU: number;

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addBloodTest: (test: BloodTest) => void;
  earnBadge: (badgeId: string) => void;
  addLifetimeIU: (iu: number) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  goal: 'maintain',
  city: '',
  latitude: 40.4168,
  longitude: -3.7038,
  skinType: 3,
  goalIU: 2000,
  onboardingComplete: false,
  gdprLocationConsent: false,
  gdprHealthConsent: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      bloodTests: [],
      badgesEarned: [],
      lifetimeIU: 0,

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, onboardingComplete: true },
        })),

      addBloodTest: (test) =>
        set((state) => ({
          bloodTests: [...state.bloodTests, test],
        })),

      earnBadge: (badgeId) =>
        set((state) => ({
          badgesEarned: state.badgesEarned.includes(badgeId)
            ? state.badgesEarned
            : [...state.badgesEarned, badgeId],
        })),

      addLifetimeIU: (iu) =>
        set((state) => ({
          lifetimeIU: state.lifetimeIU + iu,
        })),
    }),
    {
      name: 'helio-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
