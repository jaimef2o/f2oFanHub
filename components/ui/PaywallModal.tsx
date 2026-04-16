import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { PrimaryBtn } from './PrimaryBtn';
import { GhostBtn } from './GhostBtn';
import { Sun } from './Sun';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  onLifetime: () => void;
}

const FEATURES = [
  '7-day UV forecast calendar',
  'Full leaderboard participation & tier system',
  'Blood test tracker & projections',
  'Weekly insights & comparison',
  'All challenges & seasonal calendar',
];

export function PaywallModal({ visible, onClose, onStartTrial, onLifetime }: PaywallModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Sun size={48} glow color={Colors.orange} />
            <Text style={styles.title}>Helio+</Text>
            <Text style={styles.subtitle}>Unlock the full sun tracking experience</Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.checkmark}>{'\u2705'}</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctas}>
            <PrimaryBtn
              title="Start 7-day free trial \u2192"
              onPress={onStartTrial}
            />
            <Text style={styles.pricing}>
              \u20AC4.99/month \u00B7 or \u20AC39.99/year (save 33%)
            </Text>

            <TouchableOpacity onPress={onLifetime} style={styles.lifetimeBtn}>
              <Text style={styles.lifetimeEmoji}>{'\uD83C\uDF1E'}</Text>
              <View>
                <Text style={styles.lifetimeTitle}>Acceso de por vida</Text>
                <Text style={styles.lifetimePrice}>\u20AC14.99 (pago \u00FAnico)</Text>
              </View>
            </TouchableOpacity>
          </View>

          <GhostBtn title="Not now" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dim,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.orange,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.grey,
    textAlign: 'center',
  },
  features: {
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmark: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '500',
    flex: 1,
  },
  ctas: {
    gap: 12,
    marginBottom: 8,
  },
  pricing: {
    fontSize: 13,
    color: Colors.grey,
    textAlign: 'center',
  },
  lifetimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lifetimeEmoji: {
    fontSize: 28,
  },
  lifetimeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  lifetimePrice: {
    fontSize: 13,
    color: Colors.grey,
    marginTop: 2,
  },
});
