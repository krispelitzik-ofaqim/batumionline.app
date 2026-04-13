import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { fetchContent } from '../../constants/api';
import AudioPlayer from '../../components/AudioPlayer';

type Tour = {
  id: string; title: string; subtitle?: string; icon: string;
  bg?: string; summary?: string; audios?: { title?: string; url: string }[];
};

export default function TourScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);

  useEffect(() => {
    fetchContent().then((data) => {
      const cats = [...(data.mainCategories || []), ...(data.extraCategories || [])];
      for (const cat of cats) {
        const ch = (cat.children || []).find((c: Tour) => c.id === id);
        if (ch) { setTour(ch); break; }
      }
    }).catch(() => {});
  }, [id]);

  if (!tour) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'סיור', headerBackTitle: 'חזרה' }} />
        <View style={styles.center}><Text style={styles.loadTxt}>טוען...</Text></View>
      </SafeAreaView>
    );
  }

  const bg = tour.bg || '#1A6B8A';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: tour.title, headerBackTitle: 'חזרה' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[bg, '#3DA5C4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroIcon}>{tour.icon}</Text>
          <Text style={styles.heroTitle}>{tour.title}</Text>
          {tour.subtitle && <Text style={styles.heroSub}>{tour.subtitle}</Text>}
        </LinearGradient>

        {tour.summary && (
          <View style={styles.card}>
            <Text style={styles.cardBody}>{tour.summary}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>מפת המסלול</Text>
        <View style={styles.mapCard}>
          {Platform.OS === 'web' ? (
            React.createElement('iframe', {
              src: `https://www.google.com/maps?q=${encodeURIComponent(tour.title + ' Batumi')}&hl=iw&z=14&output=embed`,
              style: { width: '100%', height: 220, border: 0, display: 'block' },
              title: 'map',
            })
          ) : (
            <View style={styles.mapFallback}>
              <Text style={{ color: '#888' }}>מפה</Text>
            </View>
          )}
        </View>

        {tour.audios && tour.audios.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>תחנות הסיור</Text>
            <AudioPlayer tracks={tour.audios} />
          </>
        )}

        {(!tour.audios || tour.audios.length === 0) && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardBody}>קבצי אודיו יתווספו בקרוב</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>גלריית הסיור — {tour.title}</Text>
        <View style={styles.galleryWrap}>
          <Text style={styles.galleryPlaceholder}>תמונות יתווספו בקרוב</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    borderRadius: 20, padding: 26, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  heroIcon: { fontSize: 44, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, writingDirection: 'rtl', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 10, marginTop: 18 },
  card: {
    backgroundColor: Colors.WHITE, borderRadius: 16, padding: 18, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardBody: { fontSize: 14, color: '#444', textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  mapCard: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  mapFallback: { height: 220, alignItems: 'center', justifyContent: 'center' },
  galleryWrap: {
    backgroundColor: Colors.WHITE, borderRadius: 16, padding: 24, minHeight: 120,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  galleryPlaceholder: { fontSize: 14, color: '#999', writingDirection: 'rtl' },
});

