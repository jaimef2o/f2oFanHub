import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { SITUATIONS, type ExposureSituation } from '@/constants/situations';

interface BodyFigureProps {
  selected: string;
  onSelect: (id: string) => void;
}

function SituationCard({
  situation,
  isSelected,
  onPress,
}: {
  situation: ExposureSituation;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{situation.emoji}</Text>
      <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
        {situation.label}
      </Text>
      <Text style={styles.multiplier}>\u00D7{situation.bsaMultiplier}</Text>
    </TouchableOpacity>
  );
}

export function BodyFigure({ selected, onSelect }: BodyFigureProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {SITUATIONS.map((sit) => (
        <SituationCard
          key={sit.id}
          situation={sit}
          isSelected={selected === sit.id}
          onPress={() => onSelect(sit.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  card: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 6,
  },
  cardSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.cardHi,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 11,
    color: Colors.grey,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  labelSelected: {
    color: Colors.white,
  },
  multiplier: {
    fontSize: 12,
    color: Colors.dim,
    fontWeight: '700',
  },
});
