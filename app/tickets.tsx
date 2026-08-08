import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../constants/i18n';
import { resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';
const HERO = 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&q=80';

// GetYourGuide affiliate partner id — every purchase through these links earns commission.
const PARTNER = '?partner_id=PE2GLSE3MAO4YDEIXLNOYXMC67BCZ32C';

type Ticket = { id: string; image: string; he: string; en: string; fa: string; ru: string; url: string };
const TICKETS: Ticket[] = [
  { id: 'argo', image: '/uploads/cable_car_batumi.png', he: 'הרכבל Argo', en: 'Argo Cable Car', fa: 'تله‌کابین آرگو', ru: 'Канатная дорога Арго', url: 'https://www.getyourguide.com/batumi-l32542/batumi-argo-cable-car-ride-with-panoramic-views-t1161370/' },
  { id: 'boat', image: '/uploads/marina_batumi.png', he: 'שייט פרטי בים השחור', en: 'Private Black Sea Boat Trip', fa: 'قایق‌سواری خصوصی دریای سیاه', ru: 'Частная морская прогулка по Чёрному морю', url: 'https://www.getyourguide.com/batumi-l32542/batumi-exclusive-black-sea-adventure-private-boat-trip-t519000/' },
  { id: 'garden', image: '/uploads/1776673028587-443.png', he: 'הגן הבוטני + טעימות יין', en: 'Botanical Garden + Wine Tasting', fa: 'باغ گیاه‌شناسی + مزه شراب', ru: 'Ботанический сад + дегустация вина', url: 'https://www.getyourguide.com/batumi-l32542/batumi-exploring-botanical-garden-family-wine-tasting-t542198/' },
  { id: 'petra', image: '/uploads/a3_2_1778921033754.jpg', he: 'מבצר פטרה + גן בוטני + מיניאטורות', en: 'Petra Fortress + Botanical Garden + Miniatures', fa: 'قلعه پترا + باغ گیاه‌شناسی + پارک مینیاتور', ru: 'Крепость Петра + Ботанический сад + Парк миниатюр', url: 'https://www.getyourguide.com/batumi-l32542/batumi-botanical-garden-petra-fortress-and-miniatures-park-t547776/' },
  { id: 'city', image: '/uploads/batumi_square.png', he: 'סיור עיר פרטי + גן בוטני + Argo', en: 'Private City Tour + Botanical Garden + Argo', fa: 'تور خصوصی شهر + باغ گیاه‌شناسی + آرگو', ru: 'Частная экскурсия по городу + Ботанический сад + Арго', url: 'https://www.getyourguide.com/batumi-l32542/batumi-city-tour-batumi-botanical-garden-argo-cable-car-t754825/' },
];

export default function TicketsScreen() {
  const { t, lang, isRTL } = useI18n();
  const ta = isRTL ? 'right' : 'left';
  const wd = isRTL ? 'rtl' : 'ltr';
  const name = (tk: Ticket) => (lang === 'en' ? tk.en : lang === 'fa' ? tk.fa : lang === 'ru' ? tk.ru : tk.he);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t('tk2.title')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: HERO }} style={s.hero}>
          <LinearGradient colors={['rgba(9,26,42,0.02)', 'rgba(9,26,42,0.8)']} style={StyleSheet.absoluteFillObject as any} />
          <View style={[s.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[s.heroKicker, { textAlign: ta }]}>BATUMI · TICKETS</Text>
            <Text style={[s.heroTitle, { textAlign: ta, writingDirection: wd }]}>{t('tk2.title')}</Text>
            <Text style={[s.heroSub, { textAlign: ta, writingDirection: wd }]}>{t('tk2.subtitle')}</Text>
          </View>
        </ImageBackground>

        <View style={s.body}>
          {TICKETS.map((tk) => (
            <TouchableOpacity key={tk.id} style={s.card} activeOpacity={0.9} onPress={() => Linking.openURL(tk.url + PARTNER)}>
              <View style={s.imgWrap}>
                <Image source={{ uri: resolveUri(tk.image) }} style={s.img} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={s.imgOverlay} />
                <Text style={[s.name, { textAlign: ta, writingDirection: wd }]} numberOfLines={2}>{name(tk)}</Text>
              </View>
              <View style={s.buyBtn}><Text style={s.buyTxt}>{t('tk2.buy')} {isRTL ? '←' : '→'}</Text></View>
            </TouchableOpacity>
          ))}
          <Text style={[s.note, { textAlign: 'center', writingDirection: wd }]}>{t('tk2.note')}</Text>
        </View>
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: NAVY },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 24, fontFamily: F.m, color: '#fff' },
  hero: { width: '100%', height: 180, justifyContent: 'flex-end', backgroundColor: '#dfe6ea' },
  heroText: { padding: 18 },
  heroKicker: { color: GOLD, fontSize: 11, fontFamily: F.b, letterSpacing: 2 },
  heroTitle: { fontSize: 30, fontFamily: F.m, color: '#fff', marginTop: 3 },
  heroSub: { fontSize: 13, fontFamily: F.sb, color: '#fff', opacity: 0.9, marginTop: 2 },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 4, marginBottom: 14, overflow: 'hidden', shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  imgWrap: { width: '100%', height: 160, backgroundColor: '#e5e7eb', justifyContent: 'flex-end' },
  img: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imgOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  name: { fontSize: 20, fontFamily: F.m, color: '#fff', paddingHorizontal: 14, paddingBottom: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  buyBtn: { backgroundColor: '#DDB0A6', paddingVertical: 14, alignItems: 'center' },
  buyTxt: { color: '#16222c', fontSize: 15, fontFamily: F.b },
  note: { fontSize: 11, color: '#a9a291', fontFamily: F.r, marginTop: 8, lineHeight: 16 },
});
