import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { resolveUri } from '../constants/api';
import { openInAppBrowser } from '../constants/affiliates';
import BottomTabBar from '../components/BottomTabBar';
import AdBanner from '../components/AdBanner';

const BIZ_URL = 'https://www.batumionline.biz';
const HERO = resolveUri('/uploads/1786081911740-787.jpg');
const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };

export default function MarketScreen() {
  const { t, isRTL } = useI18n();
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';

  const Row = ({ emoji, tint, label, sub, onPress, last }: { emoji: string; tint: string; label: string; sub: string; onPress: () => void; last?: boolean }) => (
    <TouchableOpacity activeOpacity={0.6} style={[s.row, !last && s.rowBorder, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={onPress}>
      <View style={[s.iconTile, { backgroundColor: tint + '1A' }]}>
        <Text style={s.iconEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{label}</Text>
        <Text style={[s.rowSub, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={[s.chevron, { color: tint }]}>{isRTL ? '‹' : '›'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t('mk.title')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: HERO }} style={s.hero}>
          <LinearGradient colors={['rgba(9,26,42,0.02)', 'rgba(9,26,42,0.8)']} style={StyleSheet.absoluteFillObject as any} />
          <View style={[s.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[s.heroKicker, { textAlign: ta }]}>BATUMI · MARKETPLACE</Text>
            <Text style={[s.heroTitle, { textAlign: ta, writingDirection: wd }]}>{t('mk.title')}</Text>
            <Text style={[s.heroSub, { textAlign: ta, writingDirection: wd }]}>{t('mk.sub')}</Text>
          </View>
        </ImageBackground>

        <View style={s.block}>
          <Row emoji="🏦" tint="#1A6B8A" label={t('mk.bank')} sub={t('mk.bankSub')} onPress={() => openInAppBrowser(BIZ_URL)} />
          <Row emoji="🏠" tint="#2E7D9A" label={t('mk.buy')} sub={t('mk.buySub')} onPress={() => router.push('/realestate?mode=sale' as any)} />
          <Row emoji="🔑" tint="#2E9E6B" label={t('mk.rent')} sub={t('mk.rentSub')} onPress={() => router.push('/realestate?mode=rent' as any)} />
          <Row emoji="🎟️" tint="#D64C4C" label={t('tk2.tickets')} sub={t('tk2.ticketsSub')} onPress={() => router.push('/tickets' as any)} />
          <Row emoji="🎫" tint="#D98A1E" label={t('cp.coupon')} sub={t('cp.couponSub')} onPress={() => router.push('/coupons' as any)} />
          <Row emoji="✈️" tint="#E30613" label={t('mk.flights')} sub={t('mk.flightsSub')} onPress={() => router.push('/category/t9' as any)} />
          <Row emoji="🛒" tint="#6C5CE7" label={t('mk.classifieds')} sub={t('mk.classifiedsSub')} onPress={() => router.push('/marketplace' as any)} last />
        </View>
        <AdBanner />
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F1EA' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#16222C' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 26, fontFamily: F.m, color: '#fff' },
  hero: { width: '100%', height: 200, justifyContent: 'flex-end', backgroundColor: '#e8dfd0' },
  heroText: { padding: 18 },
  heroKicker: { color: Colors.ACCENT, fontSize: 11, fontFamily: F.b, letterSpacing: 2 },
  heroTitle: { fontSize: 32, fontFamily: F.m, color: '#fff', marginTop: 4 },
  heroSub: { fontSize: 13, fontFamily: F.sb, color: '#fff', opacity: 0.9, marginTop: 3 },
  block: { backgroundColor: '#fff' },
  row: { alignItems: 'center', gap: 14, paddingVertical: 18, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#efe9df' },
  iconTile: { width: 50, height: 50, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 25 },
  rowLabel: { color: '#16222c', fontSize: 20, fontFamily: F.m },
  rowSub: { color: '#94a0ab', fontSize: 12.5, fontFamily: F.r, marginTop: 3 },
  chevron: { fontSize: 26, fontFamily: F.r, opacity: 0.6 },
});
