import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import BottomTabBar from '../components/BottomTabBar';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';

type Coupon = { id: string; name: string; img: string; off: string };
const FOOD: Coupon[] = [
  { id: 'f1', name: 'Eye of the Sea', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', off: '10%' },
  { id: 'f2', name: 'Piazza Grill', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', off: '8%' },
  { id: 'f3', name: 'Boulevard Café', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80', off: '7%' },
];
const STAY: Coupon[] = [
  { id: 's1', name: 'Orbi Sea Towers', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', off: '10%' },
  { id: 's2', name: 'Boulevard Suites', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', off: '9%' },
];

export default function CouponsScreen() {
  const { t, isRTL } = useI18n();
  const [cat, setCat] = useState<'food' | 'stay'>('food');
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';
  const list = cat === 'food' ? FOOD : STAY;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t('cp.coupon')}</Text>
      </View>

      <View style={[s.tabs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={[s.tab, cat === 'food' && s.tabActive]} onPress={() => setCat('food')}>
          <Text style={[s.tabTxt, cat === 'food' && s.tabTxtActive]}>🍽️ {t('cp.catFood')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, cat === 'stay' && s.tabActive]} onPress={() => setCat('stay')}>
          <Text style={[s.tabTxt, cat === 'stay' && s.tabTxtActive]}>🏨 {t('cp.catStay')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {list.map(c => (
          <TouchableOpacity key={c.id} activeOpacity={0.85} style={s.card} onPress={() => router.push(`/coupon?cat=${cat}&biz=${encodeURIComponent(c.name)}` as any)}>
            <Image source={{ uri: c.img }} style={s.cardImg} resizeMode="cover" />
            <View style={s.offBadge}><Text style={s.offTxt}>{c.off}</Text></View>
            <View style={s.cardBody}>
              <Text style={[s.cardName, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{c.name}</Text>
              <Text style={[s.cardSub, { textAlign: ta, writingDirection: wd }]}>{t('cp.couponSub')}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={[s.soon, { textAlign: 'center', writingDirection: wd }]}>{t('cp.soon')}</Text>
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: NAVY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 26, fontFamily: F.m, color: '#fff' },
  tabs: { gap: 10, padding: 16, paddingBottom: 4 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e7e0d4' },
  tabActive: { backgroundColor: NAVY, borderColor: NAVY },
  tabTxt: { fontSize: 15, fontFamily: F.sb, color: NAVY },
  tabTxtActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', marginBottom: 14, shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  cardImg: { width: '100%', height: 160 },
  offBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: GOLD, borderRadius: 4, width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  offTxt: { color: '#fff', fontFamily: F.x, fontSize: 17 },
  cardBody: { padding: 14 },
  cardName: { fontSize: 21, fontFamily: F.m, color: '#16222c' },
  cardSub: { fontSize: 13, fontFamily: F.r, color: '#94a0ab', marginTop: 3 },
  soon: { color: '#a9b2ba', fontSize: 13, fontFamily: F.r, marginTop: 4 },
});
