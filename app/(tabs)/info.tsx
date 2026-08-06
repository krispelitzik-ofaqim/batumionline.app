import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { useI18n } from '../../constants/i18n';
import { fetchContent, API_BASE } from '../../constants/api';
import HtmlContent from '../../components/HtmlContent';

type TabId = 'about' | 'terms' | 'privacy' | 'contact';
type Tab = { id: TabId; title: string; icon: string; body: string };

const DEFAULTS: Tab[] = [
  { id: 'about', title: 'אודותינו', icon: '👥', body: '' },
  { id: 'terms', title: 'תקנון', icon: '🪪', body: '' },
  { id: 'privacy', title: 'פרטיות', icon: '⚖️', body: '' },
  { id: 'contact', title: 'כתוב לנו', icon: '✉️', body: '' },
];

const EMAIL = 'krispelitzik@gmail.com';
const WHATSAPP = '972502844867';
const SITE = 'https://www.batumionline.app';

export default function InfoScreen() {
  const { t } = useI18n();
  const { dark } = useContext(ThemeContext);
  const [active, setActive] = useState<TabId>('about');
  const [tabs, setTabs] = useState<Tab[]>(DEFAULTS);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchContent()
      .then((data) => {
        if (data.legal && Array.isArray(data.legal)) {
          const merged = DEFAULTS.map((d) => {
            const found = data.legal.find((x: any) => x.id === d.id);
            return found ? { ...d, title: found.title || d.title, body: found.longText || d.body } : d;
          });
          setTabs(merged);
        }
      })
      .catch(() => {});
  }, []);

  const current = tabs.find((t) => t.id === active) || tabs[0];
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;

  const sendContact = async () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert(t('c.missing'), t('c.missingMsg'));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || t('c.error'));
      setName(''); setEmail(''); setMessage('');
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('c.error'), e?.message || t('c.cantSend'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.topRow}>
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <TouchableOpacity key={t.id} style={styles.bannerWrap} onPress={() => setActive(t.id)} activeOpacity={0.85}>
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
        {active === 'contact' && sent ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' }}>
            <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}>
              <Text style={{ fontSize: 60 }}>🎉</Text>
            </LinearGradient>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#1C2B35', marginBottom: 12, writingDirection: 'rtl', textAlign: 'center' }}>{t('ct.sentTitle')}</Text>
            <Text style={{ fontSize: 16, color: '#64748b', writingDirection: 'rtl', textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 20 }}>
              {t('ct.sentSub')}
            </Text>
            <TouchableOpacity onPress={() => setSent(false)} style={{ backgroundColor: '#1A6B8A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12 }} activeOpacity={0.85}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('c.message')}</Text>
            </TouchableOpacity>
          </View>
        ) : active === 'contact' ? (
          <View>
            <LinearGradient colors={['#1A6B8A', '#3DA5C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <Text style={styles.heroIcon}>✉️</Text>
              <Text style={styles.heroTitle}>{t('ct.heroTitle')}</Text>
              <Text style={styles.heroSub}>{t('ct.heroSub')}</Text>
            </LinearGradient>
            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP}`)}>
                <Text style={styles.quickIcon}>💬</Text>
                <Text style={styles.quickTxt}>{t('c.whatsapp')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
                <Text style={styles.quickIcon}>📧</Text>
                <Text style={styles.quickTxt}>{t('c.email')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => Linking.openURL(SITE)}>
                <Text style={styles.quickIcon}>🌐</Text>
                <Text style={styles.quickTxt}>{t('c.website')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t('ct.formTitle')}</Text>
              <TextInput style={styles.input} placeholder={t('c.fullName')} placeholderTextColor="#999" value={name} onChangeText={setName} textAlign="right" />
              <TextInput style={styles.input} placeholder={t('c.email')} placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign="right" />
              <TextInput style={[styles.input, styles.textarea]} placeholder={t('ct.msgPh')} placeholderTextColor="#999" value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlign="right" textAlignVertical="top" />
              <TouchableOpacity style={styles.sendBtn} onPress={sendContact} activeOpacity={0.85}>
                <Text style={styles.sendBtnTxt}>{t('c.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{current.title}</Text>
            {current.body.includes('<') ? (
              <HtmlContent html={current.body} baseStyle={{ fontSize: 14, color: '#444', lineHeight: 24 }} />
            ) : (
              <Text style={styles.cardBody}>{current.body || 'תוכן יתווסף בקרוב'}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  topRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 8 },
  bannerWrap: { width: '48%', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
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
});

