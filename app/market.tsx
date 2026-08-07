import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

const IMG = {
  market: resolveUri('/uploads/1786081911740-787.jpg'),
  tickets: resolveUri('/uploads/1786082390271-386.jpg'),
  coupons: resolveUri('/uploads/1786082391353-69.jpg'),
  yad2: resolveUri('/uploads/1786082392340-392.jpg'),
};

export default function MarketScreen() {
  const { t, isRTL } = useI18n();
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';

  const Banner = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
    <TouchableOpacity activeOpacity={0.9} style={s.bannerWrap} onPress={onPress}>{children}</TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t('mk.title')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <ImageBackground source={{ uri: IMG.market }} style={s.hero} imageStyle={{ borderRadius: 16 }}>
          <View style={[s.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[s.heroTitle, { textAlign: ta, writingDirection: wd }]}>{t('mk.title')}</Text>
            <Text style={[s.heroSub, { textAlign: ta, writingDirection: wd }]}>{t('mk.sub')}</Text>
          </View>
        </ImageBackground>

        {/* Tickets */}
        <Banner onPress={() => router.push('/tickets' as any)}>
          <ImageBackground source={{ uri: IMG.tickets }} style={s.banner} imageStyle={{ borderRadius: 18 }}>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject as any} />
            <Text style={[s.bannerLabel, { textAlign: ta, writingDirection: wd }]}>🎟️ {t('tk2.tickets')}</Text>
          </ImageBackground>
        </Banner>

        {/* Coupons */}
        <Banner onPress={() => router.push('/coupon' as any)}>
          <ImageBackground source={{ uri: IMG.coupons }} style={s.banner} imageStyle={{ borderRadius: 18 }}>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject as any} />
            <Text style={[s.bannerLabel, { textAlign: ta, writingDirection: wd }]}>🎫 {t('cp.coupon')}</Text>
          </ImageBackground>
        </Banner>

        {/* Classifieds (יד2) */}
        <Banner onPress={() => router.push('/marketplace' as any)}>
          <ImageBackground source={{ uri: IMG.yad2 }} style={s.banner} imageStyle={{ borderRadius: 18 }}>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject as any} />
            <View style={{ padding: 14 }}>
              <Text style={[s.bannerLabel, { padding: 0, textAlign: ta, writingDirection: wd }]}>🛒 {t('mk.classifieds')}</Text>
              <Text style={[s.bannerSub, { textAlign: ta, writingDirection: wd }]}>{t('mk.classifiedsSub')}</Text>
            </View>
          </ImageBackground>
        </Banner>
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '300' },
  hTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: '#fff' },
  sub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 16 },
  hero: { width: '100%', height: 170, borderRadius: 16, marginBottom: 16, overflow: 'hidden', backgroundColor: '#f7f1e6' },
  heroText: { padding: 14 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#0f2942' },
  heroSub: { fontSize: 12, fontWeight: '700', color: '#1A6B8A', marginTop: 2 },
  bannerWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  banner: { height: 120, justifyContent: 'flex-end' },
  bannerImg: { position: 'absolute', top: 8, left: 20, right: 20, height: 70 },
  bannerImgSm: { position: 'absolute', top: 6, alignSelf: 'center', width: 78, height: 78 },
  bannerGlyph: { position: 'absolute', top: -6, left: -4, fontSize: 96, opacity: 0.18 },
  bannerLabel: { color: '#fff', fontSize: 17, fontWeight: '900', padding: 14 },
  bannerSub: { color: '#fff', fontSize: 12, fontWeight: '600', opacity: 0.9, marginTop: 2 },
});
