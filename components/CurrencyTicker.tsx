import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type Rates = { ILS: number; GEL: number; USD: number; EUR: number };

export default function CurrencyTicker() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setRates({ ILS: data.rates.ILS, GEL: data.rates.GEL, USD: 1, EUR: data.rates.EUR });
          setUpdatedAt(new Date());
        }
      })
      .catch(() => {});
  }, []);

  if (!rates) return null;

  const dd = updatedAt ? updatedAt.getDate().toString().padStart(2, '0') : '00';
  const mm = updatedAt ? (updatedAt.getMonth() + 1).toString().padStart(2, '0') : '00';
  const yyyy = updatedAt ? updatedAt.getFullYear() : '0000';
  const hh = updatedAt ? updatedAt.getHours().toString().padStart(2, '0') : '00';
  const mi = updatedAt ? updatedAt.getMinutes().toString().padStart(2, '0') : '00';

  const items = [
    { label: 'USD → GEL', value: rates.GEL.toFixed(3), flag: '🇺🇸' },
    { label: 'USD → ILS', value: rates.ILS.toFixed(3), flag: '🇮🇱' },
    { label: 'EUR → GEL', value: (rates.GEL / rates.EUR).toFixed(3), flag: '🇪🇺' },
    { label: 'ILS → GEL', value: (rates.GEL / rates.ILS).toFixed(3), flag: '🇮🇱' },
  ];

  return (
    <View style={s.wrap}>
      <Text style={s.header}>שערי מטבעות חיים</Text>
      <Text style={s.updated}>מעודכן ליום {dd}/{mm}/{yyyy} שעה {hh}:{mi}</Text>
      <View style={s.row}>
        {items.map((it, i) => (
          <View key={i} style={s.card}>
            <Text style={s.flag}>{it.flag}</Text>
            <Text style={s.value}>{it.value}</Text>
            <Text style={s.label}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 20, paddingHorizontal: 16 },
  header: { fontSize: 14, fontWeight: '700', color: '#888', textAlign: 'right', writingDirection: 'rtl' },
  updated: { fontSize: 11, color: '#aaa', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, marginTop: 2 },
  row: { flexDirection: 'row-reverse', gap: 8 },
  card: { flex: 1, backgroundColor: Colors.WHITE, borderRadius: 12, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  flag: { fontSize: 18 },
  value: { fontSize: 14, fontWeight: '900', color: Colors.PRIMARY, marginTop: 2 },
  label: { fontSize: 9, color: '#888', marginTop: 2 },
});
