import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { Chip } from '@/components/ui/Chip';
import { useUserStore } from '@/store/userStore';
import { useSessionStore } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { SKIN_TYPES } from '@/constants/skinTypes';
import { formatIURange } from '@/lib/iuEngine';

interface Badge {
  id: string;
  emoji: string;
  title: string;
}

const ALL_BADGES: Badge[] = [
  { id: 'first_session', emoji: '\uD83C\uDF05', title: 'First Session' },
  { id: 'week_warrior', emoji: '\uD83D\uDD25', title: 'Week Warrior' },
  { id: 'top3', emoji: '\uD83C\uDFC6', title: 'Leaderboard Top 3' },
  { id: 'blood_test', emoji: '\uD83E\uDDEC', title: 'Blood Test Hero' },
  { id: 'med_myth', emoji: '\u2600\uFE0F', title: 'Mediterranean Myth Buster' },
];

export default function ProfileScreen() {
  const { profile, setProfile, bloodTests, addBloodTest, badgesEarned, lifetimeIU } =
    useUserStore();
  const { streak } = useSessionStore();
  const { premiumStatus, setPremium, notificationsEnabled, setNotifications, units, setUnits } =
    useSettingsStore();

  const [showPaywall, setShowPaywall] = useState(false);
  const [btInput, setBtInput] = useState('');
  const [btUnit, setBtUnit] = useState<'nmol' | 'ng'>(units);

  const isPremium = premiumStatus !== 'free';
  const skinType = SKIN_TYPES.find((s) => s.id === profile.skinType);

  const goalLabel =
    profile.goal === 'biohacker'
      ? 'Biohacker'
      : profile.goal === 'deficiency'
      ? 'Deficiency fixer'
      : 'Maintainer';

  // Blood test analysis
  const lastTest = bloodTests[bloodTests.length - 1];
  const nmolValue = lastTest
    ? lastTest.valueNmol
    : btInput
    ? btUnit === 'nmol'
      ? parseFloat(btInput) || 0
      : (parseFloat(btInput) || 0) * 2.496
    : 0;

  const getLevel = (nmol: number) => {
    if (nmol < 25) return { label: 'Severe deficiency', color: Colors.red };
    if (nmol < 50) return { label: 'Deficiency', color: Colors.red };
    if (nmol < 75) return { label: 'Insufficient', color: Colors.yellow };
    if (nmol < 125) return { label: 'Sufficient', color: Colors.green };
    return { label: 'Optimal', color: Colors.teal };
  };

  const level = getLevel(nmolValue);

  const saveBloodTest = () => {
    if (!btInput) return;
    const nmol = btUnit === 'nmol' ? parseFloat(btInput) : (parseFloat(btInput)) * 2.496;
    addBloodTest({
      date: new Date().toISOString().split('T')[0],
      valueNmol: nmol,
      notes: '',
    });
    setBtInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{'\uD83D\uDC64'} Me</Text>

        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(profile.name?.[0] || 'Y').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name || 'You'}</Text>
              <Text style={styles.profileMeta}>
                {goalLabel} \u00B7 {profile.city} \u00B7 Skin type{' '}
                {skinType?.numeral ?? 'III'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{lifetimeIU.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lifetime IU</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{'\uD83D\uDD25'} {streak.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{streak.longestStreak} days</Text>
              <Text style={styles.statLabel}>Best streak</Text>
            </View>
          </View>
        </View>

        {/* Blood Test Tracker */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Blood Test Tracker</Text>
            {!isPremium && (
              <TouchableOpacity
                onPress={() => setShowPaywall(true)}
                style={styles.premiumBadge}
              >
                <Text style={styles.premiumBadgeText}>Helio+ {'\uD83D\uDD12'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.btInputRow}>
            <TextInput
              style={styles.btInput}
              value={btInput}
              onChangeText={setBtInput}
              placeholder="Enter value"
              placeholderTextColor={Colors.dim}
              keyboardType="decimal-pad"
            />
            <View style={styles.btUnitRow}>
              <Chip
                label="nmol/L"
                selected={btUnit === 'nmol'}
                onPress={() => setBtUnit('nmol')}
              />
              <Chip
                label="ng/mL"
                selected={btUnit === 'ng'}
                onPress={() => setBtUnit('ng')}
              />
            </View>
          </View>

          {btInput ? (
            <TouchableOpacity
              onPress={() => {
                if (!isPremium) {
                  setShowPaywall(true);
                } else {
                  saveBloodTest();
                }
              }}
              style={[styles.levelCard, { borderColor: `${level.color}40` }]}
            >
              <Text style={[styles.levelLabel, { color: level.color }]}>
                {level.label} \u00B7 {nmolValue.toFixed(0)} nmol/L
              </Text>
              <View style={styles.levelTrack}>
                <View
                  style={[
                    styles.levelFill,
                    {
                      width: `${Math.min((nmolValue / 150) * 100, 100)}%`,
                      backgroundColor: level.color,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ) : lastTest ? (
            <View style={[styles.levelCard, { borderColor: `${level.color}40` }]}>
              <Text style={[styles.levelLabel, { color: level.color }]}>
                {level.label} \u00B7 {lastTest.valueNmol.toFixed(0)} nmol/L
              </Text>
              <View style={styles.levelTrack}>
                <View
                  style={[
                    styles.levelFill,
                    {
                      width: `${Math.min((lastTest.valueNmol / 150) * 100, 100)}%`,
                      backgroundColor: level.color,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            Not medical advice \u00B7 Retest in ~90 days
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {ALL_BADGES.map((badge) => {
              const earned = badgesEarned.includes(badge.id);
              return (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, !earned && styles.badgeLocked]}
                >
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]}>
                    {badge.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recovery Tokens */}
        <View style={styles.card}>
          <View style={styles.tokenRow}>
            <View>
              <Text style={styles.tokenTitle}>Recovery tokens</Text>
              <Text style={styles.tokenDesc}>
                Protects your streak if you miss a day
              </Text>
            </View>
            <View style={styles.tokenCount}>
              <Text style={styles.tokenNumber}>
                {1 - (streak.recoveryTokensUsedThisWeek ?? 0)}
              </Text>
              <Text style={styles.tokenLabel}>remaining</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.cardHi, true: Colors.orange }}
              thumbColor={Colors.white}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Skin type</Text>
            <Text style={styles.settingValue}>
              Fitzpatrick {skinType?.numeral} {'\u203A'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Goal</Text>
            <Text style={styles.settingValue}>
              {goalLabel} ({profile.goalIU.toLocaleString()} IU) {'\u203A'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setUnits(units === 'nmol' ? 'ng' : 'nmol')}
          >
            <Text style={styles.settingLabel}>Units</Text>
            <Text style={styles.settingValue}>
              {units === 'nmol' ? 'nmol/L' : 'ng/mL'} {'\u203A'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerDisclaimer}>
          Helio \u00B7 Not medical advice \u00B7 Privacy Policy \u00B7 v1.0
        </Text>
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
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  profileMeta: {
    fontSize: 12,
    color: Colors.dim,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.dim,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255,140,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.orange,
  },
  btInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btUnitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  levelCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelFill: {
    height: 6,
    borderRadius: 3,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.dim,
    fontStyle: 'italic',
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
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '30%',
    backgroundColor: 'rgba(255,140,0,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.3)',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  badgeLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: Colors.border,
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeTitle: {
    fontSize: 10,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },
  badgeTitleLocked: {
    color: Colors.dim,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  tokenDesc: {
    fontSize: 11,
    color: Colors.dim,
    marginTop: 4,
  },
  tokenCount: {
    alignItems: 'center',
  },
  tokenNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.orange,
  },
  tokenLabel: {
    fontSize: 9,
    color: Colors.dim,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.dim,
  },
  footerDisclaimer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.dim,
    marginTop: 16,
    lineHeight: 20,
  },
});
