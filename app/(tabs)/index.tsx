import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../../constants/theme';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import WelcomeSlider from '../../components/WelcomeSlider';
import InfoPortal from '../../components/InfoPortal';

type CatItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  bg: string;
};

// 1. קטגוריות ראשיות (6 קארדים, 2 בשורה)
const MAIN_CATEGORIES: CatItem[] = [
  { id: '1', title: 'אירוח ולינה', subtitle: 'מלונות, דירות ואכסניות', icon: '🏨', bg: Colors.SECONDARY + '30' },
  { id: '2', title: 'אתרים ואטרקציות', subtitle: 'גלה מקומות וחוויות', icon: '🎡', bg: Colors.ACCENT + '30' },
  { id: '3', title: 'סיורים קוליים', subtitle: 'מסלולים מודרכים', icon: '🎧', bg: Colors.PRIMARY + '30' },
  { id: '4', title: 'בילוי, פנאי וחיי לילה', subtitle: 'בידור והנאה', icon: '🎰', bg: Colors.PRIMARY },
  { id: '5', title: 'תחבורה', subtitle: 'מוניות ותחבורה ציבורית', icon: '🚕', bg: Colors.ACCENT + '25' },
  { id: '6', title: 'מסעדות ואוכל', subtitle: 'מטבח מקומי ואוכל משובח', icon: '🍽️', bg: Colors.SECONDARY + '25' },
];

// 2. קטגוריות נוספות (4 קארדים)
const EXTRA_CATEGORIES: CatItem[] = [
  { id: '7', title: 'קניות ומתנות', subtitle: 'שופינג ומזכרות', icon: '🛍️', bg: Colors.PRIMARY + '25' },
  { id: '8', title: 'ספורט ואיכות חיים', subtitle: 'כושר ופעילויות', icon: '🏋️', bg: Colors.SECONDARY + '25' },
  { id: '9', title: 'אקסטרים וסקי', subtitle: 'הרפתקאות ואתגרים', icon: '⛷️', bg: Colors.ACCENT + '30' },
  { id: '10', title: 'מדריכים ישראלים וסוכנים', subtitle: 'ליווי אישי בעברית', icon: '🇮🇱', bg: Colors.PRIMARY + '30' },
];

// 6. באנרים רוחביים
const BOTTOM_BANNERS = [
  { id: 'weather', title: 'מזג אוויר', icon: '🌤️', bg: Colors.PRIMARY },
  { id: 'currency', title: 'המרת מטבעות', icon: '💱', bg: Colors.SECONDARY },
  { id: 'news', title: 'חדשות בעברית', icon: '📰', bg: Colors.TEXT },
  { id: 'flights', title: 'לוח המראות ונחיתות', icon: '✈️', bg: Colors.ACCENT },
];

const DEV_MODES = [
  { key: 'mobile', label: '📱', w: 375 },
  { key: 'tablet', label: '📲', w: 768 },
  { key: 'desktop', label: '🖥️', w: 1024 },
] as const;

function isDark(bg: string) {
  return bg.startsWith('#2') || bg.startsWith('#1');
}

function CatCard({ item, width }: { item: CatItem; width: number }) {
  const dark = isDark(item.bg);
  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/category/${item.id}`)}
    >
      <View style={[styles.cardTop, { backgroundColor: item.bg }]}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const real = useWindowDimensions();
  const [devMode, setDevMode] = useState<string | null>('mobile');
  const [showExtra, setShowExtra] = useState(false);
  const isDev = __DEV__;
  const simW = devMode ? (DEV_MODES.find(m => m.key === devMode)?.w || real.width) : real.width;
  const w = Math.min(simW, real.width);
  const cardW = (w - 48) / 2;

  const { dark } = useContext(ThemeContext);

  return (
    <View style={[styles.safe, dark && { backgroundColor: Colors.TEXT }]}>
      <ScrollView
        style={[styles.scroll, devMode ? { maxWidth: simW, alignSelf: 'center' as const } : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dev Toolbar */}
        {isDev && (
          <View style={styles.devBar}>
            {DEV_MODES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.devBtn, devMode === m.key && styles.devBtnOn]}
                onPress={() => setDevMode(devMode === m.key ? null : m.key)}
              >
                <Text style={[styles.devTxt, devMode === m.key && { opacity: 1 }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.devW}>{Math.round(w)}px</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Batumi Online</Text>
          <Text style={styles.headerSub}>המדריך לתייר הישראלי בבטומי</Text>
        </View>

        {/* 1. קטגוריות ראשיות — 6 קארדים, 2 בשורה */}
        <View style={styles.section}>
          <View style={styles.grid}>
            {MAIN_CATEGORIES.map((cat) => (
              <CatCard key={cat.id} item={cat} width={cardW} />
            ))}
          </View>
        </View>

        {/* 2. קטגוריות נוספות — דרופדאון */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowExtra(!showExtra)}>
            <Text style={styles.dropdownTxt}>{showExtra ? '▲' : '▼'} קטגוריות נוספות</Text>
          </TouchableOpacity>
          {showExtra && (
            <View style={styles.grid}>
              {EXTRA_CATEGORIES.map((cat) => (
                <CatCard key={cat.id} item={cat} width={cardW} />
              ))}
            </View>
          )}
        </View>

        {/* 3. סליידר ברוכים הבאים */}
        <View style={styles.section}>
          <WelcomeSlider />
        </View>

        {/* 4. פורטל המידע */}
        <View style={styles.section}>
          <InfoPortal />
        </View>

        {/* 5. באנרים — פורטל הנדל"ן + פורטל העסקים */}
        <View style={styles.section}>
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.sideBanner, { width: cardW, backgroundColor: Colors.ACCENT }]} activeOpacity={0.7}>
              <Text style={styles.sideBannerIcon}>🏠</Text>
              <Text style={styles.sideBannerTitle}>פורטל הנדל״ן</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sideBanner, { width: cardW, backgroundColor: Colors.PRIMARY }]} activeOpacity={0.7}>
              <Text style={styles.sideBannerIcon}>💼</Text>
              <Text style={styles.sideBannerTitle}>פורטל העסקים</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. באנרים רוחביים */}
        <View style={styles.section}>
          {BOTTOM_BANNERS.map((b) => (
            <TouchableOpacity key={b.id} style={[styles.bottomBanner, { backgroundColor: b.bg }]} activeOpacity={0.7}>
              <Text style={styles.bottomBannerTitle}>{b.title}</Text>
              <Text style={styles.bottomBannerIcon}>{b.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  scroll: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: Colors.TEXT, textAlign: 'left' },
  headerSub: { fontSize: 14, color: Colors.TEXT, opacity: 0.5, textAlign: 'left', marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 18 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },

  // Category card — colored top + white bottom
  card: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTop: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 52 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 10, paddingHorizontal: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 11, color: Colors.TEXT, opacity: 0.5, marginTop: 2, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl' },

  // Dropdown
  dropdownBtn: {
    padding: 10, alignItems: 'flex-end', marginBottom: 10,
  },
  dropdownTxt: { fontSize: 14, fontWeight: '600', color: Colors.TEXT, opacity: 0.5, writingDirection: 'rtl' },

  // Side banners (5)
  sideBanner: {
    height: 100, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  sideBannerIcon: { fontSize: 32 },
  sideBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },

  // Bottom banners (6)
  bottomBanner: {
    height: 50, borderRadius: 12, marginBottom: 8,
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  bottomBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  bottomBannerIcon: { fontSize: 20 },

  // Dev toolbar
  devBar: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 6, paddingHorizontal: 12,
    marginHorizontal: 16, marginTop: 4, marginBottom: 4,
  },
  devBtn: { padding: 4 },
  devBtnOn: { opacity: 1 },
  devTxt: { fontSize: 20, opacity: 0.35 },
  devW: { fontSize: 10, color: Colors.TEXT, opacity: 0.4, marginEnd: 4 },
});
