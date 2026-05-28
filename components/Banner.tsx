import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type Props = {
  title: string;
  icon: string;
  width: number;
};

export default function Banner({ title, icon, width }: Props) {
  return (
    <TouchableOpacity style={[styles.banner, { width }]} activeOpacity={0.7}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 100,
    backgroundColor: Colors.ACCENT,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  icon: { fontSize: 28, marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, textAlign: 'center' },
});
