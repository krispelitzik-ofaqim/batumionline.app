import React, { useEffect, useState, useRef } from 'react';
import { useI18n } from '../constants/i18n';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Image, Linking,
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
  otherIata?: string;  // the non-Batumi endpoint (origin for arrivals, destination for departures)
  otherName?: string;
  details?: FlightDetails;
};

type FlightDetails = {
  aircraft?: string;
  aircraftReg?: string;
  aircraftModeS?: string;
  callSign?: string;
  gate?: string;
  terminal?: string;
  checkInDesk?: string;
  baggageBelt?: string;
  originName?: string;
  originIcao?: string;
  destName?: string;
  destIcao?: string;
  depScheduled?: string;
  depRevised?: string;
  depRunway?: string;
  arrScheduled?: string;
  arrRevised?: string;
  arrRunway?: string;
  distanceKm?: number;
  codeshareStatus?: string;
  isCargo?: boolean;
  quality?: string[];
};

const AIRLINE_LOGOS: Record<string, any> = {
  LY: require('../assets/images/flights/LY.png'),
  UP: require('../assets/images/flights/UP.png'),
  '6H': require('../assets/images/flights/6H.png'),
  W6: require('../assets/images/flights/W6.png'),
  U2: require('../assets/images/flights/U2.png'),
  IZ: require('../assets/images/flights/IZ.png'),
  TK: require('../assets/images/flights/TK.png'),
  CW: require('../assets/images/flights/CW.png'),
  A4: require('../assets/images/flights/A4.png'),
  WZ: require('../assets/images/flights/WZ.png'),
  B2: require('../assets/images/flights/B2.png'),
  '4L': require('../assets/images/flights/4L.png'),
  '3F': require('../assets/images/flights/3F.png'),
  '9S': require('../assets/images/flights/9S.png'),
  A9: require('../assets/images/flights/A9.png'),
  BT: require('../assets/images/flights/BT.png'),
  C6: require('../assets/images/flights/C6.png'),
  DV: require('../assets/images/flights/DV.png'),
  FS: require('../assets/images/flights/FS.png'),
  FZ: require('../assets/images/flights/FZ.png'),
  HY: require('../assets/images/flights/HY.png'),
  J2: require('../assets/images/flights/J2.png'),
  KC: require('../assets/images/flights/KC.png'),
  PC: require('../assets/images/flights/PC.png'),
  Q4: require('../assets/images/flights/Q4.png'),
  XY: require('../assets/images/flights/XY.png'),
};

export default function FlightsModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const { t, lang } = useI18n();
  const L = FL(lang);
  const F = F_TR[L];
  const allFlights = lang !== 'he'; // Non-Hebrew editions (en/fa): show ALL Batumi flights, not only Israel routes
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'arrival' | 'departure'>('arrival');
  const [batumiTime, setBatumiTime] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Flight | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [routeSel, setRouteSel] = useState<string>('ALL'); // filter by the non-Batumi endpoint IATA
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setVisibleCount(10); setRouteSel('ALL'); setPickerOpen(false); }, [tab, visible]);

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
        aircraftReg: f.aircraft?.reg,
        aircraftModeS: f.aircraft?.modeS,
        callSign: f.callSign,
        gate: f.departure?.gate,
        terminal: f.arrival?.terminal || f.departure?.terminal,
        checkInDesk: f.departure?.checkInDesk,
        baggageBelt: f.arrival?.baggageBelt,
        originName: f.departure?.airport?.name,
        originIcao: f.departure?.airport?.icao,
        destName: f.arrival?.airport?.name,
        destIcao: f.arrival?.airport?.icao,
        depScheduled: parseLocal(f.departure?.scheduledTime),
        depRevised: parseLocal(f.departure?.revisedTime),
        depRunway: parseLocal(f.departure?.runwayTime),
        arrScheduled: parseLocal(f.arrival?.scheduledTime),
        arrRevised: parseLocal(f.arrival?.revisedTime),
        arrRunway: parseLocal(f.arrival?.runwayTime),
        distanceKm: f.greatCircleDistance?.km,
        codeshareStatus: f.codeshareStatus,
        isCargo: f.isCargo,
        quality: f.arrival?.quality || f.departure?.quality,
      });

      const IL_AIRPORTS = new Set(['TLV', 'ETM', 'VDA', 'HFA']);
      const arrivals: Flight[] = (data.arrivals || [])
        .filter((f: any) => allFlights || IL_AIRPORTS.has(f.departure?.airport?.iata))
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(parseLocal(f.departure?.revisedTime || f.departure?.scheduledTime)),
          arrTime: formatTime(parseLocal(f.arrival?.revisedTime || f.arrival?.scheduledTime)),
          depDate: formatDateShort(parseLocal(f.departure?.scheduledTime)),
          arrDate: formatDateShort(parseLocal(f.arrival?.scheduledTime)),
          status: translateStatus(f.status),
          type: 'arrival' as const,
          otherIata: f.departure?.airport?.iata,
          otherName: f.departure?.airport?.name,
          details: buildDetails(f),
        }));

      const departures: Flight[] = (data.departures || [])
        .filter((f: any) => allFlights || IL_AIRPORTS.has(f.arrival?.airport?.iata))
        .map((f: any) => ({
          flight: f.number || '—',
          airline: f.airline?.name || '',
          depTime: formatTime(parseLocal(f.departure?.revisedTime || f.departure?.scheduledTime)),
          arrTime: formatTime(parseLocal(f.arrival?.revisedTime || f.arrival?.scheduledTime)),
          depDate: formatDateShort(parseLocal(f.departure?.scheduledTime)),
          arrDate: formatDateShort(parseLocal(f.arrival?.scheduledTime)),
          status: translateStatus(f.status),
          type: 'departure' as const,
          otherIata: f.arrival?.airport?.iata,
          otherName: f.arrival?.airport?.name,
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
    const interval = setInterval(reload, 60_000);
    return () => clearInterval(interval);
  }, [visible, lang]);

  // ─── AviationStack API ──────────────────────────────────────
  const fetchAviationStack = async () => {
    try {
      const [arrRes, depRes] = await Promise.all([
        fetch(`http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&arr_iata=BUS${allFlights ? '' : '&dep_iata=TLV'}&flight_status=active,scheduled,landed`),
        fetch(`http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&dep_iata=BUS${allFlights ? '' : '&arr_iata=TLV'}&flight_status=active,scheduled,landed`),
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
        .filter((f: any) => allFlights || f.departure?.airport?.iata === 'TLV')
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
        .filter((f: any) => allFlights || f.arrival?.airport?.iata === 'TLV')
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

  // Unique destinations (departures) / origins (arrivals) for the picker, sorted by name.
  const routeOptions = React.useMemo(() => {
    const m = new Map<string, string>();
    flights.filter(f => f.type === tab).forEach(f => { if (f.otherIata) m.set(f.otherIata, f.otherName || f.otherIata); });
    return [...m].sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
  }, [flights, tab]);
  const FS = FSEL_TR[L];
  const selName = routeSel === 'ALL' ? '' : (routeOptions.find(([k]) => k === routeSel)?.[1] || routeSel);

  const filtered = flights.filter(f => f.type === tab && (routeSel === 'ALL' || f.otherIata === routeSel));

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={[s.title, { fontSize: 18 }]} numberOfLines={2}>{F.boardTitle}</Text>

          {/* ONLINE LED - centered */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Animated.View style={[s.led, { opacity: ledAnim }]} />
            <Text style={s.ledLabel}>ONLINE</Text>
            <Text style={[s.updatedAt, { marginTop: 0 }]}>· {F.updated}: {lastUpdatedClock}</Text>
          </View>

          {/* Clock + refresh */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 }}>
            <View style={s.clockWrap}>
              <Text style={s.clockLabelTop}>{t('flt.clock')}</Text>
              <View style={s.clockBoard}>
                <Text style={s.clockDigits}>{batumiTime}</Text>
              </View>
              <Text style={s.clockLabel}>UTC+4</Text>
            </View>
            <TouchableOpacity style={s.refreshCircle} onPress={reload} activeOpacity={0.7} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <>
                  <Text style={s.refreshCircleIcon}>↻</Text>
                  <Text style={s.refreshCircleTxt}>{t('flt.refresh')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={s.code}>{allFlights ? 'Batumi (BUS)' : 'TLV — BUS'}  •  {new Date().toLocaleDateString(F.locale || 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

          {/* Search flights CTA - full banner */}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.aviasales.com/?origin_iata=TLV&destination_iata=BUS&marker=X5SEJjUA')}
            activeOpacity={0.9}
            style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginVertical: 10, borderWidth: 1, borderColor: 'rgba(244,169,78,0.6)' }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
              <Text style={{ fontSize: 22 }}>✈️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', writingDirection: 'rtl' }}>{t('flt.searchTitle')}</Text>
                <Text style={{ fontSize: 11, color: '#F4A94E', writingDirection: 'rtl', marginTop: 2 }}>{t('flt.searchSub')}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#F4A94E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 }}>
              <Text style={{ color: '#1C2B35', fontSize: 12, fontWeight: '900' }}>{t('c.search')}</Text>
            </View>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, tab === 'departure' && s.tabActive]} onPress={() => setTab('departure')}>
              <Text style={[s.tabTxt, tab === 'departure' && s.tabTxtActive]}>{t('flt.departures')}</Text>
              <Text style={[s.tabSub, tab === 'departure' && s.tabSubActive]}>{allFlights ? 'BUS → ✈' : 'BUS → TLV'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'arrival' && s.tabActive]} onPress={() => setTab('arrival')}>
              <Text style={[s.tabTxt, tab === 'arrival' && s.tabTxtActive]}>{t('flt.arrivals')}</Text>
              <Text style={[s.tabSub, tab === 'arrival' && s.tabSubActive]}>{allFlights ? '✈ → BUS' : 'TLV → BUS'}</Text>
            </TouchableOpacity>
          </View>

          {/* Route filter: fixed Batumi + destination/origin selector (non-Hebrew editions) */}
          {allFlights && !loading && (
            <View style={{ marginBottom: 16, zIndex: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <View style={s.routeFixed}>
                  <Text style={s.routeFieldLabel}>{tab === 'departure' ? FS.origin : FS.dest}</Text>
                  <Text style={s.routeFixedTxt}>{FS.batumi} · BUS</Text>
                </View>
                <Text style={{ color: '#fff', opacity: 0.6, fontSize: 18 }}>{tab === 'departure' ? '→' : '←'}</Text>
                <TouchableOpacity style={[s.routeSelect, pickerOpen && s.routeSelectOpen]} onPress={() => setPickerOpen(o => !o)} activeOpacity={0.8}>
                  <Text style={[s.routeFieldLabel, pickerOpen && { color: '#1C2B35' }]}>{tab === 'departure' ? FS.dest : FS.origin}</Text>
                  <Text style={[s.routeSelectTxt, pickerOpen && { color: '#1C2B35' }]} numberOfLines={1}>
                    {(routeSel === 'ALL' ? (tab === 'departure' ? FS.allDest : FS.allOrigin) : selName) + '  ▼'}
                  </Text>
                </TouchableOpacity>
              </View>
              {pickerOpen && (
                <View style={s.routeList}>
                  <TouchableOpacity style={s.routeOpt} onPress={() => { setRouteSel('ALL'); setPickerOpen(false); }}>
                    <Text style={[s.routeOptTxt, { color: '#1A6B8A', fontWeight: '800' }]}>{tab === 'departure' ? FS.allDest : FS.allOrigin}</Text>
                  </TouchableOpacity>
                  {routeOptions.map(([iata, name]) => (
                    <TouchableOpacity key={iata} style={[s.routeOpt, routeSel === iata && { backgroundColor: '#f2ede3' }]} onPress={() => { setRouteSel(iata); setPickerOpen(false); }}>
                      <Text style={s.routeOptTxt}>{name} <Text style={{ color: '#999' }}>({iata})</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Table header */}
              {filtered.length > 0 && (
                <View style={s.tableHeader}>
                  <Text style={[s.thCell, { width: 70, textAlign: 'center' }]}>{t('flt.colFlight')}</Text>
                  <Text style={[s.thCell, { flex: 1, textAlign: 'center' }]}>{t('flt.colRoute')}</Text>
                  <Text style={[s.thCell, { width: 70, textAlign: 'center' }]}>{t('flt.colStatus')}</Text>
                </View>
              )}

              {filtered.map((f, i) => (
                <TouchableOpacity key={i} style={[s.flightRow, { justifyContent: 'space-between' }]} activeOpacity={0.7} onPress={() => setSelected(f)}>
                  <View style={{ alignItems: 'center', width: 60 }}>
                    <View style={s.logo}>
                      {(() => {
                        const iata = getAirlineIATA(f.flight);
                        if (AIRLINE_LOGOS[iata]) return <Image source={AIRLINE_LOGOS[iata]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />;
                        if (iata) return (
                          <View style={{ width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 6, padding: 1 }}>
                            <Image source={{ uri: `https://logos.skyscnr.com/images/airlines/favicon/${iata}.png` }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                          </View>
                        );
                        return <Text style={{ fontSize: 9, color: 'yellow', textAlign: 'center' }}>?</Text>;
                      })()}
                    </View>
                    <Text style={[s.airline, { textAlign: 'center', marginTop: 2 }]} numberOfLines={1}>{cleanAirline(f.airline)}</Text>
                    <Text style={[s.flightNum, { textAlign: 'center', fontSize: 11 }]} numberOfLines={1}>{f.flight}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                      <Text style={s.timeVal}>{f.depTime}</Text>
                      <Text style={s.timeLabel}>{tab === 'arrival' ? (f.otherIata || 'TLV') : 'BUS'}</Text>
                      <Text style={s.timeDateLabel}>{f.depDate}</Text>
                    </View>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                      <Text style={s.timeVal}>{f.arrTime}</Text>
                      <Text style={s.timeLabel}>{tab === 'arrival' ? 'BUS' : (f.otherIata || 'TLV')}</Text>
                      <Text style={s.timeDateLabel}>{f.arrDate}</Text>
                    </View>
                  </View>
                  <View style={[s.statusBadge, statusColor(f.status)]}>
                    <Text style={s.statusTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{ST(f.status, L)}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyIcon}>✈️</Text>
                  <Text style={s.emptyTxt}>{t('flt.empty')}</Text>
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
                <Text style={s.statusTxt}>{ST(selected.status, L)}</Text>
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

              {(() => {
                const d = selected.details;
                if (!d) return null;
                const delay = computeDelay(d, L);
                const duration = computeDuration(d, L);
                return (
                  <>
                    {delay && (
                      <View style={s.delayBanner}>
                        <Text style={s.delayTxt}>⚠ {delay}</Text>
                      </View>
                    )}
                    <View style={s.detailsGrid}>
                      {d.gate && <DetailItem label={F.gate} value={d.gate} />}
                      {d.terminal && <DetailItem label={F.terminal} value={d.terminal} />}
                      {d.checkInDesk && <DetailItem label={F.checkin} value={d.checkInDesk} />}
                      {d.baggageBelt && <DetailItem label={F.baggage} value={d.baggageBelt} />}
                      {duration && <DetailItem label={F.duration} value={duration} />}
                      {d.distanceKm && <DetailItem label={F.distance} value={`${Math.round(d.distanceKm).toLocaleString()} ${F.km}`} />}
                      {d.depRunway && <DetailItem label={F.actualDep} value={formatTime(d.depRunway)} />}
                      {d.arrRunway && <DetailItem label={F.actualArr} value={formatTime(d.arrRunway)} />}
                      {d.aircraft && <DetailItem label={F.aircraft} value={d.aircraft} />}
                      {d.aircraftReg && <DetailItem label={F.tail} value={d.aircraftReg} />}
                      {d.callSign && <DetailItem label="Call Sign" value={d.callSign} />}
                    </View>
                    <TouchableOpacity
                      style={s.fr24Btn}
                      activeOpacity={0.8}
                      onPress={() => {
                        const iata = (selected.flight || '').replace(/\s+/g, '').toLowerCase();
                        const url = iata
                          ? `https://www.flightradar24.com/data/flights/${iata}`
                          : 'https://www.flightradar24.com';
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={s.fr24Icon}>📡</Text>
                      <Text style={s.fr24Txt}>{t('flt.followFr24')}</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
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

// ─── Localization ──────────────────────────────────────────────
type FLang = 'he' | 'en' | 'fa' | 'ru';
const FL = (l: string): FLang => (['he', 'en', 'fa', 'ru'].includes(l) ? (l as FLang) : 'en');
const STATUS_TR: Record<FLang, Record<string, string>> = {
  he: { 'בזמן': 'בזמן', 'מתוכננת': 'מתוכננת', 'בדרך': 'בדרך', 'נחתה': 'נחתה', 'המריאה': 'המריאה', 'עיכוב': 'עיכוב', 'בוטלה': 'בוטלה', 'הועברה': 'הועברה' },
  en: { 'בזמן': 'On time', 'מתוכננת': 'Scheduled', 'בדרך': 'In flight', 'נחתה': 'Landed', 'המריאה': 'Departed', 'עיכוב': 'Delayed', 'בוטלה': 'Cancelled', 'הועברה': 'Diverted' },
  fa: { 'בזמן': 'به‌موقع', 'מתוכננת': 'برنامه‌ریزی‌شده', 'בדרך': 'در پرواز', 'נחתה': 'فرود آمد', 'המריאה': 'پرواز کرد', 'עיכוב': 'تأخیر', 'בוטלה': 'لغو شد', 'הועברה': 'تغییر مسیر' },
  ru: { 'בזמן': 'Вовремя', 'מתוכננת': 'По расписанию', 'בדרך': 'В полёте', 'נחתה': 'Приземлился', 'המריאה': 'Вылетел', 'עיכוב': 'Задержка', 'בוטלה': 'Отменён', 'הועברה': 'Изменён' },
};
const ST = (status: string, L: FLang): string => (STATUS_TR[L] && STATUS_TR[L][status]) || status;
const FSEL_TR: Record<FLang, { batumi: string; dest: string; origin: string; allDest: string; allOrigin: string }> = {
  he: { batumi: 'בטומי', dest: 'יעד', origin: 'מוצא', allDest: 'כל היעדים', allOrigin: 'כל המקורות' },
  en: { batumi: 'Batumi', dest: 'Destination', origin: 'Origin', allDest: 'All destinations', allOrigin: 'All origins' },
  fa: { batumi: 'باتومی', dest: 'مقصد', origin: 'مبدأ', allDest: 'همه مقصدها', allOrigin: 'همه مبدأها' },
  ru: { batumi: 'Батуми', dest: 'Куда', origin: 'Откуда', allDest: 'Все направления', allOrigin: 'Все пункты' },
};
const F_TR: Record<FLang, Record<string, string>> = {
  he: { gate: 'שער יציאה', terminal: 'טרמינל', checkin: 'דלפק צ׳ק-אין', baggage: 'סרט מזוודות', duration: 'משך טיסה', distance: 'מרחק', actualDep: 'המראה בפועל', actualArr: 'נחיתה בפועל', aircraft: 'דגם מטוס', tail: 'מספר זנב', km: 'ק״מ', hours: 'שעות', min: 'דק׳', delayIn: 'עיכוב ב', dep: 'המראה', arr: 'נחיתה', durH: 'ש׳', durM: 'ד׳', boardTitle: 'נחיתות והמראות · שדה התעופה בטומי (BUS)', updated: 'עודכן', locale: 'he-IL' },
  en: { gate: 'Gate', terminal: 'Terminal', checkin: 'Check-in desk', baggage: 'Baggage belt', duration: 'Flight duration', distance: 'Distance', actualDep: 'Actual departure', actualArr: 'Actual arrival', aircraft: 'Aircraft', tail: 'Tail number', km: 'km', hours: 'h', min: 'min', delayIn: 'Delay in ', dep: 'departure', arr: 'arrival', durH: 'h', durM: 'm', boardTitle: 'Arrivals & Departures · Batumi Airport (BUS)', updated: 'Updated', locale: 'en-GB' },
  fa: { gate: 'گیت', terminal: 'ترمینال', checkin: 'باجه پذیرش', baggage: 'نوار چمدان', duration: 'مدت پرواز', distance: 'مسافت', actualDep: 'پرواز واقعی', actualArr: 'فرود واقعی', aircraft: 'هواپیما', tail: 'شماره دم', km: 'کیلومتر', hours: 'ساعت', min: 'دقیقه', delayIn: 'تأخیر در ', dep: 'پرواز', arr: 'فرود', durH: 'س', durM: 'د', boardTitle: 'ورود و خروج · فرودگاه باتومی (BUS)', updated: 'به‌روزرسانی', locale: 'fa-IR' },
  ru: { gate: 'Выход', terminal: 'Терминал', checkin: 'Стойка регистрации', baggage: 'Лента багажа', duration: 'Длительность', distance: 'Расстояние', actualDep: 'Факт. вылет', actualArr: 'Факт. прилёт', aircraft: 'Самолёт', tail: 'Бортовой номер', km: 'км', hours: 'ч', min: 'мин', delayIn: 'Задержка: ', dep: 'вылет', arr: 'прилёт', durH: 'ч', durM: 'м', boardTitle: 'Прилёты и вылеты · Аэропорт Батуми (BUS)', updated: 'Обновлено', locale: 'ru-RU' },
};

// ─── Helpers ───────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'בזמן' || status === 'מתוכננת') return { backgroundColor: '#10B981' }; // green — on time
  if (status === 'בדרך') return { backgroundColor: '#3B82F6' }; // blue — in flight
  if (status === 'נחתה' || status === 'המריאה') return { backgroundColor: '#6B7280' }; // gray — completed
  if (status === 'עיכוב') return { backgroundColor: '#F59E0B' }; // amber — delayed
  if (status === 'בוטלה') return { backgroundColor: '#EF4444' }; // red — cancelled
  if (status === 'הועברה') return { backgroundColor: '#8B5CF6' }; // purple — diverted
  return { backgroundColor: 'rgba(255,255,255,0.15)' };
}

function computeDelay(d: FlightDetails, L: FLang): string | null {
  const pairs: [string | undefined, string | undefined, string][] = [
    [d.depScheduled, d.depRevised, F_TR[L].dep],
    [d.arrScheduled, d.arrRevised, F_TR[L].arr],
  ];
  for (const [sched, rev, label] of pairs) {
    if (!sched || !rev || sched === rev) continue;
    const ms = new Date(rev).getTime() - new Date(sched).getTime();
    if (isNaN(ms) || ms <= 60_000) continue;
    const mins = Math.round(ms / 60_000);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const dur = hh > 0 ? `${hh}:${String(mm).padStart(2, '0')} ${F_TR[L].hours}` : `${mm} ${F_TR[L].min}`;
    return `${F_TR[L].delayIn}${label}: ${dur}`;
  }
  return null;
}

function computeDuration(d: FlightDetails, L: FLang): string | null {
  const dep = d.depScheduled;
  const arr = d.arrScheduled;
  if (!dep || !arr) return null;
  const ms = new Date(arr).getTime() - new Date(dep).getTime();
  if (isNaN(ms) || ms <= 0) return null;
  const mins = Math.round(ms / 60_000);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return hh > 0 ? `${hh}${F_TR[L].durH} ${mm}${F_TR[L].durM}` : `${mm} ${F_TR[L].min}`;
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
  if (s === 'diverted') return 'הועברה';
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

function cleanAirline(name: string | undefined): string {
  if (!name) return '';
  return name
    .replace(/Arkia\s+Israeli(\s+Airlines)?/i, 'Arkia')
    .replace(/El\s*Al\s*Israel(\s+Airlines)?/i, 'El Al')
    .replace(/^LAS\s*SA$/i, 'One Click')
    .trim();
}

function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
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
  clockLabelTop: { fontSize: 11, color: Colors.WHITE, opacity: 0.55, fontWeight: '200', marginBottom: 4, writingDirection: 'rtl', letterSpacing: 1 },
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

  routeFixed: { flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  routeFixedTxt: { fontSize: 15, fontWeight: '900', color: Colors.WHITE },
  routeFieldLabel: { fontSize: 11, color: Colors.WHITE, opacity: 0.55, marginBottom: 2 },
  routeSelect: { flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(244,169,78,0.7)' },
  routeSelectOpen: { backgroundColor: '#fff' },
  routeSelectTxt: { fontSize: 15, fontWeight: '900', color: '#F4A94E' },
  routeList: { backgroundColor: '#fff', borderRadius: 12, marginTop: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  routeOpt: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0ece4' },
  routeOptTxt: { fontSize: 15, fontWeight: '700', color: '#1C2B35' },

  tableHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', marginBottom: 4,
  },
  thCell: { fontSize: 12, fontWeight: '700', color: Colors.WHITE, opacity: 0.5, textAlign: 'right', writingDirection: 'rtl' },

  flightRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, marginBottom: 6,
  },
  logo: { width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  flightNum: { fontSize: 8, fontWeight: '900', color: Colors.WHITE, textAlign: 'right' },
  airline: { fontSize: 10, color: Colors.WHITE, textAlign: 'right', fontWeight: '900' },
  timeCol: { alignItems: 'center', width: 42 },
  timeVal: { fontSize: 12, fontWeight: '900', color: Colors.WHITE, fontVariant: ['tabular-nums'] },
  timeDateLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.95 },
  timeLabel: { fontSize: 10, color: Colors.WHITE, opacity: 0.95, fontWeight: '700' },
  timeArrow: { fontSize: 13, color: Colors.WHITE, opacity: 0.3, marginHorizontal: 1 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center', alignSelf: 'center', width: 70 },
  statusTxt: { fontSize: 12, fontWeight: '800', color: Colors.WHITE, writingDirection: 'rtl' },

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
  delayBanner: { backgroundColor: 'rgba(245,158,11,0.18)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.6)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 },
  delayTxt: { fontSize: 13, fontWeight: '700', color: '#FCD34D', textAlign: 'center', writingDirection: 'rtl' },
  fr24Btn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(244,169,78,0.18)', borderWidth: 1, borderColor: 'rgba(244,169,78,0.6)' },
  fr24Icon: { fontSize: 18 },
  fr24Txt: { fontSize: 14, fontWeight: '700', color: '#FCD34D', writingDirection: 'rtl' },
  detailsGrid: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, gap: 12 },
  detailItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: Colors.WHITE, opacity: 0.6, writingDirection: 'rtl' },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  loadMoreBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 12, marginHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(244,169,78,0.15)', borderWidth: 1, borderColor: 'rgba(244,169,78,0.5)' },
  loadMoreArrow: { color: '#F4A94E', fontSize: 18, fontWeight: '900', lineHeight: 18 },
  loadMoreTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: Colors.WHITE, opacity: 0.6, marginTop: 8, writingDirection: 'rtl' },
  sampleNote: { fontSize: 11, color: Colors.WHITE, opacity: 0.3, textAlign: 'center', marginTop: 20, writingDirection: 'rtl' },
});
