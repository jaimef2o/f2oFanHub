import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '@/constants/colors';
import { SKIN_TYPES } from '@/constants/skinTypes';
import { PrimaryBtn } from '@/components/ui/PrimaryBtn';
import { GhostBtn } from '@/components/ui/GhostBtn';
import { Tag } from '@/components/ui/Tag';
import { Sun } from '@/components/ui/Sun';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  fetchUVForecast,
  getCurrentUV,
  getSynthesisWindow,
  getSolarStatus,
  getSolarStatusColor,
  getSolarStatusLabel,
} from '@/lib/openMeteoApi';
import { getOptimalExposureMinutes, getLatitudeLabel, KNOWN_CITIES, formatHour } from '@/lib/uvCalculator';
import { formatIURange, calculateSessionIU } from '@/lib/iuEngine';

type Step = -1 | 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, setProfile, completeOnboarding } = useUserStore();
  const { setUVData } = useSettingsStore();

  const [step, setStep] = useState<Step>(-1);
  const [locationConsent, setLocationConsent] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [detectedCity, setDetectedCity] = useState('');
  const [detectedLat, setDetectedLat] = useState(40.4168);
  const [detectedLon, setDetectedLon] = useState(-3.7038);
  const [selectedSkin, setSelectedSkin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uvIndex, setUvIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(0);
  const [hasWindow, setHasWindow] = useState(false);

  const canProceedGDPR = locationConsent && healthConsent;

  const goNext = () => setStep((s) => Math.min(s + 1, 3) as Step);
  const goBack = () => setStep((s) => Math.max(s - 1, -1) as Step);

  const detectLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDetectedCity('Madrid');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setDetectedLat(loc.coords.latitude);
      setDetectedLon(loc.coords.longitude);

      // Reverse geocode for city name
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setDetectedCity(geo?.city ?? geo?.region ?? 'Your location');
    } catch {
      setDetectedCity('Madrid');
    }
  }, []);

  const fetchUV = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const data = await fetchUVForecast(lat, lon);
      setUVData(data);
      const uv = getCurrentUV(data);
      setUvIndex(uv);
      const win = getSynthesisWindow(data);
      setWindowStart(win.start);
      setWindowEnd(win.end);
      setHasWindow(win.hasWindow);
    } catch {
      // Fallback UV for offline / API errors
      setUvIndex(5);
      setWindowStart(12);
      setWindowEnd(15);
      setHasWindow(true);
    } finally {
      setLoading(false);
    }
  }, [setUVData]);

  useEffect(() => {
    if (step === 1) {
      detectLocation();
    }
  }, [step, detectLocation]);

  useEffect(() => {
    if (step === 3) {
      fetchUV(detectedLat, detectedLon);
    }
    // Only re-fetch when we arrive at step 3
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finishOnboarding = () => {
    setProfile({
      goal: selectedGoal as any,
      city: detectedCity || 'Madrid',
      latitude: detectedLat,
      longitude: detectedLon,
      skinType: selectedSkin,
      gdprLocationConsent: true,
      gdprHealthConsent: true,
      goalIU: selectedGoal === 'biohacker' ? 4000 : selectedGoal === 'deficiency' ? 2000 : 2000,
    });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const selectCity = (city: (typeof KNOWN_CITIES)[number]) => {
    setDetectedCity(city.name);
    setDetectedLat(city.lat);
    setDetectedLon(city.lon);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress bar — hidden on GDPR step */}
        {step >= 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Back button */}
        {step > 0 && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        )}

        {/* STEP -1: GDPR Gate */}
        {step === -1 && (
          <View style={styles.stepContainer}>
            <Sun size={60} glow />
            <Text style={styles.heroTitle}>Welcome to Helio</Text>
            <Text style={styles.heroSubtitle}>
              Before we start, we need your permission for two things.
            </Text>

            <TouchableOpacity
              style={[styles.consentRow, locationConsent && styles.consentActive]}
              onPress={() => setLocationConsent(!locationConsent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, locationConsent && styles.checkboxChecked]}>
                {locationConsent && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <View style={styles.consentContent}>
                <Text style={styles.consentTitle}>{'\uD83D\uDCCD'} Precise location</Text>
                <Text style={styles.consentDesc}>
                  To calculate your real-time UV index. Used only while app is open. Never shared.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.consentRow, healthConsent && styles.consentActive]}
              onPress={() => setHealthConsent(!healthConsent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, healthConsent && styles.checkboxChecked]}>
                {healthConsent && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <View style={styles.consentContent}>
                <Text style={styles.consentTitle}>{'\uD83E\uDE7A'} Health data</Text>
                <Text style={styles.consentDesc}>
                  Skin type and vitamin D estimates stored on-device. Not sold. Not shared.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.ctaContainer}>
              <PrimaryBtn
                title="Continue"
                onPress={goNext}
                disabled={!canProceedGDPR}
              />
            </View>
          </View>
        )}

        {/* STEP 0: Goal */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What brings you to Helio?</Text>

            {[
              { id: 'deficiency', emoji: '\uD83E\uDE7A', title: 'Fix my deficiency', desc: 'Doctor said my D is low' },
              { id: 'maintain', emoji: '\u2696\uFE0F', title: 'Maintain healthy levels', desc: 'I want to stay consistent' },
              { id: 'biohacker', emoji: '\u26A1', title: 'Optimise like a biohacker', desc: 'I want 100+ nmol/L' },
            ].map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardSelected]}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalText}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalDesc}>{goal.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.ctaContainer}>
              <PrimaryBtn
                title="Continue"
                onPress={goNext}
                disabled={!selectedGoal}
              />
            </View>
          </View>
        )}

        {/* STEP 1: Location */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{'\uD83D\uDCCD'} Your location</Text>

            {detectedCity ? (
              <View style={styles.locationDetected}>
                <Text style={styles.cityName}>{detectedCity}</Text>
                <Text style={styles.latLabel}>
                  {getLatitudeLabel(detectedCity, detectedLat)}
                </Text>
                <Tag
                  label="GPS detected"
                  color={Colors.green}
                  dotColor={Colors.green}
                />
              </View>
            ) : (
              <ActivityIndicator color={Colors.orange} size="large" style={{ marginVertical: 20 }} />
            )}

            <Text style={styles.orLabel}>Or choose a city:</Text>
            <View style={styles.cityGrid}>
              {KNOWN_CITIES.map((city) => (
                <TouchableOpacity
                  key={city.name}
                  style={[
                    styles.cityChip,
                    detectedCity === city.name && styles.cityChipSelected,
                  ]}
                  onPress={() => selectCity(city)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      detectedCity === city.name && styles.cityChipTextSelected,
                    ]}
                  >
                    {city.name} ({Math.round(city.lat)}{'°'}N)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ctaContainer}>
              <PrimaryBtn
                title="Confirm location"
                onPress={goNext}
                disabled={!detectedCity}
              />
            </View>
          </View>
        )}

        {/* STEP 2: Skin Type */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your skin type</Text>
            <Text style={styles.stepSubtitle}>
              Fitzpatrick scale — helps us estimate your vitamin D synthesis rate.
            </Text>

            <View style={styles.skinGrid}>
              {SKIN_TYPES.map((skin) => (
                <TouchableOpacity
                  key={skin.id}
                  style={[
                    styles.skinCard,
                    selectedSkin === skin.id && styles.skinCardSelected,
                  ]}
                  onPress={() => setSelectedSkin(skin.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.skinCircle, { backgroundColor: skin.color }]} />
                  <Text style={styles.skinNumeral}>{skin.numeral}</Text>
                  <Text style={styles.skinBurn}>{skin.burnDescription}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSkin > 0 && (
              <View style={styles.skinResult}>
                <Text style={styles.skinResultText}>
                  For your skin type, minimum exposure time today:{' '}
                  <Text style={styles.skinResultHighlight}>
                    {getOptimalExposureMinutes(5, selectedSkin)} min
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.ctaContainer}>
              <PrimaryBtn
                title="Continue"
                onPress={goNext}
                disabled={selectedSkin === 0}
              />
            </View>
          </View>
        )}

        {/* STEP 3: AHA Moment */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Sun size={60} glow />
                <Text style={styles.loadingText}>Calculating your solar window...</Text>
                <ActivityIndicator color={Colors.orange} size="large" />
              </View>
            ) : (
              <>
                <Text style={styles.ahaHeader}>Today in {detectedCity || 'your city'}</Text>

                <Tag
                  label={getSolarStatusLabel(getSolarStatus(uvIndex))}
                  color={getSolarStatusColor(getSolarStatus(uvIndex))}
                  dotColor={getSolarStatusColor(getSolarStatus(uvIndex))}
                />

                {hasWindow && (
                  <View style={styles.ahaCard}>
                    <Text style={styles.ahaLabel}>Optimal window</Text>
                    <Text style={styles.ahaWindow}>
                      {formatHour(windowStart)}{'–'}{formatHour(windowEnd)}
                    </Text>
                  </View>
                )}

                <View style={styles.ahaCard}>
                  <Text style={styles.ahaLabel}>UV Index</Text>
                  <Text style={styles.ahaValue}>{uvIndex.toFixed(1)}</Text>
                </View>

                {selectedSkin > 0 && uvIndex >= 3 && (
                  <View style={styles.ahaCard}>
                    <Text style={styles.ahaLabel}>For your skin type</Text>
                    <Text style={styles.ahaValue}>
                      {getOptimalExposureMinutes(uvIndex, selectedSkin)} minutes gives you{' '}
                      {formatIURange(
                        calculateSessionIU(
                          uvIndex,
                          getOptimalExposureMinutes(uvIndex, selectedSkin),
                          selectedSkin,
                          'face_arms',
                          'none'
                        )
                      )}
                    </Text>
                  </View>
                )}

                <View style={styles.ctaContainer}>
                  <PrimaryBtn title="Start tracking →" onPress={finishOnboarding} />
                </View>
              </>
            )}
          </View>
        )}
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
    padding: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.cardHi,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: Colors.grey,
    fontSize: 15,
    fontWeight: '600',
  },
  stepContainer: {
    gap: 16,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  consentRow: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
  },
  consentActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.dim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orange,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  consentContent: {
    flex: 1,
    gap: 4,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  consentDesc: {
    fontSize: 13,
    color: Colors.grey,
    lineHeight: 20,
  },
  ctaContainer: {
    width: '100%',
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 22,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
  },
  goalCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalText: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  goalDesc: {
    fontSize: 13,
    color: Colors.grey,
  },
  locationDetected: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  cityName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  latLabel: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 4,
  },
  orLabel: {
    fontSize: 13,
    color: Colors.dim,
    fontWeight: '600',
    marginTop: 8,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityChipSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grey,
  },
  cityChipTextSelected: {
    color: Colors.orange,
  },
  skinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  skinCard: {
    width: '29%',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  skinCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  skinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skinNumeral: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  skinBurn: {
    fontSize: 10,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 13,
  },
  skinResult: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skinResultText: {
    fontSize: 14,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 22,
  },
  skinResultHighlight: {
    color: Colors.orange,
    fontWeight: '800',
  },
  ahaHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  ahaCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  ahaLabel: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ahaWindow: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.orange,
  },
  ahaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.grey,
    fontWeight: '500',
  },
});
