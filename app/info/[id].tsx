import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { fetchContent } from '../../constants/api';
import AudioPlayer from '../../components/AudioPlayer';

const DEMO_TRACKS = [
  { title: 'סיור העיר העתיקה', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav' },
  { title: 'סיור הטיילת', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav' },
  { title: 'היסטוריה יהודית', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav' },
];

type TabId = 'about' | 'terms' | 'privacy' | 'contact';
type Tab = { id: TabId; title: string; icon: string; body: string };

const DEFAULTS: Tab[] = [
  { id: 'about',   title: 'אודותינו', icon: '👥', body: 'Batumi Online — המדריך הישראלי לבטומי.' },
  { id: 'terms',   title: 'תקנון',    icon: '🪪', body: 'תנאי שימוש.' },
  { id: 'privacy', title: 'פרטיות',   icon: '⚖️', body: 'מדיניות פרטיות.' },
  { id: 'contact', title: 'כתוב לנו', icon: '✉️', body: '' },
];

const EMAIL = 'info@batumionline.app';
const WHATSAPP = '972500000000';
const SITE = 'https://www.batumionline.app';

export default function InfoPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabs, setTabs] = useState<Tab[]>(DEFAULTS);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchContent()
      .then((data) => {
        if (data.legal && Array.isArray(data.legal)) {
          const merged = DEFAULTS.map((d) => {
            const found = data.legal.find((x: any) => x.id === d.id);
            return found ? { ...d, title: found.title || d.title, icon: found.icon || d.icon, body: found.longText || d.body } : d;
          });
          setTabs(merged);
        }
      })
      .catch(() => {});
  }, []);

  const current = (tabs.find((t) => t.id === id) || tabs[0]) as Tab;

  const sendContact = () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert('חסרים פרטים', 'אנא מלאו שם והודעה');
      return;
    }
    const subject = encodeURIComponent(`פנייה מהאפליקציה - ${name}`);
    const body = encodeURIComponent(`שם: ${name}\nאימייל: ${email}\n\n${message}`);
    Linking.openURL(`mailto:${EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {tabs.map((t) => {
          const on = t.id === current.id;
          return (
            <TouchableOpacity key={t.id} style={styles.bannerWrap} onPress={() => router.replace(`/info/${t.id}`)} activeOpacity={0.85}>
              {on ? (
                <LinearGradient colors={['#1A6B8A', '#3DA5C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, styles.bannerOn]}>
                  <Text style={styles.icon}>{t.icon}</Text>
                  <Text style={[styles.bannerTxt, styles.bannerTxtOn]}>{t.title}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.banner}>
                  <Text style={styles.icon}>{t.icon}</Text>
                  <Text style={styles.bannerTxt}>{t.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.bodyWrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {current.id === 'contact' ? (
          <View>
            <LinearGradient colors={['#1A6B8A', '#3DA5C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <Text style={styles.heroIcon}>✉️</Text>
              <Text style={styles.heroTitle}>נשמח לשמוע מכם</Text>
              <Text style={styles.heroSub}>שאלה, הצעה או שיתוף פעולה — דברו איתנו</Text>
            </LinearGradient>

            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP}`)}>
                <Text style={styles.quickIcon}>💬</Text>
                <Text style={styles.quickTxt}>וואטסאפ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
                <Text style={styles.quickIcon}>📧</Text>
                <Text style={styles.quickTxt}>אימייל</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(SITE)}>
                <Text style={styles.quickIcon}>🌐</Text>
                <Text style={styles.quickTxt}>האתר</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>שליחת הודעה</Text>
              <TextInput style={styles.input} placeholder="שם מלא" placeholderTextColor="#999" value={name} onChangeText={setName} textAlign="right" />
              <TextInput style={styles.input} placeholder="אימייל" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign="right" />
              <TextInput style={[styles.input, styles.textarea]} placeholder="ההודעה שלכם" placeholderTextColor="#999" value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlign="right" textAlignVertical="top" />
              <TouchableOpacity style={styles.sendBtn} onPress={sendContact} activeOpacity={0.85}>
                <Text style={styles.sendBtnTxt}>שליחה ←</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLine}>📍 בטומי, גאורגיה</Text>
              <Text style={styles.infoLine}>🕐 ראשון-חמישי 09:00-18:00</Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{current.title}</Text>
              <Text style={styles.cardBody}>{current.body}</Text>
            </View>
            {current.id === 'about' && (
              <>
                <View style={{ marginTop: 14 }}>
                  <AudioPlayer tracks={[DEMO_TRACKS[0]]} compact />
                </View>
                <View style={{ marginTop: 14 }}>
                  <AudioPlayer tracks={DEMO_TRACKS} title="רשימת נגנים" />
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  topRow: { flexDirection: 'row-reverse', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 8 },
  bannerWrap: { flex: 1, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  banner: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.SECONDARY + '30', minHeight: 74 },
  bannerOn: { borderColor: 'transparent' },
  icon: { fontSize: 24, marginBottom: 4 },
  bannerTxt: { fontSize: 12, fontWeight: '800', color: Colors.PRIMARY, writingDirection: 'rtl', textAlign: 'center' },
  bannerTxtOn: { color: Colors.WHITE },
  bodyWrap: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  card: { backgroundColor: Colors.WHITE, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  cardBody: { fontSize: 14, color: '#444', textAlign: 'right', writingDirection: 'rtl', lineHeight: 24 },

  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14 },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.WHITE, writingDirection: 'rtl', textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', writingDirection: 'rtl', textAlign: 'center', marginTop: 6 },

  quickRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 14 },
  quickBtn: { flex: 1, backgroundColor: Colors.WHITE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  quickIcon: { fontSize: 26, marginBottom: 4 },
  quickTxt: { fontSize: 13, fontWeight: '700', color: Colors.PRIMARY, writingDirection: 'rtl' },

  formCard: { backgroundColor: Colors.WHITE, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 14, color: Colors.TEXT, marginBottom: 10, writingDirection: 'rtl' },
  textarea: { minHeight: 110 },
  sendBtn: { backgroundColor: Colors.ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sendBtnTxt: { color: Colors.WHITE, fontSize: 16, fontWeight: '900', writingDirection: 'rtl' },

  infoRow: { marginTop: 14, alignItems: 'flex-end' },
  infoLine: { fontSize: 13, color: '#666', writingDirection: 'rtl', marginBottom: 4 },
});

