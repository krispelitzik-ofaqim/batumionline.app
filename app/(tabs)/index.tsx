import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';
import { ThemeContext } from '../../constants/theme';
import { AdminContext } from '../../constants/adminContext';
import { PreviewContext } from '../../constants/previewContext';
import { router } from 'expo-router';
import { fetchContent, resolveUri } from '../../constants/api';
import { Colors } from '../../constants/colors';
import WelcomeSlider from '../../components/WelcomeSlider';
import HomeGallery from '../../components/HomeGallery';
import InfoPortal from '../../components/InfoPortal';
import { AdminFloatingButton, EditToolbar, EditableText, ReorderControls } from '../../components/AdminEditOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherModal from '../../components/WeatherModal';
import CurrencyModal from '../../components/CurrencyModal';
import NewsModal from '../../components/NewsModal';
import FlightsModal from '../../components/FlightsModal';
import PopupDisplay from '../../components/PopupDisplay';
import ClientBannerDisplay from '../../components/ClientBannerDisplay';
import CouponRedeemModal from '../../components/CouponRedeemModal';
import { openInAppBrowser, gygBatumi } from '../../constants/affiliates';

type CatItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  bg: string;
  bgDark: string;
};

// 1. קטגוריות ראשיות (6 קארדים, 2 בשורה)
const MAIN_CATEGORIES: CatItem[] = [
  { id: '1', title: 'אירוח ולינה', subtitle: 'מלונות, דירות ואכסניות', description: 'מצאו את מקום הלינה המושלם בבטומי — ממלונות יוקרה על חוף הים, דרך דירות Airbnb מרווחות, ועד אכסניות בתקציב נוח. כולל המלצות לפי אזורים, מחירים וביקורות אמיתיות.', icon: '🏨', bg: '#5BC0DE', bgDark: '#3DA5C4' },
  { id: '2', title: 'אתרים ואטרקציות', subtitle: 'גלה מקומות וחוויות', description: 'גלו את האתרים המרהיבים של בטומי — מהגנים הבוטניים ועד כיכר פיאצה, הטיילת לאורך הים, ומוזיאונים מרתקים. אטרקציות לכל המשפחה בכל עונה.', icon: '🎡', bg: '#F7BE68', bgDark: '#F4A94E' },
  { id: '3', title: 'סיורים קוליים', subtitle: 'מסלולים מודרכים', description: 'טיילו בבטומי עם מדריך אישי באוזן! סיורים קוליים בעברית לאורך מסלולים מרכזיים בעיר. היסטוריה, ארכיטקטורה, ותרבות — הכל בקצב שלכם.', icon: '🎧', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  { id: '4', title: 'בילוי, פנאי וחיי לילה', subtitle: 'בידור והנאה', description: 'חיי הלילה של בטומי תוססים ומגוונים. ברים על חוף הים, מועדוני לילה, קזינו, הופעות חיות ועוד. המדריך המלא לבילוי בכל שעה.', icon: '🍻', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  { id: '5', title: 'תחבורה', subtitle: 'מוניות ותחבורה ציבורית', description: 'כל מה שצריך לדעת על תחבורה בבטומי — מוניות, אוטובוסים, השכרת רכב, ואפליקציות מומלצות. טיפים לחיסכון ומסלולי נסיעה מומלצים.', icon: '🚕', bg: '#F7BE68', bgDark: '#F4A94E' },
  { id: '6', title: 'מסעדות ואוכל', subtitle: 'מטבח מקומי ואוכל משובח', description: 'המטבח הגאורגי הוא חוויה בפני עצמה. חצ׳פורי, חינקלי, שש״ק ויין מעולה. המלצות למסעדות הטובות ביותר בבטומי, כולל מחירים ותפריטים.', icon: '🍽️', bg: '#5BC0DE', bgDark: '#3DA5C4' },
];

// 2. קטגוריות נוספות (4 קארדים)
const EXTRA_CATEGORIES: CatItem[] = [
  { id: '7', title: 'קניות ומתנות', subtitle: 'שופינג ומזכרות', description: 'מרכזי קניות, שווקים מקומיים, חנויות מזכרות ומתנות מיוחדות מגאורגיה. איפה קונים, מה שווה, וטיפים למיקוח.', icon: '🛍️', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  { id: '8', title: 'ספורט ואיכות חיים', subtitle: 'כושר ופעילויות', description: 'חדרי כושר, בריכות שחייה, יוגה על החוף, רכיבה על אופניים וספורט ימי. שמרו על אורח חיים פעיל גם בחופשה.', icon: '🏋️', bg: '#5BC0DE', bgDark: '#3DA5C4' },
  { id: '9', title: 'אקסטרים וסקי', subtitle: 'הרפתקאות ואתגרים', description: 'פעילויות אתגריות ואקסטרים — גלישת סקי בגודאורי, רפטינג, ג׳יפים בהרים, פרגליידינג ועוד הרפתקאות שלא תשכחו.', icon: '⛷️', bg: '#F7BE68', bgDark: '#F4A94E' },
  { id: '10', title: 'מדריכים ישראלים וסוכנים', subtitle: 'ליווי אישי בעברית', description: 'מדריכים ישראלים מקומיים שמכירים כל פינה בבטומי. סוכני נסיעות, ליווי אישי, סיורים פרטיים והמלצות מקומיות בעברית.', icon: '🇮🇱', bg: '#2E8BA8', bgDark: '#1A6B8A' },
];

// 6. באנרים רוחביים
const BOTTOM_BANNERS = [
  { id: 'weather', title: 'מזג אוויר', icon: '🌤️', bg: Colors.PRIMARY },
  { id: 'currency', title: 'המרת מטבעות', icon: '💰', bg: Colors.SECONDARY },
  { id: 'news', title: 'חדשות בעברית', icon: '🗞️', bg: '#7ECFC0' },
  { id: 'flights', title: 'לוח המראות ונחיתות', icon: '✈️', bg: '#2D4A5E' },
  { id: 'coupon', title: 'מימוש קוד קופון', icon: '🎟️', bg: '#16a34a' },
  { id: 'gyg', title: 'סיורים ופעילויות בבטומי', icon: '🎫', bg: '#FF5A5F' },
];

const DEV_PALETTE = [
  '#1C2B35', '#2D4A5E', '#1A6B8A', '#3DA5C4', '#7ECFC0', '#5BC0DE',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#F4A94E',
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8',
  '#cbd5e1', '#e2e8f0', '#f1f5f9', '#ffffff', '#fef3c7', '#fed7aa',
  '#fecaca', '#fbcfe8', '#e9d5ff', '#c7d2fe', '#bfdbfe', '#a5f3fc',
  '#bbf7d0', '#d9f99d', '#fef08a', '#fde68a', '#fdba74', '#fca5a5',
];

function DevColorPalette() {
  const [copied, setCopied] = useState('');
  const copy = (c: string) => {
    if (Platform.OS === 'web') {
      try { (navigator as any).clipboard.writeText(c); } catch {}
    }
    setCopied(c);
    setTimeout(() => setCopied(''), 1500);
  };
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 2, padding: 4, backgroundColor: '#1C2B35', borderRadius: 6 }}>
        {DEV_PALETTE.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => copy(c)}
            style={{ width: 16, height: 16, backgroundColor: c, borderRadius: 2, borderWidth: copied === c ? 2 : 0, borderColor: '#fff' }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 10, color: copied ? '#10b981' : '#94a3b8', textAlign: 'center', marginTop: 2, writingDirection: 'rtl' }}>
        {copied ? `✓ ${copied} הועתק` : '🎨 לחץ צבע להעתיק קוד'}
      </Text>
    </View>
  );
}

function isDark(bg: string) {
  return bg.startsWith('#2') || bg.startsWith('#1');
}

function CatCard({ item, width }: { item: CatItem; width: number }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http') || item.icon.startsWith('/'));
  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/category/${item.id}`)}
    >
      {iconIsImage ? (
        <Image source={{ uri: resolveUri(item.icon) }} style={styles.cardTop} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[item.bg, item.bgDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardTop}
        >
          <Text style={styles.cardIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { width: screenW } = useWindowDimensions();
  const [showExtra, setShowExtra] = useState(false);
  const [extraGroupVisible, setExtraGroupVisible] = useState(true);
  const [sideGroupVisible, setSideGroupVisible] = useState(true);
  const [welcomeGroupVisible, setWelcomeGroupVisible] = useState(true);
  const [infoGroupVisible, setInfoGroupVisible] = useState(true);
  const [bottomGroupVisible, setBottomGroupVisible] = useState(true);
  const [mainGroupVisible, setMainGroupVisible] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editHeaderTitle, setEditHeaderTitle] = useState('Batumi Online');
  const [editHeaderSub, setEditHeaderSub] = useState('המדריך לתייר הישראלי בבטומי');
  const [editMainCats, setEditMainCats] = useState(MAIN_CATEGORIES);
  const [editExtraCats, setEditExtraCats] = useState(EXTRA_CATEGORIES);
  const [editBottomBanners, setEditBottomBanners] = useState(BOTTOM_BANNERS);
  const [realEstateImg, setRealEstateImg] = useState('');
  const [reBannerKicker, setReBannerKicker] = useState('BATUMI');
  const [reBannerTitle, setReBannerTitle] = useState('פורטל הנדל״ן והעסקים');
  const [reBannerSub, setReBannerSub] = useState('כל העסקים והנכסים של בטומי במקום אחד');
  const { simulatedWidth } = useContext(PreviewContext);
  const w = simulatedWidth ? Math.min(simulatedWidth, screenW) : screenW;
  const cardW = (w - 48) / 2;

  const { dark } = useContext(ThemeContext);
  const { isAdmin } = useContext(AdminContext);

  // Fetch content from API on mount
  useEffect(() => {
    fetchContent()
      .then(data => {
        if (data.texts) {
          setEditHeaderTitle(data.texts.headerTitle || 'Batumi Online');
          setEditHeaderSub(data.texts.headerSub || 'המדריך לתייר הישראלי בבטומי');
        }
        if (data.mainCategories) setEditMainCats(data.mainCategories);
        if (data.extraCategories) setEditExtraCats(data.extraCategories);
        if (typeof data.extraGroupVisible === 'boolean') setExtraGroupVisible(data.extraGroupVisible);
        if (data.groupVisibility && typeof data.groupVisibility === 'object') {
          if (typeof data.groupVisibility.side === 'boolean') setSideGroupVisible(data.groupVisibility.side);
          if (typeof data.groupVisibility.welcome === 'boolean') setWelcomeGroupVisible(data.groupVisibility.welcome);
          if (typeof data.groupVisibility.info === 'boolean') setInfoGroupVisible(data.groupVisibility.info);
          if (typeof data.groupVisibility.bottom === 'boolean') setBottomGroupVisible(data.groupVisibility.bottom);
          if (typeof data.groupVisibility.main === 'boolean') setMainGroupVisible(data.groupVisibility.main);
        }
        if (data.bottomBanners) setEditBottomBanners(data.bottomBanners);
        const side = data.sideBanners || [];
        const re = side.find((b: any) => b.id === 'realestate');
        const img = re?.image || (re?.icon?.startsWith('http') || re?.icon?.startsWith('/') ? re.icon : '');
        if (img) setRealEstateImg(resolveUri(img));
        if (re?.kicker !== undefined) setReBannerKicker(re.kicker || '');
        if (re?.bannerTitle !== undefined) setReBannerTitle(re.bannerTitle || '');
        if (re?.bannerSub !== undefined) setReBannerSub(re.bannerSub || '');
      })
      .catch(() => {
        // Fallback to hardcoded data — already set as defaults
      });
  }, []);

  const handleSaveEdit = () => {
    setEditMode(false);
  };

  const handleExitEdit = () => {
    setEditHeaderTitle('Batumi Online');
    setEditHeaderSub('המדריך לתייר הישראלי בבטומי');
    setEditMainCats(MAIN_CATEGORIES);
    setEditExtraCats(EXTRA_CATEGORIES);
    setEditBottomBanners(BOTTOM_BANNERS);
    setEditMode(false);
  };

  const moveMainCat = (idx: number, dir: -1 | 1) => {
    const items = [...editMainCats];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    setEditMainCats(items);
  };

  const moveBottomBanner = (idx: number, dir: -1 | 1) => {
    const items = [...editBottomBanners];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    setEditBottomBanners(items);
  };

  return (
    <View style={[styles.safe, dark && { backgroundColor: Colors.TEXT }]}>
      {editMode && <EditToolbar onSave={handleSaveEdit} onExit={handleExitEdit} />}
      <PopupDisplay page="home" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <EditableText value={editHeaderTitle} onChangeText={setEditHeaderTitle} editMode={editMode} textStyle={styles.headerTitle} />
          <EditableText value={editHeaderSub} onChangeText={setEditHeaderSub} editMode={editMode} textStyle={styles.headerSub} />
        </View>

        <HomeGallery />

        <ClientBannerDisplay page="home" position="top" />

        {/* 1. קטגוריות ראשיות — 6 קארדים, 2 בשורה */}
        {mainGroupVisible && (
          <View style={styles.section}>
            <View style={styles.grid}>
              {editMainCats.filter((c: any) => c.visible !== false).map((cat, idx) => (
                <View key={cat.id} style={{ position: 'relative' }}>
                  {editMode && <ReorderControls index={idx} total={editMainCats.length} onMove={(dir) => moveMainCat(idx, dir)} />}
                  <CatCard item={cat} width={cardW} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 2. קטגוריות נוספות — דרופדאון */}
        {extraGroupVisible && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowExtra(!showExtra)}>
              <Text style={styles.dropdownTxt}>{showExtra ? '▲' : '▼'} קטגוריות נוספות</Text>
            </TouchableOpacity>
            {showExtra && (
              <View style={styles.grid}>
                {editExtraCats.filter((c: any) => c.visible !== false).map((cat) => (
                  <CatCard key={cat.id} item={cat} width={cardW} />
                ))}
              </View>
            )}
          </View>
        )}

        <ClientBannerDisplay page="home" position="middle" />

        {/* 3. סליידר ברוכים הבאים */}
        {welcomeGroupVisible && (
          <View style={styles.section}>
            <WelcomeSlider />
          </View>
        )}

        {/* 4. פורטל המידע */}
        {infoGroupVisible && (
          <View style={styles.section}>
            <InfoPortal />
          </View>
        )}

        {/* 5. באנר — פורטל הנדל"ן והעסקים */}
        {sideGroupVisible && (
          <View style={styles.section}>
            <TouchableOpacity activeOpacity={0.85} style={styles.megaBannerWrap} onPress={() => router.push('/portal/realestate')}>
              <ImageBackground
                source={{ uri: realEstateImg || resolveUri('/uploads/city.jpg') }}
                style={styles.megaBanner}
                imageStyle={{ borderRadius: 18 }}
              >
                <LinearGradient
                  colors={['rgba(26,107,138,0.25)', 'rgba(10,30,50,0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.megaBannerOverlay}
                >
                  {!!reBannerKicker && <Text style={styles.megaBannerKicker}>{reBannerKicker}</Text>}
                  {!!reBannerTitle && <Text style={styles.megaBannerTitle}>{reBannerTitle}</Text>}
                  {!!reBannerSub && <Text style={styles.megaBannerSub}>{reBannerSub}</Text>}
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. באנרים רוחביים */}
        {bottomGroupVisible && (
          <View style={styles.section}>
            <Text style={styles.bottomSectionTitle}>מידע On Line</Text>
            {editBottomBanners.filter((b: any) => b.visible !== false).map((b, idx) => (
              <View key={b.id} style={{ position: 'relative' }}>
                {editMode && <ReorderControls index={idx} total={editBottomBanners.length} onMove={(dir) => moveBottomBanner(idx, dir)} />}
                <TouchableOpacity style={[styles.bottomBanner, { backgroundColor: b.bg }]} activeOpacity={0.7} onPress={() => { if (b.id === 'gyg') openInAppBrowser(gygBatumi()); else setActiveModal(b.id); }}>
                  <Text style={styles.bottomBannerTitle} numberOfLines={1}>{b.title}</Text>
                  <Text style={styles.bottomBannerIcon}>{b.icon}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <ClientBannerDisplay page="home" position="bottom" />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Admin floating button */}
      {!editMode && <AdminFloatingButton onEnterEdit={() => setEditMode(true)} />}

      {/* Bottom banner modals */}
      <WeatherModal visible={activeModal === 'weather'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'weather')!.bg} />
      <CurrencyModal visible={activeModal === 'currency'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'currency')!.bg} />
      <NewsModal visible={activeModal === 'news'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'news')!.bg} />
      <FlightsModal visible={activeModal === 'flights'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'flights')!.bg} />
      <CouponRedeemModal visible={activeModal === 'coupon'} onClose={() => setActiveModal(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  scroll: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.TEXT, textAlign: 'left' },
  headerSub: { fontSize: 14, fontWeight: 'normal', color: '#999999', textAlign: 'left', marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 18 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },

  // Category card — colored top + white bottom
  card: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTop: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 68 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 6, paddingHorizontal: 10, minHeight: 56 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 12, fontWeight: 'normal', color: '#999999', marginTop: 2, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },
  cardDesc: { fontSize: 11, color: '#777', marginTop: 4, lineHeight: 15, textAlign: 'right', writingDirection: 'rtl' },

  // Dropdown
  dropdownBtn: {
    padding: 10, alignItems: 'flex-end', marginBottom: 10,
  },
  dropdownTxt: { fontSize: 16, fontWeight: 'normal', color: '#999999', writingDirection: 'rtl' },

  // Mega banner
  megaBannerWrap: { width: '100%', height: 180, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
  megaBanner: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  megaBannerOverlay: { flex: 1, borderRadius: 18, justifyContent: 'flex-end', padding: 16 },
  megaBannerKicker: { fontSize: 11, fontWeight: '700', color: Colors.WHITE, opacity: 0.85, letterSpacing: 2, textAlign: 'right', writingDirection: 'rtl' },
  megaBannerTitle: { fontSize: 20, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl', marginTop: 2, lineHeight: 24 },
  megaBannerSub: { fontSize: 12, fontWeight: '500', color: Colors.WHITE, opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },

  // Bottom banners (6)
  bottomBanner: {
    height: 50, borderRadius: 12, marginBottom: 8,
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  bottomBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl', flex: 1 },
  bottomBannerIcon: { fontSize: 28, marginLeft: 8 },
  bottomSectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },

});
