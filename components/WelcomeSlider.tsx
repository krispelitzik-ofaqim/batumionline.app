import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const ITEMS = [
  { id: '1', title: 'ברוכים הבאים', subtitle: 'מדריך מקיף לבטומי', icon: '👋', bg: Colors.PRIMARY },
  { id: '2', title: 'נחיתה רכה', subtitle: 'מה צריך לדעת', icon: '✈️', bg: Colors.SECONDARY },
  { id: '3', title: 'היסטוריה כללית', subtitle: 'סיפור העיר', icon: '🏛️', bg: Colors.TEXT },
  { id: '4', title: 'היסטוריה יהודית', subtitle: 'קהילה ומורשת', icon: '✡️', bg: Colors.ACCENT },
  { id: '5', title: 'חוזרים הביתה', subtitle: 'טיפים ליום האחרון', icon: '🏠', bg: Colors.PRIMARY },
];

export default function WelcomeSlider() {
  return (
    <View>
      <Text style={styles.sectionTitle}>ברוכים הבאים</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {ITEMS.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: item.bg }]} activeOpacity={0.7}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  row: { gap: 10, paddingVertical: 4 },
  card: {
    width: 140, height: 120,
    borderRadius: 16, padding: 14,
    justifyContent: 'space-between',
  },
  icon: { fontSize: 32 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 12, color: Colors.BACKGROUND, opacity: 0.7, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});
