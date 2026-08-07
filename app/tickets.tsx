import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

// GetYourGuide affiliate partner id — every purchase through these links earns commission.
const PARTNER = '?partner_id=PE2GLSE3MAO4YDEIXLNOYXMC67BCZ32C';

type Ticket = {
  id: string;
  image: string;
  he: string;
  en: string;
  fa: string;
  url: string;
};

// Direct-to-ticket links (specific activities, not vendor landing pages).
const TICKETS: Ticket[] = [
  {
    id: 'argo', image: '/uploads/cable_car_batumi.png',
    he: 'הרכבל Argo', en: 'Argo Cable Car', fa: 'تله‌کابین آرگو',
    url: 'https://www.getyourguide.com/batumi-l32542/batumi-argo-cable-car-ride-with-panoramic-views-t1161370/',
  },
  {
    id: 'boat', image: '/uploads/marina_batumi.png',
    he: 'שייט פרטי בים השחור', en: 'Private Black Sea Boat Trip', fa: 'قایق‌سواری خصوصی دریای سیاه',
    url: 'https://www.getyourguide.com/batumi-l32542/batumi-exclusive-black-sea-adventure-private-boat-trip-t519000/',
  },
  {
    id: 'garden', image: '/uploads/1776673028587-443.png',
    he: 'הגן הבוטני + טעימות יין', en: 'Botanical Garden + Wine Tasting', fa: 'باغ گیاه‌شناسی + مزه شراب',
    url: 'https://www.getyourguide.com/batumi-l32542/batumi-exploring-botanical-garden-family-wine-tasting-t542198/',
  },
  {
    id: 'petra', image: '/uploads/a3_2_1778921033754.jpg',
    he: 'מבצר פטרה + גן בוטני + מיניאטורות', en: 'Petra Fortress + Botanical Garden + Miniatures', fa: 'قلعه پترا + باغ گیاه‌شناسی + پارک مینیاتور',
    url: 'https://www.getyourguide.com/batumi-l32542/batumi-botanical-garden-petra-fortress-and-miniatures-park-t547776/',
  },
  {
    id: 'city', image: '/uploads/batumi_square.png',
    he: 'סיור עיר פרטי + גן בוטני + Argo', en: 'Private City Tour + Botanical Garden + Argo', fa: 'تور خصوصی شهر + باغ گیاه‌شناسی + آرگو',
    url: 'https://www.getyourguide.com/batumi-l32542/batumi-city-tour-batumi-botanical-garden-argo-cable-car-t754825/',
  },
];

export default function TicketsScreen() {
  const { t, lang, isRTL } = useI18n();
  const txtAlign = isRTL ? 'right' : 'left';
  const wd = isRTL ? 'rtl' : 'ltr';
  const name = (tk: Ticket) => (lang === 'en' ? tk.en : lang === 'fa' ? tk.fa : tk.he);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: txtAlign, writingDirection: wd }]}>{t('tk2.title')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={s.heroWrap}>
          <Image source={require('../assets/images/tickets-banner.png')} style={s.banner} resizeMode="cover" />
          <Text style={[s.heroSub, { textAlign: 'center', writingDirection: wd }]}>{t('tk2.subtitle')}</Text>
        </View>

        {TICKETS.map((tk) => (
          <TouchableOpacity key={tk.id} style={s.card} activeOpacity={0.9} onPress={() => Linking.openURL(tk.url + PARTNER)}>
            <View style={s.imgWrap}>
              <Image source={{ uri: resolveUri(tk.image) }} style={s.img} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={s.imgOverlay} />
              <Text style={[s.name, { textAlign: txtAlign, writingDirection: wd }]} numberOfLines={2}>{name(tk)}</Text>
            </View>
            <View style={s.buyBtn}>
              <Text style={s.buyTxt}>{t('tk2.buy')} {isRTL ? '←' : '→'}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[s.note, { textAlign: 'center', writingDirection: wd }]}>{t('tk2.note')}</Text>
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
  hTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff' },
  heroWrap: { alignItems: 'center', marginBottom: 16 },
  banner: { width: '100%', height: 180, borderRadius: 16, marginBottom: 10, backgroundColor: '#F7F3ED' },
  heroSub: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#eef2f5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  imgWrap: { width: '100%', height: 150, backgroundColor: '#e5e7eb', position: 'relative', justifyContent: 'flex-end' },
  img: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imgOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  name: { fontSize: 18, fontWeight: '900', color: '#fff', paddingHorizontal: 14, paddingBottom: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  buyBtn: { backgroundColor: Colors.ACCENT, paddingVertical: 13, alignItems: 'center' },
  buyTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  note: { fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 16 },
});
