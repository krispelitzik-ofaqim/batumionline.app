import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import BottomTabBar from '../components/BottomTabBar';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';

type Row = { date: string; last4: string; pct: number; time: string };
// A few sample redemptions so the list isn't empty in the demo.
const DEMO_ROWS: Row[] = [
  { date: '2026-08-06', last4: '4821', pct: 10, time: '20:14' },
  { date: '2026-08-06', last4: '7093', pct: 7, time: '19:02' },
  { date: '2026-08-06', last4: '3355', pct: 5, time: '13:41' },
  { date: '2026-08-05', last4: '1180', pct: 10, time: '21:07' },
  { date: '2026-08-05', last4: '9642', pct: 3, time: '12:55' },
];

const HOURLY = [
  { h: '10', n: 1 }, { h: '11', n: 3 }, { h: '12', n: 6 }, { h: '13', n: 9 },
  { h: '14', n: 7 }, { h: '15', n: 4 }, { h: '16', n: 3 }, { h: '17', n: 5 },
  { h: '18', n: 8 }, { h: '19', n: 12 }, { h: '20', n: 14 }, { h: '21', n: 10 },
  { h: '22', n: 5 },
];
const MAX = Math.max(...HOURLY.map((x) => x.n));

const PERIODS: { key: string; label: string; total: number }[] = [
  { key: 'daily', label: 'יומי', total: 87 },
  { key: 'weekly', label: 'שבועי', total: 540 },
  { key: 'monthly', label: 'חודשי', total: 2150 },
  { key: 'yearly', label: 'שנתי', total: 24800 },
];

export default function CouponDashboard() {
  const [period, setPeriod] = useState('daily');
  const [rows, setRows] = useState<Row[]>(DEMO_ROWS);
  const sel = PERIODS.find((p) => p.key === period) || PERIODS[0];

  useEffect(() => {
    AsyncStorage.getAllKeys()
      .then(async (keys) => {
        const mine = keys.filter((k) => k.startsWith('@coupon:einhayam:'));
        const real: Row[] = [];
        for (const k of mine) {
          const parts = k.split(':'); // @coupon : einhayam : <phone> : <date>
          const phone = parts[2] || '';
          const date = parts[3] || '';
          try {
            const v = JSON.parse((await AsyncStorage.getItem(k)) || '{}');
            real.push({ date, last4: phone.slice(-4), pct: v.pct || 0, time: v.time || '' });
          } catch {}
        }
        const all = [...real, ...DEMO_ROWS].sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
        setRows(all);
      })
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.hTitle}>קופונים שמומשו · עין הים</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* period summary */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} style={[s.periodBtn, period === p.key && s.periodBtnOn]} onPress={() => setPeriod(p.key)}>
              <Text style={[s.periodTxt, period === p.key && s.periodTxtOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryVal}>{sel.total.toLocaleString()}</Text>
          <Text style={s.summaryLbl}>קופונים מומשו · {sel.label}</Text>
          <View style={s.summaryMetaRow}>
            <View style={s.metaBox}><Text style={s.metaVal}>7%</Text><Text style={s.metaLbl}>הנחה ממוצעת</Text></View>
            <View style={s.metaBox}><Text style={s.metaVal}>20:00</Text><Text style={s.metaLbl}>שעת שיא</Text></View>
          </View>
        </View>

        {/* hourly chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>מימושים לפי שעה · היום</Text>
          <View style={s.chart}>
            {HOURLY.map((x) => (
              <View key={x.h} style={s.barCol}>
                <Text style={s.barVal}>{x.n}</Text>
                <View style={[s.bar, { height: 12 + (x.n / MAX) * 120, backgroundColor: x.n === MAX ? GOLD : '#A7C0B4' }]} />
                <Text style={s.barLbl}>{x.h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* redemptions list */}
        <View style={s.card}>
          <Text style={s.cardTitle}>כל הקופונים שמומשו</Text>
          <View style={s.trHead}>
            <Text style={[s.th, { flex: 1.2 }]}>תאריך</Text>
            <Text style={[s.th, { width: 60 }]}>אחוז</Text>
            <Text style={[s.th, { width: 80 }]}>טלפון</Text>
            <Text style={[s.th, { width: 52 }]}>שעה</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={[s.tr, i % 2 === 0 && { backgroundColor: '#f8fafc' }]}>
              <Text style={[s.td, { flex: 1.2 }]}>{r.date}</Text>
              <Text style={[s.td, { width: 60, fontFamily: F.b, color: NAVY }]}>{r.pct}%</Text>
              <Text style={[s.td, { width: 80 }]}>····{r.last4}</Text>
              <Text style={[s.td, { width: 52 }]}>{r.time}</Text>
            </View>
          ))}
        </View>

        {/* promo */}
        <View style={s.promo}>
          <Text style={s.promoTitle}>רוצה יותר לקוחות בשעות השקטות?</Text>
          <Text style={s.promoSub}>קופונים בתשלום מקפיצים את העסק שלך לראש הרשימה ומביאים תנועה ממוקדת.</Text>
          <TouchableOpacity style={s.promoBtn} activeOpacity={0.85}>
            <Text style={s.promoBtnTxt}>רכישת חבילת קופונים ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.note}>נתוני הדגמה. לוח בקרה אמיתי (מימושים חיים בין מכשירים) דורש חיבור שרת.</Text>
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
  hTitle: { flex: 1, fontSize: 20, fontFamily: F.m, color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  periodRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 14 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e0d4', alignItems: 'center' },
  periodBtnOn: { backgroundColor: NAVY, borderColor: NAVY },
  periodTxt: { fontSize: 13, fontFamily: F.sb, color: NAVY, writingDirection: 'rtl' },
  periodTxtOn: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 4, padding: 20, alignItems: 'center', marginBottom: 14, shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  summaryVal: { fontSize: 48, fontFamily: F.x, color: NAVY },
  summaryLbl: { fontSize: 13, color: '#7a7261', fontFamily: F.sb, writingDirection: 'rtl', marginTop: 2 },
  summaryMetaRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 16 },
  metaBox: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#f2ede3', borderRadius: 4 },
  metaVal: { fontSize: 18, fontFamily: F.b, color: '#16222c' },
  metaLbl: { fontSize: 10, color: '#7a7261', fontFamily: F.r, writingDirection: 'rtl', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 4, padding: 16, marginBottom: 14, shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 17, fontFamily: F.m, color: '#16222c', textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 170 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '62%', borderRadius: 3, marginTop: 4 },
  barVal: { fontSize: 9, color: '#a9a291', fontFamily: F.sb },
  barLbl: { fontSize: 9, color: '#7a7261', fontFamily: F.r, marginTop: 4 },
  trHead: { flexDirection: 'row-reverse', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#efe9df' },
  th: { fontSize: 12, fontFamily: F.b, color: '#7a7261', textAlign: 'center' },
  tr: { flexDirection: 'row-reverse', paddingVertical: 9, alignItems: 'center' },
  td: { fontSize: 12, color: '#16222c', textAlign: 'center', fontFamily: F.sb },
  promo: { backgroundColor: NAVY, borderRadius: 4, padding: 20, marginBottom: 14 },
  promoTitle: { fontSize: 18, fontFamily: F.m, color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  promoSub: { fontSize: 12.5, color: '#cbd5e1', fontFamily: F.r, textAlign: 'right', writingDirection: 'rtl', marginTop: 6, lineHeight: 19 },
  promoBtn: { backgroundColor: GOLD, borderRadius: 4, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  promoBtnTxt: { color: '#fff', fontSize: 15, fontFamily: F.b },
  note: { fontSize: 10, color: '#a9a291', fontFamily: F.r, textAlign: 'center', marginTop: 6, writingDirection: 'rtl' },
});
