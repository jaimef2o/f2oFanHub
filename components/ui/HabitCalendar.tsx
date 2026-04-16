import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export interface DayState {
  label: string;
  date: string; // YYYY-MM-DD
  state: 'hit' | 'cloud' | 'missed' | 'today' | 'future';
}

interface HabitCalendarProps {
  days: DayState[];
}

// Spanish day labels: L M X J V S D
const DAY_LABELS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayGlyph(state: DayState['state']): { glyph: string; fontSize: number } {
  switch (state) {
    case 'hit':
      return { glyph: '\u2600', fontSize: 14 };
    case 'cloud':
      return { glyph: '\u2601', fontSize: 12 };
    case 'missed':
      return { glyph: '\u00B7', fontSize: 12 };
    case 'today':
      return { glyph: '\u2600', fontSize: 14 };
    case 'future':
      return { glyph: '\u00B7', fontSize: 12 };
  }
}

function getDayColors(state: DayState['state']) {
  switch (state) {
    case 'hit':
      return {
        bg: `${Colors.orange}BB`,
        border: `${Colors.orange}44`,
        text: Colors.white,
      };
    case 'cloud':
      return {
        bg: `${Colors.blue}25`,
        border: `${Colors.blue}55`,
        text: Colors.blue,
      };
    case 'missed':
      return {
        bg: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.06)',
        text: 'rgba(255,255,255,0.2)',
      };
    case 'today':
      return {
        bg: `${Colors.orange}BB`,
        border: Colors.yellow,
        text: Colors.white,
      };
    case 'future':
      return {
        bg: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.06)',
        text: 'rgba(255,255,255,0.15)',
      };
  }
}

export function HabitCalendar({ days }: HabitCalendarProps) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays: DayState[] = DAY_LABELS_ES.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const existingDay = days.find((d) => d.date === dateStr);
    if (existingDay) return { ...existingDay, label };

    if (dateStr === todayStr) {
      return { label, date: dateStr, state: 'today' as const };
    }
    if (date > today) {
      return { label, date: dateStr, state: 'future' as const };
    }
    return { label, date: dateStr, state: 'missed' as const };
  });

  return (
    <View style={styles.container}>
      {weekDays.map((day) => {
        const isToday = day.state === 'today';
        const { glyph, fontSize } = getDayGlyph(day.state);
        const colors = getDayColors(day.state);
        return (
          <View key={day.date} style={styles.dayColumn}>
            <View
              style={[
                styles.dayBar,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  borderWidth: isToday ? 2 : 1.5,
                },
                isToday && styles.todayGlow,
              ]}
            >
              <Text style={{ fontSize, color: colors.text }}>{glyph}</Text>
            </View>
            <Text
              style={[
                styles.dayLabel,
                { color: isToday ? Colors.yellow : Colors.dim },
                isToday && { fontWeight: '700' },
              ]}
            >
              {day.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function buildHabitDays(
  dailyLogs: Array<{ date: string; streakActive: boolean; cloudDay: boolean }>
): DayState[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return dailyLogs.map((log) => {
    let state: DayState['state'] = 'missed';
    if (log.date === todayStr) {
      state = log.streakActive ? 'hit' : 'today';
    } else if (log.cloudDay) {
      state = 'cloud';
    } else if (log.streakActive) {
      state = 'hit';
    }

    const date = new Date(log.date);
    const dayIndex = date.getDay();
    const esIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const label = DAY_LABELS_ES[esIndex];

    return { label, date: log.date, state };
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayBar: {
    width: '100%',
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayGlow: {
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '400',
  },
});
