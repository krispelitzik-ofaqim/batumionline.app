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
  image?: string; audio?: string; video?: string; lat?: string; lng?: string; address?: string;
  summary?: string; longText?: string; heroBg?: string;
  btnLabel?: string; btnLink?: string;
  audios?: Array<{ title?: string; url: string }>;
  children?: DataItem[];
};

const HERO_PALETTE = [
  '#2D4A5E', '#F7F3ED', '#1A6B8A', '#3DA5C4', '#7ECFC0', '#F4A94E',
];

const EMOJI_LIBRARY = [
  '🏨','🏩','🏢','🏖️','🏡','🛏️','🎡','📸','🏛️','🎧',
  '✡️','⛪','🎶','🍺','🎤','💃','🎰','🚕','🚌','🚆',
  '🚐','🚍','✈️','🚲','🍽️','🥂','🍔','🌭','⭐','🏥',
  '🛡️','📱','💡','💰','🛍️','🏋️','⛷️','🇮🇱','🌤️','💱',
  '📰','🏠','💼','📍','🌊','🏙️','🌳','🌺','☕','🍷',
];

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

const DEFAULT_LEGAL: DataItem[] = [
  { id: 'about', title: 'אודותינו', icon: '👥', bg: '#1A6B8A', longText: 'Batumi Online הוא המדריך הישראלי המקיף לטיול בבטומי, גאורגיה. נולדנו מתוך אהבה לעיר היפה הזו ורצון לעזור לכל ישראלי לחוות אותה בצורה הטובה ביותר. האפליקציה מרכזת את כל המידע שתייר ישראלי צריך – מלונות, מסעדות, אטרקציות, תחבורה, פורטל נדל"ן ועסקים, סיורים קוליים בעברית ועוד.' },
  { id: 'terms', title: 'תקנון', icon: '🪪', bg: '#3DA5C4', longText: 'השימוש באפליקציית Batumi Online כפוף לתנאים הבאים:\n\n1. כל התוכן באפליקציה מיועד למטרות מידע בלבד.\n2. איננו אחראים לדיוק המחירים, זמינות השירותים או פרטי הקשר המוצגים.\n3. המידע מתעדכן מעת לעת אך ייתכנו שינויים שאינם תחת שליטתנו.\n4. השימוש באפליקציה הוא חופשי וללא תשלום.\n5. בעת לחיצה על קישורים חיצוניים המשתמש עובר לאתרי צד שלישי שאין להם קשר אלינו.' },
  { id: 'privacy', title: 'פרטיות', icon: '⚖️', bg: '#F4A94E', longText: 'אנחנו מכבדים את פרטיות המשתמשים שלנו:\n\n• אין אנו אוספים מידע אישי מזהה ללא הסכמה מפורשת.\n• שימוש באפליקציה אינו דורש הרשמה או יצירת חשבון.\n• נתוני שימוש אנונימיים נאספים לצורך שיפור האפליקציה בלבד.\n• איננו מוכרים או מעבירים מידע לצדדים שלישיים.\n• עוגיות (Cookies) – האפליקציה עלולה להשתמש בטכנולוגיות אחסון מקומיות לשמירת העדפות.' },
  { id: 'contact', title: 'כתוב לנו', icon: '✉️', bg: '#1C2B35', longText: 'נשמח לשמוע מכם!\n\nאימייל: info@batumionline.app\nוואטסאפ: זמין דרך כפתור הוואטסאפ בסרגל התחתון\nאתר: www.batumionline.app\n\nיש לכם הצעה לשיפור? מצאתם טעות? רוצים לפרסם עסק באפליקציה? דברו איתנו!' },
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
  { key: 'legal', label: 'מידע חובה', icon: '📜', storageKey: '@admin_legal', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: true, defaults: DEFAULT_LEGAL },
];

const TAG_OPTIONS: { key: string; label: string }[] = [
  { key: 'gallery',    label: '🎞️ גלריה' },
  { key: 'icon',       label: '🖼️ אייקון' },
  { key: 'main',       label: '📂 ראשיות' },
  { key: 'extra',      label: '📁 נוספות' },
  { key: 'welcome',    label: '👋 ברוכים' },
  { key: 'info',       label: '📋 פורטל מידע' },
  { key: 'realestate', label: '🏠 נדל״ן' },
  { key: 'business',   label: '💼 עסקים' },
  { key: 'locations',  label: '📍 מיקומים' },
  { key: 'audio',      label: '🎧 אודיו' },
  { key: 'legal',      label: '📜 מידע חובה' },
];

const NAV_ITEMS = [
  { key: 'texts', label: 'דף הבית', icon: '✏️' },
  ...SECTIONS.map(s => ({ key: s.key, label: s.label, icon: s.icon })),
  { key: 'media', label: 'תמונות', icon: '🖼️' },
];

// ─── Rich Text Editor (web) ────────────────────────────────────
const FONTS = ['Assistant', 'Arial', 'David', 'Tahoma', 'Verdana', 'Georgia', 'Courier New'];
const FONT_SIZES = [
  { label: '10', val: '1' }, { label: '12', val: '2' }, { label: '14', val: '3' },
  { label: '18', val: '4' }, { label: '24', val: '5' }, { label: '32', val: '6' }, { label: '48', val: '7' },
];
const COLORS_PALETTE = ['#000000','#333333','#666666','#999999','#ffffff','#004a99','#1A6B8A','#3DA5C4','#F4A94E','#c0392b','#27ae60','#8e44ad','#e67e22','#2c3e50'];

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<any>(null);
  const [showCode, setShowCode] = React.useState(false);

  React.useEffect(() => {
    if (ref.current && !showCode && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value, showCode]);

  const exec = (cmd: string, arg?: string) => {
    (window as any).document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const btnStyle: any = {
    padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6,
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A6B8A',
  };

  const btn = (label: string, cmd: string, arg?: string) =>
    React.createElement('button', {
      type: 'button', key: label + cmd,
      onClick: () => exec(cmd, arg), style: btnStyle,
    }, label);

  const selectEl = (key: string, options: { label: string; val: string }[], cmd: string, placeholder: string) =>
    React.createElement('select', {
      key,
      onChange: (e: any) => { if (e.target.value) exec(cmd, e.target.value); e.target.value = ''; },
      defaultValue: '',
      style: { ...btnStyle, paddingRight: 4 },
    }, [
      React.createElement('option', { key: 'ph', value: '', disabled: true }, placeholder),
      ...options.map(o => React.createElement('option', { key: o.val, value: o.val }, o.label)),
    ]);

  const fontSelect = React.createElement('select', {
    key: 'fontFamily',
    onChange: (e: any) => { if (e.target.value) exec('fontName', e.target.value); e.target.value = ''; },
    defaultValue: '',
    style: { ...btnStyle, paddingRight: 4 },
  }, [
    React.createElement('option', { key: 'ph', value: '', disabled: true }, 'גופן'),
    ...FONTS.map(f => React.createElement('option', { key: f, value: f, style: { fontFamily: f } }, f)),
  ]);

  const colorPicker = (key: string, cmd: string, label: string) =>
    React.createElement('div', { key, style: { position: 'relative', display: 'inline-block' } }, [
      React.createElement('button', {
        key: 'btn', type: 'button',
        onClick: () => {
          const c = (window as any).prompt(`${label} (hex):`, '#000000');
          if (c) exec(cmd, c);
        },
        style: btnStyle,
      }, label),
    ]);

  const promptLink = () => {
    const url = (window as any).prompt('הכנס קישור:');
    if (url) exec('createLink', url);
  };

  const toggleCode = () => {
    if (showCode && ref.current) {
      ref.current.innerHTML = value || '';
    }
    setShowCode(!showCode);
  };

  return React.createElement('div', { style: { direction: 'rtl' } }, [
    React.createElement('div', {
      key: 'toolbar',
      style: { display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
    }, [
      btn('B', 'bold'), btn('I', 'italic'), btn('U', 'underline'),
      btn('S', 'strikeThrough'),
      fontSelect,
      selectEl('fontSize', FONT_SIZES, 'fontSize', 'גודל'),
      colorPicker('fgColor', 'foreColor', '🎨 צבע'),
      colorPicker('bgColor', 'hiliteColor', '🖌️ רקע'),
      btn('• רשימה', 'insertUnorderedList'),
      btn('1. רשימה', 'insertOrderedList'),
      btn('H1', 'formatBlock', 'H1'),
      btn('H2', 'formatBlock', 'H2'),
      btn('H3', 'formatBlock', 'H3'),
      btn('פסקה', 'formatBlock', 'P'),
      btn('ימין', 'justifyRight'),
      btn('מרכז', 'justifyCenter'),
      btn('שמאל', 'justifyLeft'),
      React.createElement('button', {
        type: 'button', key: 'linkbtn', onClick: promptLink, style: btnStyle,
      }, '🔗 קישור'),
      btn('הסר קישור', 'unlink'),
      btn('קו אופקי', 'insertHorizontalRule'),
      React.createElement('button', {
        type: 'button', key: 'codebtn', onClick: toggleCode,
        style: { ...btnStyle, background: showCode ? '#1A6B8A' : '#fff', color: showCode ? '#fff' : '#1A6B8A' },
      }, showCode ? 'תצוגה' : '</> קוד'),
      btn('ניקוי', 'removeFormat'),
    ]),
    showCode
      ? React.createElement('textarea', {
          key: 'codeEditor',
          value: value || '',
          onChange: (e: any) => onChange(e.target.value),
          style: {
            width: '100%', minHeight: 200, maxHeight: 400, border: '1px solid #e0e0e0',
            borderRadius: 10, padding: 12, fontSize: 13, fontFamily: 'monospace',
            lineHeight: '20px', outline: 'none', background: '#1e1e1e', color: '#d4d4d4',
            direction: 'ltr', textAlign: 'left', resize: 'vertical',
          },
        })
      : React.createElement('div', {
          key: 'editor',
          ref,
          contentEditable: true,
          suppressContentEditableWarning: true,
          onInput: (e: any) => onChange(e.currentTarget.innerHTML),
          style: {
            minHeight: 200, maxHeight: 400, overflowY: 'auto',
            border: '1px solid #e0e0e0', borderRadius: 10, padding: 12,
            fontSize: 14, lineHeight: '22px', outline: 'none', background: '#fafafa',
            direction: 'rtl', textAlign: 'right',
          },
        }),
  ]);
}

// ─── Edit Modal ────────────────────────────────────────────────
function EditModal({
  visible, item, section, onSave, onDelete, onClose, isWide, onMoveSection,
}: {
  visible: boolean; item: DataItem | null; section: Section | null;
  onSave: (item: DataItem) => void; onDelete: () => void; onClose: () => void;
  isWide: boolean;
  onMoveSection?: (target: 'main' | 'extra') => void;
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

            {onMoveSection && (section.key === 'main' || section.key === 'extra') && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>קבוצה</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                  {(['main', 'extra'] as const).map(k => {
                    const selected = section.key === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        onPress={() => { if (!selected) onMoveSection(k); }}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: 10,
                          backgroundColor: selected ? Colors.PRIMARY : '#f0f2f5',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 13, fontWeight: '700',
                          color: selected ? Colors.WHITE : '#666',
                        }}>
                          {k === 'main' ? 'קטגוריות ראשיות' : 'קטגוריות נוספות'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>רקע הכותרת</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
                {HERO_PALETTE.map(c => {
                  const selected = (form.heroBg || '') === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => set('heroBg', c)}
                      style={{
                        width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                        borderWidth: selected ? 3 : 1,
                        borderColor: selected ? Colors.TEXT : '#e8e8e8',
                      }}
                    />
                  );
                })}
              </View>
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

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>טקסט מפורט</Text>
              {Platform.OS === 'web' ? (
                <RichEditor value={form.longText || ''} onChange={(v) => set('longText', v)} />
              ) : (
                <TextInput style={[ms.input, ms.textAreaLong]} value={form.longText || ''} onChangeText={v => set('longText', v)} textAlign="right" multiline numberOfLines={8} placeholder="תוכן מלא..." placeholderTextColor="#bbb" />
              )}
            </View>

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>אייקון (תמונה)</Text>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                {form.icon && (form.icon.startsWith('data:') || form.icon.startsWith('http')) ? (
                  React.createElement('img', {
                    src: form.icon,
                    style: {
                      width: 170, height: 100, objectFit: 'cover',
                      borderTopLeftRadius: 16, borderTopRightRadius: 16,
                      borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                      border: '1px solid #e8e8e8',
                    },
                    alt: 'icon',
                  })
                ) : (
                  <View style={{
                    width: 170, height: 100, backgroundColor: '#fafafa',
                    borderWidth: 1, borderColor: '#e8e8e8',
                    borderTopLeftRadius: 16, borderTopRightRadius: 16,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 11, color: '#bbb' }}>אין תמונה</Text>
                  </View>
                )}
                {Platform.OS === 'web' && React.createElement('label', {
                  style: {
                    backgroundColor: Colors.PRIMARY, color: '#fff', padding: '10px 16px',
                    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  },
                }, [
                  'הוסף תמונה',
                  React.createElement('input', {
                    key: 'file',
                    type: 'file',
                    accept: 'image/*',
                    style: { display: 'none' },
                    onChange: (e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const src = String(reader.result);
                        const img = new (window as any).Image();
                        img.onload = () => {
                          const TW = 680, TH = 400; // 170:100 @ x4
                          const canvas = (window as any).document.createElement('canvas');
                          canvas.width = TW; canvas.height = TH;
                          const ctx = canvas.getContext('2d');
                          const srcRatio = img.width / img.height;
                          const dstRatio = TW / TH;
                          let sx = 0, sy = 0, sw = img.width, sh = img.height;
                          if (srcRatio > dstRatio) {
                            sw = img.height * dstRatio;
                            sx = (img.width - sw) / 2;
                          } else {
                            sh = img.width / dstRatio;
                            sy = (img.height - sh) / 2;
                          }
                          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH);
                          set('icon', canvas.toDataURL('image/jpeg', 0.9));
                        };
                        img.src = src;
                      };
                      reader.readAsDataURL(file);
                    },
                  }),
                ])}
              </View>
              <Text style={{ fontSize: 11, color: '#999', marginTop: 6, textAlign: 'right' }}>
                התמונה תיחתך אוטומטית ליחס 170×100 עם פינות עליונות מעוגלות
              </Text>
            </View>

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>או בחר אימוג׳י</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                {EMOJI_LIBRARY.map(e => {
                  const selected = form.icon === e;
                  return (
                    <TouchableOpacity
                      key={e}
                      onPress={() => set('icon', e)}
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        backgroundColor: selected ? Colors.PRIMARY + '20' : '#fafafa',
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? Colors.PRIMARY : '#e8e8e8',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {section.hasImage && (
              <View style={ms.fieldGroup}>
                <Text style={ms.label}>כתובת תמונה (URL / נתיב)</Text>
                <TextInput style={ms.input} value={form.image || ''} onChangeText={v => set('image', v)} textAlign="left" placeholder="https://... או assets/images/..." placeholderTextColor="#bbb" />
              </View>
            )}

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>נגני אודיו</Text>
              {(form.audios || []).map((a, idx) => (
                <View key={idx} style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={[ms.input, { flex: 1 }]}
                    value={a.title || ''}
                    onChangeText={(v) => {
                      const next = [...(form.audios || [])];
                      next[idx] = { ...next[idx], title: v };
                      setForm((p) => ({ ...p, audios: next }));
                    }}
                    placeholder="שם"
                    placeholderTextColor="#bbb"
                    textAlign="right"
                  />
                  <TextInput
                    style={[ms.input, { flex: 2 }]}
                    value={a.url}
                    onChangeText={(v) => {
                      const next = [...(form.audios || [])];
                      next[idx] = { ...next[idx], url: v };
                      setForm((p) => ({ ...p, audios: next }));
                    }}
                    placeholder="URL"
                    placeholderTextColor="#bbb"
                    textAlign="left"
                  />
                  {Platform.OS === 'web' && React.createElement('label', {
                    key: `upload-${idx}`,
                    style: {
                      backgroundColor: Colors.SECONDARY, color: '#fff', padding: '10px 12px',
                      borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    },
                  }, [
                    '📁 העלה',
                    React.createElement('input', {
                      key: 'file',
                      type: 'file',
                      accept: 'audio/*,.mp3,.wav,.m4a,.aac',
                      style: { display: 'none' },
                      onChange: async (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                          const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
                          const json = await res.json();
                          if (json.success) {
                            const next = [...(form.audios || [])];
                            next[idx] = { ...next[idx], url: json.url, title: next[idx].title || file.name.replace(/\.[^.]+$/, '') };
                            setForm((p) => ({ ...p, audios: next }));
                          }
                        } catch {}
                      },
                    }),
                  ])}
                  <TouchableOpacity
                    onPress={() => {
                      const next = (form.audios || []).filter((_, i) => i !== idx);
                      setForm((p) => ({ ...p, audios: next }));
                    }}
                    style={{ padding: 10, backgroundColor: '#fee', borderRadius: 8, justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#c33', fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setForm((p) => ({ ...p, audios: [...(p.audios || []), { title: '', url: '' }] }))}
                style={{ backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ color: Colors.WHITE, fontWeight: '800' }}>+ הוסף נגן אודיו</Text>
              </TouchableOpacity>
            </View>

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>אודיו ראשי (ישן — URL יחיד, אופציונלי)</Text>
              <TextInput style={ms.input} value={form.audio || ''} onChangeText={v => set('audio', v)} textAlign="left" placeholder="https://... או assets/audio/..." placeholderTextColor="#bbb" />
            </View>

            <View style={ms.fieldGroup}>
              <Text style={ms.label}>וידאו (URL — YouTube / MP4)</Text>
              <TextInput style={ms.input} value={form.video || ''} onChangeText={v => set('video', v)} textAlign="left" placeholder="https://youtube.com/..." placeholderTextColor="#bbb" />
            </View>

            <View style={[ms.fieldRow, isWide && { flexDirection: 'row-reverse', gap: 12 }]}>
              <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                <Text style={ms.label}>טקסט הכפתור</Text>
                <TextInput style={ms.input} value={form.btnLabel || ''} onChangeText={v => set('btnLabel', v)} textAlign="right" placeholder="לחץ כאן" placeholderTextColor="#bbb" />
              </View>
              <View style={[ms.fieldGroup, isWide && { flex: 1 }]}>
                <Text style={ms.label}>קישור הכפתור</Text>
                <TextInput style={ms.input} value={form.btnLink || ''} onChangeText={v => set('btnLink', v)} textAlign="left" placeholder="https://..." placeholderTextColor="#bbb" />
              </View>
            </View>

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
  const [childrenOf, setChildrenOf] = useState<DataItem | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ filename: string; url: string; tags?: string[] }[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<{ filename: string; url: string }[]>([]);

  const refreshMedia = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/uploads');
      const json = await res.json();
      if (json.success) setMediaFiles(json.files);
    } catch {}
  }, []);

  const refreshGallery = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/gallery');
      const json = await res.json();
      if (json.success) setGalleryFiles(json.files);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeNav === 'media') refreshMedia();
    if (activeNav === 'gallery') refreshGallery();
  }, [activeNav, refreshMedia, refreshGallery]);

  // Map section keys to API JSON keys
  const API_KEYS: Record<string, string> = {
    main: 'mainCategories', extra: 'extraCategories',
    welcome: 'welcome', info: 'infoPortal',
    bottom: 'bottomBanners', side: 'sideBanners',
    locations: 'locations', audio: 'audio',
    legal: 'legal',
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

  const saveChildren = (newChildren: DataItem[]) => {
    if (!childrenOf) return;
    const items = [...(data[activeNav] || [])];
    const pIdx = items.findIndex(i => i.id === childrenOf.id);
    if (pIdx < 0) return;
    const updatedParent = { ...items[pIdx], children: newChildren };
    items[pIdx] = updatedParent;
    saveSection(activeNav, items);
    setChildrenOf(updatedParent);
  };

  const handleSaveItem = (updated: DataItem) => {
    const section = SECTIONS.find(s => s.key === activeNav);
    if (!section) return;
    if (childrenOf) {
      const kids = childrenOf.children || [];
      const idx = kids.findIndex(i => i.id === updated.id);
      const next = [...kids];
      if (idx >= 0) next[idx] = updated; else next.push(updated);
      saveChildren(next);
      setEditItem(null);
      return;
    }
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
      if (childrenOf) {
        const next = (childrenOf.children || []).filter(i => i.id !== editItem.id);
        saveChildren(next);
      } else {
        const items = (data[activeNav] || []).filter(i => i.id !== editItem.id);
        saveSection(activeNav, items);
      }
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
    const source = childrenOf ? (childrenOf.children || []) : (data[activeNav] || []);
    const items = [...source];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    if (childrenOf) saveChildren(items); else saveSection(activeNav, items);
  };

  const reorderItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const source = childrenOf ? (childrenOf.children || []) : (data[activeNav] || []);
    const items = [...source];
    if (from >= items.length || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    if (childrenOf) saveChildren(items); else saveSection(activeNav, items);
  };

  const currentSection = SECTIONS.find(s => s.key === activeNav) || null;
  const currentItems = childrenOf ? (childrenOf.children || []) : (data[activeNav] || []);
  const canHaveChildren = activeNav === 'main' || activeNav === 'extra';

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
            onPress={() => { setActiveNav(item.key); setShowMobileNav(false); setChildrenOf(null); }}
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

  // ─── Home Preview ───────────────────────────────────────────
  const renderTexts = () => {
    return (
      <View style={cs.contentCard}>
        <Text style={cs.contentTitle}>דף הבית</Text>
        <Text style={cs.contentSub}>תצוגה מקדימה של דף הבית כפי שהגולש רואה</Text>
        {Platform.OS === 'web' && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <View style={{
              width: 591, height: 1246, backgroundColor: '#1C2B35', borderRadius: 48,
              padding: 14, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25, shadowRadius: 30,
            }}>
              <View style={{ width: 563, height: 1218, backgroundColor: '#000', borderRadius: 36, overflow: 'hidden' }}>
                {React.createElement('iframe', {
                  src: '/',
                  style: {
                    width: '375px', height: '812px', border: 0, backgroundColor: '#fff',
                    transform: 'scale(1.5)', transformOrigin: 'top left',
                  },
                  title: 'home-preview',
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─── Media Library ──────────────────────────────────────────
  const renderMedia = () => {
    const handleUpload = async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch('http://localhost:3001/api/upload', { method: 'POST', body: fd });
        await refreshMedia();
      } catch {}
    };
    const handleDelete = async (filename: string) => {
      if (Platform.OS === 'web' && !confirm(`למחוק את ${filename}?`)) return;
      try {
        await fetch(`http://localhost:3001/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        await refreshMedia();
      } catch {}
    };
    const toggleTag = async (filename: string, tag: string) => {
      const file = mediaFiles.find(f => f.filename === filename);
      const current = file?.tags || [];
      const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      setMediaFiles(prev => prev.map(f => f.filename === filename ? { ...f, tags: next } : f));
      try {
        await fetch(`http://localhost:3001/api/uploads/${encodeURIComponent(filename)}/tags`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        });
      } catch {}
    };
    const setTagSingle = async (filename: string, tag: string) => {
      const next = tag ? [tag] : [];
      setMediaFiles(prev => prev.map(f => f.filename === filename ? { ...f, tags: next } : f));
      try {
        await fetch(`http://localhost:3001/api/uploads/${encodeURIComponent(filename)}/tags`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        });
      } catch {}
    };
    return (
      <View style={cs.contentCard}>
        <View style={cs.contentHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={cs.contentTitle}>תיקיית תמונות</Text>
            <Text style={cs.contentSub}>{mediaFiles.length} תמונות — סמן כל אחת לאן היא שייכת</Text>
          </View>
          {Platform.OS === 'web' && React.createElement('label', {
            style: {
              backgroundColor: Colors.PRIMARY, color: '#fff', padding: '10px 16px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            },
          }, [
            '+ העלה תמונות',
            React.createElement('input', {
              key: 'file',
              type: 'file',
              accept: 'image/*',
              multiple: true,
              style: { display: 'none' },
              onChange: async (e: any) => {
                const files = Array.from(e.target.files || []) as File[];
                for (const f of files) await handleUpload(f);
                e.target.value = '';
              },
            }),
          ])}
        </View>

        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {mediaFiles.map(f => (
            <View key={f.filename} style={{ width: 160, backgroundColor: '#fafafa', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e8e8e8' }}>
              {Platform.OS === 'web' && React.createElement('img', {
                src: f.url,
                style: { width: '100%', height: 110, objectFit: 'cover', display: 'block' },
                alt: f.filename,
              })}
              <View style={{ padding: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 10, color: '#999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 }}>
                  {f.filename}
                </Text>
                <View style={{ marginBottom: 6 }}>
                  {Platform.OS === 'web' && React.createElement('select', {
                    value: (f.tags || []).find((t) => TAG_OPTIONS.some((o) => o.key === t)) || '',
                    onChange: (e: any) => setTagSingle(f.filename, e.target.value),
                    style: {
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid #e8e8e8',
                      fontSize: 11,
                      fontWeight: 700,
                      color: (f.tags || []).length ? Colors.WHITE : '#666',
                      backgroundColor: (f.tags || []).length ? Colors.PRIMARY : '#f0f2f5',
                      direction: 'rtl',
                      cursor: 'pointer',
                    },
                  }, [
                    React.createElement('option', { key: '', value: '' }, '— ללא קטגוריה —'),
                    ...TAG_OPTIONS.map(({ key, label }) =>
                      React.createElement('option', { key, value: key, style: { backgroundColor: '#fff', color: '#222' } }, label)
                    ),
                  ])}
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#e8f4f8', paddingVertical: 6, borderRadius: 6, alignItems: 'center' }}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        (navigator as any).clipboard?.writeText(f.url);
                      }
                    }}
                  >
                    <Text style={{ fontSize: 11, color: Colors.PRIMARY, fontWeight: '600' }}>העתק URL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#fdecea', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                    onPress={() => handleDelete(f.filename)}
                  >
                    <Text style={{ fontSize: 11, color: '#c0392b', fontWeight: '600' }}>מחק</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {mediaFiles.length === 0 && (
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', width: '100%' }}>
              אין תמונות עדיין — לחץ על "העלה תמונות" כדי להתחיל
            </Text>
          )}
        </View>
      </View>
    );
  };

  // ─── Home Gallery ───────────────────────────────────────────
  const renderGallery = () => {
    const handleUpload = async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch('http://localhost:3001/api/gallery', { method: 'POST', body: fd });
        await refreshGallery();
      } catch {}
    };
    const handleDelete = async (filename: string) => {
      if (Platform.OS === 'web' && !confirm(`למחוק את ${filename}?`)) return;
      try {
        await fetch(`http://localhost:3001/api/gallery/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        await refreshGallery();
      } catch {}
    };
    const reorder = async (from: number, to: number) => {
      if (from === to) return;
      const next = [...galleryFiles];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setGalleryFiles(next);
      await fetch('http://localhost:3001/api/gallery/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.map(f => f.filename) }),
      });
    };
    return (
      <View style={cs.contentCard}>
        <View style={cs.contentHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={cs.contentTitle}>גלריית דף הבית</Text>
            <Text style={cs.contentSub}>{galleryFiles.length} תמונות — תוצג כסליידר אוטומטי בדף הבית</Text>
          </View>
          {Platform.OS === 'web' && React.createElement('label', {
            style: {
              backgroundColor: Colors.PRIMARY, color: '#fff', padding: '10px 16px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            },
          }, [
            '+ העלה תמונות',
            React.createElement('input', {
              key: 'file',
              type: 'file',
              accept: 'image/*',
              multiple: true,
              style: { display: 'none' },
              onChange: async (e: any) => {
                const files = Array.from(e.target.files || []) as File[];
                for (const f of files) await handleUpload(f);
                e.target.value = '';
              },
            }),
          ])}
        </View>

        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {galleryFiles.map((f, idx) => {
            const card = (
              <View style={{ width: 200, backgroundColor: '#fafafa', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e8e8e8' }}>
                {Platform.OS === 'web' && React.createElement('img', {
                  src: f.url,
                  style: { width: '100%', height: 130, objectFit: 'cover', display: 'block' },
                  alt: f.filename,
                })}
                <View style={{ padding: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 11, color: '#999', fontWeight: '600', width: 22, textAlign: 'center' }}>{idx + 1}</Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: '#666', textAlign: 'right' }}>{f.filename}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#fdecea', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                    onPress={() => handleDelete(f.filename)}
                  >
                    <Text style={{ fontSize: 11, color: '#c0392b', fontWeight: '600' }}>מחק</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
            if (Platform.OS === 'web') {
              return React.createElement('div', {
                key: f.filename,
                draggable: true,
                onDragStart: (e: any) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); },
                onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
                onDrop: (e: any) => {
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(from)) reorder(from, idx);
                },
                style: { cursor: 'move' },
              }, card);
            }
            return <View key={f.filename}>{card}</View>;
          })}
          {galleryFiles.length === 0 && (
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', width: '100%' }}>
              אין תמונות עדיין — לחץ על "העלה תמונות" כדי להוסיף
            </Text>
          )}
        </View>
      </View>
    );
  };

  // ─── Items List ─────────────────────────────────────────────
  const renderItems = () => {
    if (!currentSection) return null;
    return (
      <View style={cs.contentCard}>
        {childrenOf && (
          <TouchableOpacity onPress={() => setChildrenOf(null)} style={{ marginBottom: 10, alignSelf: 'flex-end' }}>
            <Text style={{ color: Colors.PRIMARY, fontSize: 14, fontWeight: '600' }}>→ חזרה ל{currentSection.label}</Text>
          </TouchableOpacity>
        )}
        <View style={cs.contentHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={cs.contentTitle}>
              {childrenOf ? `תת-קטגוריות של ${childrenOf.title}` : currentSection.label}
            </Text>
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

        {currentItems.map((item, idx) => {
          const rowInner = (
            <View style={[cs.itemRow, isWide && cs.itemRowWide]}>
              <View style={cs.orderBtns}>
                <Text style={{ fontSize: 18, color: '#999', ...(Platform.OS === 'web' ? ({ cursor: 'grab' } as any) : {}) }}>⋮⋮</Text>
                <Text style={cs.orderNum}>{idx + 1}</Text>
                {Platform.OS !== 'web' && (
                  <>
                    <TouchableOpacity onPress={() => moveItem(idx, -1)} disabled={idx === 0}>
                      <Text style={[cs.orderArrow, idx === 0 && { opacity: 0.2 }]}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveItem(idx, 1)} disabled={idx === currentItems.length - 1}>
                      <Text style={[cs.orderArrow, idx === currentItems.length - 1 && { opacity: 0.2 }]}>▼</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={[cs.colorBar, { backgroundColor: item.bg }]} />
              {item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'))
                ? (Platform.OS === 'web'
                    ? React.createElement('img', { src: item.icon, style: { width: 60, height: 36, objectFit: 'cover', borderRadius: 6 }, alt: '' })
                    : null)
                : <Text style={cs.itemIcon}>{item.icon}</Text>}

              <View style={cs.itemInfo}>
                <Text style={cs.itemTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={cs.itemSub}>{item.subtitle}</Text> : null}
                {!isWide && item.address ? <Text style={cs.itemMeta}>📍 {item.address}</Text> : null}
                {!isWide && item.audio ? <Text style={cs.itemMeta}>🎧 אודיו מצורף</Text> : null}
              </View>

              {isWide && currentSection.hasLocation && (
                <Text style={[cs.itemMeta, { width: 120 }]}>{item.address || '—'}</Text>
              )}
              {isWide && currentSection.hasAudio && (
                <Text style={[cs.itemMeta, { width: 80 }]}>{item.audio ? '✓' : '—'}</Text>
              )}

              {canHaveChildren && !childrenOf && (
                <TouchableOpacity
                  style={[cs.editBtn, { backgroundColor: '#fff3e0' }]}
                  onPress={() => setChildrenOf(item)}
                >
                  <Text style={[cs.editTxt, { color: Colors.ACCENT }]}>
                    תת-קטגוריות ({(item.children || []).length})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={cs.editBtn} onPress={() => setEditItem(item)}>
                <Text style={cs.editTxt}>ערוך</Text>
              </TouchableOpacity>
            </View>
          );

          if (Platform.OS === 'web') {
            return React.createElement('div', {
              key: item.id,
              draggable: true,
              onDragStart: (e: any) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); },
              onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
              onDrop: (e: any) => {
                e.preventDefault();
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(from)) reorderItem(from, idx);
              },
              style: { cursor: 'move' },
            }, rowInner);
          }
          return <View key={item.id}>{rowInner}</View>;
        })}

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
            contentContainerStyle={[ds.contentInner, isDesktop && { maxWidth: 900, marginLeft: 'auto', marginRight: 0 }]}
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
            {activeNav === 'texts' ? renderTexts()
              : activeNav === 'media' ? renderMedia()
              : activeNav === 'gallery' ? renderGallery()
              : renderItems()}

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
        onMoveSection={(target) => {
          if (!editItem || childrenOf) return;
          if (target === activeNav) return;
          const fromKey = activeNav;
          const fromItems = (data[fromKey] || []).filter(i => i.id !== editItem.id);
          const toItems = [...(data[target] || []), editItem];
          saveSection(fromKey, fromItems);
          saveSection(target, toItems);
          setActiveNav(target);
          setEditItem(null);
        }}
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
  statsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: 140, backgroundColor: Colors.WHITE, borderRadius: 14, padding: 16,
    alignItems: 'flex-end',
    borderRightWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statNum: { fontSize: 28, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
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
  itemIcon: { fontSize: 36 },
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
