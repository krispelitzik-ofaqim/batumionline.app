import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { SERVICE_DETAILS } from '../../../constants/serviceDetails';
import BottomTabBar from '../../../components/BottomTabBar';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const svc = id ? SERVICE_DETAILS[id] : undefined;

  if (!svc) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>שירות</Text>
        </View>
        <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, writingDirection: 'rtl' }}>השירות לא נמצא</Text>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  const onCta = () => {
    if (svc.cta.kind === 'link' && svc.cta.url) {
      Linking.openURL(svc.cta.url);
    } else {
      router.push('/contact' as any);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={[s.header, { backgroundColor: svc.colors[1] }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{svc.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Hero */}
        <LinearGradient colors={svc.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <Ionicons name={svc.icon as any} size={200} color="rgba(255,255,255,0.10)" style={s.heroWatermark} />
          <View style={s.heroBadge}>
            <Ionicons name={svc.icon as any} size={44} color={Colors.WHITE} />
          </View>
          <Text style={s.heroTitle}>{svc.title}</Text>
          <Text style={s.heroSub}>{svc.subtitle}</Text>
        </LinearGradient>

        {/* Description */}
        <View style={s.section}>
          <Text style={s.desc}>{svc.description}</Text>
        </View>

        {/* Requirements */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>תנאים בסיסיים שצריך לדעת</Text>
          <View style={s.reqCard}>
            {svc.requirements.map((req, i) => (
              <View key={i} style={[s.reqRow, i === svc.requirements.length - 1 && { borderBottomWidth: 0 }]}>
                <Ionicons name="checkmark-circle" size={22} color={svc.colors[0]} />
                <Text style={s.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity activeOpacity={0.9} onPress={onCta} style={s.ctaWrap}>
          <LinearGradient colors={svc.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
            <Text style={s.ctaText}>{svc.cta.label}</Text>
            <Ionicons name="arrow-back" size={20} color={Colors.WHITE} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  hero: { margin: 16, borderRadius: 20, padding: 22, alignItems: 'flex-end', overflow: 'hidden', minHeight: 170, justifyContent: 'flex-end' },
  heroWatermark: { position: 'absolute', left: -20, top: -20 },
  heroBadge: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  heroSub: { fontSize: 13, fontWeight: '700', color: '#fff', opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 4, letterSpacing: 0.5 },
  section: { paddingHorizontal: 16, marginTop: 6, marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 24, color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  reqCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  reqRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#eef2f6' },
  reqText: { flex: 1, fontSize: 14.5, color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  ctaWrap: { marginTop: 18, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  cta: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900', writingDirection: 'rtl' },
});
