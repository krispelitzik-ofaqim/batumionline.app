// Translated legal pages (About / Terms / Privacy) for the non-Hebrew editions.
// The Hebrew originals live in the server content (data.legal[].longText); these are
// fixed translations keyed by tab id + language, used by app/(tabs)/info.tsx.
// English & Russian render LTR; Persian (fa) stays RTL like Hebrew.

type LL = 'en' | 'fa' | 'ru';
const isR = (l: LL) => l === 'fa';
const ta = (l: LL) => (isR(l) ? 'right' : 'left');
const dr = (l: LL) => (isR(l) ? 'rtl' : 'ltr');

const doc = (l: LL, fontSize: number, inner: string) =>
  `<div style="text-align:${ta(l)};direction:${dr(l)};font-family:Arial,sans-serif;font-size:${fontSize}px;line-height:1.7;color:#1C2B35;padding:8px">\n${inner}\n</div>`;
const title = (l: LL, t: string) => `<p style="text-align:${ta(l)};direction:${dr(l)};font-weight:900;font-size:18px;margin:0 0 12px">${t}</p>`;
const sec = (l: LL, t: string) => `<p style="text-align:${ta(l)};direction:${dr(l)};font-weight:900;margin:14px 0 6px">${t}</p>`;
const para = (l: LL, t: string, mb = 8) => `<p style="text-align:${ta(l)};direction:${dr(l)};margin:0 0 ${mb}px">${t}</p>`;
const foot = (l: LL, t: string) => `<p style="text-align:${ta(l)};direction:${dr(l)};margin:14px 0 0;font-size:11px;color:#64748b">${t}</p>`;
const teamFoot = (l: LL, t: string) => `<p style="text-align:${ta(l)};direction:${dr(l)};margin:14px 0 0;font-weight:700;color:#1A6B8A">${t}</p>`;

// ---------------- ABOUT ----------------
const ABOUT: Record<LL, { title: string; p: string[]; team: string }> = {
  en: {
    title: 'About us',
    p: [
      '<strong>Batumi Online</strong> is the comprehensive Israeli guide to Batumi, Georgia.',
      'We were born out of love for this beautiful city and a desire to help every visitor experience it in the best possible way.',
      'The app brings together in one place all the information a visitor needs:<br>hotels, apartments, restaurants, attractions, transport, maps, a real-estate portal and a business portal, audio tours, licensed guides, verified real-estate agents and more.',
      '<strong>Our goal:</strong> to give you all the tools for a smart, safe and enjoyable trip — with simple, clear icons, and no confusion.',
      "Whether this is your first visit to Batumi or your fifth — we're here so you go home with an unforgettable experience.",
    ],
    team: '— The Batumi Online team',
  },
  ru: {
    title: 'О нас',
    p: [
      '<strong>Batumi Online</strong> — это полный путеводитель по Батуми, Грузия.',
      'Мы создали его из любви к этому прекрасному городу и желания помочь каждому гостю увидеть его наилучшим образом.',
      'Приложение собирает в одном месте всю информацию, которая нужна туристу:<br>отели, апартаменты, рестораны, достопримечательности, транспорт, карты, портал недвижимости и портал бизнеса, аудиогиды, лицензированные гиды, проверенные риелторы и многое другое.',
      '<strong>Наша цель:</strong> дать вам все инструменты для умного, безопасного и приятного путешествия — с простыми и понятными иконками, без путаницы.',
      'Первый это ваш визит в Батуми или пятый — мы здесь, чтобы вы вернулись домой с незабываемыми впечатлениями.',
    ],
    team: '— Команда Batumi Online',
  },
  fa: {
    title: 'درباره ما',
    p: [
      '<strong>Batumi Online</strong> راهنمای جامع باتومی، گرجستان است.',
      'ما از عشق به این شهر زیبا و برای کمک به هر مسافر تا آن را به بهترین شکل تجربه کند، به وجود آمدیم.',
      'این اپلیکیشن همه اطلاعاتی را که یک مسافر نیاز دارد در یک جا گرد می‌آورد:<br>هتل‌ها، آپارتمان‌ها، رستوران‌ها، جاذبه‌ها، حمل‌ونقل، نقشه‌ها، پورتال املاک و پورتال کسب‌وکار، تورهای صوتی، راهنمایان مجاز، مشاوران املاک تأییدشده و موارد دیگر.',
      '<strong>هدف ما:</strong> ارائه همه ابزارها برای سفری هوشمند، ایمن و لذت‌بخش — با آیکون‌های ساده و روشن و بدون سردرگمی.',
      'چه اولین بازدید شما از باتومی باشد و چه پنجمین — ما اینجا هستیم تا با تجربه‌ای فراموش‌نشدنی به خانه بازگردید.',
    ],
    team: '— تیم Batumi Online',
  },
};
const buildAbout = (l: LL) => doc(l, 14, [title(l, ABOUT[l].title), ...ABOUT[l].p.map((x) => para(l, x, 10)), teamFoot(l, ABOUT[l].team)].join('\n'));

// ---------------- TERMS ----------------
const TERMS: Record<LL, { title: string; intro: string; secs: [string, string][]; foot: string }> = {
  en: {
    title: 'Terms of Use',
    intro: 'Welcome to the <strong>Batumi Online</strong> app. Use of the app is subject to the following terms. Your use constitutes your acceptance of these terms.',
    secs: [
      ['1. Purpose of the app', 'The app provides information, recommendations and tools for visitors to the city of Batumi, Georgia. The information is provided "As Is" and does not replace professional advice.'],
      ['2. Third-party content', 'Some of the content, information, images and links originate from third parties (Google, service providers, agents, restaurants, etc.). We are not responsible for the accuracy, availability or quality of this content.'],
      ['3. User-submitted listings and ads', 'Listings published in the app (real estate, services, agents) are the sole responsibility of the advertisers. We perform a basic check, but this is not a guarantee. Verify every detail independently before making contact.'],
      ['4. Removing a listing', 'An advertiser may request removal of their listing via the "I\'m the advertiser – remove listing" button. Removal will be done within 24 hours after verification.'],
      ['5. Third-party services', 'Clicking external links (Booking, Agoda, Google Maps, GetYourGuide and others) leads to third-party sites operating under their own terms.'],
      ['6. Limitation of liability', 'In any case, our liability is limited. We are not responsible for any direct or indirect damage caused by use of the app, by transactions you made through it, or by reliance on the information.'],
      ['7. Changes to the terms', 'We reserve the right to update these terms at any time. Changes take effect upon their publication in the app.'],
      ['8. Governing law', 'These terms are governed by Israeli law. Exclusive jurisdiction lies with the competent courts in Israel.'],
    ],
    foot: 'Last updated: April 2026 · Contact: krispelitzik@gmail.com',
  },
  ru: {
    title: 'Условия использования',
    intro: 'Добро пожаловать в приложение <strong>Batumi Online</strong>. Использование приложения регулируется следующими условиями. Само использование означает ваше согласие с этими условиями.',
    secs: [
      ['1. Назначение приложения', 'Приложение предоставляет информацию, рекомендации и инструменты для туристов в городе Батуми, Грузия. Информация предоставляется «как есть» (As Is) и не заменяет профессиональную консультацию.'],
      ['2. Контент третьих сторон', 'Часть контента, информации, изображений и ссылок получена от третьих сторон (Google, поставщики услуг, посредники, рестораны и т. д.). Мы не несём ответственности за точность, доступность или качество этого контента.'],
      ['3. Объявления и реклама от пользователей', 'Объявления, размещённые в приложении (недвижимость, услуги, посредники), находятся под ответственностью только рекламодателей. Мы проводим базовую проверку, но это не является гарантией. Проверяйте каждую деталь самостоятельно перед обращением.'],
      ['4. Удаление объявления', 'Рекламодатель может запросить удаление своего объявления через кнопку «Я рекламодатель — удалить объявление». Удаление производится в течение 24 часов после проверки.'],
      ['5. Сервисы третьих сторон', 'Переход по внешним ссылкам (Booking, Agoda, Google Maps, GetYourGuide и др.) ведёт на сайты третьих сторон, действующие по собственным правилам.'],
      ['6. Ограничение ответственности', 'В любом случае наша ответственность ограничена. Мы не несём ответственности за прямой или косвенный ущерб, причинённый использованием приложения, сделками, совершёнными вследствие него, или доверием к информации.'],
      ['7. Изменения условий', 'Мы оставляем за собой право обновлять эти условия в любое время. Изменения вступают в силу с момента их публикации в приложении.'],
      ['8. Применимое право', 'К этим условиям применяется израильское право. Исключительная юрисдикция принадлежит компетентным судам Израиля.'],
    ],
    foot: 'Последнее обновление: апрель 2026 · Контакт: krispelitzik@gmail.com',
  },
  fa: {
    title: 'قوانین استفاده',
    intro: 'به اپلیکیشن <strong>Batumi Online</strong> خوش آمدید. استفاده از اپلیکیشن مشمول شرایط زیر است. استفاده شما به منزله پذیرش این قوانین است.',
    secs: [
      ['۱. هدف اپلیکیشن', 'این اپلیکیشن اطلاعات، پیشنهادها و ابزارهایی برای مسافران در شهر باتومی، گرجستان فراهم می‌کند. اطلاعات «همان‌گونه که هست» (As Is) ارائه می‌شود و جایگزین مشاوره تخصصی نیست.'],
      ['۲. محتوای شخص ثالث', 'بخشی از محتوا، اطلاعات، تصاویر و پیوندها از اشخاص ثالث است (گوگل، ارائه‌دهندگان خدمات، واسطه‌ها، رستوران‌ها و غیره). ما مسئول دقت، در دسترس بودن یا کیفیت این محتوا نیستیم.'],
      ['۳. آگهی‌ها و تبلیغات کاربران', 'آگهی‌های منتشرشده در اپلیکیشن (املاک، خدمات، واسطه‌ها) تنها بر عهده آگهی‌دهندگان است. ما بررسی پایه انجام می‌دهیم اما این تضمین نیست. پیش از تماس، هر جزئیات را مستقل بررسی کنید.'],
      ['۴. حذف آگهی', 'آگهی‌دهنده می‌تواند از طریق دکمه «من آگهی‌دهنده هستم - آگهی را حذف کن» درخواست حذف آگهی خود را بدهد. حذف ظرف ۲۴ ساعت پس از تأیید انجام می‌شود.'],
      ['۵. خدمات شخص ثالث', 'کلیک روی پیوندهای خارجی (Booking، Agoda، Google Maps، GetYourGuide و غیره) به وب‌سایت‌های شخص ثالث می‌رود که تحت قوانین خود عمل می‌کنند.'],
      ['۶. محدودیت مسئولیت', 'در هر صورت، مسئولیت ما محدود است. ما مسئول هیچ خسارت مستقیم یا غیرمستقیم ناشی از استفاده از اپلیکیشن، معاملاتی که در پی آن انجام داده‌اید یا اتکا به اطلاعات نیستیم.'],
      ['۷. تغییرات در قوانین', 'ما این حق را برای خود محفوظ می‌داریم که این قوانین را در هر زمان به‌روزرسانی کنیم. تغییرات با انتشار در اپلیکیشن اجرایی می‌شوند.'],
      ['۸. قانون حاکم', 'بر این قوانین حقوق اسرائیل حاکم است. صلاحیت انحصاری با دادگاه‌های صالح در اسرائیل است.'],
    ],
    foot: 'آخرین به‌روزرسانی: آوریل ۲۰۲۶ · تماس: krispelitzik@gmail.com',
  },
};

// ---------------- PRIVACY ----------------
const PRIVACY: Record<LL, { title: string; intro: string; secs: [string, string][]; foot: string }> = {
  en: {
    title: 'Privacy Policy',
    intro: 'At <strong>Batumi Online</strong> we respect your privacy. This document explains what information we collect, how we use it and how it is stored.',
    secs: [
      ['1. What information we collect', '• <strong>Contact details</strong> – name, email, phone – when you contact us or post a listing.<br>• <strong>Usage data</strong> – pages you visited, actions you took (anonymous analytics).<br>• <strong>Location</strong> – only if you granted permission (for maps and tours).<br>• <strong>Content you uploaded</strong> – images, listings, reviews.'],
      ['2. How we use the information', '• To display the content and services<br>• To improve the app and fix bugs<br>• To respond to your inquiries<br>• To send important updates (only if you agreed)'],
      ['3. Sharing with third parties', 'We do not sell personal information. Sharing occurs only:<br>• with service providers (hosting, analytics)<br>• as required by law<br>• with your explicit consent'],
      ['4. Cookies and local storage', 'The app uses local storage to improve the experience (preferences, cached images). You can delete it at any time via your device settings.'],
      ['5. Data security', 'We take reasonable protective measures, including encryption (HTTPS) and access restrictions. However, absolute security on the internet does not exist.'],
      ['6. Your rights', 'You have the right to review your information, correct it, request deletion, or stop receiving notifications. Contact us: krispelitzik@gmail.com.'],
      ['7. Third-party services', 'Links to Google Maps, Booking, Agoda, GetYourGuide and others operate under their own privacy policies. We are not responsible for them.'],
      ['8. Children', 'The service is intended for ages 4+. We do not knowingly collect information from children under 13. If we become aware of this, we will delete it immediately.'],
      ['9. Changes to the policy', 'We will update the policy from time to time. Material changes will be published in the app.'],
    ],
    foot: 'Last updated: April 2026 · Contact: krispelitzik@gmail.com',
  },
  ru: {
    title: 'Политика конфиденциальности',
    intro: 'Мы в <strong>Batumi Online</strong> уважаем вашу конфиденциальность. В этом документе объясняется, какую информацию мы собираем, как её используем и как храним.',
    secs: [
      ['1. Какую информацию мы собираем', '• <strong>Контактные данные</strong> — имя, эл. почта, телефон — когда вы обращаетесь к нам или размещаете объявление.<br>• <strong>Данные об использовании</strong> — посещённые страницы, выполненные действия (анонимная аналитика).<br>• <strong>Местоположение</strong> — только если вы дали разрешение (для карт и туров).<br>• <strong>Загруженный вами контент</strong> — изображения, объявления, отзывы.'],
      ['2. Как мы используем информацию', '• Для отображения контента и услуг<br>• Для улучшения приложения и исправления ошибок<br>• Для ответа на ваши обращения<br>• Для отправки важных обновлений (только если вы согласились)'],
      ['3. Передача третьим сторонам', 'Мы не продаём личную информацию. Передача осуществляется только:<br>• поставщикам услуг (хостинг, аналитика)<br>• по требованию закона<br>• с вашего явного согласия'],
      ['4. Файлы cookie и локальное хранилище', 'Приложение использует локальное хранилище для улучшения работы (настройки, кэш изображений). Вы можете удалить его в любой момент через настройки устройства.'],
      ['5. Безопасность данных', 'Мы принимаем разумные меры защиты, включая шифрование (HTTPS) и ограничение доступа. Тем не менее абсолютной безопасности в интернете не существует.'],
      ['6. Ваши права', 'Вы имеете право просматривать свою информацию, исправлять её, запрашивать удаление или прекратить получение уведомлений. Свяжитесь с нами: krispelitzik@gmail.com.'],
      ['7. Сервисы третьих сторон', 'Ссылки на Google Maps, Booking, Agoda, GetYourGuide и другие действуют по их собственным политикам конфиденциальности. Мы не несём за них ответственности.'],
      ['8. Дети', 'Сервис предназначен для лиц от 4 лет. Мы сознательно не собираем информацию от детей младше 13 лет. Если нам станет об этом известно, мы немедленно удалим её.'],
      ['9. Изменения политики', 'Мы будем обновлять политику время от времени. Существенные изменения будут опубликованы в приложении.'],
    ],
    foot: 'Последнее обновление: апрель 2026 · Контакт: krispelitzik@gmail.com',
  },
  fa: {
    title: 'سیاست حریم خصوصی',
    intro: 'ما در <strong>Batumi Online</strong> به حریم خصوصی شما احترام می‌گذاریم. این سند توضیح می‌دهد چه اطلاعاتی جمع‌آوری می‌کنیم، چگونه از آن استفاده می‌کنیم و چگونه نگهداری می‌شود.',
    secs: [
      ['۱. چه اطلاعاتی جمع‌آوری می‌کنیم', '• <strong>اطلاعات تماس</strong> - نام، ایمیل، تلفن - هنگامی که با ما تماس می‌گیرید یا آگهی منتشر می‌کنید.<br>• <strong>داده‌های استفاده</strong> - صفحاتی که بازدید کرده‌اید، اقداماتی که انجام داده‌اید (تحلیل ناشناس).<br>• <strong>موقعیت مکانی</strong> - فقط اگر اجازه داده باشید (برای نقشه‌ها و تورها).<br>• <strong>محتوایی که بارگذاری کرده‌اید</strong> - تصاویر، آگهی‌ها، نظرات.'],
      ['۲. چگونه از اطلاعات استفاده می‌کنیم', '• برای نمایش محتوا و خدمات<br>• برای بهبود اپلیکیشن و رفع اشکالات<br>• برای پاسخ به درخواست‌های شما<br>• برای ارسال به‌روزرسانی‌های مهم (فقط اگر موافقت کرده باشید)'],
      ['۳. اشتراک‌گذاری با اشخاص ثالث', 'ما اطلاعات شخصی را نمی‌فروشیم. اشتراک‌گذاری فقط انجام می‌شود:<br>• با ارائه‌دهندگان خدمات (میزبانی، تحلیل)<br>• طبق الزام قانون<br>• با رضایت صریح شما'],
      ['۴. کوکی‌ها و ذخیره‌سازی محلی', 'اپلیکیشن از ذخیره‌سازی محلی برای بهبود تجربه استفاده می‌کند (تنظیمات، تصاویر کش‌شده). می‌توانید هر زمان از طریق تنظیمات دستگاه آن را حذف کنید.'],
      ['۵. امنیت اطلاعات', 'ما اقدامات حفاظتی معقولی از جمله رمزگذاری (HTTPS) و محدودیت دسترسی انجام می‌دهیم. با این حال، امنیت مطلق در اینترنت وجود ندارد.'],
      ['۶. حقوق شما', 'شما حق دارید اطلاعات خود را مشاهده کنید، آن را اصلاح کنید، درخواست حذف کنید یا دریافت اعلان‌ها را متوقف کنید. با ما تماس بگیرید: krispelitzik@gmail.com.'],
      ['۷. خدمات شخص ثالث', 'پیوندها به Google Maps، Booking، Agoda، GetYourGuide و غیره تحت سیاست حریم خصوصی خود عمل می‌کنند. ما مسئول آن‌ها نیستیم.'],
      ['۸. کودکان', 'این خدمت برای سنین ۴ سال به بالا در نظر گرفته شده است. ما آگاهانه اطلاعاتی از کودکان زیر ۱۳ سال جمع‌آوری نمی‌کنیم. اگر از این موضوع مطلع شویم، فوراً آن را حذف خواهیم کرد.'],
      ['۹. تغییرات در سیاست', 'ما سیاست را هر از گاهی به‌روزرسانی می‌کنیم. تغییرات مهم در اپلیکیشن منتشر خواهد شد.'],
    ],
    foot: 'آخرین به‌روزرسانی: آوریل ۲۰۲۶ · تماس: krispelitzik@gmail.com',
  },
};

const buildSectioned = (l: LL, data: { title: string; intro: string; secs: [string, string][]; foot: string }) =>
  doc(l, 13, [title(l, data.title), para(l, data.intro), ...data.secs.flatMap(([h, p]) => [sec(l, h), para(l, p)]), foot(l, data.foot)].join('\n'));

export const LEGAL_TR: Record<string, Record<LL, string>> = {
  about: { en: buildAbout('en'), fa: buildAbout('fa'), ru: buildAbout('ru') },
  terms: { en: buildSectioned('en', TERMS.en), fa: buildSectioned('fa', TERMS.fa), ru: buildSectioned('ru', TERMS.ru) },
  privacy: { en: buildSectioned('en', PRIVACY.en), fa: buildSectioned('fa', PRIVACY.fa), ru: buildSectioned('ru', PRIVACY.ru) },
};
