import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

// ---- DEMO business (placement / which business = TBD) ----
const BIZ = {
  id: 'einhayam',
  name: 'עין הים · מסעדה ישראלית',
  address: 'שדרות רוסתוולי 24, בטומי',
  image: '/uploads/heart_batumi.png',
  activeUntil: '2027-02-06', // set at activation time per the deal (e.g. 6 months / 1 year)
};
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const DISCOUNTS = [3, 5, 7, 10];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const lockKey = (phone: string) => `@coupon:${BIZ.id}:${phone}:${todayKey()}`;

function bars(seed: string): number[] {
  const out: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  for (let i = 0; i < 50; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; out.push(1 + (h % 4)); }
  return out;
}

// Discount 3%–10% shown in a selection window (only the chosen value is visible;
// tapping opens the list to choose).
const WHEEL_VALS = [3, 4, 5, 6, 7, 8, 9, 10];
function DiscountSelect({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.selWrap}>
      <TouchableOpacity style={s.selBox} activeOpacity={0.8} onPress={() => setOpen((o) => !o)}>
        <Text style={s.selChevron}>{open ? '▲' : '▼'}</Text>
        <Text style={[s.selVal, value == null && s.selPlaceholder]}>{value == null ? 'גובה ההנחה היום' : `${value}%`}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.selList}>
          {WHEEL_VALS.map((v) => (
            <TouchableOpacity key={v} style={[s.selOpt, value === v && s.selOptOn]} onPress={() => { onChange(v); setOpen(false); }}>
              <Text style={[s.selOptTxt, value === v && s.selOptTxtOn]}>{v}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CouponScreen() {
  const [done, setDone] = useState(false);
  const [date, setDate] = useState(todayKey());
  const [phone, setPhone] = useState('');
  const [selPct, setSelPct] = useState<number | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [redeemedAt, setRedeemedAt] = useState('');
  const [msg, setMsg] = useState('');

  const valid = todayKey() <= BIZ.activeUntil; // coupon deal still active
  const barSeed = `${BIZ.id}${phone}${date}`;
  const code = `${BIZ.id.toUpperCase()}-${date}-${phone.slice(-4) || '0000'}`;

  const send = async () => {
    setMsg('');
    if (todayKey() > BIZ.activeUntil) { setMsg('הקופון של בית העסק הסתיים ואינו פעיל'); return; }
    if (!date.trim() || !phone.trim()) { setMsg('נא למלא תאריך וטלפון'); return; }
    const chosen = selPct;
    if (!chosen || chosen < 3 || chosen > 10) { setMsg('נא לבחור אחוז הנחה בגלגל (3–10%)'); return; }
    // one redemption per phone per day
    try {
      const raw = await AsyncStorage.getItem(lockKey(phone.trim()));
      if (raw) {
        const saved = JSON.parse(raw);
        setPct(saved.pct); setRedeemedAt(saved.time); setDone(true);
        setMsg('');
        return;
      }
    } catch {}
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPct(chosen); setRedeemedAt(time); setDone(true);
    try { await AsyncStorage.setItem(lockKey(phone.trim()), JSON.stringify({ pct: chosen, time })); } catch {}
  };

  const Barcode = () => (
    <View style={s.barcodeWrap}>
      <View style={s.barcode}>
        {bars(barSeed).map((w, i) => (
          <View key={i} style={{ width: w, height: 54, backgroundColor: i % 2 ? '#111' : 'transparent', marginRight: 1 }} />
        ))}
      </View>
      <Text style={s.barcodeTxt}>{code}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.hTitle}>{done ? 'ההנחה התקבלה' : 'קופון הנחה'}</Text>
      </View>

      {!done ? (
        // ---------- PAGE 1: full-page coupon ----------
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
          <View style={s.sheet}>
            <View style={s.bizWrap}>
              <Image source={{ uri: resolveUri(BIZ.image) }} style={s.bizImg} resizeMode="cover" />
              {valid && <View style={s.ribbon}><Text style={s.ribbonTxt}>קבל הנחה מיוחדת</Text></View>}
              <View style={s.bizOverlay}>
                <Text style={s.bizName}>{BIZ.name}</Text>
                <Text style={s.bizAddr}>📍 {BIZ.address}</Text>
              </View>
            </View>

            <Text style={s.bigPct}>עד 10% הנחה</Text>
            <Text style={s.sub}>הצג את הקופון למלצר בעת התשלום</Text>
            <Text style={s.validity}>בתוקף עד {fmtDate(BIZ.activeUntil)}</Text>

            <Text style={s.wheelLabel}>גובה ההנחה היום</Text>
            <DiscountSelect value={selPct} onChange={setSelPct} />

            <TextInput value={date} onChangeText={setDate} placeholder="תאריך (YYYY-MM-DD)" placeholderTextColor="#94a3b8" style={s.input} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="טלפון" placeholderTextColor="#94a3b8" keyboardType="phone-pad" style={s.input} />

            <Barcode />

            {!!msg && <Text style={s.err}>{msg}</Text>}
            <TouchableOpacity style={[s.sendBtn, !valid && { opacity: 0.4 }]} activeOpacity={0.85} disabled={!valid} onPress={send}>
              <Text style={s.sendTxt}>{valid ? 'שלח' : 'הקופון הסתיים'}</Text>
            </TouchableOpacity>

            <Text style={s.finePrint}>קופון אחד לחשבון משולם בלבד · מימוש אחד ליום מכל טלפון. הבעלים רשאים לתת הנחות גורפות ללא קשר לקופון.</Text>
          </View>

          <TouchableOpacity style={s.dashLink} onPress={() => router.push('/coupon-dashboard' as any)}>
            <Text style={s.dashLinkTxt}>📊 קופונים שמומשו · סטטיסטיקה</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // ---------- PAGE 2: success ----------
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
          <View style={[s.sheet, s.sheetDone]}>
            <Text style={s.doneMark}>✓</Text>
            <Text style={s.doneTitle}>ההנחה התקבלה בהצלחה</Text>
            <Text style={s.donePct}>{pct}%</Text>
            <Text style={s.bizName2}>{BIZ.name}</Text>
            <Text style={s.bizAddr2}>📍 {BIZ.address}</Text>
            <Text style={s.doneTime}>נוצל היום בשעה {redeemedAt}</Text>
            <Barcode />
            <Text style={s.lockNote}>מימוש נוסף אפשרי מחר (בתאריך חדש). קופון אחד לחשבון משולם בלבד.</Text>
          </View>
        </ScrollView>
      )}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '300' },
  hTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  sheet: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: Colors.ACCENT, borderStyle: 'dashed', alignItems: 'center' },
  sheetDone: { borderColor: '#16a34a', minHeight: 460, justifyContent: 'center' },
  bizWrap: { width: '100%', height: 150, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#e5e7eb' },
  bizImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bizOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12 },
  ribbon: { position: 'absolute', top: 22, left: -42, width: 172, transform: [{ rotate: '-45deg' }], backgroundColor: Colors.ACCENT, paddingVertical: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  ribbonTxt: { color: '#fff', fontSize: 11, fontWeight: '900', writingDirection: 'rtl' },
  bizName: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  bizAddr: { color: '#e2e8f0', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  bigPct: { fontSize: 34, fontWeight: '900', color: Colors.PRIMARY, marginTop: 14 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 14, writingDirection: 'rtl', textAlign: 'center' },
  modeRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 14, alignSelf: 'stretch' },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  modeBtnOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  modeTxt: { fontSize: 13, fontWeight: '800', color: '#475569', writingDirection: 'rtl' },
  modeTxtOn: { color: '#fff' },
  pctRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  pctBtn: { width: 62, height: 62, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  pctBtnOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  pctTxt: { fontSize: 20, fontWeight: '900', color: '#475569' },
  pctTxtOn: { color: '#fff' },
  validity: { fontSize: 12, fontWeight: '800', color: '#16a34a', backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, overflow: 'hidden', marginBottom: 14, writingDirection: 'rtl' },
  wheelLabel: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, marginBottom: 6, writingDirection: 'rtl', textAlign: 'center' },
  selWrap: { alignSelf: 'stretch', marginBottom: 14, zIndex: 10 },
  selBox: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.PRIMARY },
  selVal: { fontSize: 20, fontWeight: '900', color: Colors.PRIMARY, writingDirection: 'rtl' },
  selPlaceholder: { color: '#94a3b8', fontWeight: '700', fontSize: 15 },
  selChevron: { fontSize: 14, color: '#64748b', fontWeight: '900' },
  selList: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 6, overflow: 'hidden' },
  selOpt: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selOptOn: { backgroundColor: '#eef6f9' },
  selOptTxt: { fontSize: 17, fontWeight: '800', color: Colors.TEXT },
  selOptTxtOn: { color: Colors.PRIMARY },
  input: { alignSelf: 'stretch', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  barcodeWrap: { alignItems: 'center', marginVertical: 10 },
  barcode: { flexDirection: 'row', alignItems: 'flex-end', height: 54 },
  barcodeTxt: { fontSize: 11, color: '#334155', letterSpacing: 2, marginTop: 6, fontWeight: '800' },
  err: { color: '#dc2626', fontSize: 13, marginBottom: 8, writingDirection: 'rtl' },
  sendBtn: { alignSelf: 'stretch', backgroundColor: Colors.ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sendTxt: { color: '#fff', fontSize: 17, fontWeight: '900' },
  finePrint: { fontSize: 10, color: '#94a3b8', marginTop: 12, lineHeight: 15, textAlign: 'center', writingDirection: 'rtl' },
  doneMark: { fontSize: 64, color: '#16a34a', fontWeight: '900' },
  doneTitle: { fontSize: 20, fontWeight: '900', color: '#16a34a', marginTop: 6, writingDirection: 'rtl', textAlign: 'center' },
  donePct: { fontSize: 56, fontWeight: '900', color: Colors.TEXT, marginVertical: 4 },
  bizName2: { fontSize: 20, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'center' },
  bizAddr2: { fontSize: 12, color: '#64748b', writingDirection: 'rtl', textAlign: 'center', marginTop: 2 },
  doneTime: { fontSize: 13, color: '#64748b', writingDirection: 'rtl', marginTop: 8 },
  lockNote: { fontSize: 11, color: '#94a3b8', marginTop: 14, writingDirection: 'rtl', textAlign: 'center', lineHeight: 16 },
  dashLink: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  dashLinkTxt: { fontSize: 13, fontWeight: '800', color: Colors.PRIMARY, writingDirection: 'rtl' },
});
