import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface SunProps {
  size?: number;
  glow?: boolean;
  color?: string;
}

export function Sun({ size = 40, glow = false, color = Colors.orange }: SunProps) {
  const center = size / 2;
  const coreRadius = size * 0.22;
  const rayLength = size * 0.15;
  const rayStart = coreRadius + size * 0.06;
  const rayEnd = rayStart + rayLength;
  const numRays = 8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {glow && (
        <View
          style={[
            styles.glow,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: size * 0.7,
              backgroundColor: color,
              left: -(size * 0.2),
              top: -(size * 0.2),
            },
          ]}
        />
      )}
      <Svg width={size} height={size}>
        {glow && (
          <Defs>
            <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
        )}
        {glow && <Circle cx={center} cy={center} r={size * 0.45} fill="url(#sunGlow)" />}
        {/* Core */}
        <Circle cx={center} cy={center} r={coreRadius} fill={color} />
        {/* Rays */}
        {Array.from({ length: numRays }).map((_, i) => {
          const angle = (i * 360) / numRays - 90;
          const rad = (angle * Math.PI) / 180;
          return (
            <Line
              key={i}
              x1={center + rayStart * Math.cos(rad)}
              y1={center + rayStart * Math.sin(rad)}
              x2={center + rayEnd * Math.cos(rad)}
              y2={center + rayEnd * Math.sin(rad)}
              stroke={color}
              strokeWidth={size * 0.06}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    opacity: 0.2,
  },
});
