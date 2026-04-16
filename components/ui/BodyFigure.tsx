import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Colors } from '@/constants/colors';

// Exposure situations with body parts mapping
const BODY_SITUATIONS = [
  {
    id: 'face_only',
    label: 'Solo la cara',
    sub: 'Con abrigo o bufanda',
    emoji: '\uD83E\uDDE5',
    bsaMultiplier: 0.36,
    exposed: ['head'],
  },
  {
    id: 'face_arms',
    label: 'Cara + brazos',
    sub: 'Camiseta, manga corta',
    emoji: '\uD83D\uDC55',
    bsaMultiplier: 1.0,
    exposed: ['head', 'arms'],
  },
  {
    id: 'face_arms_legs',
    label: 'Cara + brazos + piernas',
    sub: 'Pantalón corto',
    emoji: '\uD83E\uDE73',
    bsaMultiplier: 1.4,
    exposed: ['head', 'arms', 'legs'],
  },
  {
    id: 'torso',
    label: 'Torso al descubierto',
    sub: 'Sin camiseta / top',
    emoji: '\uD83C\uDF1E',
    bsaMultiplier: 2.0,
    exposed: ['head', 'arms', 'torso'],
  },
  {
    id: 'full_body',
    label: 'Casi todo el cuerpo',
    sub: 'Playa / piscina',
    emoji: '\uD83C\uDFD6',
    bsaMultiplier: 3.0,
    exposed: ['head', 'arms', 'torso', 'legs'],
  },
] as const;

type BodyPart = 'head' | 'arms' | 'torso' | 'legs';

/** SVG body figure matching v8 mockup */
function BodySVG({ exposed, size = 44 }: { exposed: readonly BodyPart[]; size?: number }) {
  const on = Colors.orange;
  const off = 'rgba(255,255,255,0.1)';
  const fill = (part: BodyPart) => (exposed.includes(part) ? on : off);

  const w = size;
  const h = size * 1.75;
  const scaleX = size / 44;
  const scaleY = h / 77;

  return (
    <Svg width={w} height={h} viewBox="0 0 44 77">
      {/* Head */}
      <Circle cx="22" cy="8" r="7.5" fill={fill('head')} />
      {/* Neck */}
      <Rect x="19.5" y="15.5" width="5" height="4" rx="1.5" fill={fill('head')} />
      {/* Torso */}
      <Rect x="12" y="19" width="20" height="20" rx="4" fill={fill('torso')} />
      {/* Left arm */}
      <Rect x="3" y="19" width="7" height="19" rx="3.5" fill={fill('arms')} />
      {/* Right arm */}
      <Rect x="34" y="19" width="7" height="19" rx="3.5" fill={fill('arms')} />
      {/* Left leg */}
      <Rect x="12" y="41" width="8" height="26" rx="4" fill={fill('legs')} />
      {/* Right leg */}
      <Rect x="24" y="41" width="8" height="26" rx="4" fill={fill('legs')} />
    </Svg>
  );
}

interface BodyFigureProps {
  selected: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export function BodyFigure({ selected, onSelect, compact = false }: BodyFigureProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {BODY_SITUATIONS.map((sit) => {
        const isActive = selected === sit.id;
        return (
          <TouchableOpacity
            key={sit.id}
            onPress={() => onSelect(sit.id)}
            activeOpacity={0.7}
            style={[
              styles.card,
              compact && styles.cardCompact,
              isActive && styles.cardSelected,
            ]}
          >
            <BodySVG
              exposed={sit.exposed as unknown as BodyPart[]}
              size={compact ? 36 : 44}
            />
            <Text
              style={[styles.label, isActive && styles.labelSelected]}
              numberOfLines={2}
            >
              {sit.label}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {sit.sub}
            </Text>
            {isActive && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>
                  {'\u00D7'}{sit.bsaMultiplier.toFixed(1)} IU
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  card: {
    width: 80,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 6,
  },
  cardCompact: {
    width: 70,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  cardSelected: {
    borderColor: Colors.orange,
    backgroundColor: `rgba(255,140,0,0.1)`,
  },
  label: {
    fontSize: 10,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 13,
  },
  labelSelected: {
    color: Colors.orange,
  },
  sub: {
    fontSize: 9,
    color: Colors.dim,
    textAlign: 'center',
    lineHeight: 12,
  },
  multiplierBadge: {
    backgroundColor: 'rgba(255,140,0,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  multiplierText: {
    fontSize: 9,
    color: Colors.orange,
    fontWeight: '700',
  },
});
