import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Image,
  useWindowDimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { fetchContent, updateAllContent, updateSection, fetchRatings, API_BASE } from '../../constants/api';

// ─── Types ─────────────────────────────────────────────────────
type HotelBlock = {
  id: string; title: string; titleEn?: string; text: string; image: string;
  mapUrl?: string; pageUrl?: string;
  coords?: { lat: number; lng: number };
  visible?: boolean;
  images?: string[];
  amenities?: string[];
};
type TourBlock = {
  id: string; title: string; subtitle?: string; text: string; color: string;
  images: string[]; audios: Array<{ title?: string; url: string; coords?: { lat: number; lng: number } }>;
  visible?: boolean;
  coords?: { lat: number; lng: number };
};
type DataItem = {
  id: string; title: string; subtitle?: string; icon: string; bg: string;
  image?: string; audio?: string; video?: string; lat?: string; lng?: string; address?: string;
  summary?: string; longText?: string; heroBg?: string;
  btnLabel?: string; btnLink?: string;
  audios?: Array<{ title?: string; url: string }>;
  children?: DataItem[];
  hotels?: HotelBlock[];
  tours?: TourBlock[];
  pageBtnLabel?: string;
  cardStyle?: string;
  article?: any;
};

const HERO_PALETTE = [
  '#2D4A5E', '#F7F3ED', '#1A6B8A', '#3DA5C4', '#7ECFC0', '#F4A94E',
];

const EMOJI_LIBRARY = [
  // לינה ואירוח
  '🏨','🏩','🏢','🏖️','🏡','🛏️','🏘️','🛎️','🔑','🧳',
  // אטרקציות ואתרים
  '🎡','📸','🏛️','🗿','🏰','⛲','🎭','🖼️','🏺','🗺️',
  // סיורים ואודיו
  '🎧','🎶','🎤','🎵','🎙️','📻','🔊','🎼',
  // דת והיסטוריה
  '✡️','⛪','🕌','🕍','✝️','☪️','🕎','📜',
  // מסעדות ואוכל
  '🍽️','🥂','🍔','🌭','🍕','🍣','🥘','🧀','🍷','☕','🍺','🥐','🍰',
  // בילוי וחיי לילה
  '🎰','💃','🎤','🍸','🪩','🎪','🎬','🎯',
  // תחבורה
  '🚕','🚌','🚆','🚐','🚍','✈️','🚲','🚗','🛵','⛽','🚢','🚁',
  // קניות
  '🛍️','🛒','💳','🏪','🎁','💎',
  // ספורט ובריאות
  '🏋️','⛷️','🏊','🧘','🏃','🚣','🤿','🐴','🎾','⚽','🏀','🎿',
  // ספא ורווחה
  '💆','🧖','♨️','💅',
  // טבע ומזג אוויר
  '🌊','🌳','🌺','🌤️','🌈','🏔️','🌿','🦋',
  // כללי
  '📱','💡','💰','📰','🏠','💼','📍','🏙️','⭐','🏥','🛡️','💱','🇮🇱','🇬🇪',
  // מדריכים ושירותים
  '🛂','🧭','📞','💬','👤','🤝','📋','🔒',
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
  { key: 'bottom', label: 'מידע Online', icon: '🏷️', storageKey: '@admin_bottom_banners', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_BOTTOM_BANNERS },
  { key: 'side', label: 'פורטל הנדל״ן', icon: '📌', storageKey: '@admin_side_banners', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: false, defaults: DEFAULT_SIDE_BANNERS },
  { key: 'locations', label: 'מיקומים ומפה', icon: '📍', storageKey: '@admin_locations', hasSubtitle: true, hasImage: false, hasAudio: false, hasLocation: true, hasSummary: false, hasLongText: false, defaults: DEFAULT_LOCATIONS },
  // audio section removed - files managed via media folders
  { key: 'legal', label: 'מידע חובה', icon: '📜', storageKey: '@admin_legal', hasSubtitle: false, hasImage: false, hasAudio: false, hasLocation: false, hasSummary: false, hasLongText: true, defaults: DEFAULT_LEGAL },
];

const TAG_GROUPS: { group: string; icon: string; tags: { key: string; label: string }[]; subgroups?: { label: string; tags: { key: string; label: string }[] }[] }[] = [
  { group: 'קטגוריות ראשיות', icon: '📂', subgroups: [
    { label: '🏨 אירוח ולינה', tags: [{ key: 'h1', label: 'מלונות יוקרה' },{ key: 'h2', label: 'מלונות 3-4' },{ key: 'h3', label: 'דירות נופש' },{ key: 'h4', label: 'כפרי נופש' },{ key: 'h5', label: 'ווילות' },{ key: 'h6', label: 'אכסניות' }] },
    { label: '🎡 אטרקציות ואתרים', tags: [{ key: 'a1', label: 'אטרקציות' },{ key: 'a2', label: 'אתרים פופולריים' },{ key: 'a3', label: 'היסטוריים' },{ key: 'a5', label: 'יהדות' },{ key: 'a6', label: 'נצרות' },{ key: 'a7', label: 'אוטובוס' },{ key: 'a8', label: 'נסיעות פרטיות' }] },
    { label: '🎧 סיורים קוליים', tags: [{ key: 'tours', label: 'סיורים קוליים' }] },
    { label: '🍽️ מסעדות ואוכל', tags: [{ key: 'r1', label: 'פופולריות' },{ key: 'r2', label: 'יוקרה' },{ key: 'r4', label: 'כשרות' },{ key: 'r3', label: 'רשתות' },{ key: 'r5', label: 'מהיר' },{ key: 'r6', label: 'שווה להכיר' }] },
    { label: '🍻 בילוי וחיי לילה', tags: [{ key: 'n1', label: 'מועדונים' },{ key: 'n2', label: 'פאבים' },{ key: 'n3', label: 'הופעות' },{ key: 'n4', label: 'חשפנות' }] },
    { label: '🚕 תחבורה', tags: [{ key: 't1', label: 'מוניות' },{ key: 't2', label: 'ציבורית' },{ key: 't3', label: 'רכבות' },{ key: 't4', label: 'רכב' },{ key: 't5', label: 'אופניים' },{ key: 't6', label: 'טיסות' }] },
  ], tags: [
    { key: 'main_unsorted', label: '📥 לא ממויין' },{ key: 'h1', label: 'מלונות יוקרה' },{ key: 'h2', label: 'מלונות 3-4' },{ key: 'h3', label: 'דירות נופש' },{ key: 'h4', label: 'כפרי נופש' },{ key: 'h5', label: 'ווילות' },{ key: 'h6', label: 'אכסניות' },
    { key: 'a1', label: 'אטרקציות' },{ key: 'a2', label: 'אתרים פופולריים' },{ key: 'a3', label: 'היסטוריים' },{ key: 'a5', label: 'יהדות' },{ key: 'a6', label: 'נצרות' },{ key: 'a7', label: 'אוטובוס' },{ key: 'a8', label: 'נסיעות פרטיות' },
    { key: 'tours', label: 'סיורים קוליים' },
    { key: 'r1', label: 'פופולריות' },{ key: 'r2', label: 'יוקרה' },{ key: 'r4', label: 'כשרות' },{ key: 'r3', label: 'רשתות' },{ key: 'r5', label: 'מהיר' },{ key: 'r6', label: 'שווה להכיר' },
    { key: 'n1', label: 'מועדונים' },{ key: 'n2', label: 'פאבים' },{ key: 'n3', label: 'הופעות' },{ key: 'n4', label: 'חשפנות' },
    { key: 't1', label: 'מוניות' },{ key: 't2', label: 'ציבורית' },{ key: 't3', label: 'רכבות' },{ key: 't4', label: 'רכב' },{ key: 't5', label: 'אופניים' },{ key: 't6', label: 'טיסות' },
  ]},
  { group: 'קטגוריות נוספות', icon: '📁', subgroups: [
    { label: '🛍️ קניות ומתנות', tags: [{ key: 'sh1', label: 'שופינג' },{ key: 'sh2', label: 'סופרמרקטים' },{ key: 'sh3', label: 'החזרי מס' }] },
    { label: '🏋️ ספורט', tags: [{ key: 'sp1', label: 'כושר' },{ key: 'sp2', label: 'ספא' },{ key: 'sp3', label: 'בריכות' },{ key: 'sp4', label: 'חוף' },{ key: 'sp5', label: 'ריצה' },{ key: 'sp6', label: 'יוגה' },{ key: 'sp7', label: 'ריקוד' },{ key: 'sp8', label: 'מגרשים' }] },
    { label: '⛷️ אקסטרים', tags: [{ key: 'ex1', label: 'סקי' },{ key: 'ex2', label: 'ג׳יפים' },{ key: 'ex3', label: 'טרקטורונים' },{ key: 'ex4', label: 'פרגליידינג' },{ key: 'ex5', label: 'רפטינג' },{ key: 'ex6', label: 'קניונינג' },{ key: 'ex7', label: 'סוסים' },{ key: 'ex8', label: 'צלילה' }] },
    { label: '🛂 מדריכים', tags: [{ key: 'guides', label: 'מדריכים' }] },
    { label: '🎰 קזינו', tags: [{ key: 'casino', label: 'קזינו' }] },
  ], tags: [
    { key: 'extra_unsorted', label: '📥 לא ממויין' },{ key: 'sh1', label: 'שופינג' },{ key: 'sh2', label: 'סופרמרקטים' },{ key: 'sh3', label: 'החזרי מס' },
    { key: 'sp1', label: 'כושר' },{ key: 'sp2', label: 'ספא' },{ key: 'sp3', label: 'בריכות' },{ key: 'sp4', label: 'חוף' },{ key: 'sp5', label: 'ריצה' },{ key: 'sp6', label: 'יוגה' },{ key: 'sp7', label: 'ריקוד' },{ key: 'sp8', label: 'מגרשים' },
    { key: 'ex1', label: 'סקי' },{ key: 'ex2', label: 'ג׳יפים' },{ key: 'ex3', label: 'טרקטורונים' },{ key: 'ex4', label: 'פרגליידינג' },{ key: 'ex5', label: 'רפטינג' },{ key: 'ex6', label: 'קניונינג' },{ key: 'ex7', label: 'סוסים' },{ key: 'ex8', label: 'צלילה' },
    { key: 'guides', label: 'מדריכים' },{ key: 'casino', label: 'קזינו' },
  ]},
  { group: 'סליידר ברוכים הבאים', icon: '👋', tags: [{ key: 'welcome', label: 'ברוכים הבאים' }] },
  { group: 'פורטל המידע', icon: '📋', tags: [{ key: 'info', label: 'פורטל מידע' }] },
  { group: 'מידע Online', icon: '🏷️', tags: [{ key: 'bottom', label: 'מידע Online' }] },
  { group: 'פורטל הנדל״ן', icon: '📌', tags: [{ key: 'realestate', label: 'נדל״ן' },{ key: 'business', label: 'עסקים' }] },
  { group: 'מיקומים ומפה', icon: '📍', tags: [{ key: 'locations', label: 'מיקומים' }] },
  { group: 'קבצי אודיו', icon: '🎧', tags: [{ key: 'player', label: 'נגן' }] },
  { group: 'מידע חובה', icon: '📜', tags: [{ key: 'legal', label: 'מידע חובה' }] },
  { group: 'תמונות', icon: '🖼️', tags: [{ key: 'icon', label: 'אייקון' },{ key: 'gallery', label: 'גלריה' },{ key: 'home', label: 'גלריית בית' }] },
  { group: 'גלריה', icon: '🎞️', tags: [{ key: 'gallery_main', label: 'גלריה ראשית' }] },
];
const TAG_OPTIONS = TAG_GROUPS.flatMap(g => g.tags);

const NAV_ITEMS = [
  { key: 'texts', label: 'דף הבית', icon: '✏️' },
  ...SECTIONS.map(s => ({ key: s.key, label: s.label, icon: s.icon })),
  { key: 'subscription', label: 'ניהול מנויים', icon: '💳' },
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
  visible, item, section, onSave, onDelete, onClose, isWide, onMoveSection, allMedia, ratings,
}: {
  visible: boolean; item: DataItem | null; section: Section | null;
  onSave: (item: DataItem) => void; onDelete: () => void; onClose: () => void;
  isWide: boolean;
  onMoveSection?: (target: 'main' | 'extra') => void;
  allMedia?: { filename: string; url: string; tags?: string[] }[];
  ratings?: Record<string, { sum: number; count: number }>;
}) {
  const [form, setForm] = useState<DataItem>({ id: '', title: '', icon: '', bg: '' });
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPickerFilter, setGalleryPickerFilter] = useState('');

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
              <TouchableOpacity
                style={{ backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginTop: 8 }}
                onPress={() => {
                  setShowGalleryPicker(true);
                  const sKey = section?.key || '';
                  const matchTag = TAG_OPTIONS.find(t => t.key === sKey || t.key === form.id);
                  const matchGroup = TAG_GROUPS.find((g: any) => g.group === section?.label || g.tags.some((t: any) => t.key === sKey));
                  setGalleryPickerFilter(matchTag?.key || (matchGroup?.tags[0]?.key) || '');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>📁 בחר מהגלריה</Text>
              </TouchableOpacity>
              {showGalleryPicker && allMedia && (
                <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, backgroundColor: '#f8fafc', maxHeight: 350 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.TEXT }}>בחר תמונה</Text>
                    <TouchableOpacity onPress={() => setShowGalleryPicker(false)}>
                      <Text style={{ fontSize: 18, color: '#999' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {Platform.OS === 'web' && React.createElement('select', {
                    value: galleryPickerFilter,
                    onChange: (e: any) => setGalleryPickerFilter(e.target.value),
                    style: { width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, fontWeight: 700, direction: 'rtl', cursor: 'pointer', marginBottom: 8 },
                  }, [
                    React.createElement('option', { key: '', value: '' }, 'הכל'),
                    ...TAG_GROUPS.map((g: any) => g.subgroups
                      ? g.subgroups.map((sg: any) => React.createElement('optgroup', { key: sg.label, label: sg.label }, sg.tags.map((t: any) => React.createElement('option', { key: t.key, value: t.key }, t.label))))
                      : React.createElement('optgroup', { key: g.group, label: g.group }, g.tags.map((t: any) => React.createElement('option', { key: t.key, value: t.key }, t.label)))
                    ).flat(),
                  ])}
                  <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                    {allMedia.filter(f => {
                      if (/\.(mp3|wav|m4a|aac)$/i.test(f.filename)) return false;
                      if (!galleryPickerFilter) return true;
                      return (f.tags || []).includes(galleryPickerFilter);
                    }).map(f => (
                      <TouchableOpacity key={f.filename} onPress={() => { set('icon', f.url); setShowGalleryPicker(false); }} activeOpacity={0.7}>
                        {Platform.OS === 'web' && React.createElement('img', {
                          src: f.url,
                          style: { width: 70, height: 50, objectFit: 'cover', borderRadius: 6, border: '2px solid transparent', cursor: 'pointer' },
                          alt: f.filename,
                        })}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text style={{ fontSize: 11, color: '#999', marginTop: 6, textAlign: 'right' }}>
                התמונה תיחתך אוטומטית ליחס 170×100 עם פינות עליונות מעוגלות
              </Text>
            </View>

            <View style={ms.fieldGroup}>
              <TouchableOpacity
                onPress={() => setForm(prev => ({ ...prev, _emojiOpen: !prev._emojiOpen } as any))}
                style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}
              >
                <Text style={ms.label}>או בחר אימוג׳י ({EMOJI_LIBRARY.length})</Text>
                <Text style={{ fontSize: 14, color: Colors.PRIMARY }}>{(form as any)._emojiOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {(form as any)._emojiOpen && (
                  <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {EMOJI_LIBRARY.map((e, i) => {
                      const selected = form.icon === e;
                      const used = false;
                      return (
                        <TouchableOpacity
                          key={`${e}-${i}`}
                          onPress={() => set('icon', e)}
                          style={{
                            width: 40, height: 40, borderRadius: 8,
                            backgroundColor: selected ? Colors.PRIMARY + '20' : used ? '#2a2a2a' : '#fafafa',
                            borderWidth: selected ? 2 : 1,
                            borderColor: selected ? Colors.PRIMARY : used ? '#555' : '#e8e8e8',
                            alignItems: 'center', justifyContent: 'center',
                            opacity: used ? 0.4 : 1,
                          }}
                        >
                          <Text style={{ fontSize: 22 }}>{e}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
              )}
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

            {form.hotels && (
              <View style={ms.fieldGroup}>
                <Text style={[ms.label, { fontSize: 16, marginBottom: 10 }]}>בלוקי מלונות ({form.hotels.length})</Text>
                {form.hotels.map((hb, idx) => (
                  <View key={hb.id} style={{ borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#fafafa' }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.PRIMARY }}>מיקום</Text>
                        <TextInput
                          style={{ width: 50, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center', fontSize: 14, fontWeight: '700', backgroundColor: Colors.WHITE }}
                          value={String(idx + 1)}
                          keyboardType="numeric"
                          onSubmitEditing={(e) => {
                            const target = parseInt(e.nativeEvent.text, 10);
                            if (!target || target < 1 || target > (form.hotels || []).length) return;
                            const arr = [...(form.hotels || [])];
                            const [moved] = arr.splice(idx, 1);
                            arr.splice(target - 1, 0, moved);
                            setForm(p => ({ ...p, hotels: arr }));
                          }}
                          onBlur={(e) => {
                            const target = parseInt((e.nativeEvent as any).text, 10);
                            if (!target || target < 1 || target > (form.hotels || []).length || target === idx + 1) return;
                            const arr = [...(form.hotels || [])];
                            const [moved] = arr.splice(idx, 1);
                            arr.splice(target - 1, 0, moved);
                            setForm(p => ({ ...p, hotels: arr }));
                          }}
                        />
                        <Text style={{ fontSize: 12, color: '#888' }}>/ {(form.hotels || []).length}</Text>
                      </View>
                      <View style={{ flexDirection: 'row-reverse', gap: 10, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],visible:!(n[idx].visible!==false)}; setForm(p=>({...p,hotels:n})); }}
                          style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: (hb.visible !== false) ? '#10b981' : '#9ca3af' }}
                        >
                          <Text style={{ color: Colors.WHITE, fontSize: 11, fontWeight: '800' }}>{(hb.visible !== false) ? '👁 מוצג' : '🚫 מוסתר'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          const next = (form.hotels || []).filter((_, i) => i !== idx);
                          setForm(p => ({ ...p, hotels: next }));
                        }}>
                          <Text style={{ fontSize: 16, color: '#dc2626' }}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {hb.image && (hb.image.startsWith('http') || hb.image.startsWith('data:')) ? (
                      React.createElement('img', { src: hb.image, style: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }, alt: '' })
                    ) : (
                      <View style={{ width: '100%', height: 120, backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#dc2626', fontWeight: '800' }}>פנוי</Text>
                      </View>
                    )}
                    <Text style={ms.label}>🖼 תמונה (URL)</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={hb.image} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],image:v}; setForm(p=>({...p,hotels:n})); }} placeholder="http://localhost:3001/uploads/..." placeholderTextColor="#bbb" textAlign="left" />

                    <Text style={ms.label}>📝 כותרת</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={hb.title} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],title:v}; setForm(p=>({...p,hotels:n})); }} placeholder="שם המלון" placeholderTextColor="#bbb" textAlign="right" />

                    <Text style={ms.label}>🔤 שם באנגלית (מוצג על התמונה)</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={hb.titleEn || ''} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],titleEn:v}; setForm(p=>({...p,hotels:n})); }} placeholder="English name" placeholderTextColor="#bbb" textAlign="left" />

                    <Text style={ms.label}>📄 טקסט תיאור</Text>
                    <TextInput style={[ms.input, ms.textArea, { marginBottom: 8 }]} value={hb.text} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],text:v}; setForm(p=>({...p,hotels:n})); }} placeholder="תיאור המלון" placeholderTextColor="#bbb" textAlign="right" multiline numberOfLines={4} />

                    <Text style={ms.label}>🔗 כפתור "{form.pageBtnLabel || 'לדף המלון'}" — לינק חיצוני</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={hb.pageUrl || ''} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],pageUrl:v}; setForm(p=>({...p,hotels:n})); }} placeholder="https://..." placeholderTextColor="#bbb" textAlign="left" />

                    <Text style={ms.label}>🧭 כפתור "נווט למקום" — לינק Google Maps</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={hb.mapUrl || ''} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],mapUrl:v}; setForm(p=>({...p,hotels:n})); }} placeholder="https://www.google.com/maps/..." placeholderTextColor="#bbb" textAlign="left" />

                    <Text style={ms.label}>🏷️ תגיות מידע מהיר (לחץ להוסיף/להסיר)</Text>
                    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {['קזינו', 'בריכה', 'ספא'].map(tag => {
                        const has = (hb.amenities || []).includes(tag);
                        return (
                          <TouchableOpacity key={tag} onPress={() => {
                            const n=[...(form.hotels||[])];
                            const cur = n[idx].amenities || [];
                            n[idx]={...n[idx], amenities: has ? cur.filter(a => a !== tag) : [...cur, tag]};
                            setForm(p=>({...p,hotels:n}));
                          }} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: has ? '#1A6B8A' : '#f0f4f8', borderWidth: 1, borderColor: has ? '#1A6B8A' : '#e2e8f0' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: has ? '#fff' : '#64748b' }}>{tag}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={ms.label}>🖼 גלריית "מה אוכלים" ({(hb.images || []).length}/9)</Text>
                    {(hb.images || []).length > 0 && (
                      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        {(hb.images || []).map((src, gi) => (
                          <View key={gi} style={{ position: 'relative' }}>
                            {Platform.OS === 'web' && React.createElement('img', { src, style: { width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }, alt: '' })}
                            <TouchableOpacity
                              onPress={() => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],images:(n[idx].images||[]).filter((_,i)=>i!==gi)}; setForm(p=>({...p,hotels:n})); }}
                              style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ color: Colors.WHITE, fontSize: 11, fontWeight: '900' }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                    {Platform.OS === 'web' && (hb.images || []).length < 9 && React.createElement('label', {
                      style: {
                        display: 'inline-block', backgroundColor: Colors.SECONDARY, color: '#fff',
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', marginBottom: 8, alignSelf: 'flex-start',
                      },
                    }, [
                      '📁 העלה תמונות מהמחשב',
                      React.createElement('input', {
                        key: 'file',
                        type: 'file',
                        accept: 'image/*',
                        multiple: true,
                        style: { display: 'none' },
                        onChange: async (e: any) => {
                          const files: File[] = Array.from(e.target.files || []);
                          if (!files.length) return;
                          const remaining = 9 - (hb.images || []).length;
                          const slice = files.slice(0, remaining);
                          const uploaded: string[] = [];
                          for (const f of slice) {
                            const fd = new FormData();
                            fd.append('file', f);
                            try {
                              const res = await fetch('/api/upload', { method: 'POST', body: fd });
                              const json = await res.json();
                              if (json.success && json.url) uploaded.push(json.url);
                            } catch {}
                          }
                          const n=[...(form.hotels||[])];
                          n[idx]={...n[idx],images:[...(n[idx].images||[]),...uploaded].slice(0,9)};
                          setForm(p=>({...p,hotels:n}));
                          e.target.value='';
                        },
                      }),
                    ])}

                    <Text style={ms.label}>📍 כפתור "איפה זה" — קואורדינטות (מפה מוטבעת)</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                      <TextInput style={[ms.input, { flex: 1 }]} value={String(hb.coords?.lat ?? '')} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],coords:{lat:parseFloat(v)||0,lng:n[idx].coords?.lng||0}}; setForm(p=>({...p,hotels:n})); }} placeholder="Lat (קו רוחב)" placeholderTextColor="#bbb" textAlign="left" keyboardType="numeric" />
                      <TextInput style={[ms.input, { flex: 1 }]} value={String(hb.coords?.lng ?? '')} onChangeText={v => { const n=[...(form.hotels||[])]; n[idx]={...n[idx],coords:{lat:n[idx].coords?.lat||0,lng:parseFloat(v)||0}}; setForm(p=>({...p,hotels:n})); }} placeholder="Lng (קו אורך)" placeholderTextColor="#bbb" textAlign="left" keyboardType="numeric" />
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={{ paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.PRIMARY, alignItems: 'center' }}
                  onPress={() => {
                    const n = [...(form.hotels || []), { id: `hb_${Date.now()}`, title: '', text: '', image: '', pageUrl: '', mapUrl: '' }];
                    setForm(p => ({ ...p, hotels: n }));
                  }}
                >
                  <Text style={{ color: Colors.WHITE, fontWeight: '700' }}>+ הוסף בלוק</Text>
                </TouchableOpacity>
              </View>
            )}

            {form.article && (
              <View style={ms.fieldGroup}>
                <Text style={[ms.label, { fontSize: 16, marginBottom: 10 }]}>📝 עריכת מאמר</Text>
                {(form.article.sections || []).map((sec: any, idx: number) => (
                  <View key={idx} style={{ borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#fafafa' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.PRIMARY, marginBottom: 6 }}>סקשן {idx + 1}</Text>
                    <TextInput style={[ms.input, { marginBottom: 6 }]} value={sec.icon || ''} onChangeText={(v: string) => { const a={...form.article}; const s=[...(a.sections||[])]; s[idx]={...s[idx],icon:v}; a.sections=s; setForm((p: any)=>({...p,article:a})); }} placeholder="אייקון" placeholderTextColor="#bbb" textAlign="right" />
                    <TextInput style={[ms.input, { marginBottom: 6 }]} value={sec.title || ''} onChangeText={(v: string) => { const a={...form.article}; const s=[...(a.sections||[])]; s[idx]={...s[idx],title:v}; a.sections=s; setForm((p: any)=>({...p,article:a})); }} placeholder="כותרת" placeholderTextColor="#bbb" textAlign="right" />
                    <TextInput style={[ms.input, ms.textArea, { marginBottom: 6 }]} value={sec.tip || ''} onChangeText={(v: string) => { const a={...form.article}; const s=[...(a.sections||[])]; s[idx]={...s[idx],tip:v}; a.sections=s; setForm((p: any)=>({...p,article:a})); }} placeholder="טיפים (שורה = טיפ)" placeholderTextColor="#bbb" textAlign="right" multiline numberOfLines={8} />
                  </View>
                ))}
                {(form.article.apps || []).length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.PRIMARY, marginBottom: 6 }}>📲 אפליקציות</Text>
                    {(form.article.apps || []).map((app: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 6 }}>
                        <TextInput style={[ms.input, { flex: 1 }]} value={app.name || ''} onChangeText={(v: string) => { const a={...form.article}; const apps=[...(a.apps||[])]; apps[idx]={...apps[idx],name:v}; a.apps=apps; setForm((p: any)=>({...p,article:a})); }} placeholder="שם" placeholderTextColor="#bbb" textAlign="right" />
                        <TextInput style={[ms.input, { flex: 1 }]} value={app.subtitle || ''} onChangeText={(v: string) => { const a={...form.article}; const apps=[...(a.apps||[])]; apps[idx]={...apps[idx],subtitle:v}; a.apps=apps; setForm((p: any)=>({...p,article:a})); }} placeholder="תיאור" placeholderTextColor="#bbb" textAlign="right" />
                        <TextInput style={[ms.input, { flex: 1 }]} value={app.url || ''} onChangeText={(v: string) => { const a={...form.article}; const apps=[...(a.apps||[])]; apps[idx]={...apps[idx],url:v}; a.apps=apps; setForm((p: any)=>({...p,article:a})); }} placeholder="URL" placeholderTextColor="#bbb" textAlign="left" />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {form.tours && (
              <View style={ms.fieldGroup}>
                <Text style={[ms.label, { fontSize: 16, marginBottom: 10 }]}>בלוקי סיורים קוליים ({form.tours.length})</Text>
                {form.tours.map((tb, idx) => (
                  <View key={tb.id} style={{ borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: tb.color || '#f9f9f9' }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.TEXT }}>בלוק {idx + 1}</Text>
                        {ratings?.[tb.id] && ratings[tb.id].count > 0 && (
                          <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>⭐ {(ratings[tb.id].sum / ratings[tb.id].count).toFixed(1)} ({ratings[tb.id].count} דירוגים)</Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row-reverse', gap: 10, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => { const n=[...(form.tours||[])]; n[idx]={...n[idx],visible:!(n[idx].visible!==false)}; setForm(p=>({...p,tours:n})); }}
                          style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: (tb.visible !== false) ? '#10b981' : '#9ca3af' }}
                        >
                          <Text style={{ color: Colors.WHITE, fontSize: 11, fontWeight: '800' }}>{(tb.visible !== false) ? '👁 מוצג' : '🚫 מוסתר'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={ms.label}>🎨 צבע רקע</Text>
                    <TextInput
                      style={[ms.input, { marginBottom: 8 }]}
                      value={tb.color || ''}
                      onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],color:v}; setForm(p=>({...p,tours:n})); }}
                      placeholder="#B8E6C1"
                      placeholderTextColor="#bbb"
                      textAlign="left"
                    />

                    <Text style={ms.label}>📝 כותרת</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={tb.title} onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],title:v}; setForm(p=>({...p,tours:n})); }} placeholder="שם הסיור" placeholderTextColor="#bbb" textAlign="right" />

                    <Text style={ms.label}>📋 כותרת משנה</Text>
                    <TextInput style={[ms.input, { marginBottom: 8 }]} value={tb.subtitle || ''} onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],subtitle:v}; setForm(p=>({...p,tours:n})); }} placeholder="כותרת משנה" placeholderTextColor="#bbb" textAlign="right" />

                    <Text style={ms.label}>📄 טקסט תיאור</Text>
                    <TextInput style={[ms.input, ms.textArea, { marginBottom: 8 }]} value={tb.text} onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],text:v}; setForm(p=>({...p,tours:n})); }} placeholder="תיאור" placeholderTextColor="#bbb" textAlign="right" multiline numberOfLines={4} />

                    <Text style={ms.label}>🖼 תמונות לסליידר (URL בכל שורה)</Text>
                    <TextInput
                      style={[ms.input, ms.textArea, { marginBottom: 8 }]}
                      value={(tb.images || []).join('\n')}
                      onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],images:v.split('\n').map(s=>s.trim()).filter(Boolean)}; setForm(p=>({...p,tours:n})); }}
                      placeholder="http://localhost:3001/uploads/...&#10;http://localhost:3001/uploads/..."
                      placeholderTextColor="#bbb"
                      textAlign="left"
                      multiline
                      numberOfLines={4}
                    />

                    <Text style={ms.label}>📍 קואורדינטות כלליות של הסיור</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: 8 }}>
                      <TextInput
                        style={[ms.input, { flex: 1 }]}
                        value={String(tb.coords?.lat ?? '')}
                        onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],coords:{lat:parseFloat(v)||0,lng:n[idx].coords?.lng||0}}; setForm(p=>({...p,tours:n})); }}
                        placeholder="Lat"
                        placeholderTextColor="#bbb"
                        textAlign="left"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[ms.input, { flex: 1 }]}
                        value={String(tb.coords?.lng ?? '')}
                        onChangeText={v => { const n=[...(form.tours||[])]; n[idx]={...n[idx],coords:{lat:n[idx].coords?.lat||0,lng:parseFloat(v)||0}}; setForm(p=>({...p,tours:n})); }}
                        placeholder="Lng"
                        placeholderTextColor="#bbb"
                        textAlign="left"
                        keyboardType="numeric"
                      />
                    </View>

                    <Text style={ms.label}>🎧 נגנים ({(tb.audios || []).length})</Text>
                    {(tb.audios || []).map((au, aIdx) => (
                      <View key={aIdx} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 8, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.6)' }}>
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.TEXT }}>תחנה {aIdx + 1}</Text>
                          <TouchableOpacity
                            onPress={() => { const n=[...(form.tours||[])]; const a=(n[idx].audios||[]).filter((_,i)=>i!==aIdx); n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                          >
                            <Text style={{ color: '#dc2626', fontSize: 16 }}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          style={[ms.input, { marginBottom: 4 }]}
                          value={au.title || ''}
                          onChangeText={v => { const n=[...(form.tours||[])]; const a=[...(n[idx].audios||[])]; a[aIdx]={...a[aIdx],title:v}; n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                          placeholder="שם תחנה"
                          placeholderTextColor="#bbb"
                          textAlign="right"
                        />
                        <TextInput
                          style={[ms.input, { marginBottom: 4 }]}
                          value={au.url}
                          onChangeText={v => { const n=[...(form.tours||[])]; const a=[...(n[idx].audios||[])]; a[aIdx]={...a[aIdx],url:v}; n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                          placeholder="URL אודיו"
                          placeholderTextColor="#bbb"
                          textAlign="left"
                        />
                        <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                          <TextInput
                            style={[ms.input, { flex: 1 }]}
                            value={String(au.coords?.lat ?? '')}
                            onChangeText={v => { const n=[...(form.tours||[])]; const a=[...(n[idx].audios||[])]; a[aIdx]={...a[aIdx],coords:{lat:parseFloat(v)||0,lng:a[aIdx].coords?.lng||0}}; n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                            placeholder="Lat"
                            placeholderTextColor="#bbb"
                            textAlign="left"
                            keyboardType="numeric"
                          />
                          <TextInput
                            style={[ms.input, { flex: 1 }]}
                            value={String(au.coords?.lng ?? '')}
                            onChangeText={v => { const n=[...(form.tours||[])]; const a=[...(n[idx].audios||[])]; a[aIdx]={...a[aIdx],coords:{lat:a[aIdx].coords?.lat||0,lng:parseFloat(v)||0}}; n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                            placeholder="Lng"
                            placeholderTextColor="#bbb"
                            textAlign="left"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={{ paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.SECONDARY, alignItems: 'center' }}
                      onPress={() => { const n=[...(form.tours||[])]; const a=[...(n[idx].audios||[]),{title:'',url:''}]; n[idx]={...n[idx],audios:a}; setForm(p=>({...p,tours:n})); }}
                    >
                      <Text style={{ color: Colors.WHITE, fontWeight: '700', fontSize: 13 }}>+ הוסף נגן</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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
  const [extraGroupVisible, setExtraGroupVisible] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<{ filename: string; originalName?: string; url: string; tags?: string[] }[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<{ filename: string; url: string }[]>([]);
  const [mediaFilter, setMediaFilter] = useState<string>('');
  const [mediaFolder, setMediaFolder] = useState<string>('');
  const [dragOverIdx, setDragOverIdx] = useState<number>(-1);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [mediaVersion, setMediaVersion] = useState(0);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});
  const [subBlock, setSubBlock] = useState<any>(null);
  const [subTab, setSubTab] = useState<'banner' | 'dashboard' | 'crm' | 'marketing' | 'accounting' | 'cancels'>('dashboard');

  const refreshMedia = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/uploads`);
      const json = await res.json();
      if (json.success) { setMediaFiles(json.files); setMediaVersion(v => v + 1); }
    } catch {}
  }, []);

  const refreshGallery = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery`);
      const json = await res.json();
      if (json.success) setGalleryFiles(json.files);
    } catch {}
  }, []);

  useEffect(() => {
    refreshMedia();
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
        if (typeof apiData.extraGroupVisible === 'boolean') setExtraGroupVisible(apiData.extraGroupVisible);
        try { const r = await fetchRatings(); setRatings(r); } catch {}
        if (apiData.subscriptionBlock) setSubBlock(apiData.subscriptionBlock);
        // Clear stale AsyncStorage
        for (const s of SECTIONS) await AsyncStorage.removeItem(s.storageKey).catch(() => {});
      } catch {
        // API failed - show defaults only, no stale cache
        const loaded: Record<string, DataItem[]> = {};
        for (const s of SECTIONS) {
          loaded[s.key] = s.defaults;
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
    // Tour block single-edit path
    if (updated.id && updated.id.startsWith('__tour__') && childrenOf && updated.tours && updated.tours.length === 1) {
      const parts = updated.id.split('__');
      const tourIdx = parseInt(parts[3], 10);
      const items = [...(data[activeNav] || [])];
      const pIdx = items.findIndex(i => i.id === childrenOf.id);
      if (pIdx >= 0) {
        const parent = items[pIdx];
        const newTours = [...(parent.tours || [])];
        newTours[tourIdx] = updated.tours[0];
        const newParent = { ...parent, tours: newTours };
        items[pIdx] = newParent;
        saveSection(activeNav, items);
        setChildrenOf(newParent);
      }
      setEditItem(null);
      return;
    }
    if (childrenOf && !toursMode) {
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
    if (toursMode && childrenOf) {
      const tours = [...(childrenOf.tours || [])];
      if (from >= tours.length || to >= tours.length) return;
      const [moved] = tours.splice(from, 1);
      tours.splice(to, 0, moved);
      const items = [...(data[activeNav] || [])];
      const pIdx = items.findIndex(i => i.id === childrenOf.id);
      if (pIdx >= 0) {
        const newParent = { ...items[pIdx], tours };
        items[pIdx] = newParent;
        saveSection(activeNav, items);
        setChildrenOf(newParent);
      }
      return;
    }
    const source = childrenOf ? (childrenOf.children || []) : (data[activeNav] || []);
    const items = [...source];
    if (from >= items.length || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    if (childrenOf) saveChildren(items); else saveSection(activeNav, items);
  };

  const currentSection = SECTIONS.find(s => s.key === activeNav) || null;
  const toursMode = !!(childrenOf && childrenOf.tours && childrenOf.tours.length > 0);
  const currentItems: DataItem[] = toursMode
    ? (childrenOf!.tours!.map((t, i) => ({
        id: t.id,
        title: t.title || `בלוק ${i + 1}`,
        subtitle: t.text ? t.text.slice(0, 60) : '',
        icon: '🎧',
        bg: t.color,
        _tourIdx: i,
      } as DataItem & { _tourIdx: number })))
    : childrenOf
      ? (childrenOf.children || [])
      : (data[activeNav] || []);
  const canHaveChildren = activeNav === 'main' || activeNav === 'extra';

  // ─── Sidebar / Nav ──────────────────────────────────────────
  const renderNav = () => (
    <View style={[ns.nav, isWide && ns.navWide]}>
      <View style={ns.navHeader}>
        <Image source={require('../../assets/images/batumi_icon_light.png')} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="contain" />
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
              <Text key={`${item.key}-${mediaVersion}`} style={ns.navBadge}>{item.key === 'media' ? mediaFiles.length : item.key === 'gallery' ? galleryFiles.length : item.key === 'audio' ? mediaFiles.filter(f => /\.(mp3|wav|m4a|aac)$/i.test(f.filename)).length : (data[item.key] || []).length}</Text>
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

  // ─── Subscription Block ─────────────────────────────────────
  const saveSubBlock = async (updated: any) => {
    setSubBlock(updated);
    try {
      await fetch(`${API_BASE}/api/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionBlock: updated }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const [subTabOrder, setSubTabOrder] = useState([
    { key: 'dashboard' as const, label: 'דשבורד לקוחות', icon: '👥' },
    { key: 'crm' as const, label: 'CRM', icon: '🤝' },
    { key: 'accounting' as const, label: 'הנה״ח', icon: '📊' },
    { key: 'cancels' as const, label: 'ביטולים', icon: '❌' },
    { key: 'marketing' as const, label: 'שיווק ופרסום', icon: '📣' },
    { key: 'banner' as const, label: 'באנר פרסום', icon: '📢' },
  ]);
  const [dragTabIdx, setDragTabIdx] = useState(-1);
  const [demoMode, setDemoMode] = useState(true);

  const tabColors: Record<string, string> = { dashboard: '#1A6B8A', crm: '#8b5cf6', marketing: '#f59e0b', accounting: '#3b82f6', cancels: '#dc2626', banner: '#64748b' };

  const renderSubscription = () => {
    const activeColor = tabColors[subTab] || '#1A6B8A';
    return (
      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
          <View style={{ backgroundColor: '#1C2B35', padding: 16 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#F4A94E', writingDirection: 'rtl' }}>💳 ניהול מנויים</Text>
              <TouchableOpacity
                onPress={() => setDemoMode(!demoMode)}
                style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: demoMode ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: demoMode ? '#f59e0b' : '#10b981' }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: demoMode ? '#fbbf24' : '#34d399' }}>{demoMode ? 'מצב דמו' : 'נתוני אמת'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Tabs */}
        {Platform.OS === 'web' ? (
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'row-reverse', gap: 4, marginBottom: 16, flexWrap: 'wrap', background: '#f1f5f9', borderRadius: 14, padding: 4 },
          }, subTabOrder.map((t, i) => {
            const tc = tabColors[t.key] || '#1A6B8A';
            const on = subTab === t.key;
            return React.createElement('div', {
              key: t.key,
              draggable: true,
              onClick: () => setSubTab(t.key),
              onDragStart: (e: any) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
              onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragTabIdx(i); },
              onDragLeave: () => setDragTabIdx(-1),
              onDrop: (e: any) => { e.preventDefault(); setDragTabIdx(-1); const from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!isNaN(from) && from !== i) { const arr = [...subTabOrder]; const [moved] = arr.splice(from, 1); arr.splice(i, 0, moved); setSubTabOrder(arr); } },
              onDragEnd: () => setDragTabIdx(-1),
              style: {
                padding: '8px 14px', borderRadius: 10, cursor: 'grab', userSelect: 'none',
                backgroundColor: on ? tc : 'transparent',
                borderTop: dragTabIdx === i ? `3px solid ${tc}` : '3px solid transparent',
                fontSize: 12, fontWeight: 800, color: on ? '#fff' : '#475569',
                fontFamily: 'Arial, sans-serif',
                transition: 'all 0.15s ease',
              },
            }, `${t.icon} ${t.label}`);
          }))
        ) : (
          <View style={{ flexDirection: 'row-reverse', gap: 4, marginBottom: 16, flexWrap: 'wrap', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4 }}>
            {subTabOrder.map(t => {
              const tc = tabColors[t.key] || '#1A6B8A';
              const on = subTab === t.key;
              return (
                <TouchableOpacity key={t.key} onPress={() => setSubTab(t.key)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: on ? tc : 'transparent' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: on ? '#fff' : '#475569' }}>{t.icon} {t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {subTab === 'banner' ? renderSubBanner()
          : subTab === 'dashboard' ? renderSubDashboard()
          : subTab === 'crm' ? renderSubCrm()
          : subTab === 'marketing' ? renderSubMarketing()
          : subTab === 'accounting' ? renderSubAccounting()
          : renderSubCancels()}
      </View>
    );
  };

  const demoStats = {
    totalDownloads: 1247,
    activeUsers: 389,
    totalPurchases: 156,
    dailyRevenue: 384,
    monthlyRevenue: 8920,
    yearlyRevenue: 67400,
    iosUsers: 98,
    androidUsers: 58,
    recentUsers: [
      { name: 'ישראל כ.', city: 'תל אביב', date: '18/04', plan: 'שנתי', status: 'פעיל', device: 'iOS' },
      { name: 'מיכל ד.', city: 'חיפה', date: '17/04', plan: '30 ימים', status: 'פעיל', device: 'Android' },
      { name: 'אבי ר.', city: 'ירושלים', date: '16/04', plan: 'שנתי', status: 'פעיל', device: 'iOS' },
      { name: 'דנה ל.', city: 'רעננה', date: '15/04', plan: '30 ימים', status: 'פג', device: 'Android' },
      { name: 'יוסי מ.', city: 'באר שבע', date: '14/04', plan: 'שנתי', status: 'פעיל', device: 'iOS' },
    ],
    mapPoints: [
      { city: 'תל אביב', count: 52, pct: 33 },
      { city: 'ירושלים', count: 31, pct: 20 },
      { city: 'חיפה', count: 24, pct: 15 },
      { city: 'רעננה', count: 18, pct: 12 },
      { city: 'באר שבע', count: 12, pct: 8 },
      { city: 'נתניה', count: 10, pct: 6 },
      { city: 'אחר', count: 9, pct: 6 },
    ],
  };

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderRightWidth: 4, borderRightColor: color, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.TEXT }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', writingDirection: 'rtl' }}>{label}</Text>
    </View>
  );

  const renderSubDashboard = () => {
    if (!demoMode) return (
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>ממתין לחיבור מערכת תשלומים</Text>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>נתוני אמת יופיעו כאן לאחר חיבור RevenueCat / Stripe</Text>
      </View>
    );
    return (
    <View style={{ gap: 14 }}>
      {/* Live indicator */}
      <View style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View style={{ backgroundColor: '#1C2B35', padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#F4A94E', textAlign: 'center', marginBottom: 12 }}>📊 סקירה כללית</Text>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>{demoStats.totalDownloads.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>📥 הורדות</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>{demoStats.activeUsers}</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>👥 פעילים</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#22c55e' }}>14</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>🟢 אונליין</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#F4A94E' }}>{demoStats.totalPurchases}</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>💰 רכישות</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Platform split */}
      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#007AFF' }}>
          <View style={{ backgroundColor: '#007AFF', paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>🍎 iOS</Text>
          </View>
          <View style={{ backgroundColor: '#eff6ff', padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#007AFF' }}>{demoStats.iosUsers}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>משתמשים</Text>
          </View>
        </View>
        <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#3DDC84' }}>
          <View style={{ backgroundColor: '#3DDC84', paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>🤖 Android</Text>
          </View>
          <View style={{ backgroundColor: '#f0fdf4', padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#16a34a' }}>{demoStats.androidUsers}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>משתמשים</Text>
          </View>
        </View>
      </View>

      {/* Revenue */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#10b981' }}>
        <View style={{ backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>💰 הכנסות</Text>
        </View>
        <View style={{ backgroundColor: '#f0fdf4', padding: 12 }}>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderRightWidth: 4, borderRightColor: '#10b981' }}>
              <Text style={{ fontSize: 9, color: '#888', fontWeight: '700' }}>יומי</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#10b981' }}>₪{demoStats.dailyRevenue}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderRightWidth: 4, borderRightColor: '#3b82f6' }}>
              <Text style={{ fontSize: 9, color: '#888', fontWeight: '700' }}>חודשי</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#3b82f6' }}>₪{demoStats.monthlyRevenue.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderRightWidth: 4, borderRightColor: '#f59e0b' }}>
              <Text style={{ fontSize: 9, color: '#888', fontWeight: '700' }}>שנתי</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#f59e0b' }}>₪{demoStats.yearlyRevenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* City breakdown */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#3DA5C4' }}>
        <View style={{ backgroundColor: '#3DA5C4', paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>🗺️ התפלגות לפי עיר</Text>
        </View>
        <View style={{ backgroundColor: '#f0f9ff', padding: 12 }}>
        {demoStats.mapPoints.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10, padding: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.TEXT, width: 65, textAlign: 'right', writingDirection: 'rtl' }}>{p.city}</Text>
            <View style={{ flex: 1, height: 20, backgroundColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <View style={{ width: `${p.pct}%`, height: '100%', backgroundColor: i === 0 ? '#1A6B8A' : i === 1 ? '#3DA5C4' : i === 2 ? '#F4A94E' : '#94a3b8', borderRadius: 10 } as any} />
            </View>
            <Text style={{ fontSize: 12, color: '#1C2B35', fontWeight: '800', width: 30, textAlign: 'center' }}>{p.count}</Text>
          </View>
        ))}
        </View>
      </View>

      {/* Recent users */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#8b5cf6' }}>
        <View style={{ backgroundColor: '#8b5cf6', paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>👥 לקוחות אחרונים</Text>
        </View>
        <View style={{ backgroundColor: '#faf5ff', padding: 12 }}>
        {demoStats.recentUsers.map((u, i) => (
          <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < demoStats.recentUsers.length - 1 ? 1 : 0, borderBottomColor: '#e9d5ff', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{u.name}</Text>
              <Text style={{ fontSize: 11, color: '#888', textAlign: 'right', writingDirection: 'rtl' }}>{u.device === 'iOS' ? '🍎' : '🤖'} {u.city} · {u.date} · {u.plan}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: u.status === 'פעיל' ? '#dcfce7' : '#fee2e2' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: u.status === 'פעיל' ? '#16a34a' : '#dc2626' }}>{u.status}</Text>
            </View>
          </View>
        ))}
        </View>
      </View>

      <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' }}>📊 נתוני דמו — יתעדכנו אוטומטית עם חיבור מערכת תשלומים</Text>
      </View>
    </View>
  );
  };

  const demoCrmContacts = [
    { name: 'ישראל כהן', email: 'israel@gmail.com', phone: '054-1234567', plan: 'שנתי', joined: '18/04/2026', lastActive: 'היום', score: 92 },
    { name: 'מיכל דהן', email: 'michal@gmail.com', phone: '052-9876543', plan: '30 ימים', joined: '17/04/2026', lastActive: 'אתמול', score: 78 },
    { name: 'אבי רוזן', email: 'avi@gmail.com', phone: '050-5551234', plan: 'שנתי', joined: '16/04/2026', lastActive: 'לפני 3 ימים', score: 65 },
    { name: 'דנה לוי', email: 'dana@gmail.com', phone: '053-7778899', plan: '30 ימים', joined: '15/04/2026', lastActive: 'לפני שבוע', score: 34 },
    { name: 'יוסי מזרחי', email: 'yossi@gmail.com', phone: '058-1112233', plan: 'שנתי', joined: '14/04/2026', lastActive: 'היום', score: 88 },
  ];

  const renderSubCrm = () => {
    if (!demoMode) return (
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>ממתין לחיבור מערכת תשלומים</Text>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>נתוני אמת יופיעו כאן לאחר חיבור RevenueCat / Stripe</Text>
      </View>
    );
    return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <StatCard icon="👥" label="סה״כ לקוחות" value="156" color="#3DA5C4" />
        <StatCard icon="🔥" label="פעילים השבוע" value="89" color="#10b981" />
        <StatCard icon="⚠️" label="בסיכון נטישה" value="12" color="#f59e0b" />
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' }}>🤝 כרטיסי לקוחות</Text>
        {demoCrmContacts.map((c, i) => (
          <View key={i} style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8f4f8', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' }}>{c.name}</Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>{c.email}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.score >= 80 ? '#dcfce7' : c.score >= 50 ? '#fef3c7' : '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: c.score >= 80 ? '#16a34a' : c.score >= 50 ? '#92400e' : '#dc2626' }}>{c.score}</Text>
                </View>
                <Text style={{ fontSize: 8, color: '#888', marginTop: 1 }}>ציון</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 12, marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: '#888', writingDirection: 'rtl' }}>📱 {c.phone}</Text>
              <Text style={{ fontSize: 10, color: '#888', writingDirection: 'rtl' }}>📦 {c.plan}</Text>
              <Text style={{ fontSize: 10, color: '#888', writingDirection: 'rtl' }}>🕐 {c.lastActive}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' }}>📊 נתוני דמו — יתעדכנו אוטומטית עם חיבור מערכת תשלומים</Text>
      </View>
    </View>
  );
  };

  const demoCoupons = [
    { code: 'BATUMI10', discount: '10%', uses: 23, maxUses: 50, expires: '30/05/2026', status: 'פעיל' },
    { code: 'WELCOME', discount: '7 ימים חינם', uses: 45, maxUses: 100, expires: '31/12/2026', status: 'פעיל' },
    { code: 'FRIEND25', discount: '25%', uses: 12, maxUses: 30, expires: '15/04/2026', status: 'פג' },
  ];

  const demoCampaigns = [
    { name: 'שתף וקבל חודש חינם', shares: 67, conversions: 18, status: 'פעיל' },
    { name: 'מבצע קיץ 2026', shares: 0, conversions: 0, status: 'טיוטה' },
  ];

  const demoPushHistory = [
    { title: '🎧 סיור חדש: חוף הים', sent: 389, opened: 156, date: '17/04/2026' },
    { title: '🔥 מבצע סוף שבוע!', sent: 412, opened: 203, date: '14/04/2026' },
    { title: '📍 עדכון מפות חדש', sent: 350, opened: 128, date: '10/04/2026' },
  ];

  const renderSubMarketing = () => {
    if (!demoMode) return (
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>ממתין לחיבור מערכת תשלומים</Text>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>כלי שיווק יהיו זמינים לאחר חיבור מערכת תשלומים והתראות</Text>
      </View>
    );
    return (
    <View style={{ gap: 16 }}>
      {/* Hero Stats Bar */}
      <View style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View style={{ backgroundColor: '#1C2B35', padding: 18 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#F4A94E', textAlign: 'center', writingDirection: 'rtl', marginBottom: 14 }}>📣 מרכז שיווק ופרסום</Text>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>1,151</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>חשיפות השבוע</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#10b981' }}>487</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>קליקים</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#334155' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#F4A94E' }}>42%</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8' }}>המרה</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Push Notifications */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#6366f1' }}>
        <View style={{ backgroundColor: '#6366f1', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>🔔 התראות פוש</Text>
          <TouchableOpacity style={{ paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#6366f1' }}>+ שלח התראה</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#faf5ff', padding: 12 }}>
          {demoPushHistory.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < demoPushHistory.length - 1 ? 1 : 0, borderBottomColor: '#e9d5ff', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>{Math.round(p.opened / p.sent * 100)}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }}>{p.title}</Text>
                <Text style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>{p.date} · נשלח ל-{p.sent} · נפתח {p.opened}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Coupons */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#F4A94E' }}>
        <View style={{ backgroundColor: '#F4A94E', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>🎟️ קופונים והנחות</Text>
          <TouchableOpacity style={{ paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#F4A94E' }}>+ צור קופון</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#fffbeb', padding: 12 }}>
          {demoCoupons.map((c, i) => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderRightWidth: 4, borderRightColor: c.status === 'פעיל' ? '#10b981' : '#9ca3af' }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#1C2B35', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#F4A94E', letterSpacing: 2 }}>{c.code}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1C2B35' }}>{c.discount}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: c.status === 'פעיל' ? '#dcfce7' : '#fee2e2' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: c.status === 'פעיל' ? '#16a34a' : '#dc2626' }}>{c.status}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#666', writingDirection: 'rtl' }}>שימושים: {c.uses}/{c.maxUses}</Text>
                <Text style={{ fontSize: 11, color: '#666', writingDirection: 'rtl' }}>תוקף: {c.expires}</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginTop: 8 }}>
                <View style={{ height: '100%', width: `${(c.uses / c.maxUses) * 100}%`, backgroundColor: c.status === 'פעיל' ? '#F4A94E' : '#9ca3af', borderRadius: 3 } as any} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Campaigns */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#10b981' }}>
        <View style={{ backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>🚀 קמפיינים</Text>
          <TouchableOpacity style={{ paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981' }}>+ צור קמפיין</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#f0fdf4', padding: 12 }}>
          {demoCampaigns.map((c, i) => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#1C2B35', writingDirection: 'rtl' }}>{c.name}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: c.status === 'פעיל' ? '#10b981' : '#e2e8f0' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: c.status === 'פעיל' ? '#fff' : '#64748b' }}>{c.status}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#3b82f6' }}>{c.shares}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', fontWeight: '700' }}>שיתופים</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#10b981' }}>{c.conversions}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', fontWeight: '700' }}>הרשמות</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#fffbeb', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#f59e0b' }}>{c.shares > 0 ? Math.round(c.conversions / c.shares * 100) : 0}%</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', fontWeight: '700' }}>המרה</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Audience Targeting */}
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#3DA5C4' }}>
        <View style={{ backgroundColor: '#3DA5C4', paddingVertical: 10, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>🎯 קהלי יעד</Text>
        </View>
        <View style={{ backgroundColor: '#f0f9ff', padding: 12, gap: 8 }}>
          {[
            { label: 'כל המשתמשים', count: 156, color: '#3DA5C4' },
            { label: 'מנויים שנתיים', count: 82, color: '#10b981' },
            { label: 'מנויים חודשיים', count: 74, color: '#F4A94E' },
            { label: 'לא רכשו עדיין', count: 233, color: '#6366f1' },
            { label: 'מנוי פג תוקף', count: 18, color: '#dc2626' },
          ].map((seg, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }}>{seg.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: seg.color }}>{seg.count}</Text>
              <TouchableOpacity style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: seg.color }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>שלח</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' }}>📊 נתוני דמו — יתעדכנו אוטומטית עם חיבור מערכת תשלומים</Text>
      </View>
    </View>
  );
  };

  const demoTransactions = [
    { id: 'INV-001', name: 'ישראל כ.', amount: '₪130.8', plan: 'שנתי', date: '18/04/2026', status: 'שולם' },
    { id: 'INV-002', name: 'מיכל ד.', amount: '₪64', plan: '30 ימים', date: '17/04/2026', status: 'שולם' },
    { id: 'INV-003', name: 'אבי ר.', amount: '₪130.8', plan: 'שנתי', date: '16/04/2026', status: 'שולם' },
    { id: 'INV-004', name: 'דנה ל.', amount: '₪64', plan: '30 ימים', date: '15/04/2026', status: 'החזר' },
    { id: 'INV-005', name: 'יוסי מ.', amount: '₪130.8', plan: 'שנתי', date: '14/04/2026', status: 'שולם' },
  ];

  const renderSubAccounting = () => {
    if (!demoMode) return (
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>ממתין לחיבור מערכת תשלומים</Text>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>נתוני אמת יופיעו כאן לאחר חיבור RevenueCat / Stripe</Text>
      </View>
    );
    return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>סה״כ נכנס</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#10b981' }}>₪67,400</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>החזרים</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#dc2626' }}>₪1,280</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>נטו</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#3b82f6' }}>₪66,120</Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' }}>🧾 תנועות אחרונות</Text>
        {demoTransactions.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < demoTransactions.length - 1 ? 1 : 0, borderBottomColor: '#f0f0f0', gap: 8 }}>
            <Text style={{ fontSize: 11, color: '#888', fontWeight: '700', width: 60 }}>{t.id}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{t.name}</Text>
              <Text style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>{t.date} · {t.plan}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: t.status === 'החזר' ? '#dc2626' : '#10b981' }}>{t.amount}</Text>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: t.status === 'שולם' ? '#dcfce7' : '#fee2e2' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: t.status === 'שולם' ? '#16a34a' : '#dc2626' }}>{t.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' }}>📊 נתוני דמו — יתעדכנו אוטומטית עם חיבור מערכת תשלומים</Text>
      </View>
    </View>
  );
  };

  const demoCancels = [
    { name: 'דנה ל.', plan: '30 ימים', date: '15/04/2026', reason: 'לא רלוונטי יותר', refund: '₪64', status: 'הוחזר' },
    { name: 'רונית ש.', plan: 'שנתי', date: '10/04/2026', reason: 'מחיר גבוה', refund: '₪98.2', status: 'הוחזר' },
    { name: 'עמית כ.', plan: '30 ימים', date: '08/04/2026', reason: 'בעיה טכנית', refund: '₪64', status: 'ממתין' },
  ];

  const renderSubCancels = () => {
    if (!demoMode) return (
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>ממתין לחיבור מערכת תשלומים</Text>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>נתוני אמת יופיעו כאן לאחר חיבור RevenueCat / Stripe</Text>
      </View>
    );
    return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>סה״כ ביטולים</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#dc2626' }}>3</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff7ed', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>ממתינים</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#f59e0b' }}>1</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#888', fontWeight: '700' }}>הוחזרו</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#10b981' }}>2</Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' }}>❌ בקשות ביטול</Text>
        {demoCancels.map((c, i) => (
          <View key={i} style={{ backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' }}>{c.name}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c.status === 'הוחזר' ? '#dcfce7' : '#fef3c7' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: c.status === 'הוחזר' ? '#16a34a' : '#92400e' }}>{c.status}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#888', textAlign: 'right', writingDirection: 'rtl' }}>{c.date} · {c.plan} · החזר: {c.refund}</Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }}>סיבה: {c.reason}</Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' }}>📊 נתוני דמו — יתעדכנו אוטומטית עם חיבור מערכת תשלומים</Text>
      </View>
    </View>
  );
  };

  const renderSubBanner = () => {
    if (!subBlock) return <Text style={{ textAlign: 'center', padding: 20, color: '#888' }}>טוען...</Text>;
    const s = subBlock;
    const upd = (key: string, val: any) => saveSubBlock({ ...s, [key]: val });
    const updPlan = (plan: 'plan1' | 'plan2', key: string, val: string) => saveSubBlock({ ...s, [plan]: { ...s[plan], [key]: val } });
    return (
      <View style={{ gap: 14 }}>
        {/* General settings */}
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#64748b' }}>
          <View style={{ backgroundColor: '#64748b', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' }}>✏️ הגדרות כלליות</Text>
          </View>
          <View style={{ backgroundColor: '#f8fafc', padding: 14, gap: 8 }}>
            <View>
              <Text style={ms.label}>📝 כותרת</Text>
              <TextInput style={[ms.input]} value={s.title} onChangeText={v => upd('title', v)} textAlign="right" />
            </View>
            <View>
              <Text style={ms.label}>📋 תיאור</Text>
              <TextInput style={[ms.input, ms.textArea]} value={s.desc} onChangeText={v => upd('desc', v)} textAlign="right" multiline numberOfLines={3} />
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={ms.label}>🎨 צבע רקע</Text>
                <TextInput style={ms.input} value={s.bgColor || ''} onChangeText={v => upd('bgColor', v)} textAlign="left" placeholder="#ffffff" placeholderTextColor="#bbb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ms.label}>🎨 צבע כותרת</Text>
                <TextInput style={ms.input} value={s.titleColor || ''} onChangeText={v => upd('titleColor', v)} textAlign="left" placeholder="#1C2B35" placeholderTextColor="#bbb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ms.label}>🔤 גודל פונט</Text>
                <TextInput style={ms.input} value={String(s.fontSize || 20)} onChangeText={v => upd('fontSize', parseInt(v) || 20)} textAlign="left" keyboardType="numeric" />
              </View>
            </View>
          </View>
        </View>

        {/* Plans side by side */}
        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          {/* Plan 1 */}
          <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#F4A94E' }}>
            <View style={{ backgroundColor: '#F4A94E', paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#fff', textAlign: 'center' }}>📦 מסלול 1</Text>
            </View>
            <View style={{ backgroundColor: '#fffbeb', padding: 10, gap: 6 }}>
              <Text style={ms.label}>שם</Text>
              <TextInput style={ms.input} value={s.plan1?.label || ''} onChangeText={v => updPlan('plan1', 'label', v)} textAlign="right" />
              <Text style={ms.label}>מחיר</Text>
              <TextInput style={ms.input} value={s.plan1?.price || ''} onChangeText={v => updPlan('plan1', 'price', v)} textAlign="right" />
              <Text style={ms.label}>תקופה</Text>
              <TextInput style={ms.input} value={s.plan1?.period || ''} onChangeText={v => updPlan('plan1', 'period', v)} textAlign="right" />
              <Text style={ms.label}>הערה</Text>
              <TextInput style={ms.input} value={s.plan1?.note || ''} onChangeText={v => updPlan('plan1', 'note', v)} textAlign="right" />
              <Text style={ms.label}>🎨 צבע</Text>
              <TextInput style={ms.input} value={s.plan1Color || ''} onChangeText={v => upd('plan1Color', v)} textAlign="left" placeholder="#f0f4f8" placeholderTextColor="#bbb" />
            </View>
          </View>

          {/* Plan 2 */}
          <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#1A6B8A' }}>
            <View style={{ backgroundColor: '#1A6B8A', paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#fff', textAlign: 'center' }}>📦 מסלול 2</Text>
            </View>
            <View style={{ backgroundColor: '#f0f9ff', padding: 10, gap: 6 }}>
              <Text style={ms.label}>שם</Text>
              <TextInput style={ms.input} value={s.plan2?.label || ''} onChangeText={v => updPlan('plan2', 'label', v)} textAlign="right" />
              <Text style={ms.label}>מחיר</Text>
              <TextInput style={ms.input} value={s.plan2?.price || ''} onChangeText={v => updPlan('plan2', 'price', v)} textAlign="right" />
              <Text style={ms.label}>תקופה</Text>
              <TextInput style={ms.input} value={s.plan2?.period || ''} onChangeText={v => updPlan('plan2', 'period', v)} textAlign="right" />
              <Text style={ms.label}>הערה</Text>
              <TextInput style={ms.input} value={s.plan2?.note || ''} onChangeText={v => updPlan('plan2', 'note', v)} textAlign="right" />
              <Text style={ms.label}>🎨 צבע</Text>
              <TextInput style={ms.input} value={s.plan2Color || ''} onChangeText={v => upd('plan2Color', v)} textAlign="left" placeholder="#1A6B8A" placeholderTextColor="#bbb" />
            </View>
          </View>
        </View>

        {/* Store links */}
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#1C2B35' }}>
          <View style={{ backgroundColor: '#1C2B35', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#F4A94E', textAlign: 'right', writingDirection: 'rtl' }}>🔗 קישורים לחנויות</Text>
          </View>
          <View style={{ backgroundColor: '#f8fafc', padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderRightWidth: 4, borderRightColor: '#007AFF' }}>
              <Text style={{ fontSize: 20 }}>🍎</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', writingDirection: 'rtl' }}>Apple App Store</Text>
                <TextInput style={[ms.input, { marginTop: 4 }]} value={s.appleUrl || ''} onChangeText={v => upd('appleUrl', v)} textAlign="left" />
              </View>
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderRightWidth: 4, borderRightColor: '#3DDC84' }}>
              <Text style={{ fontSize: 20 }}>🤖</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', writingDirection: 'rtl' }}>Google Play</Text>
                <TextInput style={[ms.input, { marginTop: 4 }]} value={s.googleUrl || ''} onChangeText={v => upd('googleUrl', v)} textAlign="left" />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Media Library ──────────────────────────────────────────
  const renderMedia = () => {
    const handleUpload = async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
        await refreshMedia();
      } catch {}
    };
    const handleDelete = async (filename: string) => {
      if (Platform.OS === 'web' && !confirm(`למחוק את ${filename}?`)) return;
      try {
        await fetch(`/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        await refreshMedia();
      } catch {}
    };
    const toggleTag = async (filename: string, tag: string) => {
      const file = mediaFiles.find(f => f.filename === filename);
      const current = file?.tags || [];
      const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      setMediaFiles(prev => prev.map(f => f.filename === filename ? { ...f, tags: next } : f));
      try {
        await fetch(`/api/uploads/${encodeURIComponent(filename)}/tags`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        });
      } catch {}
    };
    const setTagSingle = async (filename: string, tag: string) => {
      const next = tag ? [tag] : [];
      setMediaFiles(prev => prev.map(f => f.filename === filename ? { ...f, tags: next } : f));
      try {
        await fetch(`/api/uploads/${encodeURIComponent(filename)}/tags`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: next }),
        });
      } catch {}
    };
    const FOLDERS = TAG_GROUPS.map(g => ({
      ...g,
      count: mediaFiles.filter(f => g.tags.some(t => (f.tags || []).includes(t.key))).length,
    }));
    const untaggedCount = mediaFiles.filter(f => !(f.tags || []).length).length;
    const activeGrp = TAG_GROUPS.find(g => g.group === mediaFolder);
    const filteredFiles = mediaFiles.filter(f => {
      if (!mediaFolder) return true;
      if (mediaFolder === '__none') return !(f.tags || []).length;
      if (mediaFilter && mediaFilter !== '__none') return (f.tags || []).includes(mediaFilter);
      return activeGrp ? activeGrp.tags.some(t => (f.tags || []).includes(t.key)) : false;
    });

    if (!mediaFolder) {
      return (
        <View style={cs.contentCard}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 }}>📁 תיקיות תמונות</Text>
          <Text style={{ fontSize: 13, color: '#888', textAlign: 'right', writingDirection: 'rtl', marginBottom: 16 }}>{mediaFiles.length} תמונות בסה״כ</Text>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 }}>
            {FOLDERS.map(g => (
              <TouchableOpacity key={g.group} onPress={() => { setMediaFolder(g.group); setMediaFilter(''); }} activeOpacity={0.7}
                style={{ width: 130, height: 110, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32 }}>{g.icon}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl', marginTop: 4 }}>{g.group.replace(/^[^\s]+\s/, '')}</Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{g.count}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => { setMediaFolder('__none'); setMediaFilter('__none'); }} activeOpacity={0.7}
              style={{ width: 130, height: 110, borderRadius: 16, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>❓</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#dc2626', textAlign: 'center', marginTop: 4 }}>ללא קטגוריה</Text>
              <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{untaggedCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={cs.contentCard}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => { setMediaFolder(''); setMediaFilter(''); }}>
            <Text style={{ fontSize: 24, color: Colors.PRIMARY, fontWeight: '700' }}>→</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' }}>{mediaFolder === '__none' ? '❓ ללא קטגוריה' : mediaFolder}</Text>
            <Text style={{ fontSize: 12, color: '#888', writingDirection: 'rtl' }}>{filteredFiles.length} תמונות</Text>
          </View>
          {activeGrp && activeGrp.tags.length > 1 && Platform.OS === 'web' && React.createElement('select', {
            value: mediaFilter,
            onChange: (e: any) => setMediaFilter(e.target.value),
            style: { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 700, direction: 'rtl', cursor: 'pointer' },
          }, [
            React.createElement('option', { key: '', value: '' }, 'הכל'),
            ...activeGrp.tags.map(t => React.createElement('option', { key: t.key, value: t.key }, `${t.label} (${mediaFiles.filter(f => (f.tags || []).includes(t.key)).length})`)),
          ])}
          {Platform.OS === 'web' && React.createElement('label', {
            style: { backgroundColor: '#10b981', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
          }, [
            '📁 העלה לתיקייה',
            React.createElement('input', {
              key: 'file', type: 'file', accept: 'image/*,audio/*', multiple: true, style: { display: 'none' },
              onChange: async (e: any) => {
                const files = Array.from(e.target.files || []) as File[];
                const tag = mediaFilter || (activeGrp?.tags[0]?.key) || '';
                const beforeUpload = new Set(mediaFiles.map(f => f.filename));
                for (const f of files) await handleUpload(f);
                await refreshMedia();
                if (tag) {
                  const latestRes = await fetch(`${API_BASE}/api/uploads`).then(r => r.json());
                  const newFiles = (latestRes.files || []).filter((f: any) => !beforeUpload.has(f.filename));
                  for (const nf of newFiles) {
                    await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(nf.filename)}/tags`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: [tag] }) }).catch(() => {});
                  }
                  await refreshMedia();
                }
                e.target.value = '';
              },
            }),
          ])}
          <TouchableOpacity
            style={{ backgroundColor: Colors.SECONDARY, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
            onPress={async () => { await refreshMedia(); }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>🔄 רענן</Text>
          </TouchableOpacity>
          {selectedFiles.size > 0 && (
            <TouchableOpacity
              style={{ backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
              onPress={async () => {
                if (Platform.OS === 'web' && !confirm(`למחוק ${selectedFiles.size} קבצים?`)) return;
                for (const fn of selectedFiles) {
                  await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(fn)}`, { method: 'DELETE' }).catch(() => {});
                }
                setSelectedFiles(new Set());
                await refreshMedia();
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>🗑 מחק {selectedFiles.size} נבחרים</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 }}>
          {filteredFiles.map(f => (
            <View key={f.filename} style={{ width: 160, backgroundColor: '#fafafa', borderRadius: 12, overflow: 'hidden', borderWidth: selectedFiles.has(f.filename) ? 2 : 1, borderColor: selectedFiles.has(f.filename) ? '#dc2626' : '#e8e8e8' }}>
              <TouchableOpacity
                style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: selectedFiles.has(f.filename) ? '#dc2626' : 'rgba(255,255,255,0.8)', borderWidth: 2, borderColor: selectedFiles.has(f.filename) ? '#dc2626' : '#999', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => {
                  const next = new Set(selectedFiles);
                  if (next.has(f.filename)) next.delete(f.filename); else next.add(f.filename);
                  setSelectedFiles(next);
                }}
              >
                {selectedFiles.has(f.filename) && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>}
              </TouchableOpacity>
              {Platform.OS === 'web' && (/\.(mp3|wav|m4a|aac)$/i.test(f.filename)
                ? React.createElement('div', { style: { width: '100%', height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', fontSize: 40 } }, '🎵')
                : React.createElement('img', { src: f.url, style: { width: '100%', height: 110, objectFit: 'cover', display: 'block' }, alt: f.filename })
              )}
              <View style={{ padding: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 10, color: f.originalName ? Colors.TEXT : '#999', fontWeight: f.originalName ? '700' : '400', textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 }}>{f.originalName || f.filename}</Text>
                {f.originalName && <Text numberOfLines={1} style={{ fontSize: 8, color: '#bbb', textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 }}>{f.filename}</Text>}
                <View style={{ marginBottom: 6 }}>
                  {Platform.OS === 'web' && React.createElement('select', {
                    value: (f.tags || []).find((t: string) => TAG_OPTIONS.some((o) => o.key === t)) || '',
                    onChange: (e: any) => setTagSingle(f.filename, e.target.value),
                    style: { width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e8e8e8', fontSize: 11, fontWeight: 700, color: (f.tags || []).length ? Colors.WHITE : '#666', backgroundColor: (f.tags || []).length ? (() => { const t=(f.tags||[])[0]; const g=TAG_GROUPS.find(gr=>gr.tags.some(tt=>tt.key===t)); return g ? ({'📂':'#1A6B8A','📁':'#3DA5C4','👋':'#F4A94E','📋':'#7ECFC0','🏷️':'#2D4A5E','📌':'#F4A94E','📍':'#3DA5C4','🎧':'#1C2B35','📜':'#c0392b','🖼️':'#8e44ad','🎞️':'#e67e22'}[g.icon]||Colors.PRIMARY) : Colors.PRIMARY; })() : '#f0f2f5', direction: 'rtl', cursor: 'pointer' },
                  }, (() => {
                    const grp = TAG_GROUPS.find(g => g.group === mediaFolder) as any;
                    const subs = grp?.subgroups;
                    return [
                      React.createElement('option', { key: '', value: '' }, '— בחר —'),
                      ...(subs ? subs.map((sg: any) =>
                        React.createElement('optgroup', { key: sg.label, label: sg.label },
                          sg.tags.map((t: any) => React.createElement('option', { key: t.key, value: t.key, style: { backgroundColor: '#fff', color: '#222' } }, t.label))
                        )
                      ) : grp ? grp.tags.map((t: any) => React.createElement('option', { key: t.key, value: t.key, style: { backgroundColor: '#fff', color: '#222' } }, t.label)) : []),
                      React.createElement('optgroup', { key: '_move', label: '↩ העבר לתיקייה אחרת' },
                        TAG_GROUPS.filter(g => g.group !== mediaFolder).map(g => {
                          const unsorted = g.tags.find(t => t.key.includes('_unsorted'));
                          const tagKey = unsorted ? unsorted.key : g.tags[0]?.key || '';
                          return React.createElement('option', { key: g.group, value: tagKey, style: { backgroundColor: '#fff', color: '#222' } }, g.group);
                        })
                      ),
                    ];
                  })())}
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: '#e8f4f8', paddingVertical: 6, borderRadius: 6, alignItems: 'center' }} onPress={() => { if (Platform.OS === 'web') (navigator as any).clipboard?.writeText(f.url); }}>
                    <Text style={{ fontSize: 11, color: Colors.PRIMARY, fontWeight: '600' }}>העתק URL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#fdecea', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }} onPress={() => handleDelete(f.filename)}>
                    <Text style={{ fontSize: 11, color: '#c0392b', fontWeight: '600' }}>מחק</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {filteredFiles.length === 0 && (
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', width: '100%' }}>אין תמונות בתיקייה זו</Text>
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
        await fetch('/api/gallery', { method: 'POST', body: fd });
        await refreshGallery();
      } catch {}
    };
    const handleDelete = async (filename: string) => {
      if (Platform.OS === 'web' && !confirm(`למחוק את ${filename}?`)) return;
      try {
        await fetch(`/api/gallery/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        await refreshGallery();
      } catch {}
    };
    const reorder = async (from: number, to: number) => {
      if (from === to) return;
      const next = [...galleryFiles];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setGalleryFiles(next);
      await fetch('/api/gallery/order', {
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
              {toursMode ? `בלוקי סיורים — ${childrenOf!.title}` : childrenOf ? `תת-קטגוריות של ${childrenOf.title}` : currentSection.label}
            </Text>
            <Text style={cs.contentSub}>{currentItems.length} {toursMode ? 'בלוקים' : 'פריטים'}</Text>
          </View>
          {activeNav === 'extra' && !childrenOf && (
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: extraGroupVisible ? '#10b981' : '#9ca3af', marginLeft: 8 }}
              onPress={async () => {
                const next = !extraGroupVisible;
                setExtraGroupVisible(next);
                try { await fetch(`${API_BASE}/api/content/extraGroupVisible`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }); } catch {}
              }}
            >
              <Text style={{ color: Colors.WHITE, fontWeight: '800', fontSize: 13 }}>
                {extraGroupVisible ? '👁 הקבוצה גלויה' : '🚫 הקבוצה חבויה'}
              </Text>
            </TouchableOpacity>
          )}
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
                    {item.tours && item.tours.length > 0
                      ? `בלוקי סיורים (${item.tours.length})`
                      : `תת-קטגוריות (${(item.children || []).length})`}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={cs.editBtn}
                onPress={() => {
                  if (toursMode && childrenOf) {
                    const ti = (item as any)._tourIdx as number;
                    const tour = childrenOf.tours![ti];
                    setEditItem({
                      id: `__tour__${childrenOf.id}__${ti}`,
                      title: tour.title || '',
                      subtitle: '',
                      icon: '🎧',
                      bg: tour.color,
                      tours: [tour],
                    } as DataItem);
                  } else {
                    setEditItem(item);
                  }
                }}
              >
                <Text style={cs.editTxt}>ערוך</Text>
              </TouchableOpacity>
            </View>
          );

          if (Platform.OS === 'web') {
            return React.createElement('div', {
              key: item.id,
              draggable: true,
              onDragStart: (e: any) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); },
              onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIdx(idx); },
              onDragLeave: () => setDragOverIdx(-1),
              onDrop: (e: any) => {
                e.preventDefault();
                setDragOverIdx(-1);
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(from)) reorderItem(from, idx);
              },
              onDragEnd: () => setDragOverIdx(-1),
              style: {
                cursor: 'move',
                borderTop: dragOverIdx === idx ? '3px solid #1A6B8A' : '3px solid transparent',
                transition: 'border-top 0.15s ease',
              },
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
                { label: 'תמונות', count: mediaFiles.length, color: Colors.SECONDARY },
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
              : activeNav === 'subscription' ? renderSubscription()
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
        allMedia={mediaFiles}
        ratings={ratings}
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
    paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 8, marginVertical: 2, borderRadius: 10,
    borderBottomWidth: 1, borderBottomColor: '#2a3f4d',
  },
  navItemActive: { backgroundColor: Colors.PRIMARY + '30', borderBottomColor: Colors.PRIMARY },
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
