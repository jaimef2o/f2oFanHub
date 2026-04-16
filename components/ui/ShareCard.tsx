import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Sun } from './Sun';
import { PrimaryBtn } from './PrimaryBtn';
import { GhostBtn } from './GhostBtn';
import { formatIURange } from '@/lib/iuEngine';
import { getSituation } from '@/constants/situations';

interface ShareCardProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  iuProduced: number;
  durationMin: number;
  uvIndex: number;
  streak: number;
  situationId: string;
  city: string;
}

export function ShareCard({
  visible,
  onClose,
  onShare,
  iuProduced,
  durationMin,
  uvIndex,
  streak,
  situationId,
  city,
}: ShareCardProps) {
  const situation = getSituation(situationId);
  const iuDisplay = formatIURange(iuProduced);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Orange border glow effect */}
          <View style={styles.glowBorder} />
          <View style={styles.innerCard}>
            {/* Header */}
            <View style={styles.header}>
              <Sun size={28} color={Colors.orange} />
              <Text style={styles.logo}>HELIO</Text>
            </View>

            <Text style={styles.sessionLabel}>Session logged \u00B7 {city}</Text>

            {/* Giant IU number */}
            <Text style={styles.iuNumber}>{iuDisplay}</Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{durationMin} min</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{uvIndex.toFixed(1)}</Text>
                <Text style={styles.statLabel}>UV Index</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{'\uD83D\uDD25'} {streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              {situation.emoji} {situation.label} \u00B7 {city} \u00B7 track yours at helio.app
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <PrimaryBtn title={'\uD83D\uDCE4 Share'} onPress={onShare} />
              <GhostBtn title="Close" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.orange,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  innerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    margin: 2,
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.orange,
    letterSpacing: 2,
  },
  sessionLabel: {
    fontSize: 14,
    color: Colors.grey,
    fontWeight: '500',
  },
  iuNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.green,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dim,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  footer: {
    fontSize: 12,
    color: Colors.dim,
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 4,
    marginTop: 8,
  },
});
