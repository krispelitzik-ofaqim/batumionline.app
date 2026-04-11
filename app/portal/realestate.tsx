import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { fetchContent } from '../../constants/api';

type TopButton = { id: string; label: string };
type Article = { id: string; title: string; summary: string; image?: string; link?: string; date?: string };

const DEFAULT_TOP_BUTTONS: TopButton[] = [
  { id: 'new-hotels', label: 'פרויקטים מלונאיים חדשים' },
  { id: 'running-hotels', label: 'פרויקטים מלונאיים רצים' },
  { id: 'apartments', label: 'דירות בעיר חדשות ויד 2' },
  { id: 'future', label: 'עתיד הנדל״ן' },
];

const FALLBACK_NEWS: Article[] = [
  { id: 'n1', title: 'עיריית בטומי מאשרת 4 פרויקטי מגורים חדשים באזור הטיילת', summary: 'תוכנית אב חדשה כוללת בנייה של כ-1,200 יחידות דיור לאורך חוף הים, עם גישה ישירה לטיילת ולמרכז העיר.', date: 'היום' },
  { id: 'n2', title: 'יזמים ישראלים מובילים: "בטומי היא ההזדמנות הגדולה של העשור"', summary: 'קבוצת משקיעים מישראל רכשה מתחם בגודל 8 דונם לצורך הקמת פרויקט יוקרה עם מלון ודירות נופש.', date: 'אתמול' },
];

const FALLBACK_MONEY_INDEX = [
  { label: 'מחיר ממוצע למ״ר - מרכז', value: '1,850$' },
  { label: 'מחיר ממוצע למ״ר - טיילת', value: '2,400$' },
  { label: 'תשואה שנתית ממוצעת', value: '8-12%' },
  { label: 'מחיר שכירות חודשית (2 חד׳)', value: '500-800$' },
];

const FALLBACK_TIPS: Article[] = [
  { id: 't1', title: 'בדיקת מסמכי הנכס', summary: 'לפני רכישת דירה חובה לוודא רישום מלא בטאבו הגאורגי, מצב משכנתאות והיסטוריית הבעלות.' },
  { id: 't2', title: 'עורך דין מקומי', summary: 'חיוני לערוך את העסקה עם עורך דין ישראלי-גאורגי שמכיר את החוק המקומי.' },
  { id: 't3', title: 'מיסים ועלויות נלוות', summary: 'מס רכישה ~1%, אגרת רישום, עמלת מתווך 3-5%, והוצאות ניהול נכס אם משכירים.' },
];

export default function RealEstatePortal() {
  const [topButtons, setTopButtons] = useState<TopButton[]>(DEFAULT_TOP_BUTTONS);
  const [activeTop, setActiveTop] = useState<string>(DEFAULT_TOP_BUTTONS[0].id);
  const [news, setNews] = useState<Article[]>(FALLBACK_NEWS);
  const [moneyIndex] = useState(FALLBACK_MONEY_INDEX);
  const [tips] = useState<Article[]>(FALLBACK_TIPS);

  useEffect(() => {
    fetchContent()
      .then(data => {
        if (data?.realEstate?.topButtons?.length) setTopButtons(data.realEstate.topButtons);
        if (data?.realEstate?.news?.length) setNews(data.realEstate.news);
      })
      .catch(() => {});
  }, []);

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backX}>‹</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&q=80' }}
          style={s.hero}
          imageStyle={{ borderRadius: 0 }}
        >
          <LinearGradient
            colors={['rgba(10,30,50,0.3)', 'rgba(10,30,50,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.heroOverlay}
          >
            <Text style={s.heroKicker}>BATUMI REAL ESTATE</Text>
            <Text style={s.heroTitle}>פורטל הנדל״ן</Text>
            <Text style={s.heroSub}>כל העסקאות, הפרויקטים והמידע במקום אחד</Text>
          </LinearGradient>
        </ImageBackground>

        {/* Top buttons - horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topRow}>
          {topButtons.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[s.topBtn, activeTop === b.id && s.topBtnActive]}
              onPress={() => setActiveTop(b.id)}
            >
              <Text style={[s.topBtnTxt, activeTop === b.id && s.topBtnTxtActive]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Placeholder for selected top category */}
        <View style={s.topContent}>
          <Text style={s.topContentTxt}>בקרוב: תוכן עבור "{topButtons.find(b => b.id === activeTop)?.label}"</Text>
        </View>

        {/* Section 1 — News */}
        <Section title="חדשות נדל״ן" icon="📰">
          {news.map(n => (
            <TouchableOpacity key={n.id} style={s.newsCard} activeOpacity={0.8} onPress={() => n.link && Linking.openURL(n.link)}>
              {n.image ? (
                <Image source={{ uri: n.image }} style={s.newsImg} />
              ) : (
                <View style={[s.newsImg, s.newsImgPlaceholder]}>
                  <Text style={s.newsImgEmoji}>🏙️</Text>
                </View>
              )}
              <View style={s.newsBody}>
                <Text style={s.newsTitle} numberOfLines={2}>{n.title}</Text>
                <Text style={s.newsSummary} numberOfLines={3}>{n.summary}</Text>
                {n.date && <Text style={s.newsDate}>{n.date}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* Section 2 — Money index */}
        <Section title="מדד הכסף" icon="💰">
          <View style={s.indexGrid}>
            {moneyIndex.map((m, i) => (
              <View key={i} style={s.indexCard}>
                <Text style={s.indexValue}>{m.value}</Text>
                <Text style={s.indexLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Section 3 — Tips before buying */}
        <Section title="מה צריך לדעת לפני שרוכשים דירה בבטומי" icon="💡">
          {tips.map(t => (
            <View key={t.id} style={s.tipCard}>
              <Text style={s.tipTitle}>{t.title}</Text>
              <Text style={s.tipSummary}>{t.summary}</Text>
            </View>
          ))}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionIcon}>{icon}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  backBtn: {
    position: 'absolute', top: 50, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  backX: { fontSize: 28, color: Colors.WHITE, fontWeight: '700', marginTop: -2 },
  content: { paddingBottom: 20 },

  hero: { width: '100%', height: 220 },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  heroKicker: { fontSize: 11, fontWeight: '700', color: Colors.WHITE, opacity: 0.85, letterSpacing: 2, textAlign: 'right', writingDirection: 'rtl' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  heroSub: { fontSize: 14, color: Colors.WHITE, opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },

  topRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  topBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  topBtnActive: { backgroundColor: Colors.PRIMARY },
  topBtnTxt: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  topBtnTxtActive: { color: Colors.WHITE },

  topContent: { marginHorizontal: 16, padding: 20, backgroundColor: Colors.WHITE, borderRadius: 14, marginBottom: 8, alignItems: 'center' },
  topContentTxt: { fontSize: 13, color: '#888', writingDirection: 'rtl' },

  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },

  newsCard: { backgroundColor: Colors.WHITE, borderRadius: 14, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  newsImg: { width: '100%', height: 140 },
  newsImgPlaceholder: { backgroundColor: '#E8EEF2', alignItems: 'center', justifyContent: 'center' },
  newsImgEmoji: { fontSize: 52 },
  newsBody: { padding: 14 },
  newsTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  newsSummary: { fontSize: 13, color: '#555', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18, marginTop: 4 },
  newsDate: { fontSize: 11, color: '#999', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 },

  indexGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  indexCard: { flexGrow: 1, minWidth: '45%', backgroundColor: Colors.WHITE, borderRadius: 14, padding: 16, alignItems: 'center' },
  indexValue: { fontSize: 22, fontWeight: '900', color: Colors.PRIMARY },
  indexLabel: { fontSize: 11, color: '#666', textAlign: 'center', writingDirection: 'rtl', marginTop: 4 },

  tipCard: { backgroundColor: Colors.WHITE, borderRadius: 14, padding: 14, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  tipSummary: { fontSize: 13, color: '#555', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
});
