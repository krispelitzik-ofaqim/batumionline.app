// Content for each business-portal service detail page (requirements + CTA).
// Edit freely — this drives the generic /portal/service/[id] screen.

export type ServiceCta = { kind: 'link' | 'contact'; label: string; url?: string };

export type ServiceDetail = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;        // Ionicons name
  colors: [string, string];
  description: string;
  requirements: string[];
  cta: ServiceCta;
};

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  lawyer: {
    id: 'lawyer',
    title: 'שירותי עורך דין',
    subtitle: 'LEGAL SERVICES',
    icon: 'shield-checkmark',
    colors: ['#1A6B8A', '#0E4A60'],
    description: 'ליווי משפטי מקיף בגאורגיה — חוזים, עסקאות נדל״ן, ייפויי כוח, וייצוג מול הרשויות בכל שלב.',
    requirements: [
      'דרכון בתוקף או תעודת זהות',
      'תיאור קצר של הנושא או הצורך המשפטי',
      'מסמכים רלוונטיים (חוזה, ייפוי כוח, התכתבות)',
      'פרטי התקשרות זמינים',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  cpa: {
    id: 'cpa',
    title: 'שירותי רואה חשבון',
    subtitle: 'ACCOUNTING & TAX',
    icon: 'calculator',
    colors: ['#3DA5C4', '#1A6B8A'],
    description: 'חשבונאות ומיסוי בגאורגיה — הנהלת חשבונות, דיווחים שוטפים וליווי מול רשות המסים (RS.ge).',
    requirements: [
      'סוג הפעילות או העסק',
      'מספר עוסק או חברה (אם קיים)',
      'מסמכי הכנסות והוצאות',
      'דרכון או פרטי זיהוי',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  bank: {
    id: 'bank',
    title: 'פתיחת חשבון בנק',
    subtitle: 'BANKING IN GEORGIA',
    icon: 'card',
    colors: ['#F4A94E', '#D97E2B'],
    description: 'פתיחת חשבון בנק בינלאומי בבנקים המובילים TBC ו-Bank of Georgia — מהבית, ללא טיסה, ובליווי אישי מלא.',
    requirements: [
      'דרכון בתוקף (לפחות 6 חודשים)',
      '3 תלושי שכר אחרונים',
      'אישור ניהול חשבון בנק בישראל (באנגלית)',
      'תדפיסי בנק 6 חודשים אחרונים',
      'הוכחת כתובת בישראל',
      'ייפוי כוח נוטוריוני חתום',
    ],
    cta: { kind: 'link', label: 'התחל תהליך', url: 'https://www.batumionline.biz' },
  },
  residency: {
    id: 'residency',
    title: 'אישור תושבות',
    subtitle: 'RESIDENCY',
    icon: 'home',
    colors: ['#2E9E8F', '#16726A'],
    description: 'הסדרת מעמד תושבות בגאורגיה וליווי מלא בתהליך מול הרשויות.',
    requirements: [
      'דרכון בתוקף',
      'הוכחת כתובת מגורים בגאורגיה (חוזה שכירות או בעלות)',
      'הוכחת אמצעים כלכליים',
      'תמונות פספורט עדכניות',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  business: {
    id: 'business',
    title: 'פתיחת עסק או חברה',
    subtitle: 'BUSINESS SETUP',
    icon: 'storefront',
    colors: ['#5A6FB0', '#34467E'],
    description: 'רישום עסק או חברה בגאורגיה — כולל מעמד "עוסק זעיר" עם מס של 1% על המחזור, אידיאלי לפרילנסרים ובעלי עסקים.',
    requirements: [
      'דרכון בתוקף',
      'שם וסוג הפעילות העסקית',
      'כתובת רשומה בגאורגיה',
      'ייפוי כוח (לרישום מרחוק)',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  citizenship: {
    id: 'citizenship',
    title: 'אזרחות גאורגית',
    subtitle: 'CITIZENSHIP',
    icon: 'ribbon',
    colors: ['#C0392B', '#8E2A20'],
    description: 'ליווי מקצועי בתהליך קבלת אזרחות גאורגית — מהבדיקה הראשונית ועד קבלת האזרחות.',
    requirements: [
      'דרכון בתוקף',
      'תעודות לידה / נישואין מתורגמות ומאומתות (אפוסטיל)',
      'הוכחת זיקה לגאורגיה',
      'היסטוריית תושבות (אם רלוונטי)',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  passport: {
    id: 'passport',
    title: 'דרכון גאורגי',
    subtitle: 'GEORGIAN PASSPORT',
    icon: 'book',
    colors: ['#2D4A6B', '#16314A'],
    description: 'הוצאה, חידוש ומעקב אחר דרכון גאורגי.',
    requirements: [
      'אזרחות גאורגית קיימת או מאושרת',
      'תעודת זהות גאורגית',
      'תמונות ביומטריות',
      'טופס בקשה חתום',
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
};

export const SERVICE_ORDER = ['lawyer', 'cpa', 'bank', 'residency', 'business', 'citizenship', 'passport'];
