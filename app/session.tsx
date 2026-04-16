import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BodyFigure } from '@/components/ui/BodyFigure';
import { PrimaryBtn } from '@/components/ui/PrimaryBtn';
import { GhostBtn } from '@/components/ui/GhostBtn';
import { ShareCard } from '@/components/ui/ShareCard';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { Ring } from '@/components/ui/Ring';
import { useUserStore } from '@/store/userStore';
import { useSessionStore, type SunSession } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  calculateSessionIU,
  formatIURange,
  burnProgress,
  calculateIUPerMinute,
} from '@/lib/iuEngine';
import { getCurrentUV } from '@/lib/openMeteoApi';
import { SUNSCREEN_OPTIONS, type SunscreenId } from '@/constants/situations';

type Mode = 'log' | 'live' | 'summary';

export default function SessionScreen() {
  const router = useRouter();
  const { profile, addLifetimeIU, earnBadge } = useUserStore();
  const { addSession, lastSituation, lastDuration, streak } = useSessionStore();
  const { uvData, hasCompletedFirstSession, setFirstSessionComplete, setPremium } =
    useSettingsStore();

  const [mode, setMode] = useState<Mode>('log');
  const [duration, setDuration] = useState(lastDuration || 20);
  const [situation, setSituation] = useState(lastSituation || 'face_arms');
  const [sunscreen, setSunscreen] = useState<SunscreenId>('none');
  const [showShareCard, setShowShareCard] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState(new Date().getHours());
  const [customMinute, setCustomMinute] = useState(new Date().getMinutes());

  // Live session state
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveIU, setLiveIU] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Summary state
  const [sessionResult, setSessionResult] = useState<SunSession | null>(null);

  const currentUV = uvData ? getCurrentUV(uvData) : 0;

  // Calculate IU estimate for log mode
  const estimatedIU = calculateSessionIU(currentUV, duration, profile.skinType, situation, sunscreen);
  const burn = burnProgress(duration, currentUV, profile.skinType, sunscreen);

  // Live session IU per minute
  const iuPerMin = calculateIUPerMinute(currentUV, profile.skinType, situation, sunscreen);

  const startLiveSession = () => {
    setMode('live');
    setLiveSeconds(0);
    setLiveIU(0);
    timerRef.current = setInterval(() => {
      setLiveSeconds((s) => s + 1);
      setLiveIU((iu) => iu + iuPerMin / 60);
    }, 1000);
  };

  const endLiveSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const durationMin = Math.round(liveSeconds / 60);
    const iu = Math.round(liveIU);
    completeSession(durationMin, iu);
  };

  const logSession = () => {
    completeSession(duration, estimatedIU);
  };

  const completeSession = (durationMin: number, iu: number) => {
    const session: SunSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      durationMin,
      situation,
      sunscreen,
      uvIndex: currentUV,
      iuProduced: iu,
    };

    addSession(session);
    addLifetimeIU(iu);
    earnBadge('first_session');

    // Check streak-based badges
    const newStreak = streak.currentStreak + 1;
    if (newStreak >= 7) {
      earnBadge('week_warrior');
    }

    setSessionResult(session);
    setMode('summary');

    if (!hasCompletedFirstSession) {
      setFirstSessionComplete();
      // Show paywall after user sees their summary
      setTimeout(() => setShowPaywall(true), 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleShare = () => {
    setShowShareCard(true);
  };

  const handleDone = () => {
    router.back();
  };

  const formatLiveTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const liveBurn = burnProgress(liveSeconds / 60, currentUV, profile.skinType, sunscreen);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>{'\u2715'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'log' ? 'Log Sun Session' : mode === 'live' ? 'Live Session' : 'Session Complete'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.headerSubline}>
        UV {currentUV.toFixed(1)} {'\u00B7'} {profile.city} {'\u00B7'}{' '}
        {currentUV >= 3 ? 'Synthesis active' : 'No synthesis \u2014 UV too low'}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* LOG MODE */}
        {mode === 'log' && (
          <>
            {/* When / Time picker */}
            <View style={styles.whenCard}>
              <View>
                <Text style={styles.whenLabel}>When</Text>
                <Text style={styles.whenValue}>
                  {useCustomTime
                    ? `${customHour.toString().padStart(2, '0')}:${customMinute.toString().padStart(2, '0')}`
                    : `Now \u00B7 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setUseCustomTime(!useCustomTime)}>
                <Text style={styles.editTimeLink}>
                  {useCustomTime ? 'Use now' : 'Edit time \u25BE'}
                </Text>
              </TouchableOpacity>
            </View>
            {useCustomTime && (
              <View style={styles.timePickerRow}>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setCustomHour(Math.max(0, customHour - 1))}
                >
                  <Text style={styles.timeBtnText}>{'\u2212'}</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>
                  {customHour.toString().padStart(2, '0')}:{customMinute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setCustomHour(Math.min(23, customHour + 1))}
                >
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* UV Display */}
            <View style={styles.uvRow}>
              <Text style={styles.uvLabel}>Current UV</Text>
              <Text style={styles.uvValue}>{currentUV.toFixed(1)}</Text>
            </View>

            {/* Duration Slider */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Duration</Text>
              <View style={styles.durationRow}>
                <TouchableOpacity
                  onPress={() => setDuration(Math.max(5, duration - 5))}
                  style={styles.durationBtn}
                >
                  <Text style={styles.durationBtnText}>{'\u2212'}</Text>
                </TouchableOpacity>
                <Text style={styles.durationValue}>{duration} min</Text>
                <TouchableOpacity
                  onPress={() => setDuration(Math.min(120, duration + 5))}
                  style={styles.durationBtn}
                >
                  <Text style={styles.durationBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              {/* Simple slider track */}
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${((duration - 5) / 115) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* Body Exposure */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Body exposure</Text>
              <BodyFigure selected={situation} onSelect={setSituation} />
            </View>

            {/* Sunscreen */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sunscreen</Text>
              <View style={styles.sunscreenRow}>
                {SUNSCREEN_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.sunscreenChip,
                      sunscreen === opt.id && styles.sunscreenChipActive,
                    ]}
                    onPress={() => setSunscreen(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.sunscreenText,
                        sunscreen === opt.id && styles.sunscreenTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* IU Estimate */}
            <View style={styles.estimateCard}>
              <Text style={styles.estimateValue}>{formatIURange(estimatedIU)}</Text>
              <Text style={styles.estimateLabel}>
                IU estimated {'\u00B7'} {'\u00B1'}15% individual variance
              </Text>
            </View>

            {/* Burn Warning Bar */}
            <View style={styles.burnSection}>
              <Text style={styles.burnLabel}>Sunburn risk</Text>
              <View style={styles.burnTrack}>
                <View
                  style={[
                    styles.burnFill,
                    {
                      width: `${burn * 100}%`,
                      backgroundColor: burn > 0.7 ? Colors.red : burn > 0.4 ? Colors.orange : Colors.green,
                    },
                  ]}
                />
              </View>
              <Text style={styles.burnText}>
                {burn > 0.7 ? 'High risk — reduce time!' : burn > 0.4 ? 'Moderate — be careful' : 'Safe'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <GhostBtn title={'\u25B6 Start live'} onPress={startLiveSession} />
              <View style={{ flex: 2 }}>
                <PrimaryBtn title="Log Session" onPress={logSession} />
              </View>
            </View>
          </>
        )}

        {/* LIVE MODE */}
        {mode === 'live' && (
          <View style={styles.liveContainer}>
            <View style={styles.liveTimer}>
              <Text style={styles.liveTime}>{formatLiveTime(liveSeconds)}</Text>
              <Text style={styles.liveSubLabel}>elapsed</Text>
            </View>

            <View style={styles.liveStats}>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatValue}>{formatIURange(Math.round(liveIU))}</Text>
                <Text style={styles.liveStatLabel}>produced</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatValue}>UV {currentUV.toFixed(1)}</Text>
                <Text style={styles.liveStatLabel}>current</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatValue}>{iuPerMin.toFixed(0)} IU/min</Text>
                <Text style={styles.liveStatLabel}>rate</Text>
              </View>
            </View>

            {/* Live burn bar */}
            <View style={styles.burnSection}>
              <Text style={styles.burnLabel}>Sunburn risk</Text>
              <View style={styles.burnTrack}>
                <View
                  style={[
                    styles.burnFill,
                    {
                      width: `${liveBurn * 100}%`,
                      backgroundColor:
                        liveBurn > 0.7 ? Colors.red : liveBurn > 0.4 ? Colors.orange : Colors.green,
                    },
                  ]}
                />
              </View>
            </View>

            <PrimaryBtn title="End Session" onPress={endLiveSession} color={Colors.red} />
          </View>
        )}

        {/* SUMMARY MODE */}
        {mode === 'summary' && sessionResult && (
          <View style={styles.summaryContainer}>
            <Ring progress={1} size={160} color={Colors.green}>
              <Text style={styles.summaryEmoji}>{'\u2705'}</Text>
            </Ring>

            <Text style={styles.summaryIU}>{formatIURange(sessionResult.iuProduced)}</Text>
            <Text style={styles.summaryLabel}>vitamin D produced</Text>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{sessionResult.durationMin} min</Text>
                <Text style={styles.summaryStatLabel}>Duration</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>UV {sessionResult.uvIndex.toFixed(1)}</Text>
                <Text style={styles.summaryStatLabel}>UV Index</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {SUNSCREEN_OPTIONS.find((o) => o.id === sessionResult.sunscreen)?.label}
                </Text>
                <Text style={styles.summaryStatLabel}>Sunscreen</Text>
              </View>
            </View>

            <Text style={styles.notMedical}>
              Not medical advice. Estimates based on population averages.
            </Text>

            <View style={styles.actionsRow}>
              <GhostBtn title={'\uD83D\uDCE4 Share'} onPress={handleShare} />
              <View style={{ flex: 2 }}>
                <PrimaryBtn title="Done \u2713" onPress={handleDone} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Share Card Modal */}
      {sessionResult && (
        <ShareCard
          visible={showShareCard}
          onClose={() => setShowShareCard(false)}
          onShare={() => {
            setShowShareCard(false);
            Alert.alert('Shared!', 'Your session card has been shared.');
          }}
          iuProduced={sessionResult.iuProduced}
          durationMin={sessionResult.durationMin}
          uvIndex={sessionResult.uvIndex}
          streak={streak.currentStreak}
          situationId={sessionResult.situation}
          city={profile.city}
        />
      )}

      {/* Paywall — triggers after first completed session */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.grey,
    fontWeight: '600',
  },
  headerSubline: {
    fontSize: 12,
    color: Colors.dim,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  uvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  uvLabel: {
    fontSize: 14,
    color: Colors.grey,
    fontWeight: '600',
  },
  uvValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  durationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    minWidth: 100,
    textAlign: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.cardHi,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 6,
    backgroundColor: Colors.orange,
    borderRadius: 3,
  },
  sunscreenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sunscreenChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  sunscreenChipActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  sunscreenText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grey,
  },
  sunscreenTextActive: {
    color: Colors.orange,
  },
  estimateCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  estimateLabel: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  estimateValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.green,
  },
  burnSection: {
    marginBottom: 20,
    gap: 8,
  },
  burnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grey,
  },
  burnTrack: {
    height: 8,
    backgroundColor: Colors.cardHi,
    borderRadius: 4,
    overflow: 'hidden',
  },
  burnFill: {
    height: 8,
    borderRadius: 4,
  },
  burnText: {
    fontSize: 12,
    color: Colors.grey,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  whenCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  whenLabel: {
    fontSize: 11,
    color: Colors.dim,
    marginBottom: 2,
  },
  whenValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  editTimeLink: {
    fontSize: 11,
    color: Colors.orange,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.orange,
    minWidth: 80,
    textAlign: 'center',
  },
  // Live mode
  liveContainer: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 20,
  },
  liveTimer: {
    alignItems: 'center',
    gap: 4,
  },
  liveTime: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  liveSubLabel: {
    fontSize: 14,
    color: Colors.dim,
    fontWeight: '600',
  },
  liveStats: {
    flexDirection: 'row',
    gap: 24,
  },
  liveStat: {
    alignItems: 'center',
    gap: 4,
  },
  liveStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  liveStatLabel: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Summary
  summaryContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  summaryEmoji: {
    fontSize: 40,
  },
  summaryIU: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.green,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.grey,
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    justifyContent: 'center',
  },
  summaryStat: {
    alignItems: 'center',
    gap: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  notMedical: {
    fontSize: 11,
    color: Colors.dim,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});
