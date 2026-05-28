import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { fetchContent, API_BASE } from '../constants/api';

type Point = { year: string; value: number };

function GdpBars({ ge: geAll, il: ilAll }: { ge: Point[]; il: Point[] }) {
  if (geAll.length === 0 || ilAll.length === 0) return null;
  const ge = geAll.slice(-4);
  const il = ilAll.slice(-4);
  const W = 300;
  const H = 160;
  const padT = 10;
  const padB = 40;
  const padL = 8;
  const padR = 8;
  const years = ge.map(g => g.year);
  const maxVal = Math.max(...ge.map(g => g.value), ...il.map(i => i.value));
  const innerH = H - padT - padB;
  const innerW = W - padL - padR;
  const groupW = innerW / years.length;
  const barW = (groupW - 8) / 2;
  const GE = '#8b5cf6', IL = '#0ea5e9';

  if (Platform.OS !== 'web') {
    return (
      <View style={{ paddingVertical: 8, paddingHorizontal: 4, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, justifyContent: 'space-around' }}>
          {years.slice(-4).map((year, i) => {
            const idx = years.length - 4 + i;
            if (idx < 0) return null;
            const vge = ge[idx]?.value || 0;
            const vil = il[idx]?.value || 0;
            const hge = Math.max(8, (vge / maxVal) * 80);
            const hil = Math.max(8, (vil / maxVal) * 80);
            return (
              <View key={i} style={{ alignItems: 'center', minWidth: 50 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  <View style={{ width: 10, height: hil, backgroundColor: IL, borderRadius: 2 }} />
                  <View style={{ width: 10, height: hge, backgroundColor: GE, borderRadius: 2 }} />
                </View>
                <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{year}</Text>
                <Text style={{ fontSize: 6, color: GE, fontWeight: '700' }}>🇬🇪 {(vge / 1000).toFixed(1)}K</Text>
                <Text style={{ fontSize: 6, color: IL, fontWeight: '700' }}>🇮🇱 {(vil / 1000).toFixed(1)}K</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
  return React.createElement('div', { style: { width: '100%' } },
    React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 6, justifyContent: 'flex-end' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: { display: 'inline-block', width: 10, height: 10, background: GE, borderRadius: 2 } }),
        React.createElement('span', { style: { fontSize: 10, color: '#475569' } }, '🇬🇪 גאורגיה')
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: { display: 'inline-block', width: 10, height: 10, background: IL, borderRadius: 2 } }),
        React.createElement('span', { style: { fontSize: 10, color: '#475569' } }, '🇮🇱 ישראל')
      ),
    ),
    React.createElement('svg', { width: W, height: H },
      ...years.flatMap((year, i) => {
        const x0 = padL + i * groupW + 4;
        const vge = ge[i]?.value || 0;
        const vil = il[i]?.value || 0;
        const hge = (vge / maxVal) * innerH;
        const hil = (vil / maxVal) * innerH;
        return [
          // Georgia bar (right in RTL display, left in SVG since SVG is LTR)
          React.createElement('rect', { key: `ge-${i}`, x: x0, y: padT + innerH - hge, width: barW, height: hge, fill: GE, rx: 2 }),
          React.createElement('text', { key: `geL-${i}`, x: x0 + barW / 2, y: padT + innerH - hge - 3, fontSize: 6, fill: GE, fontWeight: '700', textAnchor: 'middle' }, `${(vge / 1000).toFixed(1)}K`),
          // Israel bar
          React.createElement('rect', { key: `il-${i}`, x: x0 + barW + 2, y: padT + innerH - hil, width: barW, height: hil, fill: IL, rx: 2 }),
          React.createElement('text', { key: `ilL-${i}`, x: x0 + barW + 2 + barW / 2, y: padT + innerH - hil - 3, fontSize: 6, fill: IL, fontWeight: '700', textAnchor: 'middle' }, `${(vil / 1000).toFixed(1)}K`),
          // Year label
          React.createElement('text', { key: `y-${i}`, x: padL + i * groupW + groupW / 2, y: H - padB + 14, fontSize: 9, fill: '#64748b', textAnchor: 'middle' }, year),
        ];
      })
    )
  );
}

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
    const chartH = 110;
    const chartPadT = 14;
    const chartPadB = 22;
    const innerChartH = chartH - chartPadT - chartPadB;
    const last = data.slice(-4);
    const lmin = Math.min(...last.map(d => d.value));
    const lmax = Math.max(...last.map(d => d.value));
    const lrange = lmax - lmin || 1;
    return (
      <View style={{ paddingVertical: 8, paddingHorizontal: 8, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <View style={{ height: chartH, position: 'relative' }}>
          {[0, 0.5, 1].map((p, i) => (
            <View key={`grid-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: chartPadT + p * innerChartH, height: 1, backgroundColor: '#e2e8f0' }} />
          ))}
          {last.map((p, i) => {
            const xPct = i / Math.max(1, last.length - 1);
            const yPx = chartPadT + innerChartH - ((p.value - lmin) / lrange) * innerChartH;
            const next = last[i + 1];
            let line = null;
            if (next) {
              const xPctNext = (i + 1) / Math.max(1, last.length - 1);
              const yPxNext = chartPadT + innerChartH - ((next.value - lmin) / lrange) * innerChartH;
              const dxPct = xPctNext - xPct;
              const dyPx = yPxNext - yPx;
              const lengthPct = dxPct;
              const angle = Math.atan2(dyPx, dxPct * 280) * 180 / Math.PI;
              line = (
                <View key={`ln-${i}`} style={{ position: 'absolute', left: `${xPct * 100}%`, top: yPx, width: `${lengthPct * 100}%`, height: 2, backgroundColor: color, transformOrigin: '0 50%', transform: [{ rotate: `${angle}deg` }] as any }} />
              );
            }
            return (
              <React.Fragment key={`pt-${i}`}>
                {line}
                <View style={{ position: 'absolute', left: `${xPct * 100}%`, top: yPx - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginLeft: -4 }} />
                <Text style={{ position: 'absolute', left: `${xPct * 100}%`, top: yPx - 16, fontSize: 5, color, fontWeight: '700', marginLeft: -14, width: 28, textAlign: 'center' }}>{p.value.toFixed(1)}</Text>
                <Text style={{ position: 'absolute', left: `${xPct * 100}%`, top: chartH - 12, fontSize: 5, color: '#64748b', marginLeft: -14, width: 28, textAlign: 'center' }}>{p.year}</Text>
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
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
    // Rate of change % labels (between consecutive points)
    ...pts.map((p, i) => {
      if (i === 0) return null;
      const prev = pts[i - 1];
      if (!prev || prev.value === 0) return null;
      const pct = ((p.value - prev.value) / Math.abs(prev.value)) * 100;
      const up = pct >= 0;
      const midX = (p.x + prev.x) / 2;
      const midY = Math.min(p.y, prev.y) - 14;
      return React.createElement('text', { key: `pc-${i}`, x: midX, y: midY, fontSize: 8, fill: up ? '#16a34a' : '#dc2626', fontWeight: '800', textAnchor: 'middle' }, `${up ? '+' : ''}${pct.toFixed(1)}%`);
    }).filter(Boolean),
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

export default function FinanceStats({ cardBg, channel = 'money' }: { cardBg?: string; channel?: 'money' | 'realEstate' | 'tourism' } = {}) {
  const [inflation, setInflation] = useState<Point[]>([]);
  const [mortgageRate, setMortgageRate] = useState<number | null>(null);
  const [mortgageHistory, setMortgageHistory] = useState<Point[]>([]);
  const [gdpHistory, setGdpHistory] = useState<Point[]>([]);
  const [gdpCurrent, setGdpCurrent] = useState<number | null>(null);
  const [unemployment, setUnemployment] = useState<Point[]>([]);
  const [unemploymentCurrent, setUnemploymentCurrent] = useState<number | null>(null);
  const [gdpCapita, setGdpCapita] = useState<Point[]>([]);
  const [gdpCapitaCurrent, setGdpCapitaCurrent] = useState<number | null>(null);
  const [gdpCapitaIL, setGdpCapitaIL] = useState<Point[]>([]);
  const [adjaraConstruction, setAdjaraConstruction] = useState<Point[]>([]);
  const [touristArrivals, setTouristArrivals] = useState<Point[]>([]);
  const [touristReceipts, setTouristReceipts] = useState<Point[]>([]);
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

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/SL.UEM.TOTL.ZS?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-4).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(2)) }));
        setUnemployment(pts);
        if (pts.length > 0) setUnemploymentCurrent(pts[pts.length - 1].value);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/NY.GDP.PCAP.CD?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-6).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(0)) }));
        setGdpCapita(pts);
        if (pts.length > 0) setGdpCapitaCurrent(pts[pts.length - 1].value);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/IL/indicator/NY.GDP.PCAP.CD?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null).reverse();
        const pts: Point[] = rows.slice(-6).map((x: any) => ({ year: x.date, value: Number(x.value.toFixed(0)) }));
        setGdpCapitaIL(pts);
      } catch {}

      try {
        const r = await fetch(`${API_BASE}/api/geostat/construction-adjara`);
        const j = await r.json();
        const pts: Point[] = (j.series || []).slice(-8).map((p: any) => ({ year: String(p.year), value: Number(p.value.toFixed(0)) }));
        setAdjaraConstruction(pts);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/ST.INT.ARVL?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null)
          .sort((a: any, b: any) => parseInt(a.date) - parseInt(b.date));
        const pts: Point[] = rows.slice(-6).map((x: any) => ({ year: x.date, value: Math.round(Number(x.value) / 1000) }));
        setTouristArrivals(pts);
      } catch {}

      try {
        const r = await fetch('https://api.worldbank.org/v2/country/GE/indicator/ST.INT.RCPT.CD?format=json&per_page=12');
        const j = await r.json();
        const rows = (j[1] || []).filter((x: any) => x.value !== null)
          .sort((a: any, b: any) => parseInt(a.date) - parseInt(b.date));
        const pts: Point[] = rows.slice(-6).map((x: any) => ({ year: x.date, value: Math.round(Number(x.value) / 1e6) }));
        setTouristReceipts(pts);
      } catch {}

      setUpdatedAt(fmtDate(new Date()));

      try {
        const d: any = await fetchContent();
        if (d.financeStats) setManual(d.financeStats);
        const money = Array.isArray(d.financeStatsCustom) ? d.financeStatsCustom.map((r: any) => ({ ...r, channel: r.channel || 'money' })) : [];
        const re = Array.isArray(d.realestateStatsCustom) ? d.realestateStatsCustom.map((r: any) => ({ ...r, channel: 'realEstate' })) : [];
        const tr = Array.isArray(d.tourismStatsCustom) ? d.tourismStatsCustom.map((r: any) => ({ ...r, channel: 'tourism' })) : [];
        setCustomIndicators([...money, ...re, ...tr]);
      } catch {}
    })();
  }, []);

  const [customIndicators, setCustomIndicators] = useState<Array<{ id: string; label: string; unit: string; values: Record<string, string> }>>([]);

  const lastInflation = inflation.length > 0 ? inflation[inflation.length - 1] : null;

  const moneyCards = [
    { key: 'inflation', label: 'אינפלציה שנתית בגאורגיה', value: manual?.inflation?.current != null ? manual.inflation.current : (lastInflation ? lastInflation.value : null), data: inflation, color: '#dc2626', date: manual?.inflation?.date },
    { key: 'lendingRate', label: 'ריבית הלוואות ממוצעת', value: manual?.lendingRate?.current != null ? manual.lendingRate.current : mortgageRate, data: mortgageHistory, color: '#1A6B8A', date: manual?.lendingRate?.date },
    { key: 'gdp', label: 'צמיחת התמ"ג השנתית', value: manual?.gdp?.current != null ? manual.gdp.current : gdpCurrent, data: gdpHistory, color: '#10b981', date: manual?.gdp?.date },
    { key: 'unemployment', label: 'אבטלה', value: unemploymentCurrent, data: unemployment, color: '#f59e0b', date: null },
    { key: 'gdpCapita', label: 'תמ"ג לנפש ($)', value: gdpCapitaCurrent, data: gdpCapita, color: '#8b5cf6', date: null, unit: '$' },
  ];

  const realEstateCards = [
    { key: 'adjaraConstruction', label: 'מחזור בנייה באג׳ריה (בטומי)', value: adjaraConstruction.length > 0 ? adjaraConstruction[adjaraConstruction.length - 1].value : null, data: adjaraConstruction, color: '#059669', date: null, unit: 'M USD' },
  ];

  const tourismCards: any[] = [
    { key: 'touristArrivals', label: 'כניסות תיירים לגאורגיה (אלפים)', value: touristArrivals.length > 0 ? touristArrivals[touristArrivals.length - 1].value : null, data: touristArrivals, color: '#ea580c', date: null, unit: 'K' },
    { key: 'touristReceipts', label: 'הכנסות מתיירות (מיליון $)', value: touristReceipts.length > 0 ? touristReceipts[touristReceipts.length - 1].value : null, data: touristReceipts, color: '#d97706', date: null, unit: 'M USD' },
  ];

  const customCardsForChannel = customIndicators
    .filter((ci: any) => ci.label && (ci.channel || 'money') === channel && (
      (Array.isArray(ci.tableRows) && ci.tableRows.some((tr: any) => tr.category || tr.value || tr.year || (tr.cells && Object.values(tr.cells).some((v: any) => v))))
      || Object.values(ci.values || {}).some((v: any) => v !== '')
    ))
    .map((ci: any, i: number) => {
      const palette = ['#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'];
      const color = palette[i % palette.length];
      if (Array.isArray(ci.tableRows) && ci.tableRows.length > 0) {
        const filled = ci.tableRows.filter((tr: any) => tr.category || tr.value || (tr.cells && Object.values(tr.cells).some((v: any) => v)));
        // Auto-detect: if single category (or no category) and all have years => line
        const uniqueCats = new Set(filled.map((tr: any) => (tr.category || '').trim()).filter((c: string) => c));
        const allHaveYears = filled.every((tr: any) => tr.year && !isNaN(parseInt(tr.year)));
        if (allHaveYears && uniqueCats.size <= 1 && filled.length >= 2) {
          const series: Point[] = filled
            .map((tr: any) => ({ year: String(parseInt(tr.year)), value: parseFloat(tr.value) }))
            .filter((p: Point) => !isNaN(p.value))
            .sort((a: Point, b: Point) => parseInt(a.year) - parseInt(b.year));
          const last = series.length > 0 ? series[series.length - 1].value : null;
          return { key: ci.id, label: ci.label, value: last, data: series, color, date: null, unit: ci.unit };
        }
        return { key: ci.id, label: ci.label, value: null, data: [] as Point[], color, date: null, unit: ci.unit, tableRows: filled, columns: ci.columns, sources: ci.sources, notes: ci.notes };
      }
      const series: Point[] = Object.entries(ci.values || {})
        .map(([y, v]) => ({ year: String(parseInt(y, 10)), value: parseFloat(v as string) }))
        .filter(s => !isNaN(parseInt(s.year)) && !isNaN(s.value))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
      const last = series.length > 0 ? series[series.length - 1].value : null;
      return { key: ci.id, label: ci.label, value: last, data: series, color, date: null, unit: ci.unit };
    });

  const autoCards = channel === 'realEstate' ? realEstateCards : channel === 'tourism' ? tourismCards : moneyCards;
  const cards: any[] = [...autoCards, ...customCardsForChannel];

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
          <View key={c.key} style={[s.card, { width: SLIDE_W }, cardBg ? { backgroundColor: cardBg } : null]}>
            <View style={s.row}>
              <Text style={s.label}>{c.label}</Text>
              {c.value != null && c.key !== 'gdpCapita' && <Text style={s.value}>{(() => {
                const u = (c as any).unit;
                if (u === '$') return `$${Number(c.value).toLocaleString()}`;
                if (u === 'M GEL') return `${Number(c.value).toLocaleString()} M₾`;
                if (u === 'M USD') return `$${Number(c.value).toLocaleString()}M`;
                if (u === 'K') return `${Number(c.value).toLocaleString()}K`;
                if (u && u !== '%') return `${c.value} ${u}`;
                return `${c.value}%`;
              })()}</Text>}
            </View>
            {c.key === 'gdpCapita' ? (
              <GdpBars ge={gdpCapita} il={gdpCapitaIL} />
            ) : (c as any).tableRows ? (() => {
              const defCols = [
                { id: 'c_year', name: 'שנה' },
                { id: 'c_type', name: 'סוג' },
                { id: 'c_val', name: 'ערך' },
              ];
              const cols = (c as any).columns && (c as any).columns.length > 0 ? (c as any).columns : defCols;
              const cellFor = (tr: any, colId: string) => {
                if (tr.cells && tr.cells[colId] !== undefined) return tr.cells[colId];
                if (colId === 'c_year') return tr.year || '';
                if (colId === 'c_type') return tr.category || '';
                if (colId === 'c_val') return tr.value || '';
                return '';
              };
              const filled = (c as any).tableRows.filter((tr: any) => {
                if (tr.cells && Object.values(tr.cells).some((v: any) => v)) return true;
                return tr.category || tr.value || tr.year;
              }).slice(-4);
              return (
                <View style={{ gap: 4, paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row-reverse', paddingHorizontal: 10, paddingVertical: 4, gap: 8 }}>
                    {cols.map((col: any) => (
                      <Text key={col.id} numberOfLines={2} adjustsFontSizeToFit style={{ flex: 1, fontSize: 8, fontWeight: '800', color: '#1A6B8A', textAlign: 'center', writingDirection: 'rtl' }}>{col.name}</Text>
                    ))}
                  </View>
                  {filled.map((tr: any) => (
                    <View key={tr.id} style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8, gap: 8 }}>
                      {cols.map((col: any, ci: number) => {
                        const v = cellFor(tr, col.id);
                        const isValue = ci === cols.length - 1;
                        const unit = (c as any).unit;
                        const suffix = isValue && v && unit ? (unit === '%' ? '%' : ` ${unit}`) : '';
                        return (
                          <Text key={col.id} numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, fontSize: 8, color: '#1C2B35', fontWeight: '500', textAlign: 'center', writingDirection: 'rtl' }}>{v}{suffix}</Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })() : (
              <Sparkline data={c.data} color={c.color} unit={(c as any).unit || '%'} />
            )}
            {((c as any).sources || (c as any).notes) && (
              <View style={{ marginTop: 6, gap: 2 }}>
                {(c as any).sources ? <Text style={{ fontSize: 10, color: '#64748b', writingDirection: 'rtl', textAlign: 'right' }}>מקור: {(c as any).sources}</Text> : null}
                {(c as any).notes ? <Text style={{ fontSize: 10, color: '#64748b', writingDirection: 'rtl', textAlign: 'right' }}>{(c as any).notes}</Text> : null}
              </View>
            )}
            <View style={s.footer}>
              <Text style={s.footerTxt}>{(c as any).tableRows ? `${((c as any).tableRows as any[]).filter((tr:any) => tr.category || tr.value).length} פריטים` : (c.data.length > 0 ? `${c.data[0].year}–${c.data[c.data.length - 1].year}` : 'טוען…')}</Text>
              <Text style={s.footerTxt}>{c.date ? `עודכן ידנית: ${c.date}` : `עודכן: ${updatedAt}`}</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 }}>
              <TouchableOpacity onPress={() => goTo(idx - 1)} disabled={idx === 0} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[s.arrowTxt, idx === 0 && { opacity: 0.3 }]}>›</Text>
              </TouchableOpacity>
              <View style={[s.dots, { marginTop: 0, paddingHorizontal: 0 }]}>
                {cards.map((_, i) => (
                  <View key={i} style={[s.dot, i === idx && s.dotActive]} />
                ))}
              </View>
              <TouchableOpacity onPress={() => goTo(idx + 1)} disabled={idx === cards.length - 1} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[s.arrowTxt, idx === cards.length - 1 && { opacity: 0.3 }]}>‹</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { borderRadius: 20, borderWidth: 1.5, padding: 10, overflow: 'hidden' },
  channel: { borderRadius: 14, padding: 4, overflow: 'hidden' },
  channelTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  empty: { fontSize: 12, color: '#64748b', writingDirection: 'rtl', textAlign: 'center', paddingVertical: 14 },
  tabsRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 10, paddingHorizontal: 2 },
  tab: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  tabTxt: { fontSize: 12, fontWeight: '700', color: '#64748b', writingDirection: 'rtl', textAlign: 'center' },
  card: { backgroundColor: Colors.WHITE, borderRadius: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  value: { fontSize: 11, fontWeight: '900', color: Colors.PRIMARY },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 },
  footerTxt: { fontSize: 10, color: '#94a3b8', writingDirection: 'rtl' },
  arrow: { position: 'absolute', bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  arrowTxt: { fontSize: 22, color: '#fff', fontWeight: '300', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6, paddingHorizontal: 50 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 16 },
});
