import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface GhostBtnProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}

export function GhostBtn({ title, onPress, style, color = Colors.grey }: GhostBtnProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={[styles.button, style]}>
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
