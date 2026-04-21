import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { fetchContent, API_BASE } from '../../constants/api';
import BusinessServicesSlider from '../../components/BusinessServicesSlider';
import RealEstateGallery from '../../components/RealEstateGallery';
import CurrencyTicker from '../../components/CurrencyTicker';
import BottomTabBar from '../../components/BottomTabBar';
import FinanceStats from '../../components/FinanceStats';
import ListingForm from '../../components/ListingForm';
import ListingsList from '../../components/ListingsList';
import DeveloperCard, { Developer } from '../../components/DeveloperCard';
import DeveloperForm from '../../components/DeveloperForm';
import { Modal } from 'react-native';

const DEMO_DEVELOPERS: Developer[] = [
  {
    id: 'dev1',
    logo: 'https://placehold.co/120x120/1E3A8A/ffffff/png?text=ORBI',
    company: 'Orbi Group',
    projectName: 'Orbi Sea Towers Phase 4',
    brandColor: '#1E3A8A',
    location: 'Batumi Seafront',
    deliveryDate: '2028',
    whatsapp: '995555123456',
    website: 'https://orbigroup.ge',
    package: 'premium',
    units: [
      { id: 'u1', title: 'פנטהאוז 120 מ"ר', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', price: '$180,000', size: '120 מ"ר · 3 חדרים', description: 'פנטהאוז מפואר עם נוף פנורמי לים, 3 חדרים + סלון, מרפסת גדולה, עיצוב מודרני.' },
      { id: 'u2', title: 'דירת 2 חד׳ 65 מ"ר', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', price: '$82,000', size: '65 מ"ר' },
      { id: 'u3', title: 'דירת 1 חד׳ 45 מ"ר', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$64,000', size: '45 מ"ר', sold: true },
      { id: 'u4', title: 'סטודיו 25 מ"ר', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', price: '$48,000', size: '25 מ"ר' },
      { id: 'u5', title: 'דירת 3 חד׳ 95 מ"ר', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$135,000', size: '95 מ"ר' },
    ],
  },
];

type TopButton = { id: string; label: string };
type Article = { id: string; title: string; summary: string; image?: string; link?: string; date?: string };
type Listing = { id: string; title: string; image: string; price: string; features: string[]; cta: string; link?: string; size?: 'full' | 'half' };

const DEFAULT_TOP_BUTTONS: TopButton[] = [
  { id: 'hotels', label: 'פרויקטים מלונאיים' },
  { id: 'sale', label: 'דירות למכירה' },
  { id: 'rent', label: 'דירות להשכרה' },
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
    { id: 'nh1', title: 'Orbi Sea Towers Phase 4', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', price: '$65,000', features: ['אולפנים החל מ-22 מ"ר', 'מסירה 2028', 'בריכה ו-SPA', 'מרחק 50 מ׳ מהים'], cta: 'פרטים נוספים', size: 'full' },
    { id: 'nh2', title: 'Batumi Riviera Residence', image: 'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=800&q=80', price: '$82,000', features: ['דירת 1 חדר', 'תשואה 9% מובטחת'], cta: 'פרטים נוספים', size: 'half' },
    { id: 'nh3', title: 'Palm Tower by Sea', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', price: '$54,000', features: ['אולפן 25 מ"ר', 'קו ראשון לים'], cta: 'פרטים נוספים', size: 'half' },
  ],
  'running-hotels': [
    { id: 'rh1', title: 'Pullman Batumi', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', price: '$95,000', features: ['דירת נופש מלונאית', 'ניהול בינלאומי', 'תשואה 7-8%', 'מוכן למגורים'], cta: 'פרטים נוספים' },
    { id: 'rh2', title: 'Wyndham Grand Batumi', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', price: '$110,000', features: ['2 חדרים', 'מלון 5 כוכבים', 'חוזה 10 שנים', 'ניהול רשת'], cta: 'פרטים נוספים' },
  ],
  'sale': [
    { id: 'ap1', title: 'דירת 2 חדרים - מרכז', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', price: '$72,000', features: ['65 מ"ר', 'קומה 8', 'משופצת', 'מרפסת'], cta: 'פרטים נוספים', size: 'full' },
    { id: 'ap2', title: 'דירת 3 חדרים - טיילת', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$125,000', features: ['95 מ"ר', 'נוף ים', 'חניה', 'מרוהטת'], cta: 'פרטים נוספים', size: 'half' },
    { id: 'ap3', title: 'סטודיו - שכונת אלברס', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$38,000', features: ['28 מ"ר', 'משופץ', 'מרוהט', 'מוכן להשכרה'], cta: 'פרטים נוספים', size: 'half' },
  ],
  'rent': [
    { id: 'rt1', title: 'דירת 2 חדרים להשכרה - מרכז', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$650/חודש', features: ['60 מ"ר', 'מרוהטת', 'קומה 5', 'מיזוג'], cta: 'פרטים נוספים', size: 'full' },
    { id: 'rt2', title: 'דירת 3 חדרים - טיילת', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$1,200/חודש', features: ['90 מ"ר', 'נוף ים', 'מרוהטת', 'חניה'], cta: 'פרטים נוספים', size: 'half' },
    { id: 'rt3', title: 'סטודיו - שכונת אלברס', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', price: '$400/חודש', features: ['28 מ"ר', 'מרוהט', 'מיני מטבח', 'וויי-פיי'], cta: 'פרטים נוספים', size: 'half' },
  ],
  'future': [
    { id: 'fu1', title: 'פארק עסקים החדש', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', price: 'החל מ-$1,400/מ"ר', features: ['אזור עסקים מתוכנן', 'תשתיות חדשות 2028', 'פוטנציאל עליית מחירים'], cta: 'פרטים נוספים' },
    { id: 'fu2', title: 'קו רכבת קל עתידי', image: 'https://images.unsplash.com/photo-1565881545969-15d1c0dee1c2?w=800&q=80', price: 'מיליארד דולר השקעה', features: ['פרויקט ממשלתי', 'תחילת עבודות 2027', 'יעלה ערך נכסים לאורך הקו'], cta: 'פרטים נוספים' },
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
  const [rentPeriod, setRentPeriod] = useState<'daily' | 'yearly'>('daily');
  const [formOpen, setFormOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [devFormOpen, setDevFormOpen] = useState(false);
  const [listingsKey, setListingsKey] = useState(0);
  const [expandedFixedId, setExpandedFixedId] = useState<string | null>(null);
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
        if (data?.realEstate?.news?.length) setNews(data.realEstate.news.filter((n: Article) => !!n.image));
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
            <TouchableOpacity onPress={() => router.back()} style={s.heroBackBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.WHITE} />
            </TouchableOpacity>
            <Text style={s.heroKicker}>BATUMI REAL ESTATE</Text>
            <Text style={s.heroTitle}>פורטל הנדל״ן</Text>
            <Text style={s.heroSub}>כל העסקאות, הפרויקטים והמידע במקום אחד</Text>
          </LinearGradient>
        </ImageBackground>

        {/* Top buttons - fit in one row */}
        <View style={s.topRow}>
          <TouchableOpacity
            style={[s.topBtnRect, s.homeBtn, activeTop === null && s.topBtnActive]}
            onPress={() => setActiveTop(null)}
          >
            <Text style={[s.topBtnTxt, activeTop === null && s.topBtnTxtActive]} numberOfLines={2}>🏠 פורטל</Text>
          </TouchableOpacity>
          {topButtons.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[s.topBtnRect, activeTop === b.id && s.topBtnActive]}
              onPress={() => setActiveTop(activeTop === b.id ? null : b.id)}
            >
              <Text style={[s.topBtnTxt, activeTop === b.id && s.topBtnTxtActive]} numberOfLines={2}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTop ? (
          <>
            {activeTop === 'hotels' && (
              <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                {DEMO_DEVELOPERS.map(d => <DeveloperCard key={d.id} d={d} />)}
              </View>
            )}

            {(activeTop === 'sale' || activeTop === 'rent' || activeTop === 'hotels') && (
              <View style={{ marginBottom: 14 }}>
                <TouchableOpacity onPress={() => activeTop === 'hotels' ? setChoiceOpen(true) : setFormOpen(true)} style={s.uploadCard}>
                  <Text style={s.uploadIcon}>📝</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.uploadTitle}>פרסם מודעה חדשה</Text>
                    <Text style={s.uploadSub}>{activeTop === 'sale' ? 'למכירה' : activeTop === 'rent' ? 'להשכרה' : 'פרויקט מלונאי'} · חינם · אישור תוך 3 שעות</Text>
                  </View>
                  <Text style={s.uploadArrow}>‹</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Listings grid - admin-curated */}
            <View style={s.listingsGrid}>
              {(LISTINGS_BY_TOP[activeTop] || []).filter(lst => !!lst.image).map(lst => (
                <React.Fragment key={lst.id}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[s.listingCard, lst.size === 'half' && s.listingCardHalf]}
                    onPress={() => setExpandedFixedId(expandedFixedId === lst.id ? null : lst.id)}
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
                  {expandedFixedId === lst.id && (
                    <View style={s.fixedExpanded}>
                      <View style={s.fixedExpandedHeader}>
                        <TouchableOpacity onPress={() => setExpandedFixedId(null)} style={s.fixedCloseBtn}>
                          <Text style={s.fixedCloseTxt}>✕</Text>
                        </TouchableOpacity>
                        <Text style={s.fixedExpandedTitle} numberOfLines={1}>{lst.title}</Text>
                      </View>
                      <Image source={{ uri: lst.image }} style={{ width: '100%', aspectRatio: 16 / 10 }} resizeMode="cover" />
                      <View style={{ padding: 12 }}>
                        {lst.features.map((f, i) => (
                          <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 4 }}>
                            <Text style={{ color: '#4ade80' }}>✓</Text>
                            <Text style={{ fontSize: 13, color: '#e2e8f0', textAlign: 'right', writingDirection: 'rtl' }}>{f}</Text>
                          </View>
                        ))}
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: '#10b981' }}>{lst.price}</Text>
                          {lst.link && (
                            <TouchableOpacity onPress={() => Linking.openURL(lst.link!)} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.PRIMARY, borderRadius: 8 }}>
                              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{lst.cta}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>

            {(activeTop === 'sale' || activeTop === 'rent' || activeTop === 'hotels') && (
              <View style={{ marginTop: 14 }}>
                <ListingsList type={activeTop as 'sale' | 'rent' | 'hotels'} reloadKey={listingsKey} />
              </View>
            )}
            {false && (activeTop === 'sale' || activeTop === 'rent') && (
              <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 14 }}>
                {(LISTINGS_BY_TOP[activeTop] || []).filter(lst => !!lst.image).map(lst => (
                  <TouchableOpacity
                    key={`h-${lst.id}`}
                    activeOpacity={0.85}
                    onPress={() => lst.link && Linking.openURL(lst.link)}
                    style={s.hBanner}
                  >
                    <Image source={{ uri: lst.image }} style={s.hBannerImg} />
                    <View style={s.hBannerBody}>
                      <Text style={s.hBannerTitle} numberOfLines={1}>{lst.title}</Text>
                      <Text style={s.hBannerInfo} numberOfLines={1}>{lst.features.slice(0, 2).join(' · ')}</Text>
                      <View style={s.hBannerBottom}>
                        <Text style={s.hBannerPrice}>{lst.price}</Text>
                        <View style={s.hBannerBtnSmall}>
                          <Text style={s.hBannerBtnSmallTxt}>{lst.cta}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Section 1 — News slider */}
            <Section title="חדשות נדל״ן" icon="📰">
              <NewsSliderArrows news={news} />
            </Section>

            <RealEstateGallery />

            {/* Section 2 — Finance stats */}
            <Section title="מדד הכסף" icon="💰">
              <FinanceStats />
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

            {/* Section - Future real estate (between services and currency) */}
            <Section title="עתיד הנדל״ן" icon="🔮">
              <FutureSlider projects={LISTINGS_BY_TOP['future'] || []} />
            </Section>

            <CurrencyTicker />
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
      <ListingForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        defaultType={activeTop === 'sale' ? 'sale' : activeTop === 'hotels' ? 'hotels' : 'rent'}
        onSubmitted={() => setListingsKey(k => k + 1)}
      />
      <DeveloperForm
        visible={devFormOpen}
        onClose={() => setDevFormOpen(false)}
        onSubmitted={() => setListingsKey(k => k + 1)}
      />
      <Modal visible={choiceOpen} animationType="fade" transparent onRequestClose={() => setChoiceOpen(false)}>
        <View style={s.choiceBackdrop}>
          <View style={s.choiceSheet}>
            <View style={s.choiceHeader}>
              <TouchableOpacity onPress={() => setChoiceOpen(false)}><Text style={s.choiceClose}>✕</Text></TouchableOpacity>
              <Text style={s.choiceTitle}>מי אתה?</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setChoiceOpen(false); setFormOpen(true); }}
              style={s.choiceBtn}
            >
              <Text style={s.choiceBtnIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.choiceBtnTitle}>לקוח פרטי</Text>
                <Text style={s.choiceBtnSub}>מודעה בודדת · קטן חינם / גדול $10/חודש</Text>
              </View>
              <Text style={s.choiceArrow}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setChoiceOpen(false); setDevFormOpen(true); }}
              style={[s.choiceBtn, s.choiceBtnDev]}
            >
              <Text style={s.choiceBtnIcon}>🏗️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.choiceBtnTitle}>יזם / מתווך</Text>
                <Text style={s.choiceBtnSub}>מיני-פורטל · Basic $100 / Premium $180 לחודש</Text>
              </View>
              <Text style={s.choiceArrow}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

function FutureSlider({ projects }: { projects: Listing[] }) {
  const SLIDE_W = 340;
  const GAP = 12;
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, i));
    setIdx(next);
    scrollRef.current?.scrollTo({ x: next * (SLIDE_W + GAP), animated: true });
  };
  if (projects.length === 0) return null;
  return (
    <View style={{ width: SLIDE_W, alignSelf: 'center', overflow: 'hidden', position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: GAP }}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + GAP)))}
      >
        {projects.map(p => (
          <TouchableOpacity key={p.id} activeOpacity={0.85} style={{ width: SLIDE_W, height: 260, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: '#e2e8f0' }} onPress={() => p.link && Linking.openURL(p.link)}>
            {p.image && <Image source={{ uri: p.image }} style={{ width: SLIDE_W, height: 140 }} />}
            <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>{p.title}</Text>
                <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 }} numberOfLines={1}>{p.price || ''}</Text>
                <Text style={{ fontSize: 11, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 }} numberOfLines={3}>{(p.features || []).join(' · ')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {projects.length > 1 && (
        <>
          <TouchableOpacity style={{ position: 'absolute', top: 60, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }} onPress={() => goTo(idx - 1)}>
            <Text style={{ fontSize: 20, color: '#fff', fontWeight: '300' }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'absolute', top: 60, left: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }} onPress={() => goTo(idx + 1)}>
            <Text style={{ fontSize: 20, color: '#fff', fontWeight: '300' }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
            {projects.map((_, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? Colors.PRIMARY : '#cbd5e1' }} />)}
          </View>
        </>
      )}
    </View>
  );
}

function NewsSliderArrows({ news }: { news: Article[] }) {
  const SLIDE_W = 340;
  const GAP = 12;
  const { width } = useWindowDimensions();
  const sidePad = Math.max(16, (width - SLIDE_W) / 2);
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const scrollTo = (i: number) => {
    const next = Math.max(0, Math.min(news.length - 1, i));
    setIdx(next);
    scrollRef.current?.scrollTo({ x: next * (SLIDE_W + GAP), animated: true });
  };
  return (
    <View style={[s.newsSliderWrap, { width: SLIDE_W, alignSelf: 'center', overflow: 'hidden' }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: GAP }}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + GAP)))}
      >
        {news.map(n => (
          <TouchableOpacity key={n.id} activeOpacity={0.85} style={[s.newsCardLike, { width: SLIDE_W, height: 200 }]} onPress={() => n.link && Linking.openURL(n.link)}>
            {n.image ? (
              <Image source={{ uri: n.image }} style={{ width: SLIDE_W, height: 100 }} />
            ) : (
              <View style={{ width: SLIDE_W, height: 100, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>🏙️</Text></View>
            )}
            <View style={{ height: 100, padding: 10, backgroundColor: Colors.WHITE, justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>{n.title}</Text>
                <Text style={{ fontSize: 12, color: '#555', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }} numberOfLines={2}>{n.summary}</Text>
              </View>
              {n.date && <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', writingDirection: 'rtl' }}>{n.date}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[s.arrowBtn, { right: 12, top: 32 }]} onPress={() => scrollTo(idx - 1)} disabled={idx === 0}>
        <Text style={[s.arrowTxt, idx === 0 && { opacity: 0.3 }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.arrowBtn, { left: 12, top: 32 }]} onPress={() => scrollTo(idx + 1)} disabled={idx === news.length - 1}>
        <Text style={[s.arrowTxt, idx === news.length - 1 && { opacity: 0.3 }]}>‹</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  heroBackBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
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

  topRow: { flexDirection: 'row-reverse', gap: 4, paddingHorizontal: 6, paddingVertical: 10, justifyContent: 'center' },
  topBtnRect: { flex: 1, backgroundColor: Colors.WHITE, paddingHorizontal: 6, paddingVertical: 10, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  topGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center' },
  topBtnGrid: { width: '32%', backgroundColor: Colors.WHITE, paddingHorizontal: 6, paddingVertical: 10, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  topBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  homeBtn: { backgroundColor: Colors.ACCENT + '30' },
  topBtnActive: { backgroundColor: Colors.PRIMARY },
  topBtnTxt: { fontSize: 10, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'center' },
  topBtnTxtActive: { color: Colors.WHITE },

  layoutToggle: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  layoutBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E5E5E5' },
  layoutBtnActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  layoutBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  layoutBtnTxtActive: { color: Colors.WHITE },

  listingsGrid: { paddingHorizontal: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  fixedExpanded: { width: '100%', backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  fixedExpandedHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e293b' },
  fixedExpandedTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  fixedCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fixedCloseTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  listingCard: {
    width: '100%',
    backgroundColor: Colors.WHITE, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  listingCardHalf: { width: '48.8%' },
  hBanner: { flexDirection: 'row-reverse', alignItems: 'stretch', width: 340, height: 100, alignSelf: 'center', backgroundColor: Colors.WHITE, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  hBannerImg: { width: 100, height: 100 },
  hBannerBody: { flex: 1, padding: 8, justifyContent: 'space-between' },
  hBannerTitle: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  hBannerInfo: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl' },
  hBannerBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  hBannerPrice: { fontSize: 13, fontWeight: '900', color: '#10b981', textAlign: 'right' },
  hBannerBtnSmall: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.PRIMARY, borderRadius: 6 },
  hBannerBtnSmallTxt: { color: Colors.WHITE, fontSize: 10, fontWeight: '800', writingDirection: 'rtl' },
  uploadCard: { marginHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: '#10b981', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  uploadIcon: { fontSize: 28 },
  uploadTitle: { fontSize: 15, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  uploadSub: { fontSize: 11, color: Colors.WHITE, opacity: 0.9, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  uploadArrow: { fontSize: 22, color: Colors.WHITE, fontWeight: '300' },
  choiceBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  choiceSheet: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  choiceHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  choiceTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  choiceClose: { fontSize: 20, color: '#64748b', padding: 4 },
  choiceBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  choiceBtnDev: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  choiceBtnIcon: { fontSize: 30 },
  choiceBtnTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  choiceBtnSub: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  choiceArrow: { fontSize: 22, color: '#64748b', fontWeight: '300' },
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
  newsSliderWrap: { position: 'relative' },
  newsCardLike: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  arrowBtn: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  arrowTxt: { fontSize: 26, fontWeight: '300', color: Colors.WHITE, lineHeight: 28 },
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
