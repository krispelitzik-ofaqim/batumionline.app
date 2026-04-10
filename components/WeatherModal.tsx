import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const OWM_KEY = ''; // Add your OpenWeatherMap API key here
const BATUMI_ID = 614553;

type CurrentWeather = {
  temp: number; feels: number; humidity: number; wind: number;
  desc: string; icon: string;
};
type DayForecast = { day: string; high: number; low: number; icon: string; desc: string };

export default function WeatherModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    if (OWM_KEY) {
      fetchOpenWeatherMap();
    } else {
      fetchWttrFallback();
    }
  }, [visible]);

  const fetchOpenWeatherMap = async () => {
    try {
      // Current weather
      const curRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${BATUMI_ID}&units=metric&lang=he&appid=${OWM_KEY}`);
      const curData = await curRes.json();

      setCurrent({
        temp: Math.round(curData.main.temp),
        feels: Math.round(curData.main.feels_like),
        humidity: curData.main.humidity,
        wind: Math.round(curData.wind.speed * 3.6), // m/s to km/h
        desc: curData.weather?.[0]?.description || '',
        icon: owmEmoji(curData.weather?.[0]?.icon || ''),
      });

      // 7-day forecast
      const foreRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${BATUMI_ID}&units=metric&lang=he&appid=${OWM_KEY}`);
      const foreData = await foreRes.json();

      // Group by day and extract high/low
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
          high: Math.round(data.high),
          low: Math.round(data.low),
          icon: data.icon,
          desc: data.desc,
        };
      });

      setForecast(days);
      setLoading(false);
    } catch {
      fetchWttrFallback();
    }
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
          desc: cur.lang_he?.[0]?.value || cur.weatherDesc?.[0]?.value || '',
          icon: wttrEmoji(Number(cur.weatherCode)),
        });
      }

      const days: DayForecast[] = (data.weather || []).slice(0, 7).map((d: any) => {
        const date = new Date(d.date);
        return {
          day: DAYS_HE[date.getDay()],
          high: Number(d.maxtempC),
          low: Number(d.mintempC),
          icon: wttrEmoji(Number(d.hourly?.[4]?.weatherCode || 0)),
          desc: d.hourly?.[4]?.lang_he?.[0]?.value || d.hourly?.[4]?.weatherDesc?.[0]?.value || '',
        };
      });

      setForecast(days);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>��</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>מזג האוויר בבטומי</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Today's weather — large display */}
              {current && (
                <View style={s.currentCard}>
                  <Text style={s.currentIcon}>{current.icon}</Text>
                  <Text style={s.currentTemp}>{current.temp}°</Text>
                  <Text style={s.currentDesc}>{current.desc}</Text>
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
                </View>
              )}

              {/* 7-day weekly forecast */}
              <Text style={s.weekTitle}>תחזית שבועית</Text>
              {forecast.map((day, i) => (
                <View key={i} style={s.dayRow}>
                  <Text style={s.dayName}>{i === 0 ? 'היו��' : day.day}</Text>
                  <Text style={s.dayIcon}>{day.icon}</Text>
                  <Text style={s.dayDesc}>{day.desc}</Text>
                  <View style={s.dayTemps}>
                    <Text style={s.dayHigh}>{day.high}°</Text>
                    <Text style={s.dayLow}>{day.low}°</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function owmEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧���',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] || '🌤️';
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
  title: { fontSize: 28, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', marginBottom: 24, writingDirection: 'rtl' },

  currentCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 28 },
  currentIcon: { fontSize: 72 },
  currentTemp: { fontSize: 64, fontWeight: '900', color: Colors.WHITE, marginTop: 4 },
  currentDesc: { fontSize: 20, color: Colors.WHITE, opacity: 0.9, marginTop: 4, textTransform: 'capitalize' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 0 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailIcon: { fontSize: 20, marginBottom: 4 },
  detailVal: { fontSize: 22, fontWeight: '800', color: Colors.WHITE },
  detailLabel: { fontSize: 12, color: Colors.WHITE, opacity: 0.6, marginTop: 2, writingDirection: 'rtl' },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  weekTitle: { fontSize: 20, fontWeight: '800', color: Colors.WHITE, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' },
  dayRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  dayName: { width: 50, fontSize: 15, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  dayIcon: { fontSize: 26 },
  dayDesc: { flex: 1, fontSize: 13, color: Colors.WHITE, opacity: 0.8, textAlign: 'right', writingDirection: 'rtl' },
  dayTemps: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dayHigh: { fontSize: 17, fontWeight: '800', color: Colors.WHITE },
  dayLow: { fontSize: 15, color: Colors.WHITE, opacity: 0.4 },
});
