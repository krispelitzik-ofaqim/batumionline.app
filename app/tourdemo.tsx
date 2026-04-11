import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

export default function TourDemo() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#1A6B8A', '#3DA5C4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.icon}>🎧</Text>
        <Text style={styles.title}>סיור העיר העתיקה</Text>
        <Text style={styles.sub}>5 תחנות · 60 דקות · עברית</Text>
        <View style={styles.chips}>
          <View style={styles.chip}><Text style={styles.chipTxt}>🚶 הליכה קלה</Text></View>
          <View style={styles.chip}><Text style={styles.chipTxt}>📍 מרכז בטומי</Text></View>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>על הסיור</Text>
        <Text style={styles.cardBody}>
          סיור קולי בן 5 תחנות לאורך לב העיר העתיקה. המסלול מתחיל בכיכר פיאצה, ממשיך לטיילת החוף,
          עובר בגן הבוטני, נוגע בשכונת היהודים ומסיים בשוק הבזאר.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  content: { padding: 16 },
  hero: {
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 6, writingDirection: 'rtl', textAlign: 'center' },
  chips: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipTxt: { color: Colors.WHITE, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  cardBody: { fontSize: 14, color: '#444', textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
});

