import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { PrimaryBtn } from '@/components/ui/PrimaryBtn';
import { useSessionStore } from '@/store/sessionStore';
import { useSocialStore } from '@/store/socialStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { formatIURange } from '@/lib/iuEngine';

type Tab = 'friends' | 'city';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [showPaywall, setShowPaywall] = useState(false);
  const { friends, challenges, activityFeed, joinedChallenges, joinChallenge, reactToEvent } =
    useSocialStore();
  const { streak, dailyLogs } = useSessionStore();
  const { premiumStatus, setPremium } = useSettingsStore();
  const { profile } = useUserStore();

  const isPremium = premiumStatus !== 'free';

  // Calculate user's weekly IU
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const mondayStr = monday.toISOString().split('T')[0];

  const userWeeklyIU = dailyLogs
    .filter((l) => l.date >= mondayStr)
    .reduce((sum, l) => sum + l.totalIU, 0);

  // Build leaderboard with user
  const userEntry = {
    id: 'user',
    name: profile.name || 'You',
    avatar: (profile.name?.[0] || 'Y').toUpperCase(),
    city: profile.city,
    weeklyIU: userWeeklyIU,
    streak: streak.currentStreak,
  };

  const allEntries = [...friends, userEntry].sort((a, b) => b.weeklyIU - a.weeklyIU);
  const cityEntries = allEntries.filter((e) => e.city === profile.city || e.id === 'user');

  const displayEntries = activeTab === 'friends' ? allEntries : cityEntries;

  // Week dates
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekLabel = `${monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}\u2013${sunday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{'\uD83C\uDFC6'} Social</Text>

        {/* Leaderboard Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'city' && styles.tabActive]}
            onPress={() => setActiveTab('city')}
          >
            <Text style={[styles.tabText, activeTab === 'city' && styles.tabTextActive]}>
              {profile.city || 'City'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Leaderboard */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>This week ({weekLabel})</Text>

          {displayEntries.map((entry, i) => {
            const isUser = entry.id === 'user';
            const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
            const isBottom = i === displayEntries.length - 1 && displayEntries.length > 1;

            return (
              <View
                key={entry.id}
                style={[styles.leaderRow, isUser && styles.leaderRowUser]}
              >
                <Text style={styles.rankText}>{medals[i] ?? `#${i + 1}`}</Text>
                <View style={[styles.avatar, isUser && styles.avatarUser]}>
                  <Text style={[styles.avatarText, isUser && styles.avatarTextUser]}>
                    {entry.avatar}
                  </Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={[styles.nameText, isUser && styles.nameTextUser]}>
                    {isUser ? 'You' : entry.name}
                  </Text>
                  {isBottom && !isUser && (
                    <Text style={styles.slackerLabel}>Solar Slacker {'\uD83D\uDE34'}</Text>
                  )}
                </View>
                <View style={styles.iuCol}>
                  <Text style={styles.iuText}>{formatIURange(entry.weeklyIU)}</Text>
                  {entry.streak > 0 && (
                    <Text style={styles.streakText}>{'\uD83D\uDD25'} {entry.streak}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges</Text>
          {challenges.map((challenge) => {
            const joined = joinedChallenges.includes(challenge.id);
            const locked = challenge.isPremium && !isPremium;
            return (
              <TouchableOpacity
                key={challenge.id}
                style={[styles.challengeCard, locked && styles.challengeLocked]}
                activeOpacity={locked ? 0.7 : 1}
                onPress={() => {
                  if (locked) setShowPaywall(true);
                  else if (!joined) joinChallenge(challenge.id);
                }}
              >
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  {locked && <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>}
                </View>
                <Text style={styles.challengeDesc}>{challenge.description}</Text>

                {!locked && (
                  <>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${challenge.progress * 100}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.challengeFooter}>
                      <Text style={styles.challengeMeta}>
                        {challenge.daysRemaining} days left
                      </Text>
                      <Text style={styles.challengeMeta}>
                        {challenge.participantCount.toLocaleString()} participants
                      </Text>
                    </View>
                  </>
                )}

                {!locked && !joined && (
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => joinChallenge(challenge.id)}
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                )}
                {joined && (
                  <Text style={styles.joinedLabel}>{'\u2705'} Joined</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {activityFeed.map((event) => (
            <View key={event.id} style={styles.activityRow}>
              <View style={styles.activityAvatar}>
                <Text style={styles.activityAvatarText}>{event.userName[0]}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityName}>{event.userName}</Text>{' '}
                  {event.description}
                </Text>
                <Text style={styles.activityStat}>{event.stat}</Text>
                <Text style={styles.activityTime}>{event.timeAgo}</Text>
              </View>
              <TouchableOpacity
                style={styles.reactionBtn}
                onPress={() => reactToEvent(event.id)}
              >
                <Text style={styles.reactionEmoji}>{'\uD83C\uDF1E'}</Text>
                <Text style={styles.reactionCount}>{event.reactions}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Invite CTA */}
        {friends.length < 3 && (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>
              Your leaderboard needs more friends!
            </Text>
            <Text style={styles.inviteDesc}>Invite 3 friends to compete</Text>
            <PrimaryBtn title="Invite friends" onPress={() => {}} style={{ marginTop: 12 }} />
          </View>
        )}
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onStartTrial={() => {
          setPremium('trial');
          setShowPaywall(false);
        }}
        onLifetime={() => {
          setPremium('premium');
          setShowPaywall(false);
        }}
      />
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.cardHi,
    borderColor: Colors.orange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grey,
  },
  tabTextActive: {
    color: Colors.orange,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  leaderRowUser: {
    backgroundColor: 'rgba(255,140,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  rankText: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    backgroundColor: Colors.orange,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.grey,
  },
  avatarTextUser: {
    color: Colors.white,
  },
  nameCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  nameTextUser: {
    color: Colors.orange,
    fontWeight: '700',
  },
  slackerLabel: {
    fontSize: 11,
    color: Colors.dim,
    marginTop: 2,
  },
  iuCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  iuText: {
    fontSize: 12,
    color: Colors.grey,
    fontWeight: '600',
  },
  streakText: {
    fontSize: 11,
    color: Colors.orange,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  challengeCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  challengeLocked: {
    opacity: 0.5,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  lockIcon: {
    fontSize: 16,
  },
  challengeDesc: {
    fontSize: 13,
    color: Colors.grey,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.cardHi,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.orange,
    borderRadius: 3,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeMeta: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  joinBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  joinedLabel: {
    fontSize: 13,
    color: Colors.green,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.grey,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  activityName: {
    fontWeight: '700',
  },
  activityStat: {
    fontSize: 13,
    color: Colors.orange,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 11,
    color: Colors.dim,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.cardHi,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.grey,
    fontWeight: '600',
  },
  inviteCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.orange,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  inviteDesc: {
    fontSize: 13,
    color: Colors.grey,
    marginTop: 4,
  },
});
