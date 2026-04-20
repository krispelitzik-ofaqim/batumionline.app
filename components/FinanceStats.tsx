import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type Point = { year: string; value: number };

function Sparkline({ data, color, unit }: { data: Point[]; color: string; unit: string }) {
  if (data.length === 0) return null;
  const W = 300;
  const H = 120;
  const padL = 38;
  const padR = 20;
  const padT = 14;
  const padB = 24;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = innerW / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => {
    const x = padL + i * stepX;
    const y = padT + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

  const yTicks = [max, (max + min) / 2, min];

  if (Platform.OS !== 'web') {
    return <View style={{ height: H, backgroundColor: '#f1f5f9', borderRadius: 6 }} />;
  }
  return React.createElement('svg', {
    width: W, height: H, style: { display: 'block' },
  },
    // Y axis labels + grid lines
    ...yTicks.map((v, i) => {
      const y = padT + (i / 2) * innerH;
      return [
        React.createElement('line', { key: `gl-${i}`, x1: padL, y1: y, x2: W - padR, y2: y, stroke: '#e2e8f0', strokeWidth: 1 }),
        React.createElement('text', { key: `yl-${i}`, x: padL - 4, y: y + 3, fontSize: 9, fill: '#94a3b8', textAnchor: 'end' }, `${v.toFixed(1)}${unit}`),
      ];
    }).flat(),
    // X axis labels - all years
    ...pts.map((p, i) => React.createElement('text', { key: `xl-${i}`, x: p.x, y: H - 6, fontSize: 9, fill: '#64748b', textAnchor: 'middle' }, p.year)),
    // Value labels above points
    ...pts.map((p, i) => React.createElement('text', { key: `vl-${i}`, x: p.x, y: p.y - 6, fontSize: 9, fill: color, fontWeight: '700', textAnchor: 'middle' }, `${p.value}`)),
    React.createElement('path', { d: path, stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    ...pts.map((p, i) => React.createElement('circle', { key: `pt-${i}`, cx: p.x, cy: p.y, r: 2.5, fill: color })),
  );
}

function fmtDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mn}`;
}

export default function FinanceStats() {
  const [inflation, setInflation] = useState<Point[]>([]);
  const [mortgageRate, setMortgageRate] = useState<number | null>(null);
  const [mortgageHistory, setMortgageHistory] = useState<Point[]>([]);
  const [gdpHistory, setGdpHistory] = useState<Point[]>([]);
  const [gdpCurrent, setGdpCurrent] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [manual, setManual] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/FP.CPI.TOTL.ZG?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-4).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(2)) }));
        setInflation(pts);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/FR.INR.LEND?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-4).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(2)) }));
        setMortgageHistory(pts);
        if (pts.length > 0) setMortgageRate(pts[pts.length - 1].value);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-4).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(2)) }));
        setGdpHistory(pts);
        if (pts.length > 0) setGdpCurrent(pts[pts.length - 1].value);
      } catch {}

      setUpdatedAt(fmtDate(new Date()));

      try {
        const d: any = await fetchContent();
        if (d.financeStats) setManual(d.financeStats);
      } catch {}
    })();
  }, []);

  const lastInflation = inflation.length > 0 ? inflation[inflation.length - 1] : null;

  const cards = [
    {
      key: 'inflation',
      label: 'אינפלציה שנתית בגאורגיה',
      value: manual?.inflation?.current != null ? manual.inflation.current : (lastInflation ? lastInflation.value : null),
      data: inflation,
      color: '#dc2626',
      date: manual?.inflation?.date,
    },
    {
      key: 'lendingRate',
      label: 'ריבית הלוואות ממוצעת',
      value: manual?.lendingRate?.current != null ? manual.lendingRate.current : mortgageRate,
      data: mortgageHistory,
      color: '#1A6B8A',
      date: manual?.lendingRate?.date,
    },
    {
      key: 'gdp',
      label: 'צמיחת התמ"ג השנתית',
      value: manual?.gdp?.current != null ? manual.gdp.current : gdpCurrent,
      data: gdpHistory,
      color: '#10b981',
      date: manual?.gdp?.date,
    },
  ];

  const { width } = useWindowDimensions();
  const SLIDE_W = Math.min(width - 32, 340);
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(cards.length - 1, i));
    setIdx(next);
    scrollRef.current?.scrollTo({ x: next * SLIDE_W, animated: true });
  };

  return (
    <View style={{ width: SLIDE_W, alignSelf: 'center', overflow: 'hidden', position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_W}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))}
      >
        {cards.map(c => (
          <View key={c.key} style={[s.card, { width: SLIDE_W }]}>
            <View style={s.row}>
              <Text style={s.label}>{c.label}</Text>
              {c.value != null && <Text style={s.value}>{c.value}%</Text>}
            </View>
            <Sparkline data={c.data} color={c.color} unit="%" />
            <View style={s.footer}>
              <Text style={s.footerTxt}>{c.data.length > 0 ? `${c.data[0].year}–${c.data[c.data.length - 1].year}` : 'טוען…'}</Text>
              <Text style={s.footerTxt}>{c.date ? `עודכן ידנית: ${c.date}` : `עודכן: ${updatedAt}`}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[s.arrow, { right: 8 }]} onPress={() => goTo(idx - 1)} disabled={idx === 0}>
        <Text style={[s.arrowTxt, idx === 0 && { opacity: 0.3 }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.arrow, { left: 8 }]} onPress={() => goTo(idx + 1)} disabled={idx === cards.length - 1}>
        <Text style={[s.arrowTxt, idx === cards.length - 1 && { opacity: 0.3 }]}>‹</Text>
      </TouchableOpacity>
      <View style={s.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[s.dot, i === idx && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.WHITE, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  value: { fontSize: 22, fontWeight: '900', color: Colors.PRIMARY },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 },
  footerTxt: { fontSize: 10, color: '#94a3b8', writingDirection: 'rtl' },
  arrow: { position: 'absolute', top: '40%', marginTop: -18, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  arrowTxt: { fontSize: 22, color: '#fff', fontWeight: '300', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 16 },
});
