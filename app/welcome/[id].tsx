import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { fetchContent } from '../../constants/api';
import AudioPlayer from '../../components/AudioPlayer';

type WelcomeItem = {
  id: string; title: string; subtitle?: string; icon: string;
  bg?: string; longText?: string;
  audios?: { title?: string; url: string }[];
};

export default function WelcomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<WelcomeItem | null>(null);

  useEffect(() => {
    fetchContent().then((data) => {
      const found = (data.welcome || []).find((w: WelcomeItem) => w.id === id);
      if (found) setItem(found);
    }).catch(() => {});
  }, [id]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'ברוכים הבאים', headerBackTitle: 'חזרה' }} />
        <View style={styles.center}><Text style={styles.loadTxt}>טוען...</Text></View>
      </SafeAreaView>
    );
  }

  const bg = item.bg || Colors.PRIMARY;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: item.title, headerBackTitle: 'חזרה' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          {item.icon && item.icon.startsWith('http') ? (
            Platform.OS === 'web' ? (
              React.createElement('img', {
                src: item.icon,
                style: { width: '100%', height: 220, objectFit: 'cover', borderRadius: 20, display: 'block' },
                alt: item.title,
              })
            ) : (
              <Image source={{ uri: item.icon }} style={styles.heroImg} resizeMode="cover" />
            )
          ) : (
            <LinearGradient colors={[bg, '#3DA5C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
              <Text style={styles.heroIcon}>{item.icon || '👋'}</Text>
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{item.title}</Text>
            {item.subtitle && <Text style={styles.heroSub}>{item.subtitle}</Text>}
          </LinearGradient>
        </View>

        {item.audios && item.audios.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <AudioPlayer tracks={item.audios} />
          </View>
        )}

        <View style={styles.card}>
          {item.longText && Platform.OS === 'web' && item.longText.includes('<') ? (
            React.createElement('div', {
              dangerouslySetInnerHTML: { __html: item.longText },
              style: { fontSize: 14, color: '#444', textAlign: 'right', direction: 'rtl', lineHeight: '24px' },
            })
          ) : (
            <Text style={styles.cardBody}>{item.longText || 'תוכן יתווסף בקרוב'}</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { fontSize: 16, color: '#999' },
  content: { padding: 16, paddingBottom: 40 },
  heroWrap: {
    borderRadius: 20, overflow: 'hidden', height: 220, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  heroImg: { width: '100%', height: 220 },
  heroGradient: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 44 },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 18, paddingTop: 40,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, writingDirection: 'rtl', textAlign: 'right' },
  card: {
    backgroundColor: Colors.WHITE, borderRadius: 16, padding: 20, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardBody: { fontSize: 14, color: '#444', textAlign: 'right', writingDirection: 'rtl', lineHeight: 24 },
});

