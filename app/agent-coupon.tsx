import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Image } from 'react-native';
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

type Lang = 'he' | 'en' | 'fa' | 'ru';
const TR: Record<Lang, Record<string, string>> = {
  he: { title: 'הקמת חבילת קופון', validity: 'תוקף החבילה', from: 'מ', to: 'עד', pickBiz: 'חפש את המסעדה שלך', search: 'הקלד שם מסעדה...', discType: 'אחוז ההנחה', fixed: 'קבוע', variable: 'משתנה', fixedHint: 'האחוז יוצג על תמונת הקופון', varHint: 'סליידר 3%–10% יופעל במימוש (המלצר בוחר)', pay: 'המשך לתשלום', logout: 'יציאה', done: 'החבילה הוגדרה!', missing: 'בחר מסעדה ואחוז', dealTitle: 'פרטי עסקה', sumBiz: 'מסעדה', sumDisc: 'הנחה', sumTotal: 'סך לתשלום', varLbl: 'משתנה (3%-10%)', change: 'שנה', noRes: 'לא נמצאה מסעדה בשם זה' },
  en: { title: 'Set up a coupon package', validity: 'Package validity', from: 'From', to: 'To', pickBiz: 'Search your restaurant', search: 'Type a restaurant name...', discType: 'Discount', fixed: 'Fixed', variable: 'Variable', fixedHint: 'The % is shown on the coupon image', varHint: 'A 3%–10% slider activates at redemption (waiter picks)', pay: 'Continue to payment', logout: 'Log out', done: 'Package configured!', missing: 'Pick a restaurant and a %', dealTitle: 'Order summary', sumBiz: 'Restaurant', sumDisc: 'Discount', sumTotal: 'Total', varLbl: 'Variable (3%-10%)', change: 'Change', noRes: 'No restaurant found' },
  fa: { title: 'راه‌اندازی بسته کوپن', validity: 'اعتبار بسته', from: 'از', to: 'تا', pickBiz: 'رستوران خود را جستجو کنید', search: 'نام رستوران را وارد کنید...', discType: 'درصد تخفیف', fixed: 'ثابت', variable: 'متغیر', fixedHint: 'درصد روی تصویر کوپن نمایش داده می‌شود', varHint: 'اسلایدر ۳٪–۱۰٪ هنگام استفاده فعال می‌شود', pay: 'ادامه پرداخت', logout: 'خروج', done: 'بسته تنظیم شد!', missing: 'رستوران و درصد را انتخاب کنید', dealTitle: 'جزئیات سفارش', sumBiz: 'رستوران', sumDisc: 'تخفیف', sumTotal: 'مبلغ کل', varLbl: 'متغیر (۳٪-۱۰٪)', change: 'تغییر', noRes: 'رستورانی یافت نشد' },
  ru: { title: 'Настройка пакета купонов', validity: 'Срок действия', from: 'С', to: 'По', pickBiz: 'Найдите свой ресторан', search: 'Введите название ресторана...', discType: 'Скидка', fixed: 'Фиксированная', variable: 'Переменная', fixedHint: 'Процент показан на изображении купона', varHint: 'Ползунок 3%–10% активируется при погашении', pay: 'Перейти к оплате', logout: 'Выход', done: 'Пакет настроен!', missing: 'Выберите ресторан и процент', dealTitle: 'Детали заказа', sumBiz: 'Ресторан', sumDisc: 'Скидка', sumTotal: 'Итого', varLbl: 'Переменная (3%-10%)', change: 'Изменить', noRes: 'Ресторан не найден' },
};

type Rest = { name: string; image?: string };
const FALLBACK: Rest[] = [{ name: 'Eye of the Sea' }, { name: 'Piazza Grill' }, { name: 'Fanfan' }, { name: 'Laguna' }, { name: 'Porto Franco' }];
const PCTS = [3, 4, 5, 6, 7, 8, 9, 10];

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
    fetchContent().then((data: any) => {
      const cat = (data?.mainCategories || []).find((c: any) => c.id === '6' || /מסעד|restaurant/i.test(c.title || ''));
      if (!cat) return;
      const out: Rest[] = [];
      const walk = (arr: any[]) => (arr || []).forEach((x: any) => {
        if (x && x.name && x.name.length > 2 && !/^מסעדות$|restaurants?$/i.test(x.name)) out.push({ name: x.name, image: x.image || x.icon });
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
        {/* Validity */}
        <Text style={[s.lbl, { textAlign: ta, writingDirection: wd }]}>{t.validity}</Text>
        <View style={[s.dateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={s.dateBox}><Text style={s.dateSm}>{t.from}</Text><Text style={s.dateBig}>{dates.from}</Text></View>
          <Text style={s.arrow}>→</Text>
          <View style={s.dateBox}><Text style={s.dateSm}>{t.to}</Text><Text style={s.dateBig}>{dates.to}</Text></View>
        </View>

        {/* Restaurant search (list hidden until typing) */}
        <Text style={[s.lbl, { textAlign: ta, writingDirection: wd, marginTop: 18 }]}>{t.pickBiz}</Text>
        {!biz ? (
          <>
            <TextInput value={q} onChangeText={setQ} placeholder={t.search} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
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
  lbl: { fontSize: 14, fontFamily: F.sb, color: '#7a7261', marginBottom: 8 },
  dateRow: { alignItems: 'center', gap: 10 },
  dateBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e0d4', borderRadius: 4, padding: 12, alignItems: 'center' },
  dateSm: { fontSize: 12, fontFamily: F.r, color: '#a9a291' },
  dateBig: { fontSize: 18, fontFamily: F.b, color: NAVY, marginTop: 2 },
  arrow: { fontSize: 20, color: '#a9a291' },
  input: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: '#16222c', fontFamily: F.r, backgroundColor: '#fff' },
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
