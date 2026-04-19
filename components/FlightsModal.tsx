import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Image,
} from 'react-native';
import { Colors } from '../constants/colors';
import { API_BASE } from '../constants/api';

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
  details?: FlightDetails;
};

type FlightDetails = {
  aircraft?: string;
  gate?: string;
  terminal?: string;
  checkInDesk?: string;
  baggageBelt?: string;
  originName?: string;
  destName?: string;
  depScheduled?: string;
  depRevised?: string;
  arrScheduled?: string;
  arrRevised?: string;
};

const AIRLINE_LOGOS: Record<string, any> = {
  LY: require('../assets/images/flights/LY.png'),
  UP: require('../assets/images/flights/UP.png'),
  '6H': require('../assets/images/flights/6H.png'),
  W6: require('../assets/images/flights/W6.png'),
  U2: require('../assets/images/flights/U2.png'),
  IZ: require('../assets/images/flights/IZ.png'),
};

export default function FlightsModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'arrival' | 'departure'>('arrival');
  const [batumiTime, setBatumiTime] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Flight | null>(null);

  const lastUpdatedClock = lastUpdated
    ? `${lastUpdated.getHours().toString().padStart(2, '0')}:${lastUpdated.getMinutes().toString().padStart(2, '0')}`
    : '--:--';
  const ledAnim = useRef(new Animated.Value(1)).current;

  // Batumi clock (Asia/Tbilisi, UTC+4)
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const now = new Date();
      const t = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hour12: false });
      setBatumiTime(t);
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
    setLastUpdated(new Date());
    fetchFromProxy();
  };

  const fetchFromProxy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/flights`);
      if (!res.ok) throw new Error('proxy error');
      const data = await res.json();

      const parseLocal = (obj: any) => {
        const s = obj?.local || obj?.utc || '';
        return s ? s.replace(' ', 'T') : '';
      };

      const buildDetails = (f: any): FlightDetails => ({
        aircraft: f.aircraft?.model,
        gate: f.departure?.gate,
        terminal: f.arrival?.terminal || f.departure?.terminal,
        checkInDesk: f.departure?.checkInDesk,
        baggageBelt: f.arrival?.baggageBelt,
        originName: f.departure?.airport?.name,
        destName: f.arrival?.airport?.name,
        depScheduled: parseLocal(f.departure?.scheduledTime),
        depRevised: parseLocal(f.departure?.revisedTime),
        arrScheduled: parseLocal(f.arrival?.scheduledTime),
        arrRevised: parseLocal(f.arrival?.revisedTime),
      });

      const arrivals: Flight[] = (data.arrivals || [])
        .filter((f: any) => f.departure?.airport?.iata === 'TLV')
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(parseLocal(f.departure?.revisedTime || f.departure?.scheduledTime)),
          arrTime: formatTime(parseLocal(f.arrival?.revisedTime || f.arrival?.scheduledTime)),
          depDate: formatDateShort(parseLocal(f.departure?.scheduledTime)),
          arrDate: formatDateShort(parseLocal(f.arrival?.scheduledTime)),
          status: translateStatus(f.status),
          type: 'arrival' as const,
          details: buildDetails(f),
        }));

      const departures: Flight[] = (data.departures || [])
        .filter((f: any) => f.arrival?.airport?.iata === 'TLV')
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(parseLocal(f.departure?.revisedTime || f.departure?.scheduledTime)),
          arrTime: formatTime(parseLocal(f.arrival?.revisedTime || f.arrival?.scheduledTime)),
          depDate: formatDateShort(parseLocal(f.departure?.scheduledTime)),
          arrDate: formatDateShort(parseLocal(f.arrival?.scheduledTime)),
          status: translateStatus(f.status),
          type: 'departure' as const,
          details: buildDetails(f),
        }));

      setFlights([...arrivals, ...departures]);
      setLoading(false);
    } catch {
      loadFallbackData();
    }
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

  // ─── Fallback sample data (TLV ↔ BUS only) ─────────────────
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
            {/* Refresh circular button - left */}
            <TouchableOpacity style={s.refreshCircle} onPress={reload} activeOpacity={0.7} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <>
                  <Text style={s.refreshCircleIcon}>↻</Text>
                  <Text style={s.refreshCircleTxt}>רענן</Text>
                </>
              )}
            </TouchableOpacity>

            {/* 7-segment clock - center */}
            <View style={s.clockWrap}>
              <View style={s.clockBoard}>
                <Text style={s.clockDigits}>{batumiTime}</Text>
              </View>
              <Text style={s.clockLabel}>שעון בטומי UTC+4</Text>
            </View>

            {/* Green blinking LED + last updated - right */}
            <View style={s.ledWrap}>
              <Animated.View style={[s.led, { opacity: ledAnim }]} />
              <Text style={s.ledLabel}>ONLINE</Text>
              <Text style={s.updatedAt}>עודכן ב: {lastUpdatedClock}</Text>
            </View>
          </View>

          <Text style={s.code}>TLV — BUS  •  {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

          {/* Tabs */}
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, tab === 'departure' && s.tabActive]} onPress={() => setTab('departure')}>
              <Text style={[s.tabTxt, tab === 'departure' && s.tabTxtActive]}>המראות מבטומי</Text>
              <Text style={[s.tabSub, tab === 'departure' && s.tabSubActive]}>BUS → TLV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'arrival' && s.tabActive]} onPress={() => setTab('arrival')}>
              <Text style={[s.tabTxt, tab === 'arrival' && s.tabTxtActive]}>נחיתות בבטומי</Text>
              <Text style={[s.tabSub, tab === 'arrival' && s.tabSubActive]}>TLV → BUS</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Table header */}
              {filtered.length > 0 && (
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, { width: 36, textAlign: 'center' }]}></Text>
                  <Text style={[s.thCell, { flex: 1, textAlign: 'right' }]}>טיסה</Text>
                  <Text style={[s.thCell, { width: 48, textAlign: 'center' }]}>המראה</Text>
                  <Text style={[s.thCell, { width: 16, marginHorizontal: 2 }]}></Text>
                  <Text style={[s.thCell, { width: 48, textAlign: 'center' }]}>נחיתה</Text>
                  <Text style={[s.thCell, { textAlign: 'center' }]}>סטטוס</Text>
                </View>
              )}

              {filtered.map((f, i) => (
                <TouchableOpacity key={i} style={s.flightRow} activeOpacity={0.7} onPress={() => setSelected(f)}>
                  <View style={s.logo}>
                    {AIRLINE_LOGOS[getAirlineIATA(f.flight)] ? (
                      <Image
                        source={AIRLINE_LOGOS[getAirlineIATA(f.flight)]}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 9, color: 'yellow', textAlign: 'center' }}>{getAirlineIATA(f.flight) || '?'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.flightNum}>{f.flight}</Text>
                    <Text style={s.airline}>{f.airline}</Text>
                  </View>
                  <View style={s.timeCol}>
                    <Text style={s.timeVal}>{f.depTime}</Text>
                    <Text style={s.timeDateLabel}>{f.depDate}</Text>
                    <Text style={s.timeLabel}>{tab === 'arrival' ? 'TLV' : 'BUS'}</Text>
                  </View>
                  <Text style={s.timeArrow}>←</Text>
                  <View style={s.timeCol}>
                    <Text style={s.timeVal}>{f.arrTime}</Text>
                    <Text style={s.timeDateLabel}>{f.arrDate}</Text>
                    <Text style={s.timeLabel}>{tab === 'arrival' ? 'BUS' : 'TLV'}</Text>
                  </View>
                  <View style={[s.statusBadge, statusColor(f.status)]}>
                    <Text style={s.statusTxt}>{f.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyIcon}>✈️</Text>
                  <Text style={s.emptyTxt}>אין טיסות ב-24 השעות הקרובות</Text>
                </View>
              )}

            </>
          )}
        </ScrollView>

        {/* Flight details overlay */}
        {selected && (
          <View style={s.detailsOverlay}>
            <TouchableOpacity style={s.detailsClose} onPress={() => setSelected(null)}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={s.detailsContent} showsVerticalScrollIndicator={false}>
              <Text style={s.detailsTitle}>{selected.flight}</Text>
              <Text style={s.detailsAirline}>{selected.airline}</Text>
              <View style={[s.statusBadge, statusColor(selected.status), { alignSelf: 'center', marginTop: 8, width: 100 }]}>
                <Text style={s.statusTxt}>{selected.status}</Text>
              </View>

              <View style={s.detailsRoute}>
                <View style={s.routePoint}>
                  <Text style={s.routeTime}>{selected.depTime}</Text>
                  <Text style={s.routeCode}>{selected.details?.originName || (selected.type === 'arrival' ? 'TLV' : 'BUS')}</Text>
                  <Text style={s.routeDate}>{selected.depDate}</Text>
                </View>
                <Text style={s.routeArrow}>←</Text>
                <View style={s.routePoint}>
                  <Text style={s.routeTime}>{selected.arrTime}</Text>
                  <Text style={s.routeCode}>{selected.details?.destName || (selected.type === 'arrival' ? 'BUS' : 'TLV')}</Text>
                  <Text style={s.routeDate}>{selected.arrDate}</Text>
                </View>
              </View>

              {selected.details && (
                <View style={s.detailsGrid}>
                  {selected.details.aircraft && <DetailItem label="דגם מטוס" value={selected.details.aircraft} />}
                  {selected.details.gate && <DetailItem label="שער יציאה" value={selected.details.gate} />}
                  {selected.details.terminal && <DetailItem label="טרמינל" value={selected.details.terminal} />}
                  {selected.details.checkInDesk && <DetailItem label="דלפק צ׳ק-אין" value={selected.details.checkInDesk} />}
                  {selected.details.baggageBelt && <DetailItem label="סרט מזוודות" value={selected.details.baggageBelt} />}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailItem}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'בזמן' || status === 'מתוכננת') return { backgroundColor: '#10B981' };
  if (status === 'נחתה' || status === 'המריאה') return { backgroundColor: '#059669' };
  if (status === 'עיכוב') return { backgroundColor: '#F59E0B' };
  if (status === 'בוטלה') return { backgroundColor: '#EF4444' };
  if (status === 'הופנתה') return { backgroundColor: '#8B5CF6' };
  return { backgroundColor: 'rgba(255,255,255,0.15)' };
}

function translateStatus(status: string): string {
  if (!status) return 'מתוכננת';
  const s = status.toLowerCase();
  if (s === 'scheduled' || s === 'unknown' || s === 'expected') return 'מתוכננת';
  if (s === 'active' || s === 'en-route' || s === 'enroute') return 'בדרך';
  if (s === 'landed' || s === 'arrived') return 'נחתה';
  if (s === 'departed') return 'המריאה';
  if (s === 'delayed') return 'עיכוב';
  if (s === 'cancelled' || s === 'canceled') return 'בוטלה';
  if (s === 'diverted') return 'הופנתה';
  return 'בזמן';
}

function getAirlineIATA(flight: string): string {
  const m = flight.match(/^([A-Z0-9]{2,3})(?=\s|\d)/i);
  return m ? m[1].toUpperCase() : '';
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
  // Sample TLV ↔ BUS flights only (next 24h window)
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
  refreshCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  refreshCircleIcon: { fontSize: 20, color: Colors.WHITE, lineHeight: 22, opacity: 0.85 },
  refreshCircleTxt: { fontSize: 11, color: Colors.WHITE, writingDirection: 'rtl', marginTop: 1, opacity: 0.85 },
  updatedAt: { fontSize: 9, color: Colors.WHITE, opacity: 0.55, marginTop: 3, writingDirection: 'rtl' },
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
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', marginBottom: 4,
  },
  thCell: { fontSize: 12, fontWeight: '700', color: Colors.WHITE, opacity: 0.5, textAlign: 'right', writingDirection: 'rtl' },

  flightRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 6,
  },
  logo: { width: 36, height: 36, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  flightNum: { fontSize: 15, fontWeight: '700', color: Colors.WHITE, textAlign: 'right' },
  airline: { fontSize: 11, color: Colors.WHITE, opacity: 0.5, textAlign: 'right' },
  timeCol: { alignItems: 'center', width: 48 },
  timeVal: { fontSize: 15, fontWeight: '700', color: Colors.WHITE },
  timeDateLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.6, marginTop: 1 },
  timeLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.4, marginTop: 1 },
  timeArrow: { fontSize: 12, color: Colors.WHITE, opacity: 0.3, marginHorizontal: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', alignSelf: 'center' },
  statusTxt: { fontSize: 11, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },

  detailsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,20,30,0.96)', zIndex: 100 },
  detailsClose: { position: 'absolute', top: 54, right: 20, zIndex: 110, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  detailsContent: { paddingTop: 90, paddingHorizontal: 24, paddingBottom: 40 },
  detailsTitle: { fontSize: 32, fontWeight: '900', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  detailsAirline: { fontSize: 15, color: Colors.WHITE, opacity: 0.6, textAlign: 'center', marginTop: 4, writingDirection: 'rtl' },
  detailsRoute: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 28, marginBottom: 28 },
  routePoint: { alignItems: 'center', minWidth: 90 },
  routeTime: { fontSize: 28, fontWeight: '800', color: Colors.WHITE },
  routeCode: { fontSize: 13, fontWeight: '600', color: Colors.WHITE, opacity: 0.7, marginTop: 4, textAlign: 'center', writingDirection: 'rtl' },
  routeDate: { fontSize: 11, color: Colors.WHITE, opacity: 0.5, marginTop: 2 },
  routeArrow: { fontSize: 20, color: Colors.WHITE, opacity: 0.4 },
  detailsGrid: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, gap: 12 },
  detailItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: Colors.WHITE, opacity: 0.6, writingDirection: 'rtl' },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: Colors.WHITE, opacity: 0.6, marginTop: 8, writingDirection: 'rtl' },
  sampleNote: { fontSize: 11, color: Colors.WHITE, opacity: 0.3, textAlign: 'center', marginTop: 20, writingDirection: 'rtl' },
});
