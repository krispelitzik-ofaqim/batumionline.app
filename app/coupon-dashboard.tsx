import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import BottomTabBar from '../components/BottomTabBar';

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
                <View style={[s.bar, { height: 12 + (x.n / MAX) * 120, backgroundColor: x.n === MAX ? Colors.ACCENT : Colors.SECONDARY }]} />
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
              <Text style={[s.td, { width: 60, fontWeight: '900', color: Colors.PRIMARY }]}>{r.pct}%</Text>
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
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '300' },
  hTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  periodRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 12 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  periodBtnOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  periodTxt: { fontSize: 12, fontWeight: '800', color: '#475569', writingDirection: 'rtl' },
  periodTxtOn: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  summaryVal: { fontSize: 44, fontWeight: '900', color: Colors.PRIMARY },
  summaryLbl: { fontSize: 13, color: '#64748b', fontWeight: '700', writingDirection: 'rtl', marginTop: 2 },
  summaryMetaRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 14 },
  metaBox: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 10 },
  metaVal: { fontSize: 18, fontWeight: '900', color: Colors.TEXT },
  metaLbl: { fontSize: 10, color: '#64748b', writingDirection: 'rtl', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 170 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '62%', borderRadius: 4, marginTop: 4 },
  barVal: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  barLbl: { fontSize: 9, color: '#64748b', marginTop: 4 },
  trHead: { flexDirection: 'row-reverse', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 12, fontWeight: '900', color: '#64748b', textAlign: 'center' },
  tr: { flexDirection: 'row-reverse', paddingVertical: 9, borderRadius: 6, alignItems: 'center' },
  td: { fontSize: 12, color: Colors.TEXT, textAlign: 'center', fontWeight: '600' },
  promo: { backgroundColor: Colors.TEXT, borderRadius: 16, padding: 18, marginBottom: 14 },
  promoTitle: { fontSize: 16, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  promoSub: { fontSize: 12, color: '#cbd5e1', textAlign: 'right', writingDirection: 'rtl', marginTop: 6, lineHeight: 18 },
  promoBtn: { backgroundColor: Colors.ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  promoBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  note: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 6, writingDirection: 'rtl' },
});
