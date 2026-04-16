import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Sun } from '@/components/ui/Sun';

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.orange,
          tabBarInactiveTintColor: Colors.dim,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Today" emoji={'\u2600\uFE0F'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Social" emoji={'\uD83C\uDFC6'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="session-fab"
          options={{
            title: 'Session',
            tabBarIcon: () => (
              <View style={styles.fabContainer}>
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => router.push('/session')}
                  activeOpacity={0.8}
                >
                  <Sun size={32} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push('/session');
            },
          }}
        />
        <Tabs.Screen
          name="sol"
          options={{
            title: 'Sol',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Sol" emoji={'\uD83C\uDF24'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Me',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Me" emoji={'\uD83D\uDC64'} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 0,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 3,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dim,
  },
  tabLabelActive: {
    color: Colors.orange,
  },
  fabContainer: {
    position: 'relative',
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
