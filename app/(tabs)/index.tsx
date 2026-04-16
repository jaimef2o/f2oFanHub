import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { Sun } from '@/components/ui/Sun';
import { Tag } from '@/components/ui/Tag';
import { HabitCalendar, buildHabitDays } from '@/components/ui/HabitCalendar';
import { PrimaryBtn } from '@/components/ui/PrimaryBtn';
import { useUserStore } from '@/store/userStore';
import { useSessionStore } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSocialStore } from '@/store/socialStore';
import {
  fetchUVForecast,
  getCurrentUV,
  getSynthesisWindow,
  getSolarStatus,
  getSolarStatusColor,
  getSolarStatusLabel,
} from '@/lib/openMeteoApi';
import { formatIURange, iuRange } from '@/lib/iuEngine';
import { formatHour, formatTimeWindow } from '@/lib/uvCalculator';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { dailyLogs, streak, addSupplement } = useSessionStore();
  const { uvData, setUVData } = useSettingsStore();
  const { friends } = useSocialStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showSupplementPicker, setShowSupplementPicker] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find((l) => l.date === today);
  const todayIU = todayLog?.totalIU ?? 0;
  const goalIU = profile.goalIU || 2000;
  const progress = Math.min(todayIU / goalIU, 1);
  const progressPct = Math.round(progress * 100);

  const currentUV = uvData ? getCurrentUV(uvData) : 0;
  const solarStatus = getSolarStatus(currentUV);
  const window = uvData ? getSynthesisWindow(uvData) : { start: 0, end: 0, hasWindow: false };

  const now = new Date();
  const currentHour = now.getHours();
  const minutesLeftInWindow = window.hasWindow && currentHour < window.end
    ? (window.end - currentHour) * 60 - now.getMinutes()
    : 0;

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchUVForecast(profile.latitude, profile.longitude);
      setUVData(data);
    } catch {
      // Silently fail — will use cached data
    }
  }, [profile.latitude, profile.longitude, setUVData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSupplement = (iu: number) => {
    addSupplement(today, iu);
    setShowSupplementPicker(false);
  };

  // Build habit calendar days
  const habitDays = buildHabitDays(dailyLogs);

  // Sort friends by weekly IU for leaderboard snippet
  const sortedFriends = [...friends].sort((a, b) => b.weeklyIU - a.weeklyIU).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Tag
              label={getSolarStatusLabel(solarStatus)}
              color={getSolarStatusColor(solarStatus)}
              dotColor={getSolarStatusColor(solarStatus)}
            />
            <Text style={styles.location}>{profile.city}</Text>
          </View>
          {streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>{'\uD83D\uDD25'} {streak.currentStreak}-day streak</Text>
            </View>
          )}
        </View>

        {/* Hero IU Ring */}
        <View style={styles.ringSection}>
          <Ring progress={progress} size={220} strokeWidth={14}>
            <Text style={styles.ringPercent}>{progressPct}%</Text>
            <Text style={styles.ringGoal}>of {goalIU.toLocaleString()} IU</Text>
          </Ring>
          <Text style={styles.todayIU}>
            {todayIU > 0 ? formatIURange(todayIU) : '0 IU'} today
          </Text>
          <Text style={styles.disclaimer}>
            Estimates based on population averages — individual synthesis varies.
          </Text>
        </View>

        {/* Solar Window Card */}
        {window.hasWindow && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your window today</Text>
            <Text style={styles.windowTime}>
              {formatTimeWindow(window.start, window.end)}
            </Text>
            <View style={styles.windowRow}>
              <Text style={styles.windowUV}>UV {currentUV.toFixed(1)}</Text>
              {minutesLeftInWindow > 0 && (
                <Text style={styles.windowCountdown}>
                  {minutesLeftInWindow} min left in window
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Supplement Log */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowSupplementPicker(!showSupplementPicker)}
          activeOpacity={0.7}
        >
          <View style={styles.supplementHeader}>
            <Text style={styles.supplementIcon}>{'\uD83D\uDC8A'}</Text>
            <Text style={styles.supplementLabel}>Log D3 supplement</Text>
          </View>
          {showSupplementPicker && (
            <View style={styles.supplementOptions}>
              {[1000, 2000, 4000].map((dose) => (
                <TouchableOpacity
                  key={dose}
                  style={styles.supplementChip}
                  onPress={() => handleSupplement(dose)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.supplementChipText}>{dose.toLocaleString()} IU</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Habit Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This week</Text>
          <HabitCalendar days={habitDays} />
        </View>

        {/* Leaderboard Snippet */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>This week</Text>
          {sortedFriends.map((friend, i) => {
            const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
            return (
              <View key={friend.id} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>{medals[i] ?? `#${i + 1}`}</Text>
                <View style={styles.leaderAvatar}>
                  <Text style={styles.leaderAvatarText}>{friend.avatar}</Text>
                </View>
                <Text style={styles.leaderName}>{friend.name}</Text>
                <Text style={styles.leaderIU}>{formatIURange(friend.weeklyIU)}</Text>
                {friend.streak > 0 && (
                  <Text style={styles.leaderStreak}>{'\uD83D\uDD25'}{friend.streak}</Text>
                )}
              </View>
            );
          })}
          <TouchableOpacity onPress={() => router.push('/(tabs)/social')} style={styles.viewMore}>
            <Text style={styles.viewMoreText}>View full leaderboard {'\u2192'}</Text>
          </TouchableOpacity>
        </View>

        {/* Invite CTA */}
        <TouchableOpacity style={styles.inviteCard} activeOpacity={0.7}>
          <Text style={styles.inviteText}>Invite friends to compete {'\uD83D\uDC4B'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  topLeft: {
    gap: 6,
  },
  location: {
    fontSize: 14,
    color: Colors.grey,
    fontWeight: '500',
  },
  streakBadge: {
    backgroundColor: 'rgba(255,140,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.orange,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  ringPercent: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
  },
  ringGoal: {
    fontSize: 14,
    color: Colors.grey,
    fontWeight: '500',
  },
  todayIU: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.dim,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  windowTime: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.orange,
  },
  windowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  windowUV: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  windowCountdown: {
    fontSize: 13,
    color: Colors.grey,
  },
  supplementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supplementIcon: {
    fontSize: 22,
  },
  supplementLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  supplementOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  supplementChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.cardHi,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supplementChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.orange,
  },
  section: {
    marginBottom: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  leaderRank: {
    fontSize: 18,
    width: 28,
  },
  leaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.orange,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  leaderIU: {
    fontSize: 12,
    color: Colors.grey,
    fontWeight: '600',
  },
  leaderStreak: {
    fontSize: 12,
    color: Colors.orange,
  },
  viewMore: {
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  },
  inviteCard: {
    backgroundColor: Colors.cardHi,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.orange,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 14,
  },
  inviteText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.orange,
  },
});
