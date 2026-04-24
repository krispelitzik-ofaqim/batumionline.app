import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { API_BASE } from '../constants/api';
import CamerasModal from './CamerasModal';
import AudioPlayer from './AudioPlayer';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const OWM_KEY = 'eb761e941b8ad25efb4bf8cc3d4d9b71';
const BATUMI_ID = 615532;

type CurrentWeather = {
  temp: number; feels: number; humidity: number; wind: number;
  desc: string; icon: string; iconCode?: string;
  seaTemp?: number; uv?: number; sunrise?: string; sunset?: string;
  waveHeight?: number;
};
type MarineData = {
  waveHeight?: number; waveDirection?: number; wavePeriod?: number;
  waterTemp?: number; airTemp?: number;
  windSpeed?: number; windDirection?: number; gust?: number;
  visibility?: number; seaLevel?: number;
};
type DayForecast = { day: string; date: string; high: number; low: number; icon: string; desc: string };
type HourForecast = { hour: string; temp: number; icon: string; pop?: number };

const BATUMI_LAT = 41.6168;
const BATUMI_LON = 41.6367;

export default function WeatherModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [hourly, setHourly] = useState<HourForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [camerasOpen, setCamerasOpen] = useState(false);
  const [batumiTime, setBatumiTime] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const livePulse = useRef(new Animated.Value(1)).current;
  const hourlyRef = useRef<ScrollView | null>(null);
  const [marine, setMarine] = useState<MarineData | null>(null);
  const [skippersOpen, setSkippersOpen] = useState(false);

  // Batumi clock (UTC+4)
  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      const t = new Date().toLocaleTimeString('he-IL', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setBatumiTime(t);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [visible]);

  // LIVE dot pulsing animation
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, livePulse]);

  const loadAll = () => {
    setLoading(true);
    if (OWM_KEY) fetchOpenWeatherMap();
    else fetchOpenMeteo();
  };

  useEffect(() => {
    if (!visible) return;
    loadAll();
    // Auto-refresh every 10 minutes
    const iv = setInterval(loadAll, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [visible]);

  const fetchOpenMeteo = async () => {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.6168&longitude=41.6367&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7';
      const marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=41.6168&longitude=41.6367&current=sea_surface_temperature&timezone=auto';

      const [res, marineRes] = await Promise.all([
        fetch(url),
        fetch(marineUrl).catch(() => null),
      ]);
      const data = await res.json();
      const marineData = marineRes ? await marineRes.json().catch(() => null) : null;
      const seaTemp = marineData?.current?.sea_surface_temperature;

      if (data.current) {
        setCurrent({
          temp: Math.round(data.current.temperature_2m),
          feels: Math.round(data.current.apparent_temperature),
          humidity: Math.round(data.current.relative_humidity_2m),
          wind: Math.round(data.current.wind_speed_10m),
          desc: wmoDesc(data.current.weather_code),
          icon: wmoEmoji(data.current.weather_code),
          uv: data.current.uv_index != null ? Math.round(data.current.uv_index) : undefined,
          seaTemp: seaTemp != null ? Math.round(seaTemp) : undefined,
          sunrise: data.daily?.sunrise?.[0]?.split('T')[1]?.slice(0, 5),
          sunset: data.daily?.sunset?.[0]?.split('T')[1]?.slice(0, 5),
        });
      }

      const days: DayForecast[] = (data.daily?.time || []).map((dateStr: string, idx: number) => {
        const date = new Date(dateStr);
        return {
          day: DAYS_HE[date.getDay()],
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          high: Math.round(data.daily.temperature_2m_max[idx]),
          low: Math.round(data.daily.temperature_2m_min[idx]),
          icon: wmoEmoji(data.daily.weather_code[idx]),
          desc: wmoDesc(data.daily.weather_code[idx]),
        };
      });

      setForecast(days);
      setLoading(false);
    } catch {
      fetchWttrFallback();
    }
  };

  const fetchOpenWeatherMap = async () => {
    try {
      // Current weather
      const curRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${BATUMI_ID}&units=metric&lang=he&appid=${OWM_KEY}`);
      const curData = await curRes.json();

      // 5-day/3-hour forecast (for hourly + daily aggregation)
      const foreRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${BATUMI_ID}&units=metric&lang=he&appid=${OWM_KEY}`);
      const foreData = await foreRes.json();

      // Marine (Stormglass via our server — water temp + waves)
      let seaTemp: number | undefined;
      let waveHeight: number | undefined;
      try {
        const mRes = await fetch(`${API_BASE}/api/marine`);
        const mData = await mRes.json();
        setMarine(mData);
        if (mData?.waterTemp != null) seaTemp = Math.round(mData.waterTemp);
        if (mData?.waveHeight != null) waveHeight = Math.round(mData.waveHeight * 10) / 10;
      } catch {}

      const sunrise = curData.sys?.sunrise ? fmtTime(curData.sys.sunrise) : undefined;
      const sunset = curData.sys?.sunset ? fmtTime(curData.sys.sunset) : undefined;

      const iconCode = curData.weather?.[0]?.icon || '';
      setCurrent({
        temp: Math.round(curData.main.temp),
        feels: Math.round(curData.main.feels_like),
        humidity: curData.main.humidity,
        wind: Math.round(curData.wind.speed * 3.6), // m/s to km/h
        desc: curData.weather?.[0]?.description || '',
        icon: owmEmoji(iconCode),
        iconCode,
        seaTemp,
        waveHeight,
        sunrise,
        sunset,
      });

      // Hourly forecast: next 24 hours (3-hour intervals → 8 points)
      const hours: HourForecast[] = (foreData.list || []).slice(0, 8).map((item: any) => {
        const d = new Date(item.dt * 1000);
        const tzDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Tbilisi' }));
        const h = tzDate.getHours().toString().padStart(2, '0');
        return {
          hour: `${h}:00`,
          temp: Math.round(item.main.temp),
          icon: owmEmoji(item.weather?.[0]?.icon || ''),
          pop: item.pop ? Math.round(item.pop * 100) : 0,
        };
      });
      setHourly(hours);

      // 7-day forecast — aggregate by day
      const dayMap: Record<string, { high: number; low: number; icon: string; desc: string }> = {};
      (foreData.list || []).forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const key = date.toISOString().split('T')[0];
        if (!dayMap[key]) {
          dayMap[key] = {
            high: item.main.temp_max,
            low: item.main.temp_min,
            icon: owmEmoji(item.weather?.[0]?.icon || ''),
            desc: item.weather?.[0]?.description || '',
          };
        } else {
          dayMap[key].high = Math.max(dayMap[key].high, item.main.temp_max);
          dayMap[key].low = Math.min(dayMap[key].low, item.main.temp_min);
        }
      });

      const days: DayForecast[] = Object.entries(dayMap).slice(0, 7).map(([dateStr, data]) => {
        const date = new Date(dateStr);
        return {
          day: DAYS_HE[date.getDay()],
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          high: Math.round(data.high),
          low: Math.round(data.low),
          icon: data.icon,
          desc: data.desc,
        };
      });

      setForecast(days);
      setLastUpdated(new Date());
      setLoading(false);
    } catch {
      fetchWttrFallback();
    }
  };

  const fmtTime = (unix: number) => {
    const d = new Date(unix * 1000);
    return d.toLocaleTimeString('he-IL', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const fetchWttrFallback = async () => {
    try {
      const res = await fetch('https://wttr.in/Batumi?format=j1');
      const data = await res.json();

      const cur = data.current_condition?.[0];
      if (cur) {
        setCurrent({
          temp: Number(cur.temp_C),
          feels: Number(cur.FeelsLikeC),
          humidity: Number(cur.humidity),
          wind: Number(cur.windspeedKmph),
          desc: wttrDesc(Number(cur.weatherCode)),
          icon: wttrEmoji(Number(cur.weatherCode)),
        });
      }

      const days: DayForecast[] = (data.weather || []).slice(0, 7).map((d: any) => {
        const date = new Date(d.date);
        return {
          day: DAYS_HE[date.getDay()],
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          high: Number(d.maxtempC),
          low: Number(d.mintempC),
          icon: wttrEmoji(Number(d.hourly?.[4]?.weatherCode || 0)),
          desc: wttrDesc(Number(d.hourly?.[4]?.weatherCode || 0)),
        };
      });

      setForecast(days);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const gradColors = weatherGradient(current?.iconCode, batumiTime);
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.container}
        // @ts-ignore — web-only: prevent browser auto-translation
        translate="no"
        // @ts-ignore — web class for Google Translate
        className="notranslate"
      >
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.liveHeader}>
            <View style={s.liveBadge}>
              <Animated.View style={[s.liveDot, { opacity: livePulse }]} />
              <Text style={s.liveTxt}>LIVE</Text>
            </View>
            <Text style={s.title}>מזג האוויר בבטומי</Text>
            <Text style={s.batumiClock}>🕐 {batumiTime}</Text>
          </View>
          {lastUpdated && (
            <Text style={s.updatedTxt}>עודכן: {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} · מתרענן כל 10 דק׳</Text>
          )}

          <View style={s.audioWrap}>
            <AudioPlayer
              tracks={[{ title: 'מזג האוויר בבטומי - סקירה שנתית', url: '/uploads/1776419283438-349.mp3' }]}
              compact
              playOnLeft
              tint="transparent"
              textLight
            />
          </View>

          <TouchableOpacity style={s.camBanner} activeOpacity={0.85} onPress={() => setCamerasOpen(true)}>
            <Text style={s.camBannerIcon}>📹</Text>
            <Text style={s.camBannerTxt}>צפה במצלמות חיות מבטומי</Text>
            <Text style={s.camBannerArrow}>‹</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Today's weather — compact display */}
              {current && (
                <View style={s.currentCard}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                    <Text style={s.currentIcon}>{current.icon}</Text>
                    <Text style={s.currentTemp}>{current.temp}°</Text>
                    <Text style={s.currentDesc}>{current.desc}</Text>
                  </View>
                  <View style={s.detailsRow}>
                    <View style={s.detailItem}>
                      <Text style={s.detailIcon}>🌡️</Text>
                      <Text style={s.detailVal}>{current.feels}°</Text>
                      <Text style={s.detailLabel}>מרגיש כמו</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.detailItem}>
                      <Text style={s.detailIcon}>💧</Text>
                      <Text style={s.detailVal}>{current.humidity}%</Text>
                      <Text style={s.detailLabel}>לחות</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.detailItem}>
                      <Text style={s.detailIcon}>💨</Text>
                      <Text style={s.detailVal}>{current.wind}</Text>
                      <Text style={s.detailLabel}>רוח קמ״ש</Text>
                    </View>
                  </View>

                  <View style={s.detailsRow}>
                    {current.seaTemp != null && (
                      <>
                        <View style={s.detailItem}>
                          <Text style={s.detailIcon}>🌊</Text>
                          <Text style={s.detailVal}>{current.seaTemp}°</Text>
                          <Text style={s.detailLabel}>טמפ׳ הים</Text>
                        </View>
                        <View style={s.divider} />
                      </>
                    )}
                    {current.uv != null && (
                      <>
                        <View style={s.detailItem}>
                          <Text style={s.detailIcon}>☀️</Text>
                          <Text style={s.detailVal}>{current.uv}</Text>
                          <Text style={s.detailLabel}>אינדקס UV</Text>
                        </View>
                        <View style={s.divider} />
                      </>
                    )}
                    {current.sunrise && (
                      <View style={s.detailItem}>
                        <Text style={s.detailIcon}>🌅</Text>
                        <Text style={s.detailVal}>{current.sunrise}</Text>
                        <Text style={s.detailLabel}>זריחה</Text>
                      </View>
                    )}
                    {current.sunset && (
                      <>
                        <View style={s.divider} />
                        <View style={s.detailItem}>
                          <Text style={s.detailIcon}>🌇</Text>
                          <Text style={s.detailVal}>{current.sunset}</Text>
                          <Text style={s.detailLabel}>שקיעה</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Hourly forecast */}
              {hourly.length > 0 && (
                <>
                  <Text style={s.weekTitle}>24 השעות הקרובות</Text>
                  <View style={{ position: 'relative' }}>
                    <Text style={s.hourArrowFloat}>←</Text>
                    <ScrollView
                      ref={hourlyRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.hourlyScroll}
                      onContentSizeChange={(w) => hourlyRef.current?.scrollTo({ x: w, animated: false })}
                    >
                      {hourly.map((h, i) => {
                        const hourInt = parseInt(h.hour.split(':')[0], 10);
                        const cellGrad = hourGradient(hourInt);
                        const isNow = i === 0;
                        return (
                          <LinearGradient
                            key={i}
                            colors={cellGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[s.hourCell, isNow && s.hourCellNow]}
                          >
                            {isNow && <Text style={s.nowBadge}>עכשיו</Text>}
                            <Text style={s.hourTime}>{h.hour}</Text>
                            <Text style={s.hourIcon}>{h.icon}</Text>
                            <Text style={s.hourTemp}>{h.temp}°</Text>
                            {!!h.pop && h.pop > 10 && <Text style={s.hourPop}>💧 {h.pop}%</Text>}
                          </LinearGradient>
                        );
                      })}
                    </ScrollView>
                  </View>
                </>
              )}

              {/* 7-day weekly forecast */}
              <Text style={s.weekTitle}>תחזית שבועית</Text>
              {forecast.map((day, i) => {
                const isToday = i === 0;
                const icon = isToday && current ? current.icon : day.icon;
                const desc = isToday && current ? current.desc : day.desc;
                return (
                  <View key={i} style={s.dayRow}>
                    <View style={s.dayNameCol}>
                      <Text style={s.dayName}>{isToday ? 'היום' : day.day}</Text>
                      <Text style={s.dayDate}>{day.date}</Text>
                    </View>
                    <Text style={s.dayIcon}>{icon}</Text>
                    <Text style={s.dayDesc} numberOfLines={1} ellipsizeMode="tail">{desc}</Text>
                    <View style={s.dayTemps}>
                      <Text style={s.dayHigh}>{day.high}°</Text>
                      <Text style={s.dayLow}>{day.low}°</Text>
                    </View>
                  </View>
                );
              })}

              {/* Skippers panel */}
              {marine && (
                <View style={s.skippersWrap}>
                  <TouchableOpacity onPress={() => setSkippersOpen(o => !o)} style={s.skippersHeader} activeOpacity={0.85}>
                    <Text style={s.skippersIcon}>⛵</Text>
                    <Text style={s.skippersTitle}>מזג אוויר לספנים ושייטים</Text>
                    <Text style={s.skippersArrow}>{skippersOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {skippersOpen && (
                    <View style={s.skippersBody}>
                      <View style={[s.safetyBanner, safetyLevel(marine.waveHeight, marine.windSpeed)]}>
                        <Text style={s.safetyTxt}>{safetyMessage(marine.waveHeight, marine.windSpeed)}</Text>
                      </View>
                      <View style={s.skGrid}>
                        <SkCell icon="🌊" label="גובה גלים" val={marine.waveHeight != null ? `${marine.waveHeight.toFixed(1)} m` : '—'} />
                        <SkCell icon="🧭" label="כיוון גלים" val={marine.waveDirection != null ? degToCardinal(marine.waveDirection) : '—'} />
                        <SkCell icon="⏱️" label="פריוד גלים" val={marine.wavePeriod != null ? `${Math.round(marine.wavePeriod)} שנ׳` : '—'} />
                        <SkCell icon="💨" label="רוח" val={marine.windSpeed != null ? `${Math.round(marine.windSpeed * 1.944)} קשר` : '—'} />
                        <SkCell icon="🧭" label="כיוון רוח" val={marine.windDirection != null ? degToCardinal(marine.windDirection) : '—'} />
                        <SkCell icon="💢" label="מכות רוח" val={marine.gust != null ? `${Math.round(marine.gust * 1.944)} קשר` : '—'} />
                        <SkCell icon="👁️" label="ראות" val={marine.visibility != null ? `${marine.visibility.toFixed(1)} ק״מ` : '—'} />
                        <SkCell icon="📏" label="מפלס ים" val={marine.seaLevel != null ? `${marine.seaLevel.toFixed(2)} m` : '—'} />
                        <SkCell icon="🌡️" label="טמפ׳ מים" val={marine.waterTemp != null ? `${marine.waterTemp.toFixed(1)}°C` : '—'} />
                      </View>
                      <Text style={s.skippersNote}>נתונים מ-Stormglass · מתרענן כל שעה</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
        <CamerasModal visible={camerasOpen} onClose={() => setCamerasOpen(false)} bgColor={bgColor} />
      </LinearGradient>
    </Modal>
  );
}

function degToCardinal(deg: number): string {
  const dirs = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
  return dirs[Math.round(deg / 45) % 8] || '—';
}

function safetyLevel(wave?: number | null, wind?: number | null): { backgroundColor: string } {
  const w = wave ?? 0;
  const windKts = (wind ?? 0) * 1.944;
  if (w > 2 || windKts > 25) return { backgroundColor: '#DC2626' };
  if (w > 1 || windKts > 15) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#16A34A' };
}

function safetyMessage(wave?: number | null, wind?: number | null): string {
  const w = wave ?? 0;
  const windKts = (wind ?? 0) * 1.944;
  if (w > 2 || windKts > 25) return '⚠️ לא מומלץ — ים סוער';
  if (w > 1 || windKts > 15) return '⚠️ זהירות — תנאים בגבול';
  return '✅ תנאים טובים לשיט';
}

function SkCell({ icon, label, val }: { icon: string; label: string; val: string }) {
  return (
    <View style={skS.cell}>
      <Text style={skS.icon}>{icon}</Text>
      <Text style={skS.val}>{val}</Text>
      <Text style={skS.label}>{label}</Text>
    </View>
  );
}

const skS = StyleSheet.create({
  cell: { width: '33.333%', paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  icon: { fontSize: 22, marginBottom: 4 },
  val: { fontSize: 15, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '700', writingDirection: 'rtl', textAlign: 'center' },
});

function hourGradient(hour: number): [string, string] {
  // 5-8 dawn, 8-11 morning, 11-16 day, 16-18 afternoon, 18-20 sunset, 20-5 night
  if (hour >= 5 && hour < 8) return ['#FDE68A', '#F4A94E'];      // dawn: soft yellow→orange
  if (hour >= 8 && hour < 11) return ['#60A5FA', '#A7F3D0'];     // morning: sky blue→mint
  if (hour >= 11 && hour < 16) return ['#3DA5C4', '#7ECFC0'];    // day: teal bright
  if (hour >= 16 && hour < 18) return ['#F4A94E', '#EC4899'];    // afternoon: orange→pink
  if (hour >= 18 && hour < 20) return ['#7C3AED', '#EC4899'];    // sunset: purple→pink
  return ['#6B7280', '#111827'];                                  // night: gray→black
}

function weatherGradient(iconCode: string | undefined, batumiHourStr: string): [string, string, string] {
  const hour = parseInt((batumiHourStr || '12:00').split(':')[0], 10) || 12;
  const code = (iconCode || '').toLowerCase();
  const isNight = code.endsWith('n') || hour < 5 || hour >= 20;
  const isDawn = hour >= 5 && hour < 8;
  const isSunset = hour >= 17 && hour < 20;

  // Weather-dominant conditions
  if (code.startsWith('11')) return ['#1E1B4B', '#4C1D95', '#0F172A']; // thunder
  if (code.startsWith('13')) return ['#BFDBFE', '#E0F2FE', '#FFFFFF']; // snow
  if (code.startsWith('50')) return ['#94A3B8', '#64748B', '#475569']; // mist
  if (code.startsWith('09') || code.startsWith('10')) return isNight ? ['#0F172A', '#1E3A8A', '#475569'] : ['#475569', '#3B82F6', '#64748B']; // rain
  if (code.startsWith('03') || code.startsWith('04')) return isNight ? ['#1E293B', '#334155', '#475569'] : ['#475569', '#334155', '#1E293B']; // cloudy — deep slate

  // Clear/few clouds — color by time of day (darker anchors for readability)
  if (isDawn) return ['#D97706', '#BE185D', '#6D28D9'];       // dawn deep orange→pink→purple
  if (isSunset) return ['#C2410C', '#9D174D', '#5B21B6'];     // sunset burnt orange→plum
  if (isNight) return ['#6B7280', '#374151', '#000000'];      // night gray→black
  return ['#1A6B8A', '#0C4A6E', '#082F49'];                   // day deep teal→navy
}

function owmEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] || '🌤️';
}

function wmoEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code === 85 || code === 86) return '🌨️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '🌤️';
}

function wmoDesc(code: number): string {
  if (code === 0) return 'בהיר';
  if (code === 1) return 'בהיר בעיקר';
  if (code === 2) return 'מעונן חלקית';
  if (code === 3) return 'מעונן';
  if (code === 45 || code === 48) return 'ערפל';
  if (code >= 51 && code <= 57) return 'טפטוף';
  if (code >= 61 && code <= 65) return 'גשם';
  if (code === 66 || code === 67) return 'גשם קפוא';
  if (code >= 71 && code <= 75) return 'שלג';
  if (code === 77) return 'גרגרי שלג';
  if (code >= 80 && code <= 82) return 'ממטרים';
  if (code === 85 || code === 86) return 'ממטרי שלג';
  if (code === 95) return 'סופת רעמים';
  if (code === 96 || code === 99) return 'סופת רעמים עם ברד';
  return 'משתנה';
}

function wttrDesc(code: number): string {
  if (code === 113) return 'בהיר';
  if (code === 116) return 'מעונן חלקית';
  if (code === 119) return 'מעונן';
  if (code === 122) return 'מעונן';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return 'גשם';
  if ([200, 386, 389].includes(code)) return 'סופת רעמים';
  if ([227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377, 392, 395].includes(code)) return 'שלג';
  if ([143, 248, 260].includes(code)) return 'ערפל';
  return 'משתנה';
}

function wttrEmoji(code: number): string {
  if (code === 113) return '☀️';
  if (code === 116) return '⛅';
  if (code === 119 || code === 122) return '☁️';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return '🌧️';
  if ([200, 386, 389].includes(code)) return '⛈️';
  if ([227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377, 392, 395].includes(code)) return '🌨️';
  if ([143, 248, 260].includes(code)) return '🌫️';
  return '🌤️';
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeX: { fontSize: 18, color: Colors.WHITE, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  camBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  camBannerIcon: { fontSize: 20 },
  camBannerTxt: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  camBannerArrow: { fontSize: 22, color: '#fff', opacity: 0.7 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl', flex: 1, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  liveHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 4 },
  liveBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  batumiClock: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  updatedTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center', marginBottom: 18, writingDirection: 'rtl' },
  audioWrap: { marginBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  hourlyScroll: { flexDirection: 'row-reverse', gap: 10, paddingVertical: 8, paddingHorizontal: 2, marginBottom: 20 },
  hourCell: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', minWidth: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  hourCellNow: { borderWidth: 2, borderColor: '#F4A94E', paddingTop: 8 },
  nowBadge: { position: 'absolute', top: -9, backgroundColor: '#F4A94E', color: '#1C2B35', fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  hourArrowFloat: { position: 'absolute', top: -18, right: 88, color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '900', zIndex: 2, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  hourTime: { fontSize: 12, color: '#fff', fontWeight: '800', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  hourIcon: { fontSize: 24, marginBottom: 2 },
  hourTemp: { fontSize: 16, color: '#fff', fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  hourPop: { fontSize: 10, color: '#DBEAFE', fontWeight: '800', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  currentCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 18, marginBottom: 18 },
  currentIcon: { fontSize: 56 },
  currentTemp: { fontSize: 52, fontWeight: '900', color: Colors.WHITE, marginLeft: 12, lineHeight: 60, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6 },
  currentDesc: { fontSize: 16, color: Colors.WHITE, textTransform: 'capitalize', flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8, width: '100%', paddingHorizontal: 2 },
  detailItem: { alignItems: 'center', flex: 1, paddingVertical: 2 },
  detailIcon: { fontSize: 22, marginBottom: 6 },
  detailVal: { fontSize: 20, fontWeight: '900', color: Colors.WHITE, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  detailLabel: { fontSize: 11, color: Colors.WHITE, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl', lineHeight: 14, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  divider: { width: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.35)' },

  weekTitle: { fontSize: 20, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  dayRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  dayNameCol: { alignItems: 'flex-end', minWidth: 70 },
  dayName: { fontSize: 14, fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  dayDate: { fontSize: 11, color: 'rgba(255,255,255,0.85)', textAlign: 'right', fontWeight: '700', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  dayIcon: { fontSize: 24 },
  dayDesc: { flex: 1, fontSize: 13, color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl', flexShrink: 1, minWidth: 80, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  dayTemps: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dayHigh: { fontSize: 17, fontWeight: '900', color: Colors.WHITE, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  dayLow: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },

  skippersWrap: { marginTop: 24, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  skippersHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  skippersIcon: { fontSize: 24 },
  skippersTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#fff', writingDirection: 'rtl', textAlign: 'right', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  skippersArrow: { fontSize: 12, color: '#fff', fontWeight: '900' },
  skippersBody: { paddingHorizontal: 12, paddingBottom: 14, paddingTop: 4 },
  safetyBanner: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  safetyTxt: { fontSize: 15, fontWeight: '900', color: '#fff', writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  skGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  skippersNote: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 10, textAlign: 'center', writingDirection: 'rtl' },
});
