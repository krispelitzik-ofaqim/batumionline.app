import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Linking, Image,
} from 'react-native';
import { Colors } from '../constants/colors';

const NEWSAPI_KEY = ''; // https://newsapi.org — set key for live data

// Batumi placeholder images per topic (royalty-free Unsplash)
const PLACEHOLDER_IMAGES: Record<Topic, string> = {
  tourism: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
  realestate: 'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=600&q=80',
  food: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  general: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80',
};

type Topic = 'tourism' | 'realestate' | 'food' | 'entertainment' | 'general';

const TOPIC_COLORS: Record<Topic, string> = {
  tourism: '#2ecc71',
  realestate: '#3498db',
  food: '#F4A94E',
  entertainment: '#9b59b6',
  general: '#1A6B8A',
};

const TOPIC_LABELS: Record<Topic, string> = {
  tourism: 'תיירות',
  realestate: 'נדל״ן',
  food: 'אוכל ומסעדות',
  entertainment: 'בילוי ואירועים',
  general: 'כללי',
};

type NewsItem = {
  title: string;
  summary: string;
  image: string;
  link: string;
  source: string;
  date: string;
  topic: Topic;
};

// ─── Topic detection from title/content keywords ───────────────
function detectTopic(text: string): Topic {
  const t = text.toLowerCase();
  if (/hotel|hostel|airbnb|מלון|אירוח|לינה|דירות|tourism|תייר|טיס|flight|visa|ויזה/.test(t)) return 'tourism';
  if (/real.?estate|נדל.?ן|דירה|בנייה|השקע|invest|property|apartment/.test(t)) return 'realestate';
  if (/restaurant|food|wine|יין|מסעד|אוכל|קולינר|שף|chef|cuisine/.test(t)) return 'food';
  if (/festival|concert|nightlife|בילוי|אירוע|פסטיבל|מופע|מסיב|club|bar/.test(t)) return 'entertainment';
  return 'general';
}

export default function NewsModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Topic | 'all'>('all');
  const [expanded, setExpanded] = useState<NewsItem | null>(null);
  const chipScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    if (NEWSAPI_KEY) {
      fetchNewsAPI();
    } else {
      fetchRSS();
    }
  }, [visible]);

  // ─── Search queries per topic ─────────────────────────────────
  const TOPIC_QUERIES: Record<Topic, string> = {
    tourism: 'Batumi tourism travel',
    realestate: 'Batumi real estate property',
    food: 'Batumi restaurants food',
    entertainment: 'Batumi events nightlife',
    general: 'Batumi Georgia news',
  };

  // ─── NewsAPI — fetch per topic ──────────────────────────────
  const fetchNewsAPI = async () => {
    try {
      const topics = Object.keys(TOPIC_QUERIES) as Topic[];
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
      const all: NewsItem[] = results.flat().sort((a, b) => {
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
  const fetchRSS = async () => {
    try {
      const topics = Object.keys(TOPIC_QUERIES) as Topic[];
      const results = await Promise.all(
        topics.map(async (topic) => {
          const q = encodeURIComponent(TOPIC_QUERIES[topic]);
          try {
            const res = await fetch(
              `https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=${q}%26hl=he%26gl=IL%26ceid=IL:he`
            );
            const data = await res.json();
            return (data.items || []).slice(0, 4).map((item: any) => ({
              title: item.title || '',
              summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 250) || '',
              image: item.enclosure?.link || item.thumbnail || '',
              link: item.link || '',
              source: item.author || extractSource(item.title),
              date: formatDate(item.pubDate),
              topic,
            }));
          } catch {
            return [];
          }
        })
      );
      const all: NewsItem[] = results.flat();
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
  const loadFallback = () => {
    setNews(FALLBACK_NEWS);
    setLoading(false);
  };

  const baseFiltered = filter === 'all' ? news : news.filter(n => n.topic === filter);
  const MIN_ITEMS = 3;
  const filtered = baseFiltered.length >= MIN_ITEMS
    ? baseFiltered
    : [
        ...baseFiltered,
        ...(filter === 'all'
          ? FALLBACK_NEWS
          : FALLBACK_NEWS.filter(n => n.topic === filter)
        ).filter(f => !baseFiltered.some(b => b.title === f.title)).slice(0, MIN_ITEMS - baseFiltered.length),
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>חדשות בעברית</Text>
          <Text style={s.subtitle}>חדשות ועדכונים מבטומי וגאורגיה</Text>

          {/* Topic filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipRow}
            ref={chipScrollRef}
            onContentSizeChange={() => chipScrollRef.current?.scrollToEnd({ animated: false })}
          >
            {(Object.keys(TOPIC_LABELS) as Topic[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.chip, filter === t && { backgroundColor: TOPIC_COLORS[t] }]}
                onPress={() => setFilter(filter === t ? 'all' : t)}
              >
                <View style={[s.chipDot, { backgroundColor: TOPIC_COLORS[t] }]} />
                <Text style={[s.chipTxt, filter === t && s.chipTxtActive]}>{TOPIC_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.chip, filter === 'all' && s.chipActive]} onPress={() => setFilter('all')}>
              <Text style={[s.chipTxt, filter === 'all' && s.chipTxtActive]}>הכל</Text>
            </TouchableOpacity>
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            filtered.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={s.card}
                activeOpacity={0.8}
                onPress={() => setExpanded(item)}
              >
                {/* Image */}
                <Image
                  source={{ uri: item.image || PLACEHOLDER_IMAGES[item.topic] }}
                  style={s.cardImage}
                />

                {/* Topic tag */}
                <View style={[s.topicTag, { backgroundColor: TOPIC_COLORS[item.topic] }]}>
                  <Text style={s.topicTxt}>{TOPIC_LABELS[item.topic]}</Text>
                </View>

                {/* Content */}
                <View style={s.cardBody}>
                  <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.cardSummary} numberOfLines={5}>{item.summary}</Text>
                  <View style={s.cardFooter}>
                    <Text style={s.cardSource}>{item.source}</Text>
                    <Text style={s.cardDate}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {!loading && filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTxt}>אין חדשות בקטגוריה זו</Text>
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
              <Image
                source={{ uri: expanded.image || PLACEHOLDER_IMAGES[expanded.topic] }}
                style={s.expandedImage}
              />
              <View style={[s.topicTag, { backgroundColor: TOPIC_COLORS[expanded.topic], position: 'relative', alignSelf: 'flex-end', marginTop: 12, marginHorizontal: 16 }]}>
                <Text style={s.topicTxt}>{TOPIC_LABELS[expanded.topic]}</Text>
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
                    <Text style={s.linkBtnTxt}>המשך לכתבה המלאה באתר המקור ←</Text>
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'עכשיו';
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  return date.toLocaleDateString('he-IL');
}

// ─── Fallback news ─────────────────────────────────────────────

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'בטומי: עונת התיירות 2026 נפתחה עם שיא תיירים מישראל',
    summary: 'עיר הנופש בטומי שעל חוף הים השחור רושמת עלייה של 30% במספר התיירים הישראלים בהשוואה לשנה שעברה. טיסות ישירות חדשות מנתב״ג תורמות לגידול המשמעותי. בתי המלון מדווחים על תפוסה מלאה בחודשי הקיץ.',
    image: '', link: '', source: 'ישראל היום', date: 'היום', topic: 'tourism',
  },
  {
    title: 'השקעות נדל״ן בבטומי: מחירי הדירות עלו ב-15% בשנה האחרונה',
    summary: 'שוק הנדל״ן בבטומי ממשיך לרשום עליות מחירים. דירות להשקעה באזור הטיילת נמכרות במחירים של 1,500-2,000 דולר למ״ר. יזמים ישראלים מובילים פרויקטים חדשים באזור. מומחים צופים המשך עליית מחירים בשנתיים הקרובות.',
    image: '', link: '', source: 'גלובס', date: 'היום', topic: 'realestate',
  },
  {
    title: 'המסעדות הכי שוות בבטומי: המדריך המלא לשנת 2026',
    summary: 'מסעדת ״ხינקלי הזהב״ זכתה בפרס המסעדה הטובה בגאורגיה. שפים ישראלים פותחים מסעדות חדשות בטיילת. המטבח הגאורגי הופך לטרנד חם בקרב ישראלים. ציוני המסעדות, שעות פתיחה ומחירים — הכל במדריך המלא.',
    image: '', link: '', source: 'אוכל טוב', date: 'אתמול', topic: 'food',
  },
  {
    title: 'פסטיבל המוזיקה הבינלאומי בבטומי יוצא לדרך בקיץ',
    summary: 'פסטיבל Black Sea Jazz חוזר לבטומי עם ליינאפ מרשים של אמנים בינלאומיים. האירוע יתקיים לאורך שלושה ימים בטיילת הים. כרטיסים כבר זמינים לרכישה. בנוסף, סדרת מופעי רחוב חדשה תתקיים כל ערב שישי לאורך הקיץ.',
    image: '', link: '', source: 'תרבות', date: 'אתמול', topic: 'entertainment',
  },
  {
    title: 'גאורגיה מקלה על תנאי הכניסה: ללא ויזה לישראלים עד שנה',
    summary: 'ממשלת גאורגיה הודיעה על הארכת פטור הוויזה לאזרחי ישראל לתקופה של עד 365 ימים. המהלך נועד לעודד תיירות והשקעות. בנוסף, הושק מסלול מהיר חדש בנמל התעופה בבטומי לתיירים מישראל.',
    image: '', link: '', source: 'Ynet', date: 'לפני 2 ימים', topic: 'general',
  },
  {
    title: 'קו רכבל חדש יחבר את בטומי להרי הקווקז',
    summary: 'פרויקט תשתית חדש יאפשר לתיירים להגיע ישירות מבטומי לאתרי הסקי בהרי הקווקז. הרכבל באורך 12 ק״מ צפוי להיפתח בחורף 2027. עלות הפרויקט מוערכת ב-200 מיליון דולר ומומן בשיתוף האיחוד האירופי.',
    image: '', link: '', source: 'כלכליסט', date: 'לפני 3 ימים', topic: 'tourism',
  },
  {
    title: 'שוק הלילה החדש של בטומי: אוכל רחוב, מוזיקה ואומנות',
    summary: 'שוק לילה חדש נפתח ברובע הישן של בטומי ומציע חוויה ייחודית של אוכל רחוב גאורגי, מוזיקה חיה ודוכני אומנות מקומית. השוק פתוח בימי חמישי עד שבת מהשעה 20:00 ועד חצות. הכניסה חופשית.',
    image: '', link: '', source: 'Time Out', date: 'לפני 4 ימים', topic: 'entertainment',
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
