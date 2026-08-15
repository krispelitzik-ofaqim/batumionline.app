import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking, Alert, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../constants/i18n';
import { fetchContent, API_BASE, resolveUri } from '../../constants/api';
import HtmlContent from '../../components/HtmlContent';
import BottomTabBar from '../../components/BottomTabBar';
import AdBanner from '../../components/AdBanner';
import { PORTAL_TR } from '../../constants/portalTranslations';



type TabId = 'about' | 'terms' | 'privacy' | 'contact';
type Tab = { id: TabId; title: string; icon: string; body: string };

const DEFAULTS: Tab[] = [
  { id: 'about',   title: 'אודותינו', icon: '👥', body: 'Batumi Online — המדריך הישראלי לבטומי.' },
  { id: 'terms',   title: 'תקנון',    icon: '🪪', body: 'תנאי שימוש.' },
  { id: 'privacy', title: 'פרטיות',   icon: '⚖️', body: 'מדיניות פרטיות.' },
  { id: 'contact', title: 'כתוב לנו', icon: '✉️', body: '' },
];

const EMAIL = 'krispelitzik@gmail.com';
const WHATSAPP = '972502844867';
const SITE = 'https://www.batumionline.app';

export default function InfoPage() {
  const { t, isRTL, lang } = useI18n();
  const A = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const D = (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr';
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabs, setTabs] = useState<Tab[]>(DEFAULTS);
  const [portalItem, setPortalItem] = useState<{ title: string; subtitle?: string; body: string; image?: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const isLegal = DEFAULTS.some((d) => d.id === id);

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
        if (!isLegal && data.infoPortal && Array.isArray(data.infoPortal)) {
          const found = data.infoPortal.find((x: any) => x.id === id);
          if (found) {
            // For non-Hebrew editions use the pre-translated portal article when available.
            const tr = lang !== 'he' ? PORTAL_TR[id as string]?.[lang as 'en' | 'fa' | 'ru'] : null;
            setPortalItem({
              title: tr?.title || found.title,
              subtitle: tr?.subtitle || found.subtitle || '',
              body: tr?.longText || found.longText || found.subtitle || '',
              image: found.icon,
            });
          }
        }
      })
      .catch(() => {});
  }, [id, lang]);

  if (!isLegal && portalItem) {
    const hasImage = portalItem.image && (portalItem.image.startsWith('http') || portalItem.image.startsWith('data:') || portalItem.image.startsWith('/'));
    return (
      <View style={styles.container}>
        <View style={{ height: Platform.OS === 'ios' ? 50 : 24, backgroundColor: '#1A6B8A' }} />
        <TouchableOpacity style={{ position: 'absolute', top: Platform.OS === 'ios' ? 58 : 32, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
          <Text style={{ fontSize: 22, color: '#fff', fontWeight: '900' }}>←</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={{ position: 'relative' }}>
            {hasImage ? (
              Platform.OS === 'web' ? (
                React.createElement('img', {
                  src: resolveUri(portalItem.image),
                  style: { width: '100%', height: 160, objectFit: 'cover', display: 'block' },
                  alt: portalItem.title,
                })
              ) : (
                <Image source={{ uri: resolveUri(portalItem.image) }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
              )
            ) : (
              <LinearGradient colors={['#1A6B8A', '#3DA5C4']} style={{ height: 160 }} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 60 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', textAlign: A, writingDirection: D }}>{portalItem.title}</Text>
              {portalItem.subtitle ? <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: A, writingDirection: D, marginTop: 4 }}>{portalItem.subtitle}</Text> : null}
            </LinearGradient>
          </View>
          <View style={{ marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: Colors.BACKGROUND, paddingTop: 16, paddingHorizontal: 12, minHeight: 400, paddingBottom: 30 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
              {portalItem.body.includes('<') ? (
                <HtmlContent html={portalItem.body} />
              ) : (
                <Text style={styles.cardBody}>{portalItem.body || 'תוכן יתווסף בקרוב'}</Text>
              )}
            </View>
            <AdBanner />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!isLegal && !portalItem) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#999' }}>{t('c.loading')}</Text>
      </View>
    );
  }

  const current = (tabs.find((t) => t.id === id) || tabs[0]) as Tab;

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
      if (!j.success) throw new Error(j.error || 'שגיאה');
      setName(''); setEmail(''); setMessage('');
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('c.error'), e?.message || t('c.cantSend'));
    }
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
        {current.id === 'contact' && sent ? (
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
            <TouchableOpacity onPress={() => router.replace('/')} style={{ paddingHorizontal: 32, paddingVertical: 10 }} activeOpacity={0.7}>
              <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 14 }}>{t('ct.backHome')}</Text>
            </TouchableOpacity>
          </View>
        ) : current.id === 'contact' ? (
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
                <Text style={styles.sendBtnTxt}>{t('ct.sendArrow')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLine}>{t('ct.locLine')}</Text>
              <Text style={styles.infoLine}>{t('ct.hoursLine')}</Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{current.title}</Text>
              {current.body.includes('<') ? (
                <HtmlContent html={current.body} baseStyle={{ fontSize: 14, color: '#444', lineHeight: 24 }} />
              ) : (
                <Text style={styles.cardBody}>{current.body}</Text>
              )}
            </View>


          </View>
        )}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  topRow: { flexDirection: 'row-reverse', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 8 },
  bannerWrap: { flex: 1, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  banner: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.SECONDARY + '30', minHeight: 64 },
  bannerOn: { borderColor: 'transparent' },
  icon: { fontSize: 24, marginBottom: 4 },
  bannerTxt: { fontSize: 11, fontWeight: '800', color: Colors.PRIMARY, writingDirection: 'rtl', textAlign: 'center' },
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

