import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal,
  useWindowDimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { fetchContent, updateAllContent, updateSection, API_BASE } from '../../constants/api';

// ─── Types ─────────────────────────────────────────────────────
type DataItem = {
  id: string; title: string; subtitle?: string; icon: string; bg: string;
  image?: string; audio?: string; lat?: string; lng?: string; address?: string;
  summary?: string; longText?: string;
};

type Section = {
  key: string; label: string; icon: string; storageKey: string;
  hasSubtitle: boolean; hasImage: boolean; hasAudio: boolean; hasLocation: boolean;
  hasSummary: boolean; hasLongText: boolean;
  defaults: DataItem[];
};

// ─── Default Data ──────────────────────────────────────────────
const DEFAULT_MAIN_CATEGORIES: DataItem[] = [
  { id: '1', title: 'אירוח ולינה', subtitle: 'מלונות, דירות ואכסניות', icon: '🏨', bg: '#3DA5C430' },
  { id: '2', title: 'אתרים ואטרקציות', subtitle: 'גלה מקומות וחוויות', icon: '🎡', bg: '#F4A94E30' },
  { id: '3', title: 'סיורים קוליים', subtitle: 'מסלולים מודרכים', icon: '🎧', bg: '#1A6B8A30' },
  { id: '4', title: 'בילוי, פנאי וחיי לילה', subtitle: 'בידור והנאה', icon: '🎰', bg: '#1A6B8A' },
  { id: '5', title: 'תחבורה', subtitle: 'מוניות ותחבורה ציבורית', icon: '🚕', bg: '#F4A94E25' },
  { id: '6', title: 'מסעדות ואוכל', subtitle: 'מטבח מקומי ואוכל משובח', icon: '🍽️', bg: '#3DA5C425' },
];

const DEFAULT_EXTRA_CATEGORIES: DataItem[] = [
  { id: '7', title: 'קניות ומתנות', subtitle: 'שופינג ומזכרות', icon: '🛍️', bg: '#1A6B8A25' },
  { id: '8', title: 'ספורט ואיכות חיים', subtitle: 'כושר ופעילויות', icon: '🏋️', bg: '#3DA5C425' },
  { id: '9', title: 'אקסטרים וסקי', subtitle: 'הרפתקאות ואתגרים', icon: '⛷️', bg: '#F4A94E30' },
  { id: '10', title: 'מדריכים ישראלים וסוכנים', subtitle: 'ליווי אישי בעברית', icon: '🇮🇱', bg: '#1A6B8A30' },
];

const DEFAULT_WELCOME: DataItem[] = [
  { id: '1', title: 'ברוכים הבאים', subtitle: 'מדריך מקיף לבטומי', icon: '👋', bg: '#1A6B8A' },
  { id: '2', title: 'נחיתה רכה', subtitle: 'מה צריך לדעת', icon: '✈️', bg: '#3DA5C4' },
  { id: '3', title: 'היסטוריה כללית', subtitle: 'סיפור העיר', icon: '🏛️', bg: '#1C2B35' },
  { id: '4', title: 'היסטוריה יהודית', subtitle: 'קהילה ומורשת', icon: '✡️', bg: '#F4A94E' },
  { id: '5', title: 'חוזרים הביתה', subtitle: 'טיפים ליום האחרון', icon: '🏠', bg: '#1A6B8A' },
];

const DEFAULT_INFO_PORTAL: DataItem[] = [
  { id: 'health', title: 'בריאות', subtitle: 'מידע רפואי חשוב', icon: '🏥', bg: '#3DA5C425', image: '' },
  { id: 'insurance', title: 'ביטוחים', subtitle: 'ביטוח נסיעות ובריאות', icon: '🛡️', bg: '#F4A94E25', image: '' },
  { id: 'telecom', title: 'תקשורת וסלולר', subtitle: 'סים מקומי וחבילות', icon: '📱', bg: '#1A6B8A25', image: '' },
  { id: 'tips', title: 'טיפים', subtitle: 'עצות מנוסים', icon: '💡', bg: '#F4A94E30', image: '' },
  { id: 'tax', title: 'החזרי מס', subtitle: 'VAT ומכס', icon: '💰', bg: '#3DA5C430', image: '' },
];

const DEFAULT_BOTTOM_BANNERS: DataItem[] = [
  { id: 'weather', title: 'מזג אוויר', icon: '🌤️', bg: '#1A6B8A' },
  { id: 'currency', title: 'המרת מטבעות', icon: '💱', bg: '#3DA5C4' },
  { id: 'news', title: 'חדשות בעברית', icon: '📰', bg: '#7ECFC0' },
  { id: 'flights', title: 'לוח המראות ונחיתות', icon: '✈️', bg: '#F4A94E' },
];

const DEFAULT_SIDE_BANNERS: DataItem[] = [
  { id: 'realestate', title: 'פורטל הנדל״ן', icon: '🏠', bg: '#F4A94E' },
  { id: 'business', title: 'פורטל העסקים', icon: '💼', bg: '#1A6B8A' },
];

const DEFAULT_LOCATIONS: DataItem[] = [
  { id: 'loc1', title: 'כיכר פיאצה', subtitle: 'הכיכר המרכזית של בטומי', icon: '📍', bg: '#1A6B8A', lat: '41.6488', lng: '41.6436', address: 'Piazza Square, Batumi' },
  { id: 'loc2', title: 'בולבר בטומי', subtitle: 'טיילת החוף', icon: '📍', bg: '#3DA5C4', lat: '41.6453', lng: '41.6378', address: 'Batumi Boulevard' },
];

const DEFAULT_AUDIO: DataItem[] = [
  { id: 'audio1', title: 'סיור בעיר העתיקה', subtitle: 'סיור קולי מודרך', icon: '🎧', bg: '#1A6B8A', audio: '' },
  { id: 'audio2', title: 'היסטוריה יהודית', subtitle: 'סיפור הקהילה', icon: '🎧', bg: '#F4A94E', audio: '' },
];

const DEFAULT_TEXTS = {
  headerTitle: 'Batumi Online',
  headerSub: 'המדריך לתייר הישראלי בבטומי',
  welcomeTitle: 'ברוכים הבאים',
  infoTitle: 'פורטל המידע',
  bottomTitle: 'מידע On Line',
  dropdownTitle: 'קטגוריות נוספות',
};

const SECTIONS: Section[] = [
  { key: 'main', label: 'קטגוריות ראשיות', icon: '📂', storageKey: '@admin_main_categories', hasSubtitle: true, hasImage: true, hasAudio: false, hasLocation: false, hasSummary: true, hasLongText: true, defaults: DEFAULT_MAIN_CATEGORIES },
  { key: 'extra', label: 'קטגוריות נוספות', icon: '📁', storageKey: '@admin_extra_categories', hasSubtitle: true, hasImage: true, hasAudio: false, hasLocation: false, hasSummary: true, hasLongText: true, defaults: DEFAULT_EXTRA_CATEGORIES },
  { key: 'welcome', label: 'סליידר ברוכים הבאים', icon: '👋', storageKey: '@admin_welcome', hasSubtitle: true, hasImage: true, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_WELCOME },
  { key: 'info', label: 'פורטל המידע', icon: '📋', storageKey: '@admin_info_portal', hasSubtitle: true, hasImage: true, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_INFO_PORTAL },
  { key: 'bottom', label: 'באנרים תחתונים', icon: '🏷️', storageKey: '@admin_bottom_banners', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_BOTTOM_BANNERS },
  { key: 'side', label: 'באנרים צדדיים', icon: '📌', storageKey: '@admin_side_banners', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_SIDE_BANNERS },
  { key: 'locations', label: 'מיקומים ומפה', icon: '📍', storageKey: '@admin_locations', hasSubtitle: true, hasImage: false, hasAudio: false, hasLocation: true, hasSummary: false, hasLongText: false, defaults: DEFAULT_LOCATIONS },
  { key: 'audio', label: 'קבצי אודיו', icon: '🎧', storageKey: '@admin_audio', hasSubtitle: true, hasImage: false, hasAudio: true, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_AUDIO },
];

const NAV_ITEMS = [
  { key: 'texts', label: 'טקסטים וכותרות', icon: '✏️' },
  ...SECTIONS.map(s => ({ key: s.key, label: s.label, icon: s.icon })),
];

// ─── Edit Modal ────────────────────────────────────────────────
function EditModal({
  visible, item, section, onSave, onDelete, onClose, isWide,
}: {
  visible: boolean; item: DataItem | null; section: Section | null;
  onSave: (item: DataItem) => void; onDelete: () => void; onClose: () => void;
  isWide: boolean;
}) {
  const [form, setForm] = useState<DataItem>({ id: '', title: '', icon: '', bg: '' });

  useEffect(() => {
    if (item) setForm({ ...item });
  }, [item]);

  if (!item || !section) return null;

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <ScrollView contentContainerStyle={ms.scrollWrap} showsVerticalScrollIndicator={false}>
          <View style={[ms.modal, isWide && { maxWidth: 520 }]}>
            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>עריכת פריט</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={ms.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>כותרת</Text>
              <TextInput style={ms.input} value={form.title} onChangeText={v => set('title', v)} textAlign="right" />
            </View>

            {section.hasSubtitle && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>כותרת משנה</Text>
                <TextInput style={ms.input} value={form.subtitle || ''} onChangeText={v => set('subtitle', v)} textAlign="right" />
              </View>
            )}

            {section.hasSummary && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>תקציר קצר</Text>
                <TextInput style={[ms.input, ms.textArea]} value={form.summary || ''} onChangeText={v => set('summary', v)} textAlign="right" multiline numberOfLines={3} placeholder="תקציר קצר שיופיע בכרטיס הקטגוריה..." placeholderTextColor="#bbb" />
              </View>
            )}

            {section.hasLongText && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>טקסט מפורט</Text>
                <TextInput style={[ms.input, ms.textAreaLong]} value={form.longText || ''} onChangeText={v => set('longText', v)} textAlign="right" multiline numberOfLines={8} placeholder="תוכן מלא שיופיע בדף הקטגוריה..." placeholderTextColor="#bbb" />
              </View>
            )}

            <View style={[ms.fieldRow, isWide && { flexDirection: 'row-reverse', gap: 12 }]}>
              <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                <Text style={ms.label}>אייקון (אימוג׳י)</Text>
                <TextInput style={ms.input} value={form.icon} onChangeText={v => set('icon', v)} textAlign="center" />
              </View>
              <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                <Text style={ms.label}>צבע רקע</Text>
                <View style={ms.colorRow}>
                  <TextInput style={[ms.input, { flex: 1 }]} value={form.bg} onChangeText={v => set('bg', v)} textAlign="left" />
                  <View style={[ms.colorPreview, { backgroundColor: form.bg }]} />
                </View>
              </View>
            </View>

            {section.hasImage && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>כתובת תמונה (URL / נתיב)</Text>
                <TextInput style={ms.input} value={form.image || ''} onChangeText={v => set('image', v)} textAlign="left" placeholder="https://... או assets/images/..." placeholderTextColor="#bbb" />
              </View>
            )}

            {section.hasAudio && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>קובץ אודיו (URL / נתיב MP3)</Text>
                <TextInput style={ms.input} value={form.audio || ''} onChangeText={v => set('audio', v)} textAlign="left" placeholder="https://... או assets/audio/..." placeholderTextColor="#bbb" />
              </View>
            )}

            {section.hasLocation && (
              <>
                <View style={[ms.fieldRow, isWide && { flexDirection: 'row-reverse', gap: 12 }]}>
                  <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                    <Text style={ms.label}>קו רוחב (Lat)</Text>
                    <TextInput style={ms.input} value={form.lat || ''} onChangeText={v => set('lat', v)} textAlign="left" keyboardType="numeric" placeholder="41.6488" placeholderTextColor="#bbb" />
                  </View>
                  <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                    <Text style={ms.label}>קו אורך (Lng)</Text>
                    <TextInput style={ms.input} value={form.lng || ''} onChangeText={v => set('lng', v)} textAlign="left" keyboardType="numeric" placeholder="41.6436" placeholderTextColor="#bbb" />
                  </View>
                </View>
                <View style={ms.fieldGroup}>
                  <Text style={ms.label}>כתובת</Text>
                  <TextInput style={ms.input} value={form.address || ''} onChangeText={v => set('address', v)} textAlign="right" />
                </View>
              </>
            )}

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.saveBtn} onPress={() => onSave(form)}>
                <Text style={ms.saveTxt}>שמור</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
                <Text style={ms.cancelTxt}>ביטול</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={ms.deleteBtn} onPress={onDelete}>
              <Text style={ms.deleteTxt}>מחק פריט</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;
  const isWide = width >= 768;

  const [data, setData] = useState<Record<string, DataItem[]>>({});
  const [texts, setTexts] = useState(DEFAULT_TEXTS);
  const [activeNav, setActiveNav] = useState('texts');
  const [editItem, setEditItem] = useState<DataItem | null>(null);
  const [saved, setSaved] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Map section keys to API JSON keys
  const API_KEYS: Record<string, string> = {
    main: 'mainCategories', extra: 'extraCategories',
    welcome: 'welcome', info: 'infoPortal',
    bottom: 'bottomBanners', side: 'sideBanners',
    locations: 'locations', audio: 'audio',
  };

  useEffect(() => {
    (async () => {
      try {
        // Try API first
        const apiData = await fetchContent();
        const loaded: Record<string, DataItem[]> = {};
        for (const s of SECTIONS) {
          const apiKey = API_KEYS[s.key];
          loaded[s.key] = apiData[apiKey] || s.defaults;
        }
        setData(loaded);
        if (apiData.texts) setTexts(apiData.texts);
      } catch {
        // Fallback to AsyncStorage
        const loaded: Record<string, DataItem[]> = {};
        for (const s of SECTIONS) {
          const raw = await AsyncStorage.getItem(s.storageKey);
          loaded[s.key] = raw ? JSON.parse(raw) : s.defaults;
        }
        setData(loaded);
        const rawTexts = await AsyncStorage.getItem('@admin_texts');
        if (rawTexts) setTexts(JSON.parse(rawTexts));
      }
    })();
  }, []);

  const flash = useCallback(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }, []);

  const saveSection = async (key: string, items: DataItem[]) => {
    const section = SECTIONS.find(s => s.key === key)!;
    // Save to API
    const apiKey = API_KEYS[key];
    try {
      await updateSection(apiKey, items);
    } catch {
      // Fallback to AsyncStorage
    }
    await AsyncStorage.setItem(section.storageKey, JSON.stringify(items));
    setData(prev => ({ ...prev, [key]: items }));
    flash();
  };

  const saveTexts = async () => {
    try {
      await updateSection('texts', texts);
    } catch {
      // Fallback to AsyncStorage
    }
    await AsyncStorage.setItem('@admin_texts', JSON.stringify(texts));
    flash();
  };

  const handleSaveItem = (updated: DataItem) => {
    const section = SECTIONS.find(s => s.key === activeNav);
    if (!section) return;
    const items = data[activeNav] || [];
    const idx = items.findIndex(i => i.id === updated.id);
    const next = [...items];
    if (idx >= 0) next[idx] = updated; else next.push(updated);
    saveSection(activeNav, next);
    setEditItem(null);
  };

  const handleDeleteItem = () => {
    if (!editItem) return;
    const doDelete = () => {
      const items = (data[activeNav] || []).filter(i => i.id !== editItem.id);
      saveSection(activeNav, items);
      setEditItem(null);
    };
    if (Platform.OS === 'web') {
      if (confirm(`למחוק את "${editItem.title}"?`)) doDelete();
    } else {
      Alert.alert('מחיקה', `למחוק את "${editItem.title}"?`, [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const addItem = () => {
    const section = SECTIONS.find(s => s.key === activeNav);
    if (!section) return;
    const newItem: DataItem = {
      id: String(Date.now()), title: 'פריט חדש', subtitle: '', icon: '📌', bg: Colors.PRIMARY,
      ...(section.hasImage ? { image: '' } : {}),
      ...(section.hasAudio ? { audio: '' } : {}),
      ...(section.hasLocation ? { lat: '', lng: '', address: '' } : {}),
      ...(section.hasSummary ? { summary: '' } : {}),
      ...(section.hasLongText ? { longText: '' } : {}),
    };
    setEditItem(newItem);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const items = [...(data[activeNav] || [])];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    saveSection(activeNav, items);
  };

  const currentSection = SECTIONS.find(s => s.key === activeNav) || null;
  const currentItems = data[activeNav] || [];

  // ─── Sidebar / Nav ──────────────────────────────────────────
  const renderNav = () => (
    <View style={[ns.nav, isWide && ns.navWide]}>
      <View style={ns.navHeader}>
        <Text style={ns.navLogo}>B</Text>
        <View>
          <Text style={ns.navTitle}>Batumi Online</Text>
          <Text style={ns.navSub}>לוח ניהול</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[ns.navItem, activeNav === item.key && ns.navItemActive]}
            onPress={() => { setActiveNav(item.key); setShowMobileNav(false); }}
          >
            <Text style={ns.navIcon}>{item.icon}</Text>
            <Text style={[ns.navLabel, activeNav === item.key && ns.navLabelActive]}>{item.label}</Text>
            {item.key !== 'texts' && (
              <Text style={ns.navBadge}>{(data[item.key] || []).length}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={ns.navFooter}>
        <TouchableOpacity style={ns.navFooterBtn} onPress={() => router.replace('/')}>
          <Text style={ns.navFooterIcon}>←</Text>
          <Text style={ns.navFooterTxt}>חזרה לאפליקציה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ns.navFooterBtn} onPress={() => router.replace('/admin')}>
          <Text style={ns.navFooterIcon}>🚪</Text>
          <Text style={ns.navFooterTxt}>התנתק</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Texts Editor ───────────────────────────────────────────
  const renderTexts = () => {
    const fields = [
      { key: 'headerTitle', label: 'כותרת ראשית' },
      { key: 'headerSub', label: 'תת כותרת' },
      { key: 'welcomeTitle', label: 'כותרת ברוכים הבאים' },
      { key: 'infoTitle', label: 'כותרת פורטל המידע' },
      { key: 'bottomTitle', label: 'כותרת באנרים תחתונים' },
      { key: 'dropdownTitle', label: 'כותרת קטגוריות נוספות' },
    ];
    return (
      <View style={cs.contentCard}>
        <Text style={cs.contentTitle}>טקסטים וכותרות</Text>
        <Text style={cs.contentSub}>עריכת כל הטקסטים והכותרות באפליקציה</Text>
        {isWide ? (
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
            {fields.map(f => (
              <View key={f.key} style={{ width: '48%', minWidth: 280 }}>
                <Text style={cs.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={cs.fieldInput}
                  value={(texts as any)[f.key]}
                  onChangeText={t => setTexts(prev => ({ ...prev, [f.key]: t }))}
                  textAlign="right"
                />
              </View>
            ))}
          </View>
        ) : (
          fields.map(f => (
            <View key={f.key} style={{ marginTop: 12 }}>
              <Text style={cs.fieldLabel}>{f.label}</Text>
              <TextInput
                style={cs.fieldInput}
                value={(texts as any)[f.key]}
                onChangeText={t => setTexts(prev => ({ ...prev, [f.key]: t }))}
                textAlign="right"
              />
            </View>
          ))
        )}
        <TouchableOpacity style={cs.primaryBtn} onPress={saveTexts}>
          <Text style={cs.primaryBtnTxt}>שמור שינויים</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Items List ─────────────────────────────────────────────
  const renderItems = () => {
    if (!currentSection) return null;
    return (
      <View style={cs.contentCard}>
        <View style={cs.contentHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={cs.contentTitle}>{currentSection.label}</Text>
            <Text style={cs.contentSub}>{currentItems.length} פריטים</Text>
          </View>
          <TouchableOpacity style={cs.addBtn} onPress={addItem}>
            <Text style={cs.addBtnTxt}>+ הוסף פריט</Text>
          </TouchableOpacity>
        </View>

        {/* Table header on wide screens */}
        {isWide && currentItems.length > 0 && (
          <View style={cs.tableHeader}>
            <Text style={[cs.thCell, { width: 50 }]}>סדר</Text>
            <Text style={[cs.thCell, { width: 50 }]}>צבע</Text>
            <Text style={[cs.thCell, { width: 50 }]}>אייקון</Text>
            <Text style={[cs.thCell, { flex: 1 }]}>כותרת</Text>
            {currentSection.hasSubtitle && <Text style={[cs.thCell, { flex: 1 }]}>תיאור</Text>}
            {currentSection.hasLocation && <Text style={[cs.thCell, { width: 120 }]}>מיקום</Text>}
            {currentSection.hasAudio && <Text style={[cs.thCell, { width: 80 }]}>אודיו</Text>}
            <Text style={[cs.thCell, { width: 70 }]}>פעולות</Text>
          </View>
        )}

        {currentItems.map((item, idx) => (
          <View key={item.id} style={[cs.itemRow, isWide && cs.itemRowWide]}>
            {/* Order buttons */}
            <View style={cs.orderBtns}>
              <TouchableOpacity onPress={() => moveItem(idx, -1)} disabled={idx === 0}>
                <Text style={[cs.orderArrow, idx === 0 && { opacity: 0.2 }]}>▲</Text>
              </TouchableOpacity>
              <Text style={cs.orderNum}>{idx + 1}</Text>
              <TouchableOpacity onPress={() => moveItem(idx, 1)} disabled={idx === currentItems.length - 1}>
                <Text style={[cs.orderArrow, idx === currentItems.length - 1 && { opacity: 0.2 }]}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Color bar */}
            <View style={[cs.colorBar, { backgroundColor: item.bg }]} />

            {/* Icon */}
            <Text style={cs.itemIcon}>{item.icon}</Text>

            {/* Info */}
            <View style={cs.itemInfo}>
              <Text style={cs.itemTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={cs.itemSub}>{item.subtitle}</Text> : null}
              {!isWide && item.address ? <Text style={cs.itemMeta}>📍 {item.address}</Text> : null}
              {!isWide && item.audio ? <Text style={cs.itemMeta}>🎧 אודיו מצורף</Text> : null}
            </View>

            {/* Extra columns on wide */}
            {isWide && currentSection.hasLocation && (
              <Text style={[cs.itemMeta, { width: 120 }]}>{item.address || '—'}</Text>
            )}
            {isWide && currentSection.hasAudio && (
              <Text style={[cs.itemMeta, { width: 80 }]}>{item.audio ? '✓' : '—'}</Text>
            )}

            {/* Edit button */}
            <TouchableOpacity style={cs.editBtn} onPress={() => setEditItem(item)}>
              <Text style={cs.editTxt}>ערוך</Text>
            </TouchableOpacity>
          </View>
        ))}

        {currentItems.length === 0 && (
          <View style={cs.emptyState}>
            <Text style={cs.emptyIcon}>{currentSection.icon}</Text>
            <Text style={cs.emptyText}>אין פריטים עדיין</Text>
            <TouchableOpacity style={cs.addBtn} onPress={addItem}>
              <Text style={cs.addBtnTxt}>+ הוסף פריט ראשון</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ─── Main Render ────────────────────────────────────────────
  return (
    <View style={ds.container}>
      {/* Mobile top bar */}
      {!isWide && (
        <View style={ds.mobileHeader}>
          <TouchableOpacity onPress={() => setShowMobileNav(!showMobileNav)}>
            <Text style={ds.hamburger}>{showMobileNav ? '✕' : '☰'}</Text>
          </TouchableOpacity>
          <Text style={ds.mobileTitle}>לוח ניהול</Text>
          {saved && <Text style={ds.savedBadge}>נשמר ✓</Text>}
        </View>
      )}

      <View style={[ds.body, isWide && { flexDirection: 'row-reverse' }]}>
        {/* Sidebar: always on desktop, togglable on mobile */}
        {(isWide || showMobileNav) && renderNav()}

        {/* Content area */}
        {(!showMobileNav || isWide) && (
          <ScrollView
            style={ds.content}
            contentContainerStyle={[ds.contentInner, isDesktop && { maxWidth: 900 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Saved badge on wide */}
            {isWide && saved && (
              <View style={ds.savedBanner}>
                <Text style={ds.savedBannerTxt}>נשמר בהצלחה ✓</Text>
              </View>
            )}

            {/* Stats bar */}
            <View style={[ds.statsRow, isWide && { flexDirection: 'row-reverse' }]}>
              {[
                { label: 'קטגוריות', count: (data.main?.length || 0) + (data.extra?.length || 0), color: Colors.PRIMARY },
                { label: 'באנרים', count: (data.bottom?.length || 0) + (data.side?.length || 0), color: Colors.ACCENT },
                { label: 'מיקומים', count: data.locations?.length || 0, color: Colors.SECONDARY },
                { label: 'אודיו', count: data.audio?.length || 0, color: '#1C2B35' },
              ].map(stat => (
                <View key={stat.label} style={[ds.statCard, { borderRightColor: stat.color }]}>
                  <Text style={ds.statNum}>{stat.count}</Text>
                  <Text style={ds.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Active section content */}
            {activeNav === 'texts' ? renderTexts() : renderItems()}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

      {/* Edit Modal */}
      <EditModal
        visible={!!editItem}
        item={editItem}
        section={currentSection}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onClose={() => setEditItem(null)}
        isWide={isWide}
      />
    </View>
  );
}

// ─── Nav Styles ────────────────────────────────────────────────
const ns = StyleSheet.create({
  nav: {
    backgroundColor: '#1C2B35', width: '100%', paddingTop: 20, paddingBottom: 12,
  },
  navWide: {
    width: 260, minHeight: '100%',
  },
  navHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2a3f4d',
  },
  navLogo: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.PRIMARY,
    textAlign: 'center', lineHeight: 40, fontSize: 20, fontWeight: '900', color: Colors.WHITE, overflow: 'hidden',
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.WHITE },
  navSub: { fontSize: 12, color: '#8899a6', writingDirection: 'rtl' },
  navItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 8, marginVertical: 1, borderRadius: 10,
  },
  navItemActive: { backgroundColor: Colors.PRIMARY + '30' },
  navIcon: { fontSize: 18 },
  navLabel: { flex: 1, fontSize: 14, color: '#b0bec5', textAlign: 'right', writingDirection: 'rtl' },
  navLabelActive: { color: Colors.WHITE, fontWeight: '600' },
  navBadge: {
    fontSize: 11, color: '#8899a6', backgroundColor: '#2a3f4d',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, overflow: 'hidden',
  },
  navFooter: {
    borderTopWidth: 1, borderTopColor: '#2a3f4d', paddingTop: 12, paddingHorizontal: 20, gap: 4,
  },
  navFooterBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 8 },
  navFooterIcon: { fontSize: 16 },
  navFooterTxt: { fontSize: 13, color: '#8899a6', writingDirection: 'rtl' },
});

// ─── Dashboard Layout Styles ──────────────────────────────────
const ds = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  mobileHeader: {
    backgroundColor: Colors.PRIMARY, flexDirection: 'row-reverse', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, gap: 12,
  },
  hamburger: { fontSize: 24, color: Colors.WHITE },
  mobileTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  savedBadge: { fontSize: 13, color: '#2ecc71', fontWeight: '700' },
  body: { flex: 1 },
  content: { flex: 1 },
  contentInner: { padding: 20 },
  savedBanner: {
    backgroundColor: '#d4edda', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center',
  },
  savedBannerTxt: { color: '#155724', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: 140, backgroundColor: Colors.WHITE, borderRadius: 14, padding: 16,
    borderRightWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statNum: { fontSize: 28, fontWeight: '800', color: Colors.TEXT },
  statLabel: { fontSize: 13, color: '#999', marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
});

// ─── Content Styles ───────────────────────────────────────────
const cs = StyleSheet.create({
  contentCard: {
    backgroundColor: Colors.WHITE, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  contentHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  contentTitle: { fontSize: 20, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  contentSub: { fontSize: 13, color: '#999', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Colors.TEXT, backgroundColor: '#fafafa', writingDirection: 'rtl',
  },
  primaryBtn: {
    backgroundColor: Colors.PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20,
  },
  primaryBtnTxt: { fontSize: 16, fontWeight: '700', color: Colors.WHITE },
  addBtn: {
    backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  addBtnTxt: { fontSize: 14, fontWeight: '600', color: Colors.WHITE, writingDirection: 'rtl' },
  tableHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 2, borderBottomColor: '#f0f0f0', marginBottom: 4,
  },
  thCell: { fontSize: 12, fontWeight: '700', color: '#999', textAlign: 'right', writingDirection: 'rtl' },
  itemRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  itemRowWide: { paddingHorizontal: 4 },
  orderBtns: { alignItems: 'center', gap: 0, width: 30 },
  orderArrow: { fontSize: 10, color: Colors.PRIMARY, padding: 4 },
  orderNum: { fontSize: 11, color: '#999', fontWeight: '600' },
  colorBar: { width: 6, height: 40, borderRadius: 3 },
  itemIcon: { fontSize: 28 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  itemSub: { fontSize: 12, color: '#999', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  itemMeta: { fontSize: 11, color: '#aaa', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  editBtn: { backgroundColor: '#e8f4f8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  editTxt: { fontSize: 13, fontWeight: '600', color: Colors.PRIMARY },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#999', writingDirection: 'rtl' },
});

// ─── Modal Styles ──────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scrollWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: {
    width: '100%', maxWidth: 420, backgroundColor: Colors.WHITE, borderRadius: 20, padding: 24,
  },
  modalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 20, color: '#999', padding: 4 },
  fieldGroup: { marginBottom: 12 },
  fieldRow: {},
  label: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Colors.TEXT, backgroundColor: '#fafafa', writingDirection: 'rtl',
  },
  colorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  colorPreview: { width: 42, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0' },
  btnRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 20 },
  saveBtn: { flex: 1, backgroundColor: Colors.PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt: { fontSize: 16, fontWeight: '700', color: Colors.WHITE },
  cancelBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt: { fontSize: 16, fontWeight: '600', color: '#666' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  textAreaLong: { height: 160, textAlignVertical: 'top', paddingTop: 10 },
  deleteBtn: { marginTop: 14, padding: 10, alignItems: 'center' },
  deleteTxt: { fontSize: 14, color: '#e74c3c', fontWeight: '600' },
});
