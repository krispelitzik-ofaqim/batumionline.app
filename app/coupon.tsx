import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'qrcode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { resolveUri, fetchContent } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';

// ---- Fallback business (used only when opened with no ?biz= param) ----
const FALLBACK = {
  id: 'einhayam',
  name: 'עין הים · מסעדה ישראלית',
  address: 'שדרות רוסתוולי 24, בטומי',
  image: '/uploads/heart_batumi.png',
  activeUntil: '2027-02-06',
  type: 'variable' as 'variable' | 'fixed',
  pct: null as number | null,
};
const slug = (s: string) => 'r' + Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0).toString(36);
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const DISCOUNTS = [3, 5, 7, 10];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const lockKey = (bizId: string, phone: string) => `@coupon:${bizId}:${phone}:${todayKey()}`;

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
  const { biz: bizParam } = useLocalSearchParams<{ biz?: string }>();
  const [biz, setBiz] = useState<typeof FALLBACK>(FALLBACK);
  const [done, setDone] = useState(false);
  const [date, setDate] = useState(todayKey());
  const [phone, setPhone] = useState('');
  const [selPct, setSelPct] = useState<number | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [redeemedAt, setRedeemedAt] = useState('');
  const [msg, setMsg] = useState('');

  // Load the real coupon for the restaurant passed in ?biz=.
  useEffect(() => {
    if (!bizParam) return;
    fetchContent().then((c: any) => {
      const found = Array.isArray(c?.coupons) ? c.coupons.find((x: any) => (x.restaurant || x.id) === bizParam) : null;
      if (found) {
        setBiz({ id: slug(found.restaurant || bizParam), name: found.restaurant || bizParam, address: '', image: found.image || FALLBACK.image, activeUntil: found.to || FALLBACK.activeUntil, type: found.type || 'variable', pct: found.pct ?? null });
      } else {
        setBiz({ ...FALLBACK, id: slug(bizParam), name: bizParam, address: '' });
      }
    }).catch(() => {});
  }, [bizParam]);

  const isFixed = biz.type === 'fixed' && !!biz.pct;
  const valid = todayKey() <= biz.activeUntil; // coupon deal still active
  const code = `${biz.id.toUpperCase()}-${date}-${phone.slice(-4) || '0000'}`;

  const send = async () => {
    setMsg('');
    if (todayKey() > biz.activeUntil) { setMsg('הקופון של בית העסק הסתיים ואינו פעיל'); return; }
    if (!date.trim() || !phone.trim()) { setMsg('נא למלא תאריך וטלפון'); return; }
    const chosen = isFixed ? biz.pct : selPct;
    if (!chosen || chosen < 3 || chosen > 10) { setMsg('נא לבחור אחוז הנחה (3–10%)'); return; }
    // one redemption per phone per day
    try {
      const raw = await AsyncStorage.getItem(lockKey(biz.id, phone.trim()));
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
    try { await AsyncStorage.setItem(lockKey(biz.id, phone.trim()), JSON.stringify({ pct: chosen, time })); } catch {}
  };

  // QR encodes a deep link that opens this restaurant's page inside our app.
  const deepLink = `batumionline://place/${biz.id}`;
  const QR = () => {
    const modules = useMemo(() => { try { return QRCode.create(deepLink, { errorCorrectionLevel: 'M' }).modules; } catch { return null; } }, []);
    if (!modules) return null;
    const size = modules.size, cell = 5;
    const rows = [];
    for (let r = 0; r < size; r++) {
      const cells = [];
      for (let c = 0; c < size; c++) cells.push(<View key={c} style={{ width: cell, height: cell, backgroundColor: modules.data[r * size + c] ? NAVY : '#fff' }} />);
      rows.push(<View key={r} style={{ flexDirection: 'row' }}>{cells}</View>);
    }
    return (
      <View style={s.qrWrap}>
        <View style={s.qrBox}>{rows}</View>
        <Text style={s.qrTxt}>סרקו לדף המסעדה באפליקציה</Text>
        <Text style={s.qrCode}>{code}</Text>
      </View>
    );
  };

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
              <Image source={{ uri: resolveUri(biz.image) }} style={s.bizImg} resizeMode="cover" />
              {valid && <View style={s.ribbon}><Text style={s.ribbonTxt}>קבל הנחה מיוחדת</Text></View>}
              <View style={s.bizOverlay}>
                <Text style={s.bizName}>{biz.name}</Text>
                {!!biz.address && <Text style={s.bizAddr}>📍 {biz.address}</Text>}
              </View>
            </View>

            <Text style={s.bigPct}>{isFixed ? `${biz.pct}% הנחה` : 'עד 10% הנחה'}</Text>
            <Text style={s.sub}>הצג את הקופון למלצר בעת התשלום</Text>
            <Text style={s.validity}>בתוקף עד {fmtDate(biz.activeUntil)}</Text>

            {!isFixed && (
              <>
                <Text style={s.wheelLabel}>גובה ההנחה היום</Text>
                <DiscountSelect value={selPct} onChange={setSelPct} />
              </>
            )}

            <TextInput value={date} onChangeText={setDate} placeholder="תאריך (YYYY-MM-DD)" placeholderTextColor="#94a3b8" style={s.input} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="טלפון" placeholderTextColor="#94a3b8" keyboardType="phone-pad" style={s.input} />

            <QR />

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
            <Text style={s.bizName2}>{biz.name}</Text>
            {!!biz.address && <Text style={s.bizAddr2}>📍 {biz.address}</Text>}
            <Text style={s.doneTime}>נוצל היום בשעה {redeemedAt}</Text>
            <QR />
            <Text style={s.lockNote}>מימוש נוסף אפשרי מחר (בתאריך חדש). קופון אחד לחשבון משולם בלבד.</Text>
          </View>
        </ScrollView>
      )}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: NAVY },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 24, fontFamily: F.m, color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  sheet: { backgroundColor: '#fff', borderRadius: 6, padding: 16, borderWidth: 1.5, borderColor: '#e7e0d4', alignItems: 'center' },
  sheetDone: { borderColor: '#2E9E6B', minHeight: 460, justifyContent: 'center' },
  bizWrap: { width: '100%', height: 160, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#e5e7eb' },
  bizImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bizOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12 },
  ribbon: { position: 'absolute', top: 22, left: -42, width: 172, transform: [{ rotate: '-45deg' }], backgroundColor: GOLD, paddingVertical: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  ribbonTxt: { color: '#fff', fontSize: 11, fontFamily: F.x, writingDirection: 'rtl' },
  bizName: { color: '#fff', fontSize: 22, fontFamily: F.m, textAlign: 'right', writingDirection: 'rtl' },
  bizAddr: { color: '#e2e8f0', fontSize: 12, fontFamily: F.r, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  bigPct: { fontSize: 38, fontFamily: F.m, color: NAVY, marginTop: 16 },
  sub: { fontSize: 13, color: '#7a7261', fontFamily: F.r, marginBottom: 14, writingDirection: 'rtl', textAlign: 'center' },
  validity: { fontSize: 12, fontFamily: F.sb, color: '#2E9E6B', backgroundColor: '#e6f4ec', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 14, writingDirection: 'rtl' },
  wheelLabel: { fontSize: 13, fontFamily: F.sb, color: '#16222c', marginBottom: 6, writingDirection: 'rtl', textAlign: 'center' },
  selWrap: { alignSelf: 'stretch', marginBottom: 14, zIndex: 10 },
  selBox: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f2e9', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: NAVY },
  selVal: { fontSize: 20, fontFamily: F.b, color: NAVY, writingDirection: 'rtl' },
  selPlaceholder: { color: '#a9a291', fontFamily: F.sb, fontSize: 15 },
  selChevron: { fontSize: 14, color: '#7a7261', fontFamily: F.b },
  selList: { backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#e7e0d4', marginTop: 6, overflow: 'hidden' },
  selOpt: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f2ede3' },
  selOptOn: { backgroundColor: '#f2ede3' },
  selOptTxt: { fontSize: 17, fontFamily: F.sb, color: '#16222c' },
  selOptTxtOn: { color: NAVY },
  input: { alignSelf: 'stretch', backgroundColor: '#f7f2e9', borderRadius: 4, padding: 12, fontSize: 15, fontFamily: F.r, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12, borderWidth: 1, borderColor: '#e7e0d4', color: '#16222c' },
  qrWrap: { alignItems: 'center', marginVertical: 14 },
  qrBox: { padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e0d4', borderRadius: 4 },
  qrTxt: { fontSize: 12, color: '#16222c', fontFamily: F.sb, marginTop: 8, writingDirection: 'rtl' },
  qrCode: { fontSize: 11, color: '#a9a291', letterSpacing: 2, marginTop: 2, fontFamily: F.b },
  err: { color: '#dc2626', fontSize: 13, fontFamily: F.sb, marginBottom: 8, writingDirection: 'rtl' },
  sendBtn: { alignSelf: 'stretch', backgroundColor: GOLD, borderRadius: 4, paddingVertical: 15, alignItems: 'center' },
  sendTxt: { color: '#fff', fontSize: 17, fontFamily: F.b },
  finePrint: { fontSize: 10, color: '#a9a291', fontFamily: F.r, marginTop: 12, lineHeight: 15, textAlign: 'center', writingDirection: 'rtl' },
  doneMark: { fontSize: 64, color: '#2E9E6B', fontFamily: F.x },
  doneTitle: { fontSize: 22, fontFamily: F.m, color: '#2E9E6B', marginTop: 6, writingDirection: 'rtl', textAlign: 'center' },
  donePct: { fontSize: 56, fontFamily: F.x, color: NAVY, marginVertical: 4 },
  bizName2: { fontSize: 22, fontFamily: F.m, color: '#16222c', writingDirection: 'rtl', textAlign: 'center' },
  bizAddr2: { fontSize: 12, color: '#7a7261', fontFamily: F.r, writingDirection: 'rtl', textAlign: 'center', marginTop: 2 },
  doneTime: { fontSize: 13, color: '#7a7261', fontFamily: F.sb, writingDirection: 'rtl', marginTop: 8 },
  lockNote: { fontSize: 11, color: '#a9a291', fontFamily: F.r, marginTop: 14, writingDirection: 'rtl', textAlign: 'center', lineHeight: 16 },
  dashLink: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  dashLinkTxt: { fontSize: 13, fontFamily: F.sb, color: NAVY, writingDirection: 'rtl' },
});
