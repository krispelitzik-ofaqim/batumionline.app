import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Linking, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useI18n } from '../../constants/i18n';
import { fetchContent, resolveUri } from '../../constants/api';
import BottomTabBar from '../../components/BottomTabBar';

type Broker = {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  whatsapp?: string;
  image?: string;
  description?: string;
  city?: string;
  yearsActive?: string;
  visible?: boolean;
};

const BROKER_IMAGES = [
  '/uploads/1775910069485-6.jpg',
  '/uploads/1775910069516-30.jpg',
  '/uploads/1775910069548-933.jpg',
  '/uploads/1775910069562-341.jpg',
  '/uploads/1775910069573-698.jpg',
  '/uploads/1775910069590-365.jpg',
];

const FALLBACK: Broker[] = Array.from({ length: 6 }, (_, i) => ({
  id: `b${i + 1}`,
  name: 'דודי ספיר',
  title: 'מתווך נדל״ן מומלץ בבטומי',
  phone: '+995-555-123-456',
  whatsapp: '972501234567',
  image: BROKER_IMAGES[i],
  description: 'מתווך מורשה עם 8 שנות ניסיון בבטומי. דובר עברית, רוסית וגאורגית. ליווי מלא בעסקאות נדל"ן מתחילתן ועד החתימה הסופית.',
  city: 'בטומי',
  yearsActive: '8 שנים',
  visible: true,
}));

export default function BrokersPortal() {
  const { t } = useI18n();
  const [items, setItems] = useState<Broker[]>(FALLBACK);
  const [showCriteria, setShowCriteria] = useState(false);

  useEffect(() => {
    fetchContent().then(d => {
      if (Array.isArray(d?.brokers) && d.brokers.length > 0) setItems(d.brokers.filter((b: Broker) => b.visible !== false));
    }).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>{t('po.brokersTitle')}</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/portal/realestate' as any)} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row-reverse', gap: 8, padding: 12, backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#bbf7d0' }}>
        <TouchableOpacity onPress={() => setShowCriteria(true)} style={[s.topBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#15803d' }]} activeOpacity={0.85}>
          <Text style={[s.topBtnTxt, { color: '#15803d', textAlign: 'center' }]}>{t('po.whatRequired')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/972502844867?text=' + encodeURIComponent('שלום, אני רוצה להמליץ על סוכן נדל"ן בבטומי. שם הסוכן: '))} style={[s.topBtn, { backgroundColor: Colors.PRIMARY }]} activeOpacity={0.85}>
          <Text style={[s.topBtnTxt, { color: '#fff', textAlign: 'center' }]}>{t('po.recommendAgent')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCriteria} transparent animationType="slide" onRequestClose={() => setShowCriteria(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowCriteria(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: 20, paddingTop: 50 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#15803d', writingDirection: 'rtl', textAlign: 'right', marginBottom: 12 }}>{t('po.critTitle')}</Text>
            <Text style={s.introBullet}>{t('po.crit1')}</Text>
            <Text style={s.introBullet}>{t('po.crit2')}</Text>
            <Text style={s.introBullet}>{t('po.crit3')}</Text>
            <Text style={s.introBullet}>{t('po.crit4')}</Text>
            <Text style={s.introBullet}>{t('po.crit5')}</Text>
            <Text style={s.introBullet}>{t('po.crit6')}</Text>
            <Text style={s.introBullet}>{t('po.crit7')}</Text>
            <TouchableOpacity onPress={() => setShowCriteria(false)} style={{ marginTop: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#15803d', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{t('c.gotIt')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.map((b, i) => {
          const earthColors = ['#92400e', '#65a30d', '#F4A94E', '#9f1239', '#ca8a04'];
          const borderColor = earthColors[i % earthColors.length];
          return (
          <View key={b.id} style={[s.card, { borderColor, borderWidth: 1.5, position: 'relative' }]}>
            <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 5, transform: [{ rotate: '-12deg' }], width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor, alignItems: 'center', justifyContent: 'center', opacity: 0.5, backgroundColor: 'transparent' }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 8, fontWeight: '900', color: borderColor, textAlign: 'center', letterSpacing: 0.3 }}>Batumi</Text>
                <Text style={{ fontSize: 8, fontWeight: '900', color: borderColor, textAlign: 'center', letterSpacing: 0.3 }}>On LINE</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
              {b.image && (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: resolveUri(b.image) }} style={s.img} resizeMode="cover" />
                  <View style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1d9bf0', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', lineHeight: 14 }}>✓</Text>
                  </View>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.cardKicker}>{t('po.recommendedAgent')}</Text>
                <Text style={s.cardName}>{b.name}</Text>
                {!!b.title && <Text style={[s.cardMeta, { fontWeight: '700' }]}>{b.title}</Text>}
                {!!b.city && <Text style={s.cardMeta}>📍 {b.city}{b.yearsActive ? ` · ${b.yearsActive}` : ''}</Text>}
              </View>
            </View>
            {!!b.description && <Text style={s.desc}>{b.description}</Text>}
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 10, justifyContent: 'center' }}>
              {b.whatsapp && (
                <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`)} style={[s.btn, { backgroundColor: '#25D366' }]}>
                  <Text style={s.btnTxt}>💬 WhatsApp</Text>
                </TouchableOpacity>
              )}
              {b.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${b.phone}`)} style={[s.btn, { backgroundColor: Colors.PRIMARY }]}>
                  <Text style={s.btnTxt}>{t('c.call')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          );
        })}
        {items.length === 0 && <Text style={s.empty}>{t('po.noAgents')}</Text>}
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '300' },
  title: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  intro: { padding: 12, backgroundColor: '#dcfce7', borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  introTitle: { fontSize: 13, fontWeight: '900', color: '#166534', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  introBullet: { fontSize: 11, color: '#166534', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  topBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  topBtnTxt: { fontSize: 12, fontWeight: '900', writingDirection: 'rtl' },
  recBtn: { marginHorizontal: 16, marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Colors.PRIMARY, alignItems: 'center' },
  recBtnTitle: { fontSize: 15, fontWeight: '900', color: '#fff', writingDirection: 'rtl' },
  recBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', writingDirection: 'rtl', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  img: { width: 80, height: 80, borderRadius: 8 },
  cardKicker: { fontSize: 11, fontWeight: '700', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl' },
  cardName: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  desc: { fontSize: 12, color: '#475569', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  empty: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40, writingDirection: 'rtl' },
});
