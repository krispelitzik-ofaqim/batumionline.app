import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type Props = {
  title: string;
  icon: string;
};

export default function BottomBanner({ title, icon }: Props) {
  return (
    <TouchableOpacity style={styles.banner} activeOpacity={0.7}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 50,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0dcd6',
  },
  icon: { fontSize: 20 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.TEXT },
});
