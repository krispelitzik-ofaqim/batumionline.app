// Content for each business-portal service detail page (requirements + CTA).
// Edit freely — this drives the generic /portal/service/[id] screen.

export type ServiceCta = { kind: 'link' | 'contact'; label: string; url?: string };

export type ServiceTrack = { title: string; tag?: string; body: string; icon?: string };

export type ServiceDetail = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;        // Ionicons name
  colors: [string, string];
  description: string;
  requirements?: string[];        // simple services: a checklist
  tracks?: ServiceTrack[];        // multi-route services: a banner per route/step
  generalConditions?: string;     // shared conditions footnote
  cta: ServiceCta;
  guide?: { label: string; url: string };   // optional free-guide download button
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
    guide: { label: 'הורדת המדריך החינמי (PDF)', url: 'https://www.batumionline.biz/guide-bank-georgia.pdf' },
  },
  residency: {
    id: 'residency',
    title: 'אישור תושבות',
    subtitle: 'RESIDENCY',
    icon: 'home',
    colors: ['#2E9E8F', '#16726A'],
    description: 'ניתן לקבל אישור תושבות (היתר שהייה זמני) בגאורגיה דרך מספר מסלולים מרכזיים:',
    tracks: [
      {
        title: 'תושבות נדל״ן',
        tag: 'הנפוץ ביותר',
        icon: 'home',
        body: 'רכישת נכס (מגורים או מסחר) בשווי של לפחות $150,000. השווי נקבע אך ורק לפי הערכת שמאי מוסמך בגאורגיה (ולא לפי מחיר החוזה). האישור ניתן לשנה ומחודש בכל שנה.',
      },
      {
        title: 'תושבות משקיע',
        icon: 'trending-up',
        body: 'השקעה של לפחות $300,000 בכלכלה או בנדל״ן. מסלול זה מעניק אישור שהייה ל-5 שנים, שבסיומן ניתן לבקש תושבות קבע.',
      },
      {
        title: 'תושבות עסקית / עבודה',
        icon: 'briefcase',
        body: 'רישום כעוסק מורשה (IE), הקמת חברה או העסקה בחברה מקומית. יש לעמוד בדרישות מחזור שנתיות של העסק ובהוכחת שכר חודשי המבוסס על שכר המינימום המקומי.',
      },
      {
        title: 'תושבות מס (HNWI — ללא חובת שהייה)',
        icon: 'cash',
        body: 'מיועדת לבעלי הון המציגים נכסים גלובליים בשווי של מעל 3 מיליון לארי (GEL) או הכנסה שנתית גבוהה, לצד הוכחת זיקה פיננסית/נכסים בגאורגיה.',
      },
    ],
    generalConditions: 'דרכון בתוקף · הבקשה הראשונה מוגשת פיזית בגאורגיה (Public Service Hall) · כל המסמכים הזרים בתרגום נוטריוני לגאורגית ואימות אפוסטיל.',
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  business: {
    id: 'business',
    title: 'פתיחת עסק או חברה',
    subtitle: 'BUSINESS SETUP',
    icon: 'business',
    colors: ['#5A6FB0', '#34467E'],
    description: 'רישום עסק או חברה בגאורגיה — בחירת המסלול תלויה בהיקף הפעילות ובמבנה המיסוי הרצוי:',
    tracks: [
      {
        title: 'עוסק זעיר / פטור (Small Status IE)',
        tag: '1% מס',
        icon: 'person',
        body: 'רישום: פתיחת תיק עצמאי (IE) בבית השירות הציבורי (Public Service Hall) ורישום ברשות המיסים (Revenue Service). תקרת הכנסה: מחזור שנתי עד 500,000 לארי (GEL). מיסוי: 1% בלבד מהמחזור (או 0% אם המחזור מתחת ל-30,000 לארי, ללא הטבות מסוימות). תחומים מוחרגים: ייעוץ, הימורים, או פעילויות הדורשות רישוי מיוחד.',
      },
      {
        title: 'הקמת חברה בע״מ (LLC)',
        icon: 'business',
        body: 'רישום: במרשם המרכזי הלאומי (NAPR), עם כתובת מקומית רשמית (אפשר שירות כתובת וירטואלית) והפקדת תקנון. הון וניהול: אין דרישת הון עצמי מינימלי, וניתן למנות דירקטור זר שאינו תושב. מיסוי: 15% מס חברות + 5% מס דיבידנד — מוטלים רק בעת חלוקת רווחים בפועל (המודל האסטוני: רווחים המושקעים בחזרה בחברה פטורים ממס).',
      },
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  citizenship: {
    id: 'citizenship',
    title: 'אזרחות גאורגית',
    subtitle: 'CITIZENSHIP',
    icon: 'ribbon',
    colors: ['#C0392B', '#8E2A20'],
    description: 'התנאים משתנים לפי מסלול ההגשה. בכל המסלולים (למעט חריגים) נדרש ויתור על האזרחות הקודמת:',
    tracks: [
      {
        title: 'הליך רגיל (התאזרחות)',
        icon: 'time',
        body: 'שהייה חוקית ורצופה בגאורגיה במשך 10 שנים, הוכחת זיקה כלכלית (עבודה, עסק פעיל או נדל״ן במדינה), ומעבר בהצלחה של מבחנים ממשלתיים בשפה הגאורגית, בהיסטוריה ובחוקה המקומית.',
      },
      {
        title: 'הליך מפושט (נישואין)',
        icon: 'heart',
        body: 'נישואין לאזרח/ית גאורגיה ושהייה חוקית ורצופה במדינה במשך 5 שנים לפחות. גם במסלול זה חובה לעבור את המבחנים בשפה, בהיסטוריה ובחוקה.',
      },
      {
        title: 'חריג של נשיא המדינה',
        tag: 'אזרחות כפולה',
        icon: 'star',
        body: 'הנשיא רשאי להעניק אזרחות לבעלי הישגים יוצאי דופן (ספורט, מדע) או למשקיעים שתרמו תרומה משמעותית לכלכלה. זהו המסלול היחיד המאפשר אזרחות כפולה — לפי שיקול דעת הנשיא בלבד ובכפוף להמלצות של שני אזרחי גאורגיה.',
      },
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
  passport: {
    id: 'passport',
    title: 'דרכון גאורגי',
    subtitle: 'GEORGIAN PASSPORT',
    icon: 'book',
    colors: ['#2D4A6B', '#16314A'],
    description: 'התנאים לקבלת דרכון זהים לתנאי האזרחות — הדרכון הוא תעודת המעבר הרשמית למי שכבר מחזיק באזרחות. לאחר קבלת האזרחות, אלו השלבים הטכניים להנפקה:',
    tracks: [
      {
        title: 'הגשת בקשה',
        icon: 'document-text',
        body: 'פיזית בבית השירות הציבורי (Public Service Hall) בגאורגיה, או דרך שגרירות גאורגיה בעולם.',
      },
      {
        title: 'מסמכים נדרשים',
        icon: 'folder-open',
        body: 'תעודת אזרחות גאורגית בתוקף, תמונות פספורט ביומטריות (נלקחות במקום), ודרכון זר נוכחי.',
      },
      {
        title: 'תשלום אגרה',
        icon: 'cash',
        body: 'עלות ההנפקה משתנה לפי מהירות השירות — מהנפקת אקספרס באותו היום ועד שירות רגיל של 10 ימי עסקים.',
      },
    ],
    cta: { kind: 'contact', label: 'צור קשר לפרטים נוספים' },
  },
};

export const SERVICE_ORDER = ['lawyer', 'cpa', 'bank', 'residency', 'business', 'citizenship', 'passport'];
