export type Illustration = { key: string; label: string; source: any };

export const ILLUSTRATIONS: Illustration[] = [
  { key: 'hotels',         label: 'אירוח ולינה',          source: require('./hotels.png') },
  { key: 'attractions',    label: 'אתרים ואטרקציות',     source: require('./attractions.png') },
  { key: 'audio-tour',     label: 'סיורים קוליים',       source: require('./audio-tour.png') },
  { key: 'nightlife',      label: 'בילוי וחיי לילה',      source: require('./nightlife.png') },
  { key: 'transport',      label: 'תחבורה',               source: require('./transport.png') },
  { key: 'restaurants',    label: 'מסעדות ואוכל',        source: require('./restaurants.png') },
  { key: 'shopping',       label: 'קניות ומתנות',         source: require('./shopping.png') },
  { key: 'sports',         label: 'ספורט ואיכות חיים',    source: require('./sports.png') },
  { key: 'extreme-ski',    label: 'אקסטרים וסקי',         source: require('./extreme-ski.png') },
  { key: 'israeli-guides', label: 'מדריכים ישראלים',     source: require('./israeli-guides.png') },
  { key: 'health',         label: 'בריאות',               source: require('./health.png') },
  { key: 'insurance',      label: 'ביטוחים',              source: require('./insurance.png') },
  { key: 'telecom',        label: 'תקשורת וסלולר',       source: require('./telecom.png') },
  { key: 'tips',           label: 'טיפים',                source: require('./tips.png') },
  { key: 'tax-refund',     label: 'החזרי מס',             source: require('./tax-refund.png') },
  { key: 'welcome',        label: 'ברוכים הבאים',         source: require('./welcome.png') },
  { key: 'landing',        label: 'נחיתה רכה',            source: require('./landing.png') },
  { key: 'history',        label: 'היסטוריה כללית',       source: require('./history.png') },
  { key: 'jewish-history', label: 'היסטוריה יהודית',     source: require('./jewish-history.png') },
  { key: 'going-home',     label: 'חוזרים הביתה',         source: require('./going-home.png') },
];
