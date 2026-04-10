import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { PreviewContext } from '../../constants/previewContext';
import DevicePreviewBar from '../../components/DevicePreviewBar';

type CatData = {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  bg: string;
  bgDark: string;
};

const CATEGORIES: Record<string, CatData> = {
  '1': { title: 'אירוח ולינה', subtitle: 'מלונות, דירות ואכסניות', description: 'מצאו את מקום הלינה המושלם בבטומי — ממלונות יוקרה על חוף הים, דרך דירות Airbnb מרווחות, ועד אכסניות בתקציב נוח. כולל המלצות לפי אזורים, מחירים וביקורות אמיתיות.\n\nבטומי מציעה מגוון רחב של אפשרויות לינה לכל תקציב. באזור הטיילת תמצאו מלונות 5 כוכבים כמו Hilton ו-Radisson Blu, עם נוף מרהיב לים השחור. למטיילים בתקציב בינוני, ישנן דירות מרוהטות להשכרה לטווח קצר באזור העיר העתיקה וברחוב Chavchavadze.\n\nטיפ: הזמינו מראש בעונת הקיץ (יוני-ספטמבר) כי התפוסה מגיעה ל-95%. בעונת השכם (מרץ-מאי) ובסתיו תמצאו מחירים נמוכים ב-40% ואפילו יותר.', icon: '🏨', bg: '#5BC0DE', bgDark: '#3DA5C4' },
  '2': { title: 'אתרים ואטרקציות', subtitle: 'גלה מקומות וחוויות', description: 'גלו את האתרים המרהיבים של בטומי — מהגנים הבוטניים ועד כיכר פיאצה, הטיילת לאורך הים, ומוזיאונים מרתקים. אטרקציות לכל המשפחה בכל עונה.\n\nהגן הבוטני של בטומי הוא אחד הגדולים בעולם ומשתרע על פני 111 הקטר. כיכר פיאצה, בהשראה איטלקית, היא הלב הפועם של העיר עם מסעדות, מוזיקה חיה ואדריכלות מרהיבה.\n\nאל תפספסו: פסל עלי ונינו הנע, מגדל האלפבית, ובולוור בטומי — טיילת חוף באורך 7 ק״מ. לילדים — פארק מים, אקווריום ודולפינריום.', icon: '🎡', bg: '#F7BE68', bgDark: '#F4A94E' },
  '3': { title: 'סיורים קוליים', subtitle: 'מסלולים מודרכים', description: 'טיילו בבטומי עם מדריך אישי באוזן! סיורים קוליים בעברית לאורך מסלולים מרכזיים בעיר. היסטוריה, ארכיטקטורה, ותרבות — הכל בקצב שלכם.\n\nהסיורים הקוליים שלנו כוללים מסלולים מובנים עם תחנות עצירה, סיפורים היסטוריים, ואנקדוטות מקומיות. כל סיור נמשך כשעה-שעתיים ומותאם להליכה בקצב נוח.\n\nמסלולים זמינים: סיור העיר העתיקה, סיור הטיילת, סיור ההיסטוריה היהודית, וסיור האדריכלות המודרנית.', icon: '🎧', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  '4': { title: 'בילוי, פנאי וחיי לילה', subtitle: 'בידור והנאה', description: 'חיי הלילה של בטומי תוססים ומגוונים. ברים על חוף הים, מועדוני לילה, קזינו, הופעות חיות ועוד. המדריך המלא לבילוי בכל שעה.\n\nבטומי ידועה כבירת הבילוי של גאורגיה. לאורך הטיילת תמצאו ברים וקלאבים פתוחים עד השעות הקטנות. הקזינו של בטומי הוא אחד הגדולים באזור.\n\nלמשפחות — פארקי שעשועים, קולנוע, באולינג ומרכזי בידור. בקיץ — אירועי חוף, פסטיבלים ומופעים בחינם בטיילת.', icon: '🎰', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  '5': { title: 'תחבורה', subtitle: 'מוניות ותחבורה ציבורית', description: 'כל מה שצריך לדעת על תחבורה בבטומי — מוניות, אוטובוסים, השכרת רכב, ואפליקציות מומלצות. טיפים לחיסכון ומסלולי נסיעה מומלצים.\n\nהאפליקציה המומלצת למוניות היא Bolt (לשעבר Taxify). מחיר ממוצע לנסיעה בתוך העיר: 5-10 לארי (6-12 ש״ח). אוטובוסים עירוניים עולים 0.30 לארי.\n\nהשכרת רכב מתחילה מ-80 לארי ליום. שימו לב: הנהיגה בגאורגיה שונה מישראל — היזהרו בכבישים הררים מחוץ לעיר.', icon: '🚕', bg: '#F7BE68', bgDark: '#F4A94E' },
  '6': { title: 'מסעדות ואוכל', subtitle: 'מטבח מקומי ואוכל משובח', description: 'המטבח הגאורגי הוא חוויה בפני עצמה. חצ׳פורי, חינקלי, שש״ק ויין מעולה. המלצות למסעדות הטובות ביותר בבטומי, כולל מחירים ותפריטים.\n\nחובה לטעום: חצ׳פורי אג׳רולי (הגרסה המקומית עם ביצה), חינקלי (כיסוני בשר), מצוואדי (שיפודים), ולובייני (שעועית). היין הגאורגי מיוצר בשיטה עתיקה בקווערי (כדי חרס).\n\nמסעדות מומלצות: Retro, Old Boulevard, Porto Franco, ו-Fanfan. ארוחה לזוג עם יין: 60-100 לארי (70-120 ש״ח).', icon: '🍽️', bg: '#5BC0DE', bgDark: '#3DA5C4' },
  '7': { title: 'קניות ומתנות', subtitle: 'שופינג ומזכרות', description: 'מרכזי קניות, שווקים מקומיים, חנויות מזכרות ומתנות מיוחדות מגאורגיה. איפה קונים, מה שווה, וטיפים למיקוח.\n\nהשוק המרכזי של בטומי (Boni Market) הוא חובה לביקור — תבלינים, גבינות, ממתקים מקומיים (צ׳ורצ׳חלה), ויין. Metro City Mall הוא מרכז הקניות הגדול ביותר.\n\nמתנות מומלצות: יין גאורגי, צ׳ורצ׳חלה, חרסינה מסורתית, ובדים ארוגים ביד.', icon: '🛍️', bg: '#2E8BA8', bgDark: '#1A6B8A' },
  '8': { title: 'ספורט ואיכות חיים', subtitle: 'כושר ופעילויות', description: 'חדרי כושר, בריכות שחייה, יוגה על החוף, רכיבה על אופניים וספורט ימי. שמרו על אורח חיים פעיל גם בחופשה.\n\nחוף הים של בטומי מושלם לריצה ורכיבה על אופניים. השכרת אופניים זמינה לאורך הטיילת. חדרי כושר מומלצים: Gym Nation, Sport Life.\n\nספורט ימי: ג׳ט סקי, פרשתינג, שיט בקיאקים ואפילו צלילה. יוגה על החוף בכל בוקר (חינם) ליד מגדל האלפבית.', icon: '🏋️', bg: '#5BC0DE', bgDark: '#3DA5C4' },
  '9': { title: 'אקסטרים וסקי', subtitle: 'הרפתקאות ואתגרים', description: 'פעילויות אתגריות ואקסטרים — גלישת סקי בגודאורי, רפטינג, ג׳יפים בהרים, פרגליידינג ועוד הרפתקאות שלא תשכחו.\n\nגודאורי — אתר הסקי המוביל בגאורגיה, 4 שעות נסיעה מבטומי. עונת הסקי: דצמבר-אפריל. מחיר סקי פס: 40 לארי ליום.\n\nמבטומי עצמה: רפטינג בנהר Acharistskali, ג׳יפים להרי אג׳ארה, פרגליידינג מעל העיר, וטיולי הרים בפארק הלאומי Mtirala.', icon: '⛷️', bg: '#F7BE68', bgDark: '#F4A94E' },
  '10': { title: 'מדריכים ישראלים וסוכנים', subtitle: 'ליווי אישי בעברית', description: 'מדריכים ישראלים מקומיים שמכירים כל פינה בבטומי. סוכני נסיעות, ליווי אישי, סיורים פרטיים והמלצות מקומיות בעברית.\n\nהמדריכים שלנו הם ישראלים שחיים בבטומי ומכירים את העיר על בוריה. הם יכולים לעזור בהזמנת מלונות, מסעדות, ותחבורה — הכל בעברית.\n\nשירותים: סיורים פרטיים, ליווי עסקי, סיוע בפתיחת חשבון בנק, והמלצות מקומיות אותנטיות.', icon: '🇮🇱', bg: '#2E8BA8', bgDark: '#1A6B8A' },
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cat = CATEGORIES[id || ''];
  const { dark } = useContext(ThemeContext);
  const { simulatedWidth } = useContext(PreviewContext);
  const { width: screenW } = useWindowDimensions();
  const maxW = simulatedWidth ? Math.min(simulatedWidth, screenW) : undefined;

  if (!cat) {
    return (
      <SafeAreaView style={st.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'קטגוריה', headerBackTitle: 'חזרה' }} />
        <View style={st.emptyWrap}>
          <Text style={st.emptyTxt}>קטגוריה לא נמצאה</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.safe, dark && { backgroundColor: Colors.TEXT }]}>
      <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
      <DevicePreviewBar />
      <ScrollView showsVerticalScrollIndicator={false} style={maxW ? { maxWidth: maxW, alignSelf: 'center', width: '100%' } : undefined}>
        {/* Hero gradient header */}
        <LinearGradient
          colors={[cat.bg, cat.bgDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.hero}
        >
          <Text style={st.heroIcon}>{cat.icon}</Text>
          <Text style={st.heroTitle}>{cat.title}</Text>
          <Text style={st.heroSub}>{cat.subtitle}</Text>
        </LinearGradient>

        {/* Content */}
        <View style={st.body}>
          <Text style={[st.content, dark && { color: Colors.BACKGROUND }]}>{cat.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },

  hero: {
    paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center',
  },
  heroIcon: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 15, color: Colors.WHITE, opacity: 0.8, marginTop: 6, textAlign: 'center', writingDirection: 'rtl' },

  body: { padding: 24 },
  content: {
    fontSize: 16, color: Colors.TEXT, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl',
  },
});
