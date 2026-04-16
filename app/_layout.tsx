import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const { profile } = useUserStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inOnboarding = segments[0] === '(onboarding)';

    if (!profile.onboardingComplete && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (profile.onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [profile.onboardingComplete, segments]);

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
