import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { fetchContent, API_BASE } from '../../constants/api';
import BusinessServicesSlider from '../../components/BusinessServicesSlider';
import RealEstateGallery from '../../components/RealEstateGallery';
import CurrencyTicker from '../../components/CurrencyTicker';

type TopButton = { id: string; label: string };
type Article = { id: string; title: string; summary: string; image?: string; link?: string; date?: string };
type Listing = { id: string; title: string; image: string; price: string; features: string[]; cta: string; link?: string; size?: 'full' | 'half' };

const DEFAULT_TOP_BUTTONS: TopButton[] = [
  { id: 'new-hotels', label: 'פרויקטים מלונאיים חדשים' },
  { id: 'running-hotels', label: 'פרויקטים מלונאיים רצים' },
  { id: 'apartments', label: 'דירות בעיר חדשות ויד 2' },
  { id: 'future', label: 'עתיד הנדל״ן' },
];

const FALLBACK_NEWS: Article[] = [
  { id: 'n1', title: 'עיריית בטומי מאשרת 4 פרויקטי מגורים חדשים באזור הטיילת', summary: 'תוכנית אב חדשה כוללת בנייה של כ-1,200 יחידות דיור לאורך חוף הים, עם גישה ישירה לטיילת ולמרכז העיר.', image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80', date: 'היום' },
  { id: 'n2', title: 'יזמים ישראלים: "בטומי היא ההזדמנות הגדולה של העשור"', summary: 'קבוצת משקיעים מישראל רכשה מתחם בגודל 8 דונם לצורך הקמת פרויקט יוקרה עם מלון ודירות נופש.', image: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80', date: 'אתמול' },
  { id: 'n3', title: 'תשואות שכירות בבטומי עלו ל-10% בממוצע שנתי', summary: 'נתוני הלשכה המרכזית לסטטיסטיקה של גאורגיה חושפים שגאורגיה הפכה ליעד השקעה מוביל בקווקז.', image: 'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=800&q=80', date: 'לפני יומיים' },
  { id: 'n4', title: 'חברת Orbi מכריזה על מגדל חדש בגובה 45 קומות', summary: 'הפרויקט ייבנה במרכז הטיילת ויכלול דירות יוקרה, חדרי כושר, ספא ובריכה אינסוף.', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80', date: 'השבוע' },
  { id: 'n5', title: 'הבנק הלאומי של גאורגיה מקל על משכנתאות לזרים', summary: 'רפורמה חדשה מאפשרת לרוכשים זרים לקבל מימון של עד 60% מערך הנכס בריבית קבועה.', image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80', date: 'השבוע' },
];

const FALLBACK_MONEY_INDEX = [
  { label: 'מחיר ממוצע למ״ר - מרכז', value: '1,850$' },
  { label: 'מחיר ממוצע למ״ר - טיילת', value: '2,400$' },
  { label: 'תשואה שנתית ממוצעת', value: '8-12%' },
  { label: 'מחיר שכירות חודשית (2 חד׳)', value: '500-800$' },
];

const LISTINGS_BY_TOP: Record<string, Listing[]> = {
  'new-hotels': [
    { id: 'nh1', title: 'Orbi Sea Towers Phase 4', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', price: '$65,000', features: ['אולפנים החל מ-22 מ"ר', 'מסירה 2028', 'בריכה ו-SPA', 'מרחק 50 מ׳ מהים'], cta: 'לפרטים עם המתווך', size: 'full' },
    { id: 'nh2', title: 'Batumi Riviera Residence', image: 'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=800&q=80', price: '$82,000', features: ['דירת 1 חדר', 'תשואה 9% מובטחת'], cta: 'לפרטים', size: 'half' },
    { id: 'nh3', title: 'Palm Tower by Sea', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', price: '$54,000', features: ['אולפן 25 מ"ר', 'קו ראשון לים'], cta: 'לפרטים', size: 'half' },
  ],
  'running-hotels': [
    { id: 'rh1', title: 'Pullman Batumi', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', price: '$95,000', features: ['דירת נופש מלונאית', 'ניהול בינלאומי', 'תשואה 7-8%', 'מוכן למגורים'], cta: 'לפרטים עם המתווך' },
    { id: 'rh2', title: 'Wyndham Grand Batumi', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', price: '$110,000', features: ['2 חדרים', 'מלון 5 כוכבים', 'חוזה 10 שנים', 'ניהול רשת'], cta: 'לפרטים עם המתווך' },
  ],
  'apartments': [
    { id: 'ap1', title: 'דירת 2 חדרים - מרכז', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', price: '$72,000', features: ['65 מ"ר', 'קומה 8', 'משופצת', 'מרפסת'], cta: 'לפרטים עם המתווך' },
    { id: 'ap2', title: 'דירת 3 חדרים - טיילת', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$125,000', features: ['95 מ"ר', 'נוף ים', 'חניה', 'מרוהטת'], cta: 'לפרטים עם המתווך' },
    { id: 'ap3', title: 'סטודיו - שכונת אלברס', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$38,000', features: ['28 מ"ר', 'משופץ', 'מרוהט', 'מוכן להשכרה'], cta: 'לפרטים עם המתווך' },
  ],
  'future': [
    { id: 'fu1', title: 'פארק עסקים החדש', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', price: 'החל מ-$1,400/מ"ר', features: ['אזור עסקים מתוכנן', 'תשתיות חדשות 2028', 'פוטנציאל עליית מחירים'], cta: 'מידע נוסף' },
    { id: 'fu2', title: 'קו רכבת קל עתידי', image: 'https://images.unsplash.com/photo-1565881545969-15d1c0dee1c2?w=800&q=80', price: 'מיליארד דולר השקעה', features: ['פרויקט ממשלתי', 'תחילת עבודות 2027', 'יעלה ערך נכסים לאורך הקו'], cta: 'מידע נוסף' },
  ],
};

const FALLBACK_TIPS: Article[] = [
  { id: 't1', title: 'בדיקת מסמכי הנכס', summary: 'לפני רכישת דירה חובה לוודא רישום מלא בטאבו הגאורגי, מצב משכנתאות והיסטוריית הבעלות.' },
  { id: 't2', title: 'עורך דין מקומי', summary: 'חיוני לערוך את העסקה עם עורך דין ישראלי-גאורגי שמכיר את החוק המקומי.' },
  { id: 't3', title: 'מיסים ועלויות נלוות', summary: 'מס רכישה ~1%, אגרת רישום, עמלת מתווך 3-5%, והוצאות ניהול נכס אם משכירים.' },
];

export default function RealEstatePortal() {
  const [topButtons, setTopButtons] = useState<TopButton[]>(DEFAULT_TOP_BUTTONS);
  const [activeTop, setActiveTop] = useState<string | null>(null);
  const [news, setNews] = useState<Article[]>(FALLBACK_NEWS);
  const [moneyIndex] = useState(FALLBACK_MONEY_INDEX);
  const [tips] = useState<Article[]>(FALLBACK_TIPS);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const handleService = useCallback((id: string) => {
    if (id === 'bank') {
      Linking.openURL('https://batumionline.biz');
    }
  }, []);

  const [realEstateImage, setRealEstateImage] = useState('');

  useEffect(() => {
    fetchContent()
      .then(data => {
        if (data?.realEstate?.topButtons?.length) setTopButtons(data.realEstate.topButtons);
        if (data?.realEstate?.news?.length) setNews(data.realEstate.news);
        const side = data?.sideBanners || [];
        const re = side.find((b: any) => b.id === 'realestate');
        if (re?.icon?.startsWith('http')) setRealEstateImage(re.icon);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/gallery`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.files?.length) {
          const urls: string[] = j.files.map((f: any) => f.url);
          setGalleryImages(urls);
          setNews(prev => prev.map((n, i) => ({ ...n, image: urls[i % urls.length] })));
        }
      })
      .catch(() => {});
  }, []);

  const heroUri = realEstateImage || galleryImages[0] || 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&q=80';

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backX}>‹</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground
          source={{ uri: heroUri }}
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
          <TouchableOpacity
            style={[s.topBtn, s.homeBtn, activeTop === null && s.topBtnActive]}
            onPress={() => setActiveTop(null)}
          >
            <Text style={[s.topBtnTxt, activeTop === null && s.topBtnTxtActive]}>🏠 פורטל הנדל״ן</Text>
          </TouchableOpacity>
          {topButtons.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[s.topBtn, activeTop === b.id && s.topBtnActive]}
              onPress={() => setActiveTop(activeTop === b.id ? null : b.id)}
            >
              <Text style={[s.topBtnTxt, activeTop === b.id && s.topBtnTxtActive]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTop ? (
          <>
            <BusinessServicesSlider variant="small" onPressService={handleService} />
            {/* Listings grid - size per listing set by editor (admin) */}
            <View style={s.listingsGrid}>
              {(LISTINGS_BY_TOP[activeTop] || []).map(lst => (
                <TouchableOpacity
                  key={lst.id}
                  activeOpacity={0.85}
                  style={[s.listingCard, lst.size === 'half' && s.listingCardHalf]}
                  onPress={() => lst.link && Linking.openURL(lst.link)}
                >
                  <Image source={{ uri: lst.image }} style={s.listingImage} />
                  <View style={s.listingBody}>
                    <Text style={s.listingTitle} numberOfLines={2}>{lst.title}</Text>
                    {lst.features.map((f, i) => (
                      <View key={i} style={s.listingFeature}>
                        <Text style={s.listingFeatureCheck}>✓</Text>
                        <Text style={s.listingFeatureTxt} numberOfLines={2}>{f}</Text>
                      </View>
                    ))}
                    <Text style={s.listingPrice}>{lst.price}</Text>
                    <View style={s.listingCta}>
                      <Text style={s.listingCtaTxt}>{lst.cta}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Section 1 — News slider */}
            <Section title="חדשות נדל״ן" icon="📰">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.newsRow}>
                {news.map(n => (
                  <TouchableOpacity key={n.id} style={s.newsSlide} activeOpacity={0.8} onPress={() => n.link && Linking.openURL(n.link)}>
                    {n.image ? (
                      <Image source={{ uri: n.image }} style={s.newsSlideImg} />
                    ) : (
                      <View style={[s.newsSlideImg, s.newsImgPlaceholder]}>
                        <Text style={s.newsImgEmoji}>🏙️</Text>
                      </View>
                    )}
                    <View style={s.newsSlideBody}>
                      <Text style={s.newsTitle} numberOfLines={2}>{n.title}</Text>
                      <Text style={s.newsSummary} numberOfLines={3}>{n.summary}</Text>
                      {n.date && <Text style={s.newsDate}>{n.date}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Section>

            <RealEstateGallery />

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

            <BusinessServicesSlider variant="large" onPressService={handleService} />
            <CurrencyTicker />
          </>
        )}

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
  homeBtn: { backgroundColor: Colors.ACCENT + '30' },
  topBtnActive: { backgroundColor: Colors.PRIMARY },
  topBtnTxt: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  topBtnTxtActive: { color: Colors.WHITE },

  layoutToggle: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  layoutBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E5E5E5' },
  layoutBtnActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  layoutBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  layoutBtnTxtActive: { color: Colors.WHITE },

  listingsGrid: { paddingHorizontal: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  listingCard: {
    width: '100%',
    backgroundColor: Colors.WHITE, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  listingCardHalf: { width: '48.8%' },
  listingImage: { width: '100%', height: 160 },
  listingBody: { padding: 14 },
  listingTitle: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  listingFeature: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  listingFeatureCheck: { fontSize: 12, fontWeight: '800', color: Colors.PRIMARY, lineHeight: 16 },
  listingFeatureTxt: { flex: 1, fontSize: 12, color: '#555', textAlign: 'right', writingDirection: 'rtl', lineHeight: 16 },
  listingPrice: { fontSize: 20, fontWeight: '900', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 10 },
  listingCta: { marginTop: 10, backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  listingCtaTxt: { fontSize: 13, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },

  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },

  newsCard: { backgroundColor: Colors.WHITE, borderRadius: 14, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  newsImg: { width: '100%', height: 140 },
  newsRow: { gap: 12 },
  newsSlide: { width: 260, backgroundColor: Colors.WHITE, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  newsSlideImg: { width: '100%', height: 140 },
  newsSlideBody: { padding: 12 },
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
