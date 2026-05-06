import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground, Linking, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';
import { fetchContent, API_BASE, resolveUri } from '../../constants/api';
import BusinessServicesSlider from '../../components/BusinessServicesSlider';
import RealEstateGallery from '../../components/RealEstateGallery';
import CurrencyTicker from '../../components/CurrencyTicker';
import BottomTabBar from '../../components/BottomTabBar';
import AppHeader from '../../components/AppHeader';
import FinanceStats from '../../components/FinanceStats';
import ListingForm from '../../components/ListingForm';
import MyListingsModal from '../../components/MyListingsModal';
import { FEATURES } from '../../constants/features';
import ListingsList from '../../components/ListingsList';
import DeveloperCard, { Developer } from '../../components/DeveloperCard';
import DeveloperForm from '../../components/DeveloperForm';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HtmlContent from '../../components/HtmlContent';

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
type Article = { id: string; title: string; summary: string; image?: string; link?: string; date?: string; body?: string; longText?: string; article?: string };
type Listing = { id: string; title: string; image: string; images?: string[]; price: string; features: string[]; cta: string; link?: string; size?: 'full' | 'half'; article?: string };

const DEFAULT_TOP_BUTTONS: TopButton[] = [
  { id: 'sale', label: 'דירות למכירה' },
  { id: 'rent', label: 'דירות להשכרה' },
  { id: 'hotels', label: 'פרויקטים מלונאיים' },
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
  const [futureProjects, setFutureProjects] = useState<Listing[]>(LISTINGS_BY_TOP['future'] || []);
  const [myListingsOpen, setMyListingsOpen] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [openArticle, setOpenArticle] = useState<any | null>(null);
  const [curated, setCurated] = useState<Record<string, Listing[]>>({});

  const [openServiceArticle, setOpenServiceArticle] = useState<any>(null);
  const handleService = useCallback((svc: any) => {
    const type = svc.actionType;
    if (type === 'link' && svc.url) {
      Linking.openURL(svc.url);
    } else if (type === 'modal' || type === 'article') {
      setOpenServiceArticle(svc);
    } else if (svc.id === 'realestate') {
      router.push('/portal/brokers' as any);
    } else if (svc.id === 'bank') {
      Linking.openURL('https://batumionline.biz');
    } else {
      router.push('/contact' as any);
    }
  }, []);

  const [realEstateImage, setRealEstateImage] = useState('');

  useEffect(() => {
    (async () => {
      const RE_FALLBACKS = [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=800&q=80',
      ];
      try {
        const rssUrl = 'https://news.google.com/rss/search?q=' + encodeURIComponent('בטומי נדלן') + '&hl=he&gl=IL&ceid=IL:he';
        const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
        const r = await fetch(apiUrl);
        const j = await r.json();
        const filtered = (j.items || []).filter((it: any) => {
          const text = ((it.title || '') + ' ' + (it.description || '')).toLowerCase();
          return text.includes('בטומי') || text.includes('batumi');
        });
        const items: Article[] = filtered.slice(0, 12).map((it: any, i: number) => ({
          id: 'rss_' + i + '_' + (it.guid || it.link || '').slice(-12),
          title: it.title || '',
          summary: (it.description || '').replace(/<[^>]+>/g, '').slice(0, 250),
          image: it.enclosure?.link || it.thumbnail || RE_FALLBACKS[i % RE_FALLBACKS.length],
          link: it.link || '',
          date: it.pubDate ? new Date(it.pubDate).toLocaleDateString('he-IL') : '',
        }));
        if (items.length) setNews(items);
      } catch {}
    })();
    fetchContent()
      .then(data => {
        if (data?.realEstate?.topButtons?.length) setTopButtons(data.realEstate.topButtons);
        if (data?.realEstate?.news?.length) setNews(data.realEstate.news.filter((n: Article) => !!n.image));
        else if (Array.isArray(data?.realEstate?.newsCategories) && data.realEstate.newsCategories.length > 0) {
          const flat: Article[] = [];
          data.realEstate.newsCategories.forEach((c: any) => (c.items || []).forEach((i: any) => flat.push(i)));
          if (flat.length) setNews(flat.filter(n => !!n.image));
        }
        const side = data?.sideBanners || [];
        const re = side.find((b: any) => b.id === 'realestate');
        const heroImg = re?.image || (re?.icon?.startsWith('http') ? re.icon : '');
        if (heroImg) setRealEstateImage(heroImg);
        if (Array.isArray(data?.futureProjects) && data.futureProjects.length) setFutureProjects(data.futureProjects);
        if (Array.isArray(data?.realEstateArticles)) setArticles(data.realEstateArticles);
        if (data?.curatedListings && typeof data.curatedListings === 'object') setCurated(data.curatedListings);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/gallery`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.files?.length) {
          const urls: string[] = j.files.map((f: any) => f.url);
          setGalleryImages(urls);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const missing = news.filter(n => !n.image && n.link);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const n of missing) {
        try {
          const r = await fetch(`${API_BASE}/api/og-image?url=${encodeURIComponent(n.link!)}`);
          const j = await r.json();
          if (cancelled) return;
          if (j.success && j.image) {
            setNews(prev => prev.map(x => x.id === n.id ? { ...x, image: j.image } : x));
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [news]);

  const heroUri = realEstateImage || galleryImages[0] || '/uploads/city.jpg';

  return (
    <SafeAreaView edges={['top']} style={s.container}>
      <AppHeader crumbs={[{ title: 'פורטל הנדל״ן' }]} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground
          source={{ uri: resolveUri(heroUri) }}
          style={s.hero}
          imageStyle={{ borderRadius: 0 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(10,30,50,0.85)']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.heroOverlay}
          >
            <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.heroBackBtn}>
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
            <Text style={[s.topBtnTxt, activeTop === null && s.topBtnTxtActive]} numberOfLines={2}>🏠 פורטל{'\n'}הנדל"ן</Text>
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
              <View style={{ marginBottom: 14, paddingHorizontal: 12, gap: 6 }}>
                <TouchableOpacity onPress={() => activeTop === 'hotels' ? setChoiceOpen(true) : setFormOpen(true)} activeOpacity={0.85} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.PRIMARY, backgroundColor: '#fff' }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#fff', fontWeight: '900' }}>+</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>פרסם {activeTop === 'sale' ? 'למכירה' : activeTop === 'rent' ? 'להשכרה' : 'פרויקט'}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 1 }}>חינם · חשיפה לישראלים בבטומי</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: Colors.PRIMARY, fontWeight: '300' }}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMyListingsOpen(true)} activeOpacity={0.7} style={{ paddingVertical: 6, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: Colors.PRIMARY, fontWeight: '700', textDecorationLine: 'underline' }}>המודעות שלי / מחיקה</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Listings grid - admin-curated */}
            <View style={s.listingsGrid}>
              {((curated[activeTop] && curated[activeTop].length > 0 ? curated[activeTop] : LISTINGS_BY_TOP[activeTop]) || []).filter((lst: any) => !!lst.image && lst.visible !== false).map((lst: any) => {
                const hs = lst.highlightStyle || '';
                const cardBg = hs === 'yellow' || hs === 'yellow-border' ? '#fffbeb' : hs === 'blue' ? '#0c1e3a' : Colors.WHITE;
                const cardBorder = hs === 'yellow-border' ? { borderWidth: 2, borderColor: '#f59e0b' } : hs === 'blue' ? { borderWidth: 2, borderColor: '#1e3a8a' } : {};
                const isBlue = hs === 'blue';
                const txtColor = isBlue ? '#fff' : '#1C2B35';
                const subColor = isBlue ? '#cbd5e1' : '#555';
                const priceColor = isBlue ? '#F4A94E' : '#10b981';
                const isBanner = lst.size === 'banner';
                const isFull = lst.size === 'full' || (!lst.size);
                return (
                <React.Fragment key={lst.id}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[s.listingCard, lst.size === 'half' && s.listingCardHalf, isBanner && { width: '100%', flexDirection: 'row-reverse', height: 130 }, { backgroundColor: cardBg }, cardBorder]}
                    onPress={() => setExpandedFixedId(expandedFixedId === lst.id ? null : lst.id)}
                  >
                    <Image source={{ uri: resolveUri(lst.image) }} style={[s.listingImage, isBanner && { width: 150, height: '100%' }]} />
                    <View style={[s.listingBody, isBanner && { flex: 1, padding: 8 }]}>
                      {isFull ? (
                        <>
                          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <Text style={[{ flex: 1, fontSize: 18, fontWeight: '900', color: txtColor, textAlign: 'right', writingDirection: 'rtl' }]} numberOfLines={2}>{lst.title}</Text>
                            <Text style={[s.listingPrice, { color: priceColor, marginTop: 0, fontSize: 18 }]}>{lst.price}</Text>
                          </View>
                          {!!lst.location && <Text style={[s.listingFeatureTxt, { color: subColor, marginTop: 6, fontSize: 12 }]}>📍 {lst.location}</Text>}
                          {(lst.features || []).slice(0, 4).map((f: string, i: number) => (
                            <View key={i} style={s.listingFeature}>
                              <Text style={[s.listingFeatureCheck, { color: isBlue ? '#F4A94E' : Colors.PRIMARY }]}>✓</Text>
                              <Text style={[s.listingFeatureTxt, { color: subColor }]} numberOfLines={1}>{f}</Text>
                            </View>
                          ))}
                          <Text style={{ fontSize: 11, color: isBlue ? '#F4A94E' : Colors.PRIMARY, fontWeight: '700', textAlign: 'left', marginTop: 8 }}>פרטים נוספים ›</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[s.listingTitle, { color: txtColor }, isBanner && { fontSize: 13, marginBottom: 4 }]} numberOfLines={2}>{lst.title}</Text>
                          {!!lst.location && <Text style={[s.listingFeatureTxt, { color: subColor, marginBottom: 4 }]}>📍 {lst.location}</Text>}
                          {(lst.features || []).slice(0, isBanner ? 2 : 4).map((f: string, i: number) => (
                            <View key={i} style={s.listingFeature}>
                              <Text style={[s.listingFeatureCheck, { color: isBlue ? '#F4A94E' : Colors.PRIMARY }]}>✓</Text>
                              <Text style={[s.listingFeatureTxt, { color: subColor }]} numberOfLines={1}>{f}</Text>
                            </View>
                          ))}
                          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <Text style={[s.listingPrice, { color: priceColor, marginTop: 0 }, isBanner && { fontSize: 16 }]}>{lst.price}</Text>
                            <Text style={{ fontSize: 11, color: isBlue ? '#F4A94E' : Colors.PRIMARY, fontWeight: '700' }}>פרטים ›</Text>
                          </View>
                        </>
                      )}
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
                      {(lst as any).video ? (
                        <View style={{ width: '100%', aspectRatio: 16/10, backgroundColor: '#000' }}>
                          <Video
                            source={{ uri: resolveUri((lst as any).video) }}
                            style={{ width: '100%', height: '100%' }}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                          />
                        </View>
                      ) : null}
                      <ExpandedGallery images={(lst.images && lst.images.length > 0) ? lst.images : (lst.image ? [lst.image] : [])} />
                      <View style={{ padding: 12 }}>
                        {!!lst.location && <Text style={{ fontSize: 13, color: '#cbd5e1', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 }}>📍 {lst.location}</Text>}
                        {(lst.features || []).map((f: string, i: number) => (
                          <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 4 }}>
                            <Text style={{ color: '#4ade80' }}>✓</Text>
                            <Text style={{ fontSize: 13, color: '#e2e8f0', textAlign: 'right', writingDirection: 'rtl' }}>{f}</Text>
                          </View>
                        ))}
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#10b981', textAlign: 'right', marginTop: 10 }}>{lst.price}</Text>
                        {(lst as any).phone && (
                          <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 10 }}>
                            <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${String((lst as any).phone).replace(/\D/g, '')}`)} style={{ flex: 1, paddingVertical: 10, backgroundColor: '#25D366', borderRadius: 8, alignItems: 'center' }}>
                              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>💬 WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${(lst as any).phone}`)} style={{ flex: 1, paddingVertical: 10, backgroundColor: '#10b981', borderRadius: 8, alignItems: 'center' }}>
                              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>📞 חייג · {(lst as any).phone}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </React.Fragment>
                );
              })}
            </View>

            {(activeTop === 'sale' || activeTop === 'rent' || activeTop === 'hotels') && (
              <View style={{ marginTop: 14 }}>
                <ListingsList type={activeTop as 'sale' | 'rent' | 'hotels'} reloadKey={listingsKey} />
                <BrokerBannerSmall />
              </View>
            )}
            {false && activeTop && (activeTop === 'sale' || activeTop === 'rent') && (
              <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 14 }}>
                {(LISTINGS_BY_TOP[activeTop as string] || []).filter((lst: any) => !!lst.image).map((lst: any) => (
                  <TouchableOpacity
                    key={`h-${lst.id}`}
                    activeOpacity={0.85}
                    onPress={() => lst.link && Linking.openURL(lst.link)}
                    style={s.hBanner}
                  >
                    <Image source={{ uri: resolveUri(lst.image) }} style={s.hBannerImg} />
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
            <Section title="חדשות נדל״ן" icon="">
              <NewsSliderArrows news={news} />
            </Section>

            <ArticlesAt loc="after_news" articles={articles} onOpen={setOpenArticle} />

            <RealEstateGallery />

            <ArticlesAt loc="after_gallery" articles={articles} onOpen={setOpenArticle} />

            {/* Section 2 — Market indices with switchable tabs */}
            <IndicesTabs />

            <ArticlesAt loc="after_indices" articles={articles} onOpen={setOpenArticle} />

            <ArticlesAt loc="after_tips" articles={articles} onOpen={setOpenArticle} />

            <BusinessServicesSlider variant="large" onPressService={handleService} />

            <ArticlesAt loc="after_business_services" articles={articles} onOpen={setOpenArticle} />

            {/* Section - Future real estate (between services and currency) */}
            <Section title="עתיד הנדל״ן" icon="">
              <FutureSlider projects={futureProjects} />
            </Section>

            <ArticlesAt loc="after_future" articles={articles} onOpen={setOpenArticle} />
            <ArticlesAt loc="before_currency" articles={articles} onOpen={setOpenArticle} />

            <BrokerBanner />

            <CurrencyTicker />
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <Modal visible={!!openArticle} transparent animationType="fade" onRequestClose={() => setOpenArticle(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '90%' }}>
            {openArticle?.showImage && openArticle?.image && (
              <View style={{ width: '100%', height: 200, position: 'relative' }}>
                <Image source={{ uri: resolveUri(openArticle.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            )}
            <TouchableOpacity onPress={() => setOpenArticle(null)} style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{openArticle?.title}</Text>
                {!!openArticle?.summary && <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }}>{openArticle.summary}</Text>}
                {!!openArticle?.article && <Text style={{ fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 14, lineHeight: 20 }}>{openArticle.article}</Text>}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={!!openServiceArticle} transparent animationType="fade" onRequestClose={() => setOpenServiceArticle(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '90%' }}>
            {openServiceArticle?.image && (
              <View style={{ width: '100%', height: 180, position: 'relative' }}>
                <Image source={{ uri: resolveUri(openServiceArticle.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setOpenServiceArticle(null)} style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView contentContainerStyle={{ padding: 18 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{openServiceArticle?.title}</Text>
              {openServiceArticle?.subtitle ? <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }}>{openServiceArticle.subtitle}</Text> : null}
              {openServiceArticle?.body ? (
                openServiceArticle.body.includes('<')
                  ? <View style={{ marginTop: 12 }}><HtmlContent html={openServiceArticle.body} /></View>
                  : <Text style={{ fontSize: 14, color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl', marginTop: 12, lineHeight: 22 }}>{openServiceArticle.body}</Text>
              ) : (
                <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'right', writingDirection: 'rtl', marginTop: 14 }}>תוכן יתווסף בקרוב</Text>
              )}
              {openServiceArticle?.url ? (
                <TouchableOpacity onPress={() => Linking.openURL(openServiceArticle.url)} style={{ marginTop: 16, backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>↗ למידע נוסף</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomTabBar />
      <ListingForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        defaultType={activeTop === 'sale' ? 'sale' : activeTop === 'hotels' ? 'hotels' : 'rent'}
        onSubmitted={() => setListingsKey(k => k + 1)}
      />
      <MyListingsModal visible={myListingsOpen} onClose={() => setMyListingsOpen(false)} />
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
                <Text style={s.choiceBtnSub}>{FEATURES.PAID_LISTING_OPTIONS ? 'מודעה בודדת · קטן חינם / גדול $10/חודש' : 'מודעה בודדת · חינם'}</Text>
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
                <Text style={s.choiceBtnSub}>{FEATURES.PAID_LISTING_OPTIONS ? 'מיני-פורטל · Basic $100 / Premium $180 לחודש' : 'מיני-פורטל · חינם'}</Text>
              </View>
              <Text style={s.choiceArrow}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function IndicesTabs() {
  const tabs = [
    { id: 'money', label: 'מדד הכסף', icon: '💰', bg: undefined as string | undefined },
    { id: 'realEstate', label: 'מדד הנדל״ן', icon: '🏠', bg: '#C8E6C9' },
    { id: 'tourism', label: 'מדד התיירים', icon: '🧳', bg: '#FFE0B2' },
  ];
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find(t => t.id === active)!;

  return (
    <View style={s.section}>
      <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 10, paddingHorizontal: 2 }}>
        {tabs.map(t => {
          const isActive = t.id === active;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActive(t.id)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 10,
                borderWidth: 1.5,
                alignItems: 'center',
                backgroundColor: isActive ? (t.bg || '#FFFFFF') : 'transparent',
                borderColor: isActive ? '#1A6B8A' : '#cbd5e1',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? '900' : '600',
                color: isActive ? '#1C2B35' : '#64748b',
                writingDirection: 'rtl',
                textAlign: 'center',
              }}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FinanceStats cardBg={current.bg} channel={active as any} />
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

const BROKER_FALLBACK_IMAGES = [
  '/uploads/1775910069485-6.jpg',
  '/uploads/1775910069516-30.jpg',
  '/uploads/1775910069548-933.jpg',
  '/uploads/1775910069562-341.jpg',
  '/uploads/1775910069573-698.jpg',
  '/uploads/1775910069590-365.jpg',
];

function BrokerBannerSmall() {
  const [brokers, setBrokers] = useState<any[]>(BROKER_FALLBACK_IMAGES.map((img, i) => ({ id: `b${i+1}`, name: 'דודי ספיר', title: 'מתווך נדל״ן מומלץ', phone: '+995-555-123-456', image: img })));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchContent().then(d => {
      if (Array.isArray(d?.brokers) && d.brokers.length > 0) {
        const visible = d.brokers.filter((b: any) => b.visible !== false);
        if (visible.length > 0) setBrokers(visible);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (brokers.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % brokers.length), 5000);
    return () => clearInterval(t);
  }, [brokers.length]);

  const broker = brokers[idx % brokers.length] || brokers[0];
  if (!broker) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 }}>סוכני נדל״ן מומלצים בבטומי</Text>
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/portal/brokers' as any)} style={{ flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: '#92400e', minHeight: 55 }}>
        <Image source={{ uri: resolveUri(broker.image) }} style={{ width: 55, height: 55 }} resizeMode="cover" />
        <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>{broker.name}</Text>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ fontSize: 10, color: '#475569' }} numberOfLines={1}>📞 {broker.phone}</Text>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {brokers.map((_, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: i === idx ? Colors.PRIMARY : '#cbd5e1' }} />)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function BrokerBanner() {
  const [brokers, setBrokers] = useState<any[]>(BROKER_FALLBACK_IMAGES.map((img, i) => ({ id: `b${i+1}`, name: 'דודי ספיר', title: 'מתווך נדל״ן מומלץ בבטומי', phone: '+995-555-123-456', image: img })));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchContent().then(d => {
      if (Array.isArray(d?.brokers) && d.brokers.length > 0) {
        const visible = d.brokers.filter((b: any) => b.visible !== false);
        if (visible.length > 0) setBrokers(visible);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (brokers.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % brokers.length), 5000);
    return () => clearInterval(t);
  }, [brokers.length]);

  const broker = brokers[idx % brokers.length] || brokers[0];
  if (!broker) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#888', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 }}>סוכני נדל״ן מומלצים בבטומי</Text>
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/portal/brokers' as any)} style={{ flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#92400e', minHeight: 110 }}>
        <Image source={{ uri: resolveUri(broker.image) }} style={{ width: 110, height: 'auto', minHeight: 110 }} resizeMode="cover" />
        <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>✓ {broker.title}</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 }} numberOfLines={1}>{broker.name}</Text>
            <Text style={{ fontSize: 11, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 }} numberOfLines={1}>📞 {broker.phone}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 10, color: '#64748b' }}>לכל המתווכים ›</Text>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {brokers.map((_, i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: i === idx ? Colors.PRIMARY : '#cbd5e1' }} />)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ExpandedGallery({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const next = () => setIdx((idx + 1) % images.length);
  const prev = () => setIdx((idx - 1 + images.length) % images.length);
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: '#000', position: 'relative' }}>
      <Image source={{ uri: resolveUri(images[idx]) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {images.length > 1 && (
        <>
          <TouchableOpacity onPress={prev} style={{ position: 'absolute', top: '50%', right: 8, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} style={{ position: 'absolute', top: '50%', left: 8, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            {images.map((_, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
          </View>
          <View style={{ position: 'absolute', top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>📷 {idx + 1}/{images.length}</Text>
          </View>
        </>
      )}
    </View>
  );
}

function ArticlesAt({ loc, articles, onOpen }: { loc: string; articles: any[]; onOpen: (a: any) => void }) {
  const items = articles.filter(a => a.location === loc && a.visible !== false);
  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 18, paddingHorizontal: 16 }}>
      {items.map(a => (
        <TouchableOpacity key={a.id} activeOpacity={0.85} onPress={() => onOpen(a)} style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
          {a.showImage && a.image && <Image source={{ uri: resolveUri(a.image) }} style={{ width: '100%', height: 140 }} resizeMode="cover" />}
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>💡 {a.title}</Text>
            {!!a.summary && <Text style={{ fontSize: 12, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 4, lineHeight: 18 }}>{a.summary}</Text>}
            {!!a.article && <Text style={{ fontSize: 11, color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 6, fontWeight: '700' }}>קרא עוד ›</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FutureCard({ p, width }: { p: Listing; width: number }) {
  const imgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
  const [imgIdx, setImgIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const next = () => setImgIdx((imgIdx + 1) % imgs.length);
  const prev = () => setImgIdx((imgIdx - 1 + imgs.length) % imgs.length);
  return (
    <>
      <TouchableOpacity activeOpacity={0.85} style={{ width, height: 260, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE, borderWidth: 1.5, borderColor: '#F4A94E' }} onPress={() => setOpen(true)}>
        <View style={{ width, height: 140, position: 'relative' }}>
          {imgs.length > 0 && <Image source={{ uri: resolveUri(imgs[imgIdx]) }} style={{ width, height: 140 }} />}
          {imgs.length > 1 && (
            <View style={{ position: 'absolute', bottom: 6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
              {imgs.map((_, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
            </View>
          )}
        </View>
        <View style={{ padding: 12, flex: 1, justifyContent: 'space-between', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>{p.title}</Text>
            <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 }} numberOfLines={1}>{p.price || ''}</Text>
            <Text style={{ fontSize: 11, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 }} numberOfLines={3}>{(p.features || []).join(' · ')}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '90%' }}>
            <View style={{ width: '100%', height: 240, backgroundColor: '#000', position: 'relative' }}>
              {imgs.length > 0 && <Image source={{ uri: resolveUri(imgs[imgIdx]) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
              {imgs.length > 1 && (
                <>
                  <TouchableOpacity onPress={prev} style={{ position: 'absolute', top: 100, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={next} style={{ position: 'absolute', top: 100, left: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 22 }}>‹</Text>
                  </TouchableOpacity>
                  <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                    {imgs.map((_, i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
                  </View>
                </>
              )}
              <TouchableOpacity onPress={() => setOpen(false)} style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{p.title}</Text>
                {!!p.price && <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }}>{p.price}</Text>}
                {(p.features || []).length > 0 && (
                  <View style={{ marginTop: 12, gap: 6 }}>
                    {(p.features || []).map((f, i) => (
                      <View key={i} style={{ flexDirection: 'row-reverse', gap: 6 }}>
                        <Text style={{ color: '#10b981', fontWeight: '900' }}>✓</Text>
                        <Text style={{ flex: 1, fontSize: 13, color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!p.article && <Text style={{ fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 14, lineHeight: 20 }}>{p.article}</Text>}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function FutureSlider({ projects }: { projects: Listing[] }) {
  const { width } = useWindowDimensions();
  const SLIDE_W = width - 32;
  const GAP = 12;
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
          <FutureCard key={p.id} p={p} width={SLIDE_W} />
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
  const { width } = useWindowDimensions();
  const SLIDE_W = width - 32;
  const GAP = 12;
  const sidePad = 16;
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const [openNews, setOpenNews] = useState<Article | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
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
          <TouchableOpacity key={n.id} activeOpacity={0.85} style={[s.newsCardLike, { width: SLIDE_W, height: 200, position: 'relative' }]} onPress={() => {
            const hasArticle = !!(n.body || n.longText || n.article);
            if (hasArticle) setOpenNews(n);
            else if (n.link) setWebViewUrl(n.link);
            else setOpenNews(n);
          }}>
            {n.image ? (
              <Image source={{ uri: resolveUri(n.image) }} style={{ width: SLIDE_W, height: 200 }} />
            ) : (
              <View style={{ width: SLIDE_W, height: 200, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 50 }}>🏙️</Text></View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 80, paddingBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4, lineHeight: 22 }} numberOfLines={2}>{n.title}</Text>
              {n.summary ? (
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.92)', textAlign: 'right', writingDirection: 'rtl', lineHeight: 16, marginBottom: 6 }} numberOfLines={2}>{n.summary}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#F4A94E' }}>‹ קרא עוד</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[s.arrowBtn, { right: 12, top: 32 }]} onPress={() => scrollTo(idx - 1)} disabled={idx === 0}>
        <Text style={[s.arrowTxt, idx === 0 && { opacity: 0.3 }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.arrowBtn, { left: 12, top: 32 }]} onPress={() => scrollTo(idx + 1)} disabled={idx === news.length - 1}>
        <Text style={[s.arrowTxt, idx === news.length - 1 && { opacity: 0.3 }]}>‹</Text>
      </TouchableOpacity>

      <Modal visible={!!openNews} transparent animationType="fade" onRequestClose={() => setOpenNews(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '90%' }}>
            {openNews?.image ? (
              <View style={{ width: '100%', height: 200, position: 'relative' }}>
                <Image source={{ uri: resolveUri(openNews.image) }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setOpenNews(null)} style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>{openNews?.title}</Text>
                  {openNews?.date ? <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 }}>{openNews.date}</Text> : null}
                </LinearGradient>
              </View>
            ) : (
              <View style={{ padding: 16, paddingTop: 40, position: 'relative' }}>
                <TouchableOpacity onPress={() => setOpenNews(null)} style={{ position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#475569', fontSize: 16, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{openNews?.title}</Text>
              </View>
            )}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {openNews?.summary ? <Text style={{ fontSize: 14, color: '#475569', textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, marginBottom: 12, fontWeight: '600' }}>{openNews.summary}</Text> : null}
              {(openNews?.body || openNews?.longText || openNews?.article) ? (
                ((openNews.body || openNews.longText || openNews.article || '').includes('<')
                  ? <HtmlContent html={openNews.body || openNews.longText || openNews.article || ''} />
                  : <Text style={{ fontSize: 14, color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 }}>{openNews.body || openNews.longText || openNews.article}</Text>
                )
              ) : null}
              {openNews?.link ? (
                <TouchableOpacity onPress={() => { const u = openNews.link; setOpenNews(null); setWebViewUrl(u || null); }} style={{ marginTop: 14, backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>↗ למקור המלא</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!webViewUrl} animationType="slide" onRequestClose={() => setWebViewUrl(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.PRIMARY, borderBottomWidth: 1, borderBottomColor: '#0e4256' }}>
            <TouchableOpacity onPress={() => setWebViewUrl(null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>✕ סגור</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', marginLeft: 12 }} numberOfLines={1}>{webViewUrl || ''}</Text>
          </View>
          {webViewUrl ? <WebView source={{ uri: webViewUrl }} style={{ flex: 1 }} /> : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  heroBackBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
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

  topRow: { flexDirection: 'row-reverse', gap: 6, paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center' },
  topBtnRect: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  topGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center' },
  topBtnGrid: { width: '32%', backgroundColor: Colors.WHITE, paddingHorizontal: 6, paddingVertical: 10, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  topBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  homeBtn: {},
  topBtnActive: { backgroundColor: '#fff', borderColor: Colors.PRIMARY },
  topBtnTxt: { fontSize: 12, fontWeight: '600', color: '#64748b', writingDirection: 'rtl', textAlign: 'center' },
  topBtnTxtActive: { color: '#1C2B35', fontWeight: '900' },

  layoutToggle: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  layoutBtn: { backgroundColor: Colors.WHITE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E5E5E5' },
  layoutBtnActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  layoutBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  layoutBtnTxtActive: { color: Colors.WHITE },

  listingsGrid: { paddingHorizontal: 12, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  fixedExpanded: { width: '100%', backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  fixedExpandedHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e293b' },
  fixedExpandedTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  fixedCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fixedCloseTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  listingCard: {
    width: '100%',
    backgroundColor: Colors.WHITE, borderRadius: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  listingCardHalf: { width: '49%' },
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
  listingImage: { width: '100%', height: 140 },
  listingBody: { padding: 10 },
  listingTitle: { fontSize: 14, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  listingFeature: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 4, marginTop: 2 },
  listingFeatureCheck: { fontSize: 11, fontWeight: '800', color: Colors.PRIMARY, lineHeight: 14 },
  listingFeatureTxt: { flex: 1, fontSize: 11, color: '#555', textAlign: 'right', writingDirection: 'rtl', lineHeight: 14 },
  listingPrice: { fontSize: 18, fontWeight: '900', color: '#10b981', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 },
  listingCta: { marginTop: 8, backgroundColor: '#25D366', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  listingCtaTxt: { fontSize: 12, fontWeight: '800', color: Colors.WHITE, writingDirection: 'rtl' },

  section: { marginTop: 18, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },

  newsCard: { backgroundColor: Colors.WHITE, borderRadius: 14, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  newsImg: { width: '100%', height: 140 },
  newsRow: { gap: 12 },
  newsSlide: { width: 260, backgroundColor: Colors.WHITE, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  newsSliderWrap: { position: 'relative' },
  newsCardLike: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' },
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
