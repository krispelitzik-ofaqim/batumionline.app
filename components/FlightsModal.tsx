import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import { Colors } from '../constants/colors';

// API keys — set one to enable live data
const AVIATIONSTACK_KEY = ''; // https://aviationstack.com
const AERODATABOX_KEY = '';   // https://rapidapi.com/aedbx-aedbx/api/aerodatabox

type Flight = {
  flight: string;
  airline: string;
  depTime: string;
  arrTime: string;
  depDate: string;
  arrDate: string;
  status: string;
  type: 'arrival' | 'departure';
};

export default function FlightsModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'arrival' | 'departure'>('arrival');
  const [batumiTime, setBatumiTime] = useState('');
  const ledAnim = useRef(new Animated.Value(1)).current;

  // Batumi clock UTC+4
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const now = new Date();
      const batumi = new Date(now.getTime() + (4 * 60 - now.getTimezoneOffset()) * 60000);
      const h = batumi.getUTCHours().toString().padStart(2, '0');
      const m = batumi.getUTCMinutes().toString().padStart(2, '0');
      setBatumiTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  // Blinking LED
  useEffect(() => {
    if (!visible) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(ledAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(ledAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [visible, ledAnim]);

  const reload = () => {
    setLoading(true);
    if (AVIATIONSTACK_KEY) fetchAviationStack();
    else if (AERODATABOX_KEY) fetchAeroDataBox();
    else loadFallbackData();
  };

  useEffect(() => {
    if (!visible) return;
    reload();
  }, [visible]);

  // ─── AviationStack API ──────────────────────────────────────
  const fetchAviationStack = async () => {
    try {
      const [arrRes, depRes] = await Promise.all([
        fetch(`http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&arr_iata=BUS&dep_iata=TLV&flight_status=active,scheduled,landed`),
        fetch(`http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&dep_iata=BUS&arr_iata=TLV&flight_status=active,scheduled,landed`),
      ]);
      const arrData = await arrRes.json();
      const depData = await depRes.json();

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const arrivals: Flight[] = (arrData.data || [])
        .filter((f: any) => {
          const t = new Date(f.arrival?.scheduled || '');
          return t >= now && t <= in24h;
        })
        .map((f: any) => ({
          flight: f.flight?.iata || f.flight?.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(f.departure?.scheduled),
          arrTime: formatTime(f.arrival?.scheduled),
          depDate: formatDateShort(f.departure?.scheduled),
          arrDate: formatDateShort(f.arrival?.scheduled),
          status: translateStatus(f.flight_status),
          type: 'arrival' as const,
        }));

      const departures: Flight[] = (depData.data || [])
        .filter((f: any) => {
          const t = new Date(f.departure?.scheduled || '');
          return t >= now && t <= in24h;
        })
        .map((f: any) => ({
          flight: f.flight?.iata || f.flight?.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(f.departure?.scheduled),
          arrTime: formatTime(f.arrival?.scheduled),
          depDate: formatDateShort(f.departure?.scheduled),
          arrDate: formatDateShort(f.arrival?.scheduled),
          status: translateStatus(f.flight_status),
          type: 'departure' as const,
        }));

      setFlights([...arrivals, ...departures]);
      setLoading(false);
    } catch {
      loadFallbackData();
    }
  };

  // ─── AeroDataBox API (RapidAPI) ─────────────────────────────
  const fetchAeroDataBox = async () => {
    try {
      const now = new Date();
      const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const fromLocal = now.toISOString().slice(0, 16);
      const toLocal = in12h.toISOString().slice(0, 16);
      const headers = { 'X-RapidAPI-Key': AERODATABOX_KEY, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' };

      const [arrRes, depRes] = await Promise.all([
        fetch(`https://aerodatabox.p.rapidapi.com/flights/airport/iata/BUS/${fromLocal}/${toLocal}?direction=Arrival`, { headers }),
        fetch(`https://aerodatabox.p.rapidapi.com/flights/airport/iata/BUS/${fromLocal}/${toLocal}?direction=Departure`, { headers }),
      ]);
      const arrData = await arrRes.json();
      const depData = await depRes.json();

      const arrivals: Flight[] = (arrData.arrivals || [])
        .filter((f: any) => f.departure?.airport?.iata === 'TLV')
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(f.departure?.scheduledTimeLocal),
          arrTime: formatTime(f.arrival?.scheduledTimeLocal),
          depDate: formatDateShort(f.departure?.scheduledTimeLocal),
          arrDate: formatDateShort(f.arrival?.scheduledTimeLocal),
          status: translateStatus(f.status),
          type: 'arrival' as const,
        }));

      const departures: Flight[] = (depData.departures || [])
        .filter((f: any) => f.arrival?.airport?.iata === 'TLV')
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(f.departure?.scheduledTimeLocal),
          arrTime: formatTime(f.arrival?.scheduledTimeLocal),
          depDate: formatDateShort(f.departure?.scheduledTimeLocal),
          arrDate: formatDateShort(f.arrival?.scheduledTimeLocal),
          status: translateStatus(f.status),
          type: 'departure' as const,
        }));

      setFlights([...arrivals, ...departures]);
      setLoading(false);
    } catch {
      loadFallbackData();
    }
  };

  // ─── Fallback sample data (TLV ↔ BSB only) ─────────────────
  const loadFallbackData = () => {
    const now = new Date();
    const h = now.getHours();
    setFlights(generateTLVFlights(h));
    setLoading(false);
  };

  const filtered = flights.filter(f => f.type === tab);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>נחיתות והמראות משדה התעופה בטומי BUS</Text>

          {/* Airport board header */}
          <View style={s.boardHeader}>
            {/* Load button - left */}
            <TouchableOpacity style={[s.loadBtn, loading && s.loadBtnLoading]} onPress={reload} activeOpacity={0.7} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <Text style={s.loadBtnTxt}>🔄 טען נתונים</Text>
              )}
            </TouchableOpacity>

            {/* 7-segment clock - center */}
            <View style={s.clockWrap}>
              <View style={s.clockBoard}>
                <Text style={s.clockDigits}>{batumiTime}</Text>
              </View>
              <Text style={s.clockLabel}>שעון בטומי UTC+4</Text>
            </View>

            {/* Green blinking LED - right */}
            <View style={s.ledWrap}>
              <Animated.View style={[s.led, { opacity: ledAnim }]} />
              <Text style={s.ledLabel}>ONLINE</Text>
            </View>
          </View>

          <Text style={s.code}>TLV ✈ BSB  •  {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

          {/* Tabs */}
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, tab === 'arrival' && s.tabActive]} onPress={() => setTab('arrival')}>
              <Text style={[s.tabTxt, tab === 'arrival' && s.tabTxtActive]}>נחיתות בבטומי</Text>
              <Text style={[s.tabSub, tab === 'arrival' && s.tabSubActive]}>TLV → BSB</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'departure' && s.tabActive]} onPress={() => setTab('departure')}>
              <Text style={[s.tabTxt, tab === 'departure' && s.tabTxtActive]}>המראות מבטומי</Text>
              <Text style={[s.tabSub, tab === 'departure' && s.tabSubActive]}>BSB → TLV</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Table header */}
              {filtered.length > 0 && (
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, { flex: 1 }]}>טיסה</Text>
                  <Text style={[s.thCell, { width: 65 }]}>המראה</Text>
                  <Text style={[s.thCell, { width: 20 }]}></Text>
                  <Text style={[s.thCell, { width: 65 }]}>נחיתה</Text>
                  <Text style={[s.thCell, { width: 70 }]}>סטטוס</Text>
                </View>
              )}

              {filtered.map((f, i) => (
                <View key={i} style={s.flightRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.flightNum}>{f.flight}</Text>
                    <Text style={s.airline}>{f.airline}</Text>
                  </View>
                  <View style={s.timeCol}>
                    <Text style={s.timeVal}>{f.depTime}</Text>
                    <Text style={s.timeDateLabel}>{f.depDate}</Text>
                    <Text style={s.timeLabel}>{tab === 'arrival' ? 'TLV' : 'BSB'}</Text>
                  </View>
                  <Text style={s.timeArrow}>←</Text>
                  <View style={s.timeCol}>
                    <Text style={s.timeVal}>{f.arrTime}</Text>
                    <Text style={s.timeDateLabel}>{f.arrDate}</Text>
                    <Text style={s.timeLabel}>{tab === 'arrival' ? 'BSB' : 'TLV'}</Text>
                  </View>
                  <View style={[s.statusBadge, statusColor(f.status)]}>
                    <Text style={s.statusTxt}>{f.status}</Text>
                  </View>
                </View>
              ))}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyIcon}>✈️</Text>
                  <Text style={s.emptyTxt}>אין טיסות ב-24 השעות הקרובות</Text>
                </View>
              )}

              {!AVIATIONSTACK_KEY && !AERODATABOX_KEY && (
                <Text style={s.sampleNote}>* לוח טיסות לדוגמה. הוסף מפתח API לנתונים בזמן אמת</Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'בזמן' || status === 'מתוכננת') return { backgroundColor: 'rgba(46,204,113,0.3)' };
  if (status === 'נחתה' || status === 'המריאה') return { backgroundColor: 'rgba(46,204,113,0.5)' };
  if (status === 'עיכוב') return { backgroundColor: 'rgba(231,76,60,0.4)' };
  if (status === 'בוטלה') return { backgroundColor: 'rgba(231,76,60,0.5)' };
  return { backgroundColor: 'rgba(255,255,255,0.15)' };
}

function translateStatus(status: string): string {
  if (!status) return 'מתוכננת';
  const s = status.toLowerCase();
  if (s === 'scheduled' || s === 'unknown') return 'מתוכננת';
  if (s === 'active' || s === 'en-route') return 'בדרך';
  if (s === 'landed') return 'נחתה';
  if (s === 'departed') return 'המריאה';
  if (s === 'delayed') return 'עיכוב';
  if (s === 'cancelled' || s === 'canceled') return 'בוטלה';
  if (s === 'diverted') return 'הופנתה';
  return 'בזמן';
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Try parsing "HH:mm" format from AeroDataBox
    const match = dateStr.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : '—';
  }
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function pad(h: number): string {
  const normalized = ((h % 24) + 24) % 24;
  return normalized.toString().padStart(2, '0');
}

function flightDate(hourOffset: number): string {
  const now = new Date();
  const d = new Date(now);
  d.setHours(now.getHours() + hourOffset);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function generateTLVFlights(hour: number): Flight[] {
  // Sample TLV ↔ BSB flights only (next 24h window)
  const arrivals: Flight[] = [
    { flight: '6H 042', airline: 'Israir', depTime: pad(hour + 1) + ':00', arrTime: pad(hour + 4) + ':15', depDate: flightDate(1), arrDate: flightDate(4), status: 'בזמן', type: 'arrival' },
    { flight: 'UP 804', airline: 'El Al Sun d\'Or', depTime: pad(hour + 3) + ':30', arrTime: pad(hour + 6) + ':45', depDate: flightDate(3), arrDate: flightDate(6), status: 'בזמן', type: 'arrival' },
    { flight: 'U2 1782', airline: 'Uvda Air', depTime: pad(hour + 6) + ':00', arrTime: pad(hour + 9) + ':20', depDate: flightDate(6), arrDate: flightDate(9), status: 'מתוכננת', type: 'arrival' },
    { flight: '6H 044', airline: 'Israir', depTime: pad(hour + 10) + ':15', arrTime: pad(hour + 13) + ':30', depDate: flightDate(10), arrDate: flightDate(13), status: 'מתוכננת', type: 'arrival' },
    { flight: 'LY 2702', airline: 'אל על', depTime: pad(hour - 2) + ':00', arrTime: pad(hour + 1) + ':15', depDate: flightDate(-2), arrDate: flightDate(1), status: 'נחתה', type: 'arrival' },
    { flight: 'W6 2442', airline: 'Wizz Air', depTime: pad(hour + 8) + ':45', arrTime: pad(hour + 12) + ':00', depDate: flightDate(8), arrDate: flightDate(12), status: 'בזמן', type: 'arrival' },
  ];

  const departures: Flight[] = [
    { flight: '6H 043', airline: 'Israir', depTime: pad(hour + 2) + ':00', arrTime: pad(hour + 5) + ':15', depDate: flightDate(2), arrDate: flightDate(5), status: 'בזמן', type: 'departure' },
    { flight: 'UP 805', airline: 'El Al Sun d\'Or', depTime: pad(hour + 5) + ':00', arrTime: pad(hour + 8) + ':15', depDate: flightDate(5), arrDate: flightDate(8), status: 'בזמן', type: 'departure' },
    { flight: 'LY 2703', airline: 'אל על', depTime: pad(hour + 7) + ':30', arrTime: pad(hour + 10) + ':45', depDate: flightDate(7), arrDate: flightDate(10), status: 'מתוכננת', type: 'departure' },
    { flight: '6H 045', airline: 'Israir', depTime: pad(hour + 12) + ':00', arrTime: pad(hour + 15) + ':15', depDate: flightDate(12), arrDate: flightDate(15), status: 'מתוכננת', type: 'departure' },
    { flight: 'W6 2443', airline: 'Wizz Air', depTime: pad(hour + 14) + ':30', arrTime: pad(hour + 17) + ':45', depDate: flightDate(14), arrDate: flightDate(17), status: 'מתוכננת', type: 'departure' },
    { flight: 'U2 1783', airline: 'Uvda Air', depTime: pad(hour - 1) + ':00', arrTime: pad(hour + 2) + ':15', depDate: flightDate(-1), arrDate: flightDate(2), status: 'המריאה', type: 'departure' },
  ];

  return [...arrivals, ...departures];
}

// ─── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeX: { fontSize: 18, color: Colors.WHITE, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', marginBottom: 12, writingDirection: 'rtl' },

  // Airport board header
  boardHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 14, marginBottom: 14,
  },
  loadBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  loadBtnLoading: {
    width: 44, height: 44, borderRadius: 22, paddingHorizontal: 0, paddingVertical: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)',
  },
  loadBtnTxt: { fontSize: 12, fontWeight: '600', color: Colors.WHITE, writingDirection: 'rtl' },
  clockWrap: { alignItems: 'center' },
  clockBoard: {
    backgroundColor: '#0a0a0a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: '#333',
  },
  clockDigits: {
    fontSize: 32, fontWeight: '200', color: '#00ff88', letterSpacing: 6,
    fontFamily: 'Courier', fontVariant: ['tabular-nums'],
  },
  clockLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.5, marginTop: 4, writingDirection: 'rtl' },
  ledWrap: { alignItems: 'center', gap: 4 },
  led: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#00ff44',
    shadowColor: '#00ff44', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
  },
  ledLabel: { fontSize: 9, fontWeight: '800', color: '#00ff44', letterSpacing: 1 },

  code: { fontSize: 13, color: Colors.WHITE, opacity: 0.6, textAlign: 'center', marginBottom: 16 },

  tabRow: { flexDirection: 'row-reverse', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.WHITE },
  tabTxt: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },
  tabTxtActive: { color: Colors.TEXT },
  tabSub: { fontSize: 11, color: Colors.WHITE, opacity: 0.5, marginTop: 2 },
  tabSubActive: { color: Colors.TEXT, opacity: 0.5 },

  tableHeader: {
    flexDirection: 'row-reverse', paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', marginBottom: 4,
  },
  thCell: { fontSize: 12, fontWeight: '700', color: Colors.WHITE, opacity: 0.5, textAlign: 'right', writingDirection: 'rtl' },

  flightRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 6,
  },
  flightNum: { fontSize: 15, fontWeight: '700', color: Colors.WHITE, textAlign: 'right' },
  airline: { fontSize: 11, color: Colors.WHITE, opacity: 0.5, textAlign: 'right' },
  timeCol: { alignItems: 'center', width: 48 },
  timeVal: { fontSize: 15, fontWeight: '700', color: Colors.WHITE },
  timeDateLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.6, marginTop: 1 },
  timeLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.4, marginTop: 1 },
  timeArrow: { fontSize: 12, color: Colors.WHITE, opacity: 0.3, marginHorizontal: 2 },
  statusBadge: { width: 70, paddingVertical: 5, borderRadius: 8, alignItems: 'center' },
  statusTxt: { fontSize: 11, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: Colors.WHITE, opacity: 0.6, marginTop: 8, writingDirection: 'rtl' },
  sampleNote: { fontSize: 11, color: Colors.WHITE, opacity: 0.3, textAlign: 'center', marginTop: 20, writingDirection: 'rtl' },
});
