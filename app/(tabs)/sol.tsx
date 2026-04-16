import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { Tag } from '@/components/ui/Tag';
import { Sun } from '@/components/ui/Sun';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  fetchUVForecast,
  getCurrentUV,
  getTodayUV,
  getSynthesisWindow,
  getDailyMaxUV,
  getSolarStatus,
  getSolarStatusColor,
  getSolarStatusLabel,
} from '@/lib/openMeteoApi';
import { getSeasonLabel, daysUntilSeason, formatHour } from '@/lib/uvCalculator';
import { formatIURange } from '@/lib/iuEngine';

export default function SolScreen() {
  const { profile } = useUserStore();
  const { uvData, setUVData, premiumStatus, setPremium } = useSettingsStore();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUVForecast(profile.latitude, profile.longitude);
        setUVData(data);
      } catch {}
    };
    if (!uvData) load();
  }, []);

  const todayUV = uvData ? getTodayUV(uvData) : { hours: [], uvValues: [] };
  const currentUV = uvData ? getCurrentUV(uvData) : 0;
  const currentHour = new Date().getHours();
  const dailyMax = uvData ? getDailyMaxUV(uvData) : [];
  const season = getSeasonLabel(profile.latitude);
  const seasonInfo = daysUntilSeason(profile.latitude);
  const isPremium = premiumStatus !== 'free';

  // UV Chart dimensions
  const chartW = 320;
  const chartH = 160;
  const maxUV = Math.max(...todayUV.uvValues, 6);
  const barW = todayUV.hours.length > 0 ? chartW / todayUV.hours.length : 20;

  // Build the area path
  const buildAreaPath = () => {
    if (todayUV.hours.length === 0) return '';
    const points = todayUV.uvValues.map((uv, i) => {
      const x = i * barW + barW / 2;
      const y = chartH - (uv / maxUV) * chartH;
      return { x, y };
    });

    let path = `M ${points[0].x} ${chartH}`;
    points.forEach((p) => {
      path += ` L ${p.x} ${p.y}`;
    });
    path += ` L ${points[points.length - 1].x} ${chartH} Z`;
    return path;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{'\uD83C\uDF24'} Sol</Text>

        {/* Current Status */}
        <View style={styles.statusRow}>
          <Tag
            label={getSolarStatusLabel(getSolarStatus(currentUV))}
            color={getSolarStatusColor(getSolarStatus(currentUV))}
            dotColor={getSolarStatusColor(getSolarStatus(currentUV))}
          />
          <Text style={styles.currentUV}>UV {currentUV.toFixed(1)}</Text>
        </View>

        {/* UV Forecast Chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today's UV curve</Text>
          <View style={styles.chartContainer}>
            <Svg width={chartW} height={chartH + 30}>
              {/* Synthesis zone background (UV >= 3) */}
              <Rect
                x={0}
                y={chartH - (3 / maxUV) * chartH}
                width={chartW}
                height={(3 / maxUV) * chartH}
                fill="rgba(255,140,0,0.08)"
              />

              {/* UV 3 threshold line */}
              <Line
                x1={0}
                y1={chartH - (3 / maxUV) * chartH}
                x2={chartW}
                y2={chartH - (3 / maxUV) * chartH}
                stroke={Colors.orange}
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.5}
              />

              {/* Area fill */}
              <Path d={buildAreaPath()} fill="rgba(255,140,0,0.2)" />

              {/* Data points and line */}
              {todayUV.uvValues.map((uv, i) => {
                const x = i * barW + barW / 2;
                const y = chartH - (uv / maxUV) * chartH;
                const isNow = todayUV.hours[i] === currentHour;
                const isSynthesis = uv >= 3;
                return (
                  <React.Fragment key={i}>
                    <Circle
                      cx={x}
                      cy={y}
                      r={isNow ? 5 : 2.5}
                      fill={isNow ? Colors.white : isSynthesis ? Colors.orange : Colors.dim}
                    />
                    {/* Hour labels (every 3 hours) */}
                    {todayUV.hours[i] % 3 === 0 && (
                      <SvgText
                        x={x}
                        y={chartH + 18}
                        fill={Colors.dim}
                        fontSize={10}
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {todayUV.hours[i]}h
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Current time marker */}
              {todayUV.hours.includes(currentHour) && (
                <Line
                  x1={todayUV.hours.indexOf(currentHour) * barW + barW / 2}
                  y1={0}
                  x2={todayUV.hours.indexOf(currentHour) * barW + barW / 2}
                  y2={chartH}
                  stroke={Colors.white}
                  strokeWidth={1}
                  strokeDasharray="2,3"
                  opacity={0.4}
                />
              )}
            </Svg>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.orange }]} />
              <Text style={styles.legendText}>Synthesis possible (UV {'\u2265'} 3)</Text>
            </View>
          </View>
        </View>

        {/* 7-Day Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-day solar calendar</Text>
          {dailyMax.map((day, i) => {
            const isToday = i === 0;
            const isLocked = i > 0 && !isPremium;
            const window = uvData ? getSynthesisWindow(uvData, i) : { start: 0, end: 0, hasWindow: false };
            const dateObj = new Date(day.date);
            const dayName = isToday
              ? 'Today'
              : dateObj.toLocaleDateString('en', { weekday: 'short' });
            const dateLabel = dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' });

            return (
              <TouchableOpacity
                key={day.date}
                style={[styles.forecastCard, isLocked && styles.forecastLocked]}
                activeOpacity={isLocked ? 0.7 : 1}
                onPress={() => isLocked && setShowPaywall(true)}
              >
                <View style={styles.forecastLeft}>
                  <Text style={[styles.forecastDay, isToday && styles.forecastDayToday]}>
                    {dayName}
                  </Text>
                  <Text style={styles.forecastDate}>{dateLabel}</Text>
                </View>
                {isLocked ? (
                  <View style={styles.lockContainer}>
                    <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>
                    <Text style={styles.lockText}>Premium</Text>
                  </View>
                ) : (
                  <View style={styles.forecastRight}>
                    <View style={styles.forecastUV}>
                      <Text style={styles.forecastUVLabel}>Max UV</Text>
                      <Text
                        style={[
                          styles.forecastUVValue,
                          { color: getSolarStatusColor(getSolarStatus(day.maxUV)) },
                        ]}
                      >
                        {day.maxUV.toFixed(1)}
                      </Text>
                    </View>
                    {window.hasWindow && (
                      <Text style={styles.forecastWindow}>
                        {formatHour(window.start)}{'–'}{formatHour(window.end)}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Seasonal Context */}
        <View style={styles.card}>
          <View style={styles.seasonHeader}>
            <Sun size={24} color={Colors.orange} />
            <Text style={styles.seasonLabel}>{season}</Text>
          </View>
          {seasonInfo.days > 0 && (
            <Text style={styles.seasonDays}>
              {seasonInfo.label}: <Text style={styles.seasonDaysHighlight}>{seasonInfo.days} days</Text>
            </Text>
          )}
        </View>

        {/* Winter Mode Banner */}
        {currentUV < 2 && (
          <View style={styles.winterBanner}>
            <Text style={styles.winterIcon}>{'\u2744\uFE0F'}</Text>
            <Text style={styles.winterText}>
              Vitamin D Winter — Sun won't produce D until UV returns above 3. Focus on supplements!
            </Text>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentUV: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  forecastCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  forecastLocked: {
    opacity: 0.6,
  },
  forecastLeft: {
    gap: 2,
  },
  forecastDay: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  forecastDayToday: {
    color: Colors.orange,
  },
  forecastDate: {
    fontSize: 12,
    color: Colors.dim,
  },
  forecastRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  forecastUV: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forecastUVLabel: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '600',
  },
  forecastUVValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  forecastWindow: {
    fontSize: 12,
    color: Colors.grey,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    fontSize: 16,
  },
  lockText: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '600',
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  seasonDays: {
    fontSize: 14,
    color: Colors.grey,
    lineHeight: 22,
  },
  seasonDaysHighlight: {
    color: Colors.orange,
    fontWeight: '700',
  },
  winterBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 16,
  },
  winterIcon: {
    fontSize: 24,
  },
  winterText: {
    flex: 1,
    fontSize: 14,
    color: Colors.red,
    lineHeight: 22,
    fontWeight: '500',
  },
});
