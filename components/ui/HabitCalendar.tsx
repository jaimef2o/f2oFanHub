import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Sun } from './Sun';

interface DayState {
  label: string; // Mon, Tue, etc.
  date: string; // YYYY-MM-DD
  state: 'hit' | 'cloud' | 'missed' | 'today' | 'future';
}

interface HabitCalendarProps {
  days: DayState[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayIcon(state: DayState['state']) {
  switch (state) {
    case 'hit':
      return <Sun size={22} color={Colors.orange} />;
    case 'cloud':
      return <Text style={styles.cloudIcon}>{'\u2601\uFE0F'}</Text>;
    case 'missed':
      return <View style={styles.missedDot} />;
    case 'today':
      return <Sun size={22} color={Colors.yellow} />;
    case 'future':
      return <View style={styles.futureDot} />;
  }
}

export function HabitCalendar({ days }: HabitCalendarProps) {
  // Build 7 days from Monday of current week
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays: DayState[] = DAY_LABELS.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const existingDay = days.find((d) => d.date === dateStr);
    if (existingDay) return existingDay;

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
      {weekDays.map((day, i) => {
        const isToday = day.state === 'today';
        return (
          <View key={day.date} style={styles.dayColumn}>
            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{DAY_LABELS[i]}</Text>
            <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
              {getDayIcon(day.state)}
            </View>
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
    const label = DAY_LABELS[dayIndex === 0 ? 6 : dayIndex - 1];

    return { label, date: log.date, state };
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dim,
    textTransform: 'uppercase',
  },
  todayLabel: {
    color: Colors.yellow,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: Colors.yellow,
    borderRadius: 18,
  },
  cloudIcon: {
    fontSize: 18,
  },
  missedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dim,
  },
  futureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
