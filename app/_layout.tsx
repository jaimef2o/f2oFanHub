import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Colors } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

export default function RootLayout() {
  const { profile } = useUserStore();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    // Wait until navigation is ready
    if (!navState?.key) return;

    const inOnboarding = segments[0] === '(onboarding)';

    if (!profile.onboardingComplete && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (profile.onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [profile.onboardingComplete, segments, navState?.key, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
