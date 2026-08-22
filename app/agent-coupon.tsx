import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../constants/i18n';
import { fetchContent, resolveUri, updateSection } from '../constants/api';
import { openInAppBrowser } from '../constants/affiliates';
import BottomTabBar from '../components/BottomTabBar';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';
const PAYPAL_COUPONS = 'https://www.paypal.com/ncp/payment/KKZPEW7QECXFY';
const PRICE = '$240';
// WhatsApp support for restaurant owners setting up a package (intl format, digits only).
const SUPPORT_PHONE = '972502844867';
const HELP: Record<'he' | 'en' | 'fa' | 'ru', string> = { he: 'צריך סיוע?', en: 'Need help?', fa: 'کمک لازم دارید؟', ru: 'Нужна помощь?' };

type Lang = 'he' | 'en' | 'fa' | 'ru';
const TR: Record<Lang, Record<string, string>> = {
  he: { title: 'הקמת חבילת קופון', validity: 'תוקף החבילה · שנה מיום הרכישה', from: 'מ', to: 'עד', pickBiz: 'חפש את המסעדה שלך', search: 'הקלד שם מסעדה...', discType: 'אחוז ההנחה', fixed: 'קבוע', variable: 'משתנה', fixedHint: 'האחוז יוצג על תמונת הקופון', varHint: 'סליידר 6%–12% יופעל במימוש (המלצר בוחר)', fixedDesc: 'הלקוח יודע את ההנחה מראש.', varDesc: 'בעל המסעדה מחליט את גובה ההנחה ביום הרכישה.', pay: 'המשך לתשלום', logout: 'יציאה', done: 'החבילה הוגדרה!', missing: 'בחר מסעדה ואחוז', dealTitle: 'פרטי עסקה', sumBiz: 'מסעדה', sumDisc: 'גובה ההנחה שנקבעה בקופון', sumTotal: 'סך לתשלום', varLbl: 'משתנה (6%-12%)', change: 'שנה', noRes: 'לא נמצאה מסעדה בשם זה', listNote: 'הרשימה מכילה רק מסעדות שהומלצו על ידי צוות בטומי און ליין' },
  en: { title: 'Set up a coupon package', validity: 'Package validity · one year from purchase', from: 'From', to: 'To', pickBiz: 'Search your restaurant', search: 'Type a restaurant name...', discType: 'Discount', fixed: 'Fixed', variable: 'Variable', fixedHint: 'The % is shown on the coupon image', varHint: 'A 6%–12% slider activates at redemption (waiter picks)', fixedDesc: 'the customer knows the discount in advance.', varDesc: 'the restaurant owner decides the discount on the day.', pay: 'Continue to payment', logout: 'Log out', done: 'Package configured!', missing: 'Pick a restaurant and a %', dealTitle: 'Order summary', sumBiz: 'Restaurant', sumDisc: 'Discount set in the coupon', sumTotal: 'Total', varLbl: 'Variable (6%-12%)', change: 'Change', noRes: 'No restaurant found', listNote: 'The list includes only restaurants recommended by the Batumi Online team' },
  fa: { title: 'راه‌اندازی بسته کوپن', validity: 'اعتبار بسته · یک سال از تاریخ خرید', from: 'از', to: 'تا', pickBiz: 'رستوران خود را جستجو کنید', search: 'نام رستوران را وارد کنید...', discType: 'درصد تخفیف', fixed: 'ثابت', variable: 'متغیر', fixedHint: 'درصد روی تصویر کوپن نمایش داده می‌شود', varHint: 'اسلایدر ۶٪–۱۲٪ هنگام استفاده فعال می‌شود', fixedDesc: 'مشتری تخفیف را از قبل می‌داند.', varDesc: 'صاحب رستوران در روز خرید تصمیم می‌گیرد.', pay: 'ادامه پرداخت', logout: 'خروج', done: 'بسته تنظیم شد!', missing: 'رستوران و درصد را انتخاب کنید', dealTitle: 'جزئیات سفارش', sumBiz: 'رستوران', sumDisc: 'میزان تخفیف تعیین‌شده در کوپن', sumTotal: 'مبلغ کل', varLbl: 'متغیر (۶٪-۱۲٪)', change: 'تغییر', noRes: 'رستورانی یافت نشد', listNote: 'این فهرست فقط شامل رستوران‌هایی است که تیم باتومی آنلاین توصیه کرده است' },
  ru: { title: 'Настройка пакета купонов', validity: 'Срок действия · один год с даты покупки', from: 'С', to: 'По', pickBiz: 'Найдите свой ресторан', search: 'Введите название ресторана...', discType: 'Скидка', fixed: 'Фиксированная', variable: 'Переменная', fixedHint: 'Процент показан на изображении купона', varHint: 'Ползунок 6%–12% активируется при погашении', fixedDesc: 'клиент знает скидку заранее.', varDesc: 'владелец ресторана решает в день покупки.', pay: 'Перейти к оплате', logout: 'Выход', done: 'Пакет настроен!', missing: 'Выберите ресторан и процент', dealTitle: 'Детали заказа', sumBiz: 'Ресторан', sumDisc: 'Размер скидки, установленный в купоне', sumTotal: 'Итого', varLbl: 'Переменная (6%-12%)', change: 'Изменить', noRes: 'Ресторан не найден', listNote: 'В списке только рестораны, рекомендованные командой Batumi Online' },
};

// What the restaurant owner gets — explanation shown at the top of the setup screen.
const INTRO: Record<Lang, { title: string; points: string[] }> = {
  he: { title: 'מה אתם מקבלים?', points: [
    'הקופון שלכם מופיע בעמוד הקופונים ובעמוד המסעדה שלכם באפליקציה',
    'חשיפה לתיירים מכל העולם שמשתמשים באפליקציה — ב-4 שפות (עברית, אנגלית, פרסית, רוסית)',
    'לקוחות חדשים שמגיעים עם הקופון ומזמינים אצלכם',
    'אתם קובעים את גובה ההנחה — קבוע או משתנה',
    'תוקף לשנה שלמה · תשלום חד-פעמי',
  ] },
  en: { title: 'What you get', points: [
    'Your coupon appears on the Coupons page and on your restaurant page in the app',
    'Exposure to tourists from around the world using the app — in 4 languages (Hebrew, English, Persian, Russian)',
    'New customers who arrive with the coupon and order at your place',
    'You set the discount — fixed or variable',
    'Valid for a full year · one-time payment',
  ] },
  fa: { title: 'شما چه چیزی دریافت می‌کنید؟', points: [
    'کوپن شما در صفحه کوپن‌ها و صفحه رستوران شما در برنامه نمایش داده می‌شود',
    'دیده‌شدن توسط گردشگران از سراسر جهان که از برنامه استفاده می‌کنند — به ۴ زبان (عبری، انگلیسی، فارسی، روسی)',
    'مشتریان جدیدی که با کوپن می‌آیند و سفارش می‌دهند',
    'شما میزان تخفیف را تعیین می‌کنید — ثابت یا متغیر',
    'اعتبار یک سال کامل · پرداخت یک‌باره',
  ] },
  ru: { title: 'Что вы получаете', points: [
    'Ваш купон появляется на странице купонов и на странице вашего ресторана в приложении',
    'Показ туристам со всего мира, использующим приложение — на 4 языках (иврит, английский, персидский, русский)',
    'Новые клиенты, которые приходят с купоном и заказывают у вас',
    'Вы устанавливаете скидку — фиксированную или переменную',
    'Действует целый год · единоразовая оплата',
  ] },
};

type Rest = { name: string; image?: string };
const FALLBACK: Rest[] = [{ name: 'Eye of the Sea' }, { name: 'Piazza Grill' }, { name: 'Fanfan' }, { name: 'Laguna' }, { name: 'Porto Franco' }];
const PCTS = [6, 7, 8, 9, 10, 11, 12];

export default function AgentCouponScreen() {
  const { lang, isRTL } = useI18n();
  const L = (lang as Lang) in TR ? (lang as Lang) : 'he';
  const t = TR[L];
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';

  const [q, setQ] = useState('');
  const [restaurants, setRestaurants] = useState<Rest[]>(FALLBACK);
  const [biz, setBiz] = useState<Rest | null>(null);
  const [type, setType] = useState<'fixed' | 'variable'>('fixed');
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    // Load the RAW content so the agent sees every restaurant, including the
    // audience-only Russian/Halal groups that the localized editions hide.
    fetchContent({ raw: true }).then((data: any) => {
      const cat = (data?.mainCategories || []).find((c: any) => c.id === '6' || /מסעד|restaurant/i.test(c.title || ''));
      if (!cat) return;
      const out: Rest[] = [];
      // Prefer the Latin/English name so a non-Hebrew-speaking agent can read it.
      const walk = (arr: any[]) => (arr || []).forEach((x: any) => {
        const nm = x && (x.titleEn || x.name || x.title);
        if (nm && nm.length > 2 && !/^מסעדות$|restaurants?$/i.test(nm)) out.push({ name: nm, image: x.image || x.icon });
        ['children', 'hotels', 'items', 'places'].forEach(k => Array.isArray(x?.[k]) && walk(x[k]));
      });
      walk(cat.children || cat.hotels || []);
      const seen = new Set<string>(); const clean = out.filter(r => !seen.has(r.name) && seen.add(r.name));
      if (clean.length) setRestaurants(clean);
    }).catch(() => {});
  }, []);

  const dates = useMemo(() => {
    const d = new Date();
    const fmt = (x: Date) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
    const end = new Date(d); end.setFullYear(d.getFullYear() + 1);
    return { from: fmt(d), to: fmt(end) };
  }, []);

  // List is hidden until searching (so an owner never sees other restaurants).
  const results = q.trim() ? restaurants.filter(r => r.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];

  const pay = async () => {
    if (!biz || (type === 'fixed' && !pct)) { const m = t.missing; Platform.OS === 'web' ? alert(m) : Alert.alert(m); return; }
    // Immediate activation: write the coupon to shared content so it appears at once
    // on the Coupons page and the restaurant's page (for everyone).
    try {
      const data: any = await fetchContent({ raw: true });
      const list = Array.isArray(data?.coupons) ? data.coupons : [];
      const coupon = { id: biz.name, restaurant: biz.name, image: biz.image || '', cat: 'food', type, pct: type === 'fixed' ? pct : null, from: dates.from, to: dates.to };
      await updateSection('coupons', [...list.filter((c: any) => c.id !== biz.name), coupon]);
    } catch {}
    openInAppBrowser(PAYPAL_COUPONS);
  };

  const Thumb = ({ img }: { img?: string }) => (
    img ? <Image source={{ uri: resolveUri(img) }} style={s.thumb} resizeMode="cover" /> : <View style={[s.thumb, s.thumbEmpty]}><Text style={{ fontSize: 20 }}>🍽️</Text></View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}><Text style={s.backTxt}>‹</Text></TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* What the restaurant owner gets */}
        <View style={s.intro}>
          <Text style={[s.introTitle, { textAlign: ta, writingDirection: wd }]}>{(INTRO[lang] || INTRO.en).title}</Text>
          {(INTRO[lang] || INTRO.en).points.map((p, i) => (
            <View key={i} style={[s.introRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={s.introBullet}>✓</Text>
              <Text style={[s.introTxt, { flex: 1, textAlign: ta, writingDirection: wd }]}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Validity */}
        <Text style={[s.lbl, { textAlign: ta, writingDirection: wd }]}>{t.validity}</Text>
        <View style={[s.dateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={s.dateBox}><Text style={s.dateSm}>{t.from}</Text><Text style={s.dateBig}>{dates.from}</Text></View>
          <Text style={s.arrow}>{isRTL ? '←' : '→'}</Text>
          <View style={s.dateBox}><Text style={s.dateSm}>{t.to}</Text><Text style={s.dateBig}>{dates.to}</Text></View>
        </View>

        {/* Restaurant search (list hidden until typing) */}
        <Text style={[s.lbl, { textAlign: ta, writingDirection: wd, marginTop: 18 }]}>{t.pickBiz}</Text>
        {!biz ? (
          <>
            <TextInput value={q} onChangeText={setQ} placeholder={t.search} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
            <Text style={[s.listNote, { textAlign: ta, writingDirection: wd }]}>{t.listNote}</Text>
            {q.trim().length > 0 && (
              results.length ? (
                <View style={s.list}>
                  {results.map(r => (
                    <TouchableOpacity key={r.name} style={[s.resRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => { setBiz(r); setQ(''); }}>
                      <Thumb img={r.image} />
                      <Text style={[s.resName, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{r.name}</Text>
                      <View style={s.radio} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : <Text style={[s.hint, { textAlign: ta, writingDirection: wd }]}>{t.noRes}</Text>
            )}
          </>
        ) : (
          <View style={[s.selRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Thumb img={biz.image} />
            <Text style={[s.resName, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{biz.name}</Text>
            <View style={s.radioOn}><Text style={{ color: '#fff', fontSize: 13 }}>✓</Text></View>
            <TouchableOpacity onPress={() => { setBiz(null); setPct(null); }}><Text style={s.change}>{t.change}</Text></TouchableOpacity>
          </View>
        )}

        {/* Discount — only after a restaurant is chosen */}
        {biz && (
          <>
            <Text style={[s.lbl, { textAlign: ta, writingDirection: wd, marginTop: 18 }]}>{t.discType}</Text>
            <Text style={[s.typeExplain, { textAlign: ta, writingDirection: wd }]}><Text style={s.typeKey}>{t.fixed}</Text> = {t.fixedDesc}{'\n'}<Text style={s.typeKey}>{t.variable}</Text> = {t.varDesc}</Text>
            <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={[s.seg, type === 'fixed' && s.segOn]} onPress={() => setType('fixed')}><Text style={[s.segTxt, type === 'fixed' && s.segTxtOn]}>{t.fixed}</Text></TouchableOpacity>
              <TouchableOpacity style={[s.seg, type === 'variable' && s.segOn]} onPress={() => { setType('variable'); setPct(null); }}><Text style={[s.segTxt, type === 'variable' && s.segTxtOn]}>{t.variable}</Text></TouchableOpacity>
            </View>
            {type === 'fixed' ? (
              <>
                <Text style={[s.hint, { textAlign: ta, writingDirection: wd }]}>{t.fixedHint}</Text>
                <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {PCTS.map(p => (<TouchableOpacity key={p} style={[s.pctChip, pct === p && s.pctChipOn]} onPress={() => setPct(p)}><Text style={[s.pctTxt, pct === p && { color: '#fff' }]}>{p}%</Text></TouchableOpacity>))}
                </View>
              </>
            ) : <Text style={[s.hint, { textAlign: ta, writingDirection: wd }]}>{t.varHint}</Text>}

            {/* Order summary */}
            <View style={s.summary}>
              <Text style={[s.sumTitle, { textAlign: ta, writingDirection: wd }]}>{t.dealTitle}</Text>
              <View style={[s.sumRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text style={s.sumK}>{t.sumBiz}</Text><Text style={s.sumV} numberOfLines={1}>{biz.name}</Text></View>
              <View style={[s.sumRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text style={s.sumK}>{t.sumDisc}</Text><Text style={s.sumV}>{type === 'fixed' ? (pct ? pct + '%' : '—') : t.varLbl}</Text></View>
              <View style={[s.sumRow, s.sumTotalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text style={s.sumTotalK}>{t.sumTotal}</Text><Text style={s.sumTotalV}>{PRICE}</Text></View>
            </View>

            <TouchableOpacity style={s.payBtn} activeOpacity={0.85} onPress={pay}><Text style={s.payTxt}>{t.pay} · {PRICE}</Text></TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={{ paddingVertical: 14, alignItems: 'center' }} onPress={() => (router.canGoBack() ? router.back() : router.replace('/coupons'))}><Text style={{ color: '#64748b', fontFamily: F.sb }}>{t.logout}</Text></TouchableOpacity>
      </ScrollView>

      {/* Floating WhatsApp help button (RTL apps: on the LEFT) */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.9}
        onPress={() => {
          const msg = encodeURIComponent(`${HELP[L]} · ${t.title}`);
          Linking.openURL(`https://wa.me/${SUPPORT_PHONE}?text=${msg}`).catch(() => {});
        }}
      >
        <Text style={s.fabIcon}>💬</Text>
        <Text style={s.fabTxt}>{HELP[L]}</Text>
      </TouchableOpacity>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: NAVY },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 24, fontFamily: F.m, color: '#fff' },
  intro: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ece7dd' },
  introTitle: { fontSize: 17, fontFamily: F.m, color: '#1A6B8A', marginBottom: 12 },
  introRow: { alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  introBullet: { fontSize: 15, color: '#F4A94E', fontFamily: F.sb, marginTop: 1 },
  introTxt: { fontSize: 13.5, fontFamily: F.r, color: '#4a453c', lineHeight: 20 },
  fab: { position: 'absolute', left: 16, bottom: 82, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 28, paddingVertical: 12, paddingHorizontal: 18, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabIcon: { fontSize: 20 },
  fabTxt: { color: '#fff', fontSize: 14, fontFamily: F.b },
  lbl: { fontSize: 14, fontFamily: F.sb, color: '#7a7261', marginBottom: 8 },
  dateRow: { alignItems: 'center', gap: 10 },
  dateBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e0d4', borderRadius: 4, padding: 12, alignItems: 'center' },
  dateSm: { fontSize: 12, fontFamily: F.r, color: '#a9a291' },
  dateBig: { fontSize: 18, fontFamily: F.b, color: NAVY, marginTop: 2 },
  arrow: { fontSize: 20, color: '#a9a291' },
  input: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: '#16222c', fontFamily: F.r, backgroundColor: '#fff' },
  listNote: { marginTop: 7, fontSize: 12, color: '#8a8578', fontFamily: F.r, lineHeight: 16 },
  typeExplain: { marginTop: 4, marginBottom: 9, fontSize: 12.5, color: '#6b6558', fontFamily: F.r, lineHeight: 20 },
  typeKey: { fontFamily: F.x, color: NAVY },
  list: { marginTop: 8, backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#e7e0d4', overflow: 'hidden' },
  resRow: { alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f2ede3' },
  selRow: { alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 4, borderWidth: 1.5, borderColor: GOLD, marginTop: 4 },
  thumb: { width: 46, height: 46, borderRadius: 4, backgroundColor: '#e5e7eb' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  resName: { flex: 1, fontSize: 15, fontFamily: F.sb, color: '#16222c' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1' },
  radioOn: { width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  change: { color: NAVY, fontFamily: F.sb, fontSize: 13 },
  rowWrap: { flexWrap: 'wrap', gap: 8, marginTop: 4 },
  seg: { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#e7e0d4' },
  segOn: { backgroundColor: NAVY, borderColor: NAVY },
  segTxt: { fontSize: 15, fontFamily: F.sb, color: NAVY },
  segTxtOn: { color: '#fff' },
  hint: { fontSize: 12.5, fontFamily: F.r, color: '#a9a291', marginTop: 8, marginBottom: 6 },
  pctChip: { width: 56, paddingVertical: 10, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#e7e0d4' },
  pctChipOn: { backgroundColor: GOLD, borderColor: GOLD },
  pctTxt: { fontSize: 15, fontFamily: F.b, color: '#16222c' },
  summary: { backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#e7e0d4', padding: 16, marginTop: 20 },
  sumTitle: { fontSize: 16, fontFamily: F.b, color: NAVY, marginBottom: 10 },
  sumRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  sumK: { fontSize: 14, fontFamily: F.r, color: '#7a7261' },
  sumV: { fontSize: 15, fontFamily: F.sb, color: '#16222c', flexShrink: 1, marginHorizontal: 10 },
  sumTotalRow: { borderTopWidth: 1, borderTopColor: '#efe9df', marginTop: 6, paddingTop: 10 },
  sumTotalK: { fontSize: 15, fontFamily: F.b, color: '#16222c' },
  sumTotalV: { fontSize: 22, fontFamily: F.x, color: GOLD },
  payBtn: { backgroundColor: GOLD, borderRadius: 4, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  payTxt: { color: '#fff', fontFamily: F.b, fontSize: 16 },
});
