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
} from 'react-native';
import { ThemeContext } from '../../constants/theme';
import { AdminContext } from '../../constants/adminContext';
import { PreviewContext } from '../../constants/previewContext';
import { router } from 'expo-router';
import { fetchContent } from '../../constants/api';
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
];

function isDark(bg: string) {
  return bg.startsWith('#2') || bg.startsWith('#1');
}

function CatCard({ item, width }: { item: CatItem; width: number }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/category/${item.id}`)}
    >
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={styles.cardTop} resizeMode="cover" />
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
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { width: screenW } = useWindowDimensions();
  const [showExtra, setShowExtra] = useState(false);
  const [extraGroupVisible, setExtraGroupVisible] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editHeaderTitle, setEditHeaderTitle] = useState('Batumi Online');
  const [editHeaderSub, setEditHeaderSub] = useState('המדריך לתייר הישראלי בבטומי');
  const [editMainCats, setEditMainCats] = useState(MAIN_CATEGORIES);
  const [editExtraCats, setEditExtraCats] = useState(EXTRA_CATEGORIES);
  const [editBottomBanners, setEditBottomBanners] = useState(BOTTOM_BANNERS);
  const [realEstateImg, setRealEstateImg] = useState('');
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
        if (data.bottomBanners) setEditBottomBanners(data.bottomBanners);
        const side = data.sideBanners || [];
        const re = side.find((b: any) => b.id === 'realestate');
        if (re?.icon?.startsWith('http')) setRealEstateImg(re.icon);
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

        {/* 1. קטגוריות ראשיות — 6 קארדים, 2 בשורה */}
        <View style={styles.section}>
          <View style={styles.grid}>
            {editMainCats.map((cat, idx) => (
              <View key={cat.id} style={{ position: 'relative' }}>
                {editMode && <ReorderControls index={idx} total={editMainCats.length} onMove={(dir) => moveMainCat(idx, dir)} />}
                <CatCard item={cat} width={cardW} />
              </View>
            ))}
          </View>
        </View>

        {/* 2. קטגוריות נוספות — דרופדאון */}
        {extraGroupVisible && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowExtra(!showExtra)}>
              <Text style={styles.dropdownTxt}>{showExtra ? '▲' : '▼'} קטגוריות נוספות</Text>
            </TouchableOpacity>
            {showExtra && (
              <View style={styles.grid}>
                {editExtraCats.map((cat) => (
                  <CatCard key={cat.id} item={cat} width={cardW} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* 3. סליידר ברוכים הבאים */}
        <View style={styles.section}>
          <WelcomeSlider />
        </View>

        {/* 4. פורטל המידע */}
        <View style={styles.section}>
          <InfoPortal />
        </View>

        {/* 5. באנר — פורטל הנדל"ן והעסקים */}
        <View style={styles.section}>
          <TouchableOpacity activeOpacity={0.85} style={styles.megaBannerWrap} onPress={() => router.push('/portal/realestate')}>
            <ImageBackground
              source={{ uri: realEstateImg || 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80' }}
              style={styles.megaBanner}
              imageStyle={{ borderRadius: 18 }}
            >
              <LinearGradient
                colors={['rgba(26,107,138,0.25)', 'rgba(10,30,50,0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.megaBannerOverlay}
              >
                <Text style={styles.megaBannerKicker}>BATUMI</Text>
                <Text style={styles.megaBannerTitle}>פורטל הנדל״ן והעסקים</Text>
                <Text style={styles.megaBannerSub}>כל העסקים והנכסים של בטומי במקום אחד</Text>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* 6. באנרים רוחביים */}
        <View style={styles.section}>
          <Text style={styles.bottomSectionTitle}>מידע On Line</Text>
          {editBottomBanners.map((b, idx) => (
            <View key={b.id} style={{ position: 'relative' }}>
              {editMode && <ReorderControls index={idx} total={editBottomBanners.length} onMove={(dir) => moveBottomBanner(idx, dir)} />}
              <TouchableOpacity style={[styles.bottomBanner, { backgroundColor: b.bg }]} activeOpacity={0.7} onPress={() => setActiveModal(b.id)}>
                <Text style={styles.bottomBannerTitle}>{b.title}</Text>
                <Text style={styles.bottomBannerIcon}>{b.icon}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Admin floating button */}
      {!editMode && <AdminFloatingButton onEnterEdit={() => setEditMode(true)} />}

      {/* Bottom banner modals */}
      <WeatherModal visible={activeModal === 'weather'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'weather')!.bg} />
      <CurrencyModal visible={activeModal === 'currency'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'currency')!.bg} />
      <NewsModal visible={activeModal === 'news'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'news')!.bg} />
      <FlightsModal visible={activeModal === 'flights'} onClose={() => setActiveModal(null)} bgColor={BOTTOM_BANNERS.find(b => b.id === 'flights')!.bg} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  scroll: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: Colors.TEXT, textAlign: 'left' },
  headerSub: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'left', marginTop: 2 },

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
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 10, paddingHorizontal: 12 },
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
  bottomBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  bottomBannerIcon: { fontSize: 32 },
  bottomSectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },

});
