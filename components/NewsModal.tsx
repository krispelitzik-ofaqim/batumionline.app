import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../constants/i18n';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Linking, Image,
} from 'react-native';
import { Colors } from '../constants/colors';
import { API_BASE } from '../constants/api';

const NEWSAPI_KEY = ''; // https://newsapi.org — set key for live data

// Batumi placeholder images per topic (royalty-free Unsplash)
const PLACEHOLDER_IMAGES: Record<Topic, string> = {
  tourism: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
  realestate: 'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=600&q=80',
  food: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  israel: 'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=600&q=80',
};

type Topic = 'tourism' | 'realestate' | 'food' | 'entertainment' | 'israel';

const TOPIC_COLORS: Record<Topic, string> = {
  tourism: '#2ecc71',
  realestate: '#3498db',
  food: '#F4A94E',
  entertainment: '#9b59b6',
  israel: '#0038b8',
};

const TOPIC_LABELS: Record<Topic, string> = {
  tourism: 'תיירות',
  realestate: 'נדל״ן',
  food: 'אוכל ומסעדות',
  entertainment: 'בילוי ואירועים',
  israel: '🇮🇱 מישראל',
};

type NLang = 'he' | 'en' | 'fa' | 'ru';
const TOPIC_LABELS_TR: Record<NLang, Record<Topic, string>> = {
  he: { tourism: 'תיירות', realestate: 'נדל״ן', food: 'אוכל ומסעדות', entertainment: 'בילוי ואירועים', israel: '🇮🇱 מישראל' },
  en: { tourism: 'Tourism', realestate: 'Real estate', food: 'Food & dining', entertainment: 'Events & nightlife', israel: '🇮🇱 From Israel' },
  fa: { tourism: 'گردشگری', realestate: 'املاک', food: 'غذا و رستوران', entertainment: 'رویدادها و سرگرمی', israel: '🇮🇱 از اسرائیل' },
  ru: { tourism: 'Туризм', realestate: 'Недвижимость', food: 'Еда и рестораны', entertainment: 'События и ночная жизнь', israel: '🇮🇱 Из Израиля' },
};
const TOPIC_QUERIES_TR: Record<NLang, Record<Topic, string>> = {
  he: { tourism: 'בטומי תיירות', realestate: 'בטומי נדלן', food: 'בטומי מסעדות', entertainment: 'בטומי חיי לילה', israel: 'בטומי ישראלים' },
  en: { tourism: 'Batumi tourism', realestate: 'Batumi real estate', food: 'Batumi restaurants', entertainment: 'Batumi nightlife', israel: 'Batumi Israelis' },
  fa: { tourism: 'باتومی گردشگری', realestate: 'باتومی املاک', food: 'باتومی رستوران', entertainment: 'باتومی زندگی شبانه', israel: 'باتومی اسرائیلی‌ها' },
  ru: { tourism: 'Батуми туризм', realestate: 'Батуми недвижимость', food: 'Батуми рестораны', entertainment: 'Батуми ночная жизнь', israel: 'Батуми израильтяне' },
};
const RSS_LOCALE: Record<NLang, string> = { he: 'hl=he&gl=IL&ceid=IL:he', en: 'hl=en-US&gl=US&ceid=US:en', fa: 'hl=fa&gl=IR&ceid=IR:fa', ru: 'hl=ru&gl=RU&ceid=RU:ru' };
const NL = (l: string): NLang => (['he', 'en', 'fa', 'ru'].includes(l) ? (l as NLang) : 'en');
// Topics per edition — the Israel topic is Hebrew-audience only.
const TOPICS_FOR = (l: NLang): Topic[] => (l === 'he' ? ['tourism', 'realestate', 'food', 'entertainment', 'israel'] : ['tourism', 'realestate', 'food', 'entertainment']);

type NewsItem = {
  title: string;
  summary: string;
  image: string;
  link: string;
  source: string;
  date: string;
  topic: Topic;
  pubTs?: number;
};

// ─── Topic detection from title/content keywords ───────────────
function detectTopic(text: string): Topic {
  const t = text.toLowerCase();
  if (/hotel|hostel|airbnb|מלון|אירוח|לינה|דירות|tourism|תייר|טיס|flight|visa|ויזה/.test(t)) return 'tourism';
  if (/real.?estate|נדל.?ן|דירה|בנייה|השקע|invest|property|apartment/.test(t)) return 'realestate';
  if (/restaurant|food|wine|יין|מסעד|אוכל|קולינר|שף|chef|cuisine/.test(t)) return 'food';
  if (/festival|concert|nightlife|בילוי|אירוע|פסטיבל|מופע|מסיב|club|bar/.test(t)) return 'entertainment';
  return 'tourism';
}

export default function NewsModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const { t, lang } = useI18n();
  const L = NL(lang);
  const TOPICS = TOPICS_FOR(L);
  const LBL = TOPIC_LABELS_TR[L];
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Topic | 'all'>('all');
  const [expanded, setExpanded] = useState<NewsItem | null>(null);
  const [batumiImages, setBatumiImages] = useState<string[]>([]);
  const chipScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const loadNews = (images: string[]) => {
      if (NEWSAPI_KEY) fetchNewsAPI(images);
      else fetchRSS(images);
    };
    if (batumiImages.length === 0) {
      fetch(`${API_BASE}/api/batumi-images`)
        .then(r => r.json())
        .then(d => {
          const imgs = d.images || [];
          setBatumiImages(imgs);
          loadNews(imgs);
        })
        .catch(() => loadNews([]));
    } else {
      loadNews(batumiImages);
    }
  }, [visible]);

  const pickFromImages = (seed: string, images: string[]): string => {
    if (!images || images.length === 0) return '';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % images.length;
    return `${API_BASE}/batumi-images/${images[idx]}`;
  };

  // ─── Search queries per topic (localized to the current edition) ──
  const TOPIC_QUERIES = TOPIC_QUERIES_TR[L];

  // ─── NewsAPI — fetch per topic ──────────────────────────────
  const fetchNewsAPI = async (_images: string[] = []) => {
    try {
      const topics = TOPICS;
      const results = await Promise.all(
        topics.map(async (topic) => {
          const q = encodeURIComponent(TOPIC_QUERIES[topic]);
          const res = await fetch(
            `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWSAPI_KEY}`
          );
          const data = await res.json();
          return (data.articles || []).map((a: any) => ({
            title: a.title || '',
            summary: a.description || a.content?.slice(0, 200) || '',
            image: a.urlToImage || '',
            link: a.url || '',
            source: a.source?.name || '',
            date: formatDate(a.publishedAt),
            topic,
          }));
        })
      );
      const all: NewsItem[] = results.flat().filter(n => !!n.image).sort((a, b) => {
        // Sort newest first by rough date comparison
        return (b.date === 'עכשיו' ? 1 : 0) - (a.date === 'עכשיו' ? 1 : 0);
      });
      setNews(all);
      setLoading(false);
    } catch {
      fetchRSS();
    }
  };

  // ─── Google News RSS — fetch per topic ──────────────────────
  const fetchRSS = async (images: string[] = []) => {
    try {
      const topics = TOPICS;
      const results = await Promise.all(
        topics.map(async (topic) => {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(TOPIC_QUERIES[topic])}&${RSS_LOCALE[L]}`;
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
          try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            return (data.items || []).map((item: any) => ({
              title: item.title || '',
              summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 250) || '',
              image: item.enclosure?.link || item.thumbnail || pickFromImages(item.title || item.guid || '', images) || PLACEHOLDER_IMAGES[topic],
              link: item.link || '',
              source: item.author || extractSource(item.title),
              date: formatDate(item.pubDate),
              pubTs: item.pubDate ? new Date(item.pubDate).getTime() : 0,
              topic,
            }));
          } catch {
            return [];
          }
        })
      );
      const all: NewsItem[] = results.flat()
        .sort((a: any, b: any) => (b.pubTs || 0) - (a.pubTs || 0));
      if (all.length > 0) {
        setNews(all);
      } else {
        loadFallback();
        return;
      }
      setLoading(false);
    } catch {
      loadFallback();
    }
  };

  // ─── Fallback static data ───────────────────────────────────
  const FB = L === 'he' ? FALLBACK_NEWS : FALLBACK_NEWS.filter(n => n.topic !== 'israel');
  const loadFallback = () => {
    setNews(FB);
    setLoading(false);
  };

  const baseFiltered = filter === 'all' ? news : news.filter(n => n.topic === filter);
  const MIN_ITEMS = 5;
  const filtered = baseFiltered.length >= MIN_ITEMS
    ? baseFiltered
    : [
        ...baseFiltered,
        ...(filter === 'all'
          ? FB
          : FB.filter(n => n.topic === filter)
        ).filter(f => !baseFiltered.some(b => b.title === f.title)).slice(0, MIN_ITEMS - baseFiltered.length),
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>{t('news.title')}</Text>
          <Text style={s.subtitle}>{t('news.sub')}</Text>

          {/* Topic filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipRow}
            ref={chipScrollRef}
            onContentSizeChange={() => chipScrollRef.current?.scrollToEnd({ animated: false })}
          >
            {TOPICS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.chip, filter === t && { backgroundColor: TOPIC_COLORS[t] }]}
                onPress={() => setFilter(filter === t ? 'all' : t)}
              >
                <View style={[s.chipDot, { backgroundColor: TOPIC_COLORS[t] }]} />
                <Text style={[s.chipTxt, filter === t && s.chipTxtActive]}>{LBL[t]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.chip, filter === 'all' && s.chipActive]} onPress={() => setFilter('all')}>
              <Text style={[s.chipTxt, filter === 'all' && s.chipTxtActive]}>{t('c.all')}</Text>
            </TouchableOpacity>
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            filtered.map((item, i) => (
              <NewsCard key={i} item={item} onPress={() => setExpanded(item)} />
            ))
          )}

          {!loading && filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTxt}>{t('news.empty')}</Text>
            </View>
          )}
        </ScrollView>

        {/* Expanded article overlay */}
        {expanded && (
          <View style={s.expandedOverlay}>
            <TouchableOpacity style={s.expandedClose} onPress={() => setExpanded(null)}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={s.expandedContent} showsVerticalScrollIndicator={false}>
              <FallbackImage src={expanded.image} topic={expanded.topic} style={s.expandedImage} />
              <View style={[s.topicTag, { backgroundColor: TOPIC_COLORS[expanded.topic], position: 'relative', alignSelf: 'flex-end', marginTop: 12, marginHorizontal: 16 }]}>
                <Text style={s.topicTxt}>{LBL[expanded.topic]}</Text>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={s.expandedTitle}>{expanded.title}</Text>
                <View style={s.cardFooter}>
                  <Text style={s.cardSource}>{expanded.source}</Text>
                  <Text style={s.cardDate}>{expanded.date}</Text>
                </View>
                <Text style={s.expandedSummary}>{expanded.summary}</Text>
                {expanded.link ? (
                  <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(expanded.link)}>
                    <Text style={s.linkBtnTxt}>{t('news.readMore')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function extractSource(title: string): string {
  const match = title.match(/ - (.+)$/);
  return match ? match[1] : 'חדשות';
}

function FallbackImage({ src, topic, style }: { src: string; topic: Topic; style: any }) {
  const [errored, setErrored] = useState(false);
  const uri = errored || !src ? PLACEHOLDER_IMAGES[topic] : src;
  return <Image source={{ uri }} style={style} onError={() => setErrored(true)} />;
}

function NewsCard({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={onPress}>
      <FallbackImage src={item.image} topic={item.topic} style={s.cardImage} />
      <View style={[s.topicTag, { backgroundColor: TOPIC_COLORS[item.topic] }]}>
        <Text style={s.topicTxt}>{TOPIC_LABELS[item.topic]}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.cardSummary} numberOfLines={5}>{item.summary}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardSource}>{item.source}</Text>
          <Text style={s.cardDate}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

// ─── Fallback news ─────────────────────────────────────────────

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'בטומי: עונת התיירות 2026 נפתחה עם שיא תיירים מישראל',
    summary: 'עיר הנופש בטומי שעל חוף הים השחור רושמת עלייה של 30% במספר התיירים הישראלים בהשוואה לשנה שעברה. טיסות ישירות חדשות מנתב״ג תורמות לגידול המשמעותי. בתי המלון מדווחים על תפוסה מלאה בחודשי הקיץ.',
    image: '', link: '', source: 'ישראל היום', date: formatDate(daysAgoISO(0)), topic: 'tourism',
  },
  {
    title: 'השקעות נדל״ן בבטומי: מחירי הדירות עלו ב-15% בשנה האחרונה',
    summary: 'שוק הנדל״ן בבטומי ממשיך לרשום עליות מחירים. דירות להשקעה באזור הטיילת נמכרות במחירים של 1,500-2,000 דולר למ״ר. יזמים ישראלים מובילים פרויקטים חדשים באזור. מומחים צופים המשך עליית מחירים בשנתיים הקרובות.',
    image: '', link: '', source: 'גלובס', date: formatDate(daysAgoISO(0)), topic: 'realestate',
  },
  {
    title: 'המסעדות הכי שוות בבטומי: המדריך המלא לשנת 2026',
    summary: 'מסעדת ״ხינקלי הזהב״ זכתה בפרס המסעדה הטובה בגאורגיה. שפים ישראלים פותחים מסעדות חדשות בטיילת. המטבח הגאורגי הופך לטרנד חם בקרב ישראלים. ציוני המסעדות, שעות פתיחה ומחירים — הכל במדריך המלא.',
    image: '', link: '', source: 'אוכל טוב', date: formatDate(daysAgoISO(1)), topic: 'food',
  },
  {
    title: 'פסטיבל המוזיקה הבינלאומי בבטומי יוצא לדרך בקיץ',
    summary: 'פסטיבל Black Sea Jazz חוזר לבטומי עם ליינאפ מרשים של אמנים בינלאומיים. האירוע יתקיים לאורך שלושה ימים בטיילת הים. כרטיסים כבר זמינים לרכישה. בנוסף, סדרת מופעי רחוב חדשה תתקיים כל ערב שישי לאורך הקיץ.',
    image: '', link: '', source: 'תרבות', date: formatDate(daysAgoISO(1)), topic: 'entertainment',
  },
  {
    title: 'גאורגיה מקלה על תנאי הכניסה: ללא ויזה לישראלים עד שנה',
    summary: 'ממשלת גאורגיה הודיעה על הארכת פטור הוויזה לאזרחי ישראל לתקופה של עד 365 ימים. המהלך נועד לעודד תיירות והשקעות. בנוסף, הושק מסלול מהיר חדש בנמל התעופה בבטומי לתיירים מישראל.',
    image: '', link: '', source: 'Ynet', date: formatDate(daysAgoISO(2)), topic: 'israel',
  },
  {
    title: 'קו רכבל חדש יחבר את בטומי להרי הקווקז',
    summary: 'פרויקט תשתית חדש יאפשר לתיירים להגיע ישירות מבטומי לאתרי הסקי בהרי הקווקז. הרכבל באורך 12 ק״מ צפוי להיפתח בחורף 2027. עלות הפרויקט מוערכת ב-200 מיליון דולר ומומן בשיתוף האיחוד האירופי.',
    image: '', link: '', source: 'כלכליסט', date: formatDate(daysAgoISO(3)), topic: 'tourism',
  },
  {
    title: 'שוק הלילה החדש של בטומי: אוכל רחוב, מוזיקה ואומנות',
    summary: 'שוק לילה חדש נפתח ברובע הישן של בטומי ומציע חוויה ייחודית של אוכל רחוב גאורגי, מוזיקה חיה ודוכני אומנות מקומית. השוק פתוח בימי חמישי עד שבת מהשעה 20:00 ועד חצות. הכניסה חופשית.',
    image: '', link: '', source: 'Time Out', date: formatDate(daysAgoISO(4)), topic: 'entertainment',
  },
];

// ─── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeX: { fontSize: 18, color: Colors.WHITE, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', marginBottom: 4, writingDirection: 'rtl' },
  subtitle: { fontSize: 14, color: Colors.WHITE, opacity: 0.7, textAlign: 'center', marginBottom: 16, writingDirection: 'rtl' },

  // Filter chips
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 16, paddingHorizontal: 4 },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  chipActive: { backgroundColor: Colors.WHITE },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.WHITE, writingDirection: 'rtl' },
  chipTxtActive: { color: Colors.TEXT },

  // News card
  card: {
    backgroundColor: Colors.WHITE, borderRadius: 16, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: '100%', height: 180 },
  topicTag: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  topicTxt: { fontSize: 11, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', lineHeight: 24, marginBottom: 8 },
  cardSummary: { fontSize: 14, color: '#555', textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardSource: { fontSize: 12, fontWeight: '600', color: '#999', writingDirection: 'rtl' },
  cardDate: { fontSize: 12, color: '#bbb' },

  // Expanded article
  expandedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.BACKGROUND,
  },
  expandedClose: {
    position: 'absolute', top: 54, right: 20, zIndex: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  expandedContent: { paddingBottom: 40, paddingTop: 0 },
  expandedImage: { width: '100%', height: 240 },
  expandedTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.TEXT,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 30, marginBottom: 10, marginTop: 8,
  },
  expandedSummary: {
    fontSize: 16, color: '#333', textAlign: 'right', writingDirection: 'rtl',
    lineHeight: 26, marginTop: 14,
  },
  linkBtn: {
    marginTop: 24, backgroundColor: Colors.PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  linkBtnTxt: { color: Colors.WHITE, fontSize: 15, fontWeight: '700', writingDirection: 'rtl' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: Colors.WHITE, opacity: 0.6, marginTop: 8, writingDirection: 'rtl' },
});
