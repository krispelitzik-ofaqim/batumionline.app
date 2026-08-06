import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'he' | 'en';

// App-shell UI strings (chrome only). Content (places/tours/categories) comes from the server.
// Missing keys fall back to Hebrew, then to the key itself.
const STRINGS: Record<string, { he: string; en: string }> = {
  // tabs
  'tab.home':    { he: 'בית',    en: 'Home' },
  'tab.search':  { he: 'חיפוש',  en: 'Search' },
  'tab.map':     { he: 'מפה',    en: 'Map' },
  'tab.info':    { he: 'מידע',   en: 'Info' },
  'tab.contact': { he: 'צור קשר', en: 'Contact' },
  // home
  'home.moreCategories': { he: 'קטגוריות נוספות', en: 'More categories' },
  'home.onlineInfo':     { he: 'מידע On Line',    en: 'Info Online' },
  // common (shared)
  'c.loading':   { he: 'טוען...',   en: 'Loading...' },
  'c.loadingE':  { he: 'טוען…',     en: 'Loading…' },
  'c.cancel':    { he: 'ביטול',     en: 'Cancel' },
  'c.close':     { he: 'סגור',      en: 'Close' },
  'c.error':     { he: 'שגיאה',     en: 'Error' },
  'c.send':      { he: 'שליחה',     en: 'Send' },
  'c.search':    { he: 'חפש',       en: 'Search' },
  'c.call':      { he: '📞 חייג',    en: '📞 Call' },
  'c.phone':     { he: 'טלפון',     en: 'Phone' },
  'c.fullName':  { he: 'שם מלא',    en: 'Full name' },
  'c.email':     { he: 'אימייל',    en: 'Email' },
  'c.message':   { he: 'הודעה',     en: 'Message' },
  'c.navigate':  { he: '🧭 נווט',    en: '🧭 Navigate' },
  'c.gotIt':     { he: 'הבנתי',     en: 'Got it' },
  'c.all':       { he: 'הכל',       en: 'All' },
  'c.thanks':    { he: 'תודה!',     en: 'Thank you!' },
  'c.delete':    { he: 'מחק',       en: 'Delete' },
  'c.website':   { he: 'האתר',      en: 'Website' },
  'c.whatsapp':  { he: 'וואטסאפ',   en: 'WhatsApp' },
  'c.missing':   { he: 'חסרים פרטים', en: 'Missing details' },
  'c.missingMsg':{ he: 'אנא מלאו שם והודעה', en: 'Please fill in a name and a message' },
  'c.cantSend':  { he: 'לא ניתן לשלוח כרגע', en: "Can't send right now" },
  // contact / info tab
  'ct.heroTitle':{ he: 'נשמח לשמוע מכם', en: "We'd love to hear from you" },
  'ct.heroSub':  { he: 'שאלה, הצעה או שיתוף פעולה — דברו איתנו', en: 'A question, suggestion or collaboration — talk to us' },
  'ct.formTitle':{ he: 'שליחת הודעה', en: 'Send a message' },
  'ct.msgPh':    { he: 'ההודעה שלכם', en: 'Your message' },
  'ct.sendArrow':{ he: 'שליחה ←',    en: 'Send →' },
  'ct.backHome': { he: 'חזרה לדף הבית', en: 'Back to home' },
  'ct.locLine':  { he: '📍 בטומי, גאורגיה', en: '📍 Batumi, Georgia' },
  'ct.hoursLine':{ he: '🕐 ראשון-חמישי 09:00-18:00', en: '🕐 Sunday-Thursday 09:00-18:00' },
  'ct.sentTitle':{ he: 'ההודעה נשלחה בהצלחה!', en: 'Your message was sent successfully!' },
  'ct.sentSub':  { he: 'תודה על פנייתך 🙏\nנחזור אליך בהקדם האפשרי', en: 'Thank you for reaching out 🙏\nWe will get back to you as soon as possible' },
  // map
  'map.nearMe':  { he: '📍 קרוב אליי', en: '📍 Near me' },
  'map.categories': { he: 'קטגוריות מפה', en: 'Map categories' },
  'map.loadingLoc': { he: 'טוען מיקום...', en: 'Getting location...' },

  // place / tickets
  'pl.notFound': { he: 'לא נמצא מידע', en: 'No information found' },
  'pl.hours':    { he: 'שעות פתיחה', en: 'Opening hours' },
  'pl.open247':  { he: 'פתוח 24 שעות ביממה, 7 ימים בשבוע', en: 'Open 24 hours a day, 7 days a week' },
  'pl.priceAvail':{ he: 'ראה מחיר וזמינות', en: 'See price & availability' },
  'pl.officialSite':{ he: 'אתר רשמי', en: 'Official website' },
  'pl.notFoundMore':{ he: 'לא נמצא מידע נוסף', en: 'No further information found' },
  'tk.buy':      { he: 'רכישת כרטיס', en: 'Buy a ticket' },
  'tk.onsite':   { he: 'תשלום בכניסה', en: 'Pay at entrance' },
  'tk.free':     { he: 'חינם',       en: 'Free' },
  'tk.appt':     { he: 'בתיאום מראש', en: 'By appointment' },
  // tour
  'tr.routeMap': { he: 'מפת המסלול', en: 'Route map' },
  'tr.stops':    { he: 'תחנות הסיור', en: 'Tour stops' },
  'tr.audioSoon':{ he: 'קבצי אודיו יתווספו בקרוב', en: 'Audio files coming soon' },
  'tr.photosSoon':{ he: 'תמונות יתווספו בקרוב', en: 'Photos coming soon' },
  // welcome
  'wl.worthIt':  { he: 'משתלם!',     en: 'Worth it!' },
  'wl.welcome':  { he: 'ברוכים הבאים', en: 'Welcome' },
  // currency modal
  'cur.title':   { he: 'המרת מטבעות', en: 'Currency Converter' },
  'cur.sub':     { he: 'שערים מתעדכנים בזמן אמת', en: 'Rates updated in real time' },
  'cur.refresh': { he: 'רענן נתונים', en: 'Refresh' },
  'cur.clear':   { he: 'נקה', en: 'Clear' },
  'cur.tickerHdr':{ he: 'שערי מטבעות חיים', en: 'Live Exchange Rates' },
  // news modal
  'news.title':  { he: 'חדשות בעברית', en: 'News' },
  'news.sub':    { he: 'חדשות ועדכונים מבטומי וגאורגיה', en: 'News and updates from Batumi and Georgia' },
  'news.empty':  { he: 'אין חדשות בקטגוריה זו', en: 'No news in this category' },
  'news.readMore':{ he: 'המשך לכתבה המלאה באתר המקור ←', en: 'Read the full article at the source →' },
  // cameras modal
  'cam.live':    { he: '● חי', en: '● Live' },
  'cam.location':{ he: '📍 מיקום', en: '📍 Location' },
  'cam.title':   { he: '📹 מצלמות חיות מבטומי', en: '📹 Live Cameras from Batumi' },
  'cam.sub':     { he: 'לחץ לצפייה בשידור חי', en: 'Tap to watch the live stream' },
  // search modal
  'srch.ph':     { he: 'חפש באפליקציה...', en: 'Search the app...' },
  'srch.hint':   { he: 'הקלד מילת חיפוש — קטגוריות, מקומות, סיורים', en: 'Type to search — categories, places, tours' },
  // weather modal
  'wthr.title':  { he: 'מזג האוויר בבטומי', en: 'Weather in Batumi' },
  'wthr.camBanner':{ he: 'צפה במצלמות חיות מבטומי', en: 'Watch live cameras from Batumi' },
  'wthr.feels':  { he: 'מרגיש כמו', en: 'Feels like' },
  'wthr.humidity':{ he: 'לחות', en: 'Humidity' },
  'wthr.wind':   { he: 'רוח קמ״ש', en: 'Wind km/h' },
  'wthr.seaTemp':{ he: 'טמפ׳ הים', en: 'Sea temp' },
  'wthr.uv':     { he: 'אינדקס UV', en: 'UV index' },
  'wthr.sunrise':{ he: 'זריחה', en: 'Sunrise' },
  'wthr.sunset': { he: 'שקיעה', en: 'Sunset' },
  'wthr.next24': { he: '24 השעות הקרובות', en: 'Next 24 hours' },
  'wthr.now':    { he: 'עכשיו', en: 'Now' },
  'wthr.weekly': { he: 'תחזית שבועית', en: 'Weekly forecast' },
  'wthr.skippers':{ he: 'מזג אוויר לספנים ושייטים', en: 'Weather for sailors & boaters' },
  'wthr.skippersNote':{ he: 'נתונים מ-Stormglass · מתרענן כל שעה', en: 'Data from Stormglass · refreshes hourly' },
  // flights modal
  'flt.clock':   { he: 'שעון בטומי', en: 'Batumi clock' },
  'flt.refresh': { he: 'רענן', en: 'Refresh' },
  'flt.departures':{ he: 'המראות מבטומי', en: 'Departures from Batumi' },
  'flt.arrivals':{ he: 'נחיתות בבטומי', en: 'Arrivals in Batumi' },
  'flt.colFlight':{ he: 'טיסה', en: 'Flight' },
  'flt.colRoute':{ he: 'המראה / נחיתה', en: 'Departure / Arrival' },
  'flt.colStatus':{ he: 'סטטוס', en: 'Status' },
  'flt.empty':   { he: 'אין טיסות ב-12 השעות הקרובות', en: 'No flights in the next 12 hours' },
  'flt.followFr24':{ he: 'עקוב ב-FlightRadar24', en: 'Track on FlightRadar24' },
  'flt.searchTitle':{ he: 'חפש טיסות', en: 'Search flights' },
  'flt.searchSub':{ he: 'השוואת מחירים ומציאת טיסות', en: 'Compare prices and find flights' },
  // my-tours
  'mt.title':    { he: 'הסיורים שלי', en: 'My Tours' },
  'mt.intro':    { he: 'בנה סיור משלך לפי ימים ושעות. לחץ על "✏️" ליד עצירה כדי לקבוע יום ושעה.', en: 'Build your own tour by days and times. Tap the "✏️" next to a stop to set a day and time.' },
  'mt.newName':  { he: 'שם הסיור החדש:', en: 'New tour name:' },
  'mt.newNamePh':{ he: 'לדוגמה: סוף שבוע ראשון בבטומי', en: 'e.g. First weekend in Batumi' },
  'mt.create':   { he: '✓ צור סיור', en: '✓ Create tour' },
  'mt.createNew':{ he: '+ צור סיור חדש', en: '+ Create a new tour' },
  'mt.empty':    { he: 'עדיין לא יצרת סיורים', en: "You haven't created any tours yet" },
  'mt.emptySub': { he: 'כשתוסיף אטרקציה לסיור היא תופיע כאן', en: 'When you add an attraction to a tour it will appear here' },
  'mt.delTitle': { he: 'מחיקת סיור', en: 'Delete tour' },
  'mt.delMsg':   { he: 'למחוק את הסיור?', en: 'Delete this tour?' },
  'mt.permTitle':{ he: 'הרשאה נדרשת', en: 'Permission required' },
  'mt.permMsg':  { he: 'יש לאפשר גישה למצלמה', en: 'Please allow camera access' },
  'mt.savedTitle':{ he: '✓ נשמר', en: '✓ Saved' },
  'mt.savedMsg': { he: 'נוצר סיור "הזכרונות שלי" עם הצילום', en: 'Created a "My Memories" tour with the photo' },
  'mt.addedTitle':{ he: '✓ נוסף', en: '✓ Added' },
  'mt.camErr':   { he: 'לא ניתן לצלם', en: "Couldn't take a photo" },
  // portals
  'po.brokersTitle':{ he: 'סוכני נדל"ן מורשים', en: 'Licensed real estate agents' },
  'po.whatRequired':{ he: 'מה נדרש מהסוכן?', en: 'What is required of an agent?' },
  'po.recommendAgent':{ he: 'המלצה על סוכן נדל"ן', en: 'Recommend a real estate agent' },
  'po.agentReqTitle':{ he: 'דרישות מסוכן נדל״ן', en: 'Real estate agent requirements' },
  'po.noAgents': { he: 'אין סוכנים זמינים כרגע', en: 'No agents available right now' },
  'po.recommendedAgent':{ he: '✓ סוכן נדל״ן מומלץ בבטומי', en: '✓ Recommended real estate agent in Batumi' },
  'po.businessTitle':{ he: 'פורטל העסקים', en: 'Business Portal' },
  'po.openBank': { he: 'לפתיחת חשבון בנק', en: 'Open a bank account' },
  'po.contact':  { he: 'צור קשר', en: 'Contact' },
  'po.noBusiness':{ he: 'אין עסקים בקטגוריה זו', en: 'No businesses in this category' },
  'po.reTitle':  { he: 'פורטל הנדל״ן', en: 'Real Estate Portal' },
  'po.reSub':    { he: 'כל העסקאות, הפרויקטים והמידע במקום אחד', en: 'All the deals, projects and info in one place' },
  'po.whoAreYou':{ he: 'מי אתה?', en: 'Who are you?' },
  'po.privateClient':{ he: 'לקוח פרטי', en: 'Private client' },
  'po.developerBroker':{ he: 'יזם / מתווך', en: 'Developer / Broker' },
  'po.readMore': { he: 'קרא עוד', en: 'Read more' },
  'po.moreInfo': { he: '↗ למידע נוסף', en: '↗ More info' },
  'po.fullSource':{ he: '↗ למקור המלא', en: '↗ Full source' },
  'po.allBrokers':{ he: 'לכל המתווכים ›', en: 'All brokers ›' },
  'po.service':  { he: 'שירות', en: 'Service' },
  'po.routes':   { he: 'המסלולים האפשריים', en: 'Available paths' },
  'po.basics':   { he: 'תנאים בסיסיים שצריך לדעת', en: 'Basic requirements to know' },
  'po.noItems':  { he: 'אין פריטים עדיין', en: 'No items yet' },
  'po.noService':{ he: 'לא נמצא מידע על שירות זה', en: 'No information found for this service' },
  'po.critTitle':{ he: '✓ קריטריוני אימות סוכנים', en: '✓ Agent verification criteria' },
  'po.crit1':{ he: '• ניסיון מוכח בנדל"ן בבטומי - מעל שנתיים', en: '• Proven Batumi real estate experience — over two years' },
  'po.crit2':{ he: '• חשבון בנק פעיל בבטומי', en: '• An active bank account in Batumi' },
  'po.crit3':{ he: '• ערוץ תקשורת (אתר, פייסבוק, אחר)', en: '• A communication channel (website, Facebook, other)' },
  'po.crit4':{ he: '• הצגת הסכם מכר שבוצע בעבר', en: '• Showing a past sale agreement' },
  'po.crit5':{ he: '• שיחת טלפון אישית', en: '• A personal phone call' },
  'po.crit6':{ he: '• שליחת פרטים, תמונה ומסמכים נוספים (ככל שיידרשו)', en: '• Sending details, a photo and documents (as needed)' },
  'po.crit7':{ he: '• 2 ממליצים לפחות', en: '• At least 2 references' },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: (k: string) => string; isRTL: boolean };
const I18nCtx = createContext<Ctx>({ lang: 'he', setLang: () => {}, toggle: () => {}, t: (k) => k, isRTL: true });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('he');
  useEffect(() => {
    AsyncStorage.getItem('appLang').then(v => { if (v === 'en' || v === 'he') setLangState(v); }).catch(() => {});
  }, []);
  const setLang = (l: Lang) => { setLangState(l); AsyncStorage.setItem('appLang', l).catch(() => {}); };
  const toggle = () => setLang(lang === 'he' ? 'en' : 'he');
  const t = (k: string) => STRINGS[k]?.[lang] ?? STRINGS[k]?.he ?? k;
  return <I18nCtx.Provider value={{ lang, setLang, toggle, t, isRTL: lang !== 'en' }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
