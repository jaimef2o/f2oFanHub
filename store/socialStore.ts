import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Friend {
  id: string;
  name: string;
  avatar: string; // single letter initial
  city: string;
  weeklyIU: number;
  streak: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  daysRemaining: number;
  participantCount: number;
  progress: number; // 0-1
  isPremium: boolean;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  type: 'session' | 'streak_milestone' | 'blood_test';
  description: string;
  stat: string;
  timeAgo: string;
  reactions: number;
}

interface SocialState {
  friends: Friend[];
  challenges: Challenge[];
  activityFeed: ActivityEvent[];
  joinedChallenges: string[];

  addFriend: (friend: Friend) => void;
  joinChallenge: (id: string) => void;
  reactToEvent: (eventId: string) => void;
}

// Mock friends data
const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Lucas', avatar: 'L', city: 'Madrid', weeklyIU: 14200, streak: 18 },
  { id: '2', name: 'Mar\u00eda', avatar: 'M', city: 'Madrid', weeklyIU: 11800, streak: 12 },
  { id: '3', name: 'Javi', avatar: 'J', city: 'Barcelona', weeklyIU: 9600, streak: 7 },
  { id: '4', name: 'Sof\u00eda', avatar: 'S', city: 'Sevilla', weeklyIU: 8900, streak: 22 },
  { id: '5', name: 'Carlos', avatar: 'C', city: 'Madrid', weeklyIU: 6400, streak: 3 },
];

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: '30 Days to Optimal D',
    description: 'Reach 75 nmol/L in 30 days',
    daysRemaining: 24,
    participantCount: 847,
    progress: 0.2,
    isPremium: false,
  },
  {
    id: 'c2',
    title: 'Solar Streak',
    description: '7 consecutive days of sun exposure',
    daysRemaining: 5,
    participantCount: 1243,
    progress: 0.43,
    isPremium: false,
  },
  {
    id: 'c3',
    title: 'Winter Warrior',
    description: 'Maintain D through winter with supplements',
    daysRemaining: 90,
    participantCount: 392,
    progress: 0.1,
    isPremium: false,
  },
  {
    id: 'c4',
    title: 'Team Sun',
    description: 'Group challenge — top team wins',
    daysRemaining: 14,
    participantCount: 2100,
    progress: 0,
    isPremium: true,
  },
];

const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: 'a1',
    userId: '1',
    userName: 'Lucas',
    type: 'session',
    description: 'logged a 25-min session',
    stat: '~1,800\u20132,400 IU',
    timeAgo: '2h ago',
    reactions: 3,
  },
  {
    id: 'a2',
    userId: '4',
    userName: 'Sof\u00eda',
    type: 'streak_milestone',
    description: 'reached a 21-day streak!',
    stat: '\uD83D\uDD25 21 days',
    timeAgo: '5h ago',
    reactions: 8,
  },
  {
    id: 'a3',
    userId: '2',
    userName: 'Mar\u00eda',
    type: 'session',
    description: 'logged a 15-min session',
    stat: '~900\u20131,200 IU',
    timeAgo: '6h ago',
    reactions: 1,
  },
  {
    id: 'a4',
    userId: '3',
    userName: 'Javi',
    type: 'blood_test',
    description: 'logged a blood test — Sufficient!',
    stat: '82 nmol/L',
    timeAgo: '1d ago',
    reactions: 12,
  },
];

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      friends: MOCK_FRIENDS,
      challenges: MOCK_CHALLENGES,
      activityFeed: MOCK_ACTIVITY,
      joinedChallenges: ['c1', 'c2'],

      addFriend: (friend) =>
        set((state) => ({
          friends: [...state.friends, friend],
        })),

      joinChallenge: (id) =>
        set((state) => ({
          joinedChallenges: state.joinedChallenges.includes(id)
            ? state.joinedChallenges
            : [...state.joinedChallenges, id],
        })),

      reactToEvent: (eventId) =>
        set((state) => ({
          activityFeed: state.activityFeed.map((e) =>
            e.id === eventId ? { ...e, reactions: e.reactions + 1 } : e
          ),
        })),
    }),
    {
      name: 'helio-social',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
