import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

type Rates = { ILS: number; GEL: number; USD: number; EUR: number };

const FLAGS: Record<string, string> = { ILS: '🇮🇱', GEL: '🇬🇪', USD: '🇺🇸', EUR: '🇪🇺' };
const NAMES: Record<string, string> = { ILS: 'שקל', GEL: 'לארי', USD: 'דולר', EUR: 'יורו' };

export default function CurrencyModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState<keyof Rates>('ILS');
  const [lastUpdate, setLastUpdate] = useState('');

  const loadRates = () => {
    setLoading(true);
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setRates({ ILS: data.rates.ILS, GEL: data.rates.GEL, USD: 1, EUR: data.rates.EUR });
        }
        const src = data.time_last_update_utc || data.time_last_update_unix;
        if (src) {
          const d = typeof src === 'number' ? new Date(src * 1000) : new Date(src);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            setLastUpdate(`${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!visible) return;
    loadRates();
  }, [visible]);

  const convert = (to: keyof Rates): string => {
    if (!rates || !amount) return '—';
    const num = parseFloat(amount);
    if (isNaN(num)) return '—';
    const inUsd = num / rates[from];
    const result = inUsd * rates[to];
    return result.toFixed(2);
  };

  const currencies: (keyof Rates)[] = ['EUR', 'USD', 'GEL', 'ILS'];
  const others = currencies.filter(c => c !== from);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <View style={s.content}>
          <Text style={s.title}>המרת מטבעות</Text>
          <Text style={s.subtitle}>שערים מתעדכנים בזמן אמת</Text>
          {lastUpdate ? <Text style={s.updatedTxt}>עודכן: {lastUpdate}</Text> : null}
          <TouchableOpacity style={s.refreshBtn} onPress={loadRates} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <Text style={s.refreshIcon}>🔄</Text>
            )}
            <Text style={s.refreshTxt}>רענן נתונים</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.WHITE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* From currency selector */}
              <View style={s.fromRow}>
                {currencies.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.currBtn, from === c && s.currBtnActive]}
                    onPress={() => setFrom(c)}
                  >
                    <Text style={s.currFlag}>{FLAGS[c]}</Text>
                    <Text style={[s.currLabel, from === c && s.currLabelActive]}>{NAMES[c]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount input */}
              <View style={s.inputCard}>
                <View style={s.inputRow}>
                  <TextInput
                    style={s.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    textAlign="center"
                    selectTextOnFocus
                    placeholder={`הקלד סכום ב${NAMES[from]}`}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                  />
                </View>
              </View>

              {/* Results */}
              {others.map(c => (
                <View key={c} style={s.resultCard}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                    <Text style={s.resultFlag}>{FLAGS[c]}</Text>
                    <Text style={s.resultAmount}>{convert(c)}</Text>
                    <Text style={s.resultName}>{NAMES[c]}</Text>
                  </View>
                  {rates && (
                    <Text style={[s.rateText, { textAlign: 'center' }]}>
                      1 {NAMES[from]} = {(rates[c] / rates[from]).toFixed(4)} {NAMES[c]}
                    </Text>
                  )}
                </View>
              ))}
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 16, writingDirection: 'rtl' }}>מקור הנתונים: open.er-api.com (שערים גלובליים, מתעדכנים יומית)</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeX: { fontSize: 18, color: Colors.WHITE, fontWeight: '700' },
  content: { paddingHorizontal: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', marginBottom: 4, writingDirection: 'rtl' },
  subtitle: { fontSize: 14, color: Colors.WHITE, opacity: 0.7, textAlign: 'center', marginBottom: 4, writingDirection: 'rtl' },
  updatedTxt: { fontSize: 11, color: Colors.WHITE, opacity: 0.6, textAlign: 'center', marginBottom: 12, writingDirection: 'rtl' },
  refreshBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20,
  },
  refreshIcon: { fontSize: 16 },
  refreshTxt: { fontSize: 13, fontWeight: '600', color: Colors.WHITE, writingDirection: 'rtl' },

  fromRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 },
  currBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, minWidth: 110, justifyContent: 'center' },
  currBtnActive: { backgroundColor: Colors.WHITE },
  currFlag: { fontSize: 20 },
  currLabel: { fontSize: 14, fontWeight: '600', color: Colors.WHITE },
  currLabelActive: { color: Colors.TEXT },

  inputCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 },
  inputLabel: { fontSize: 14, color: Colors.WHITE, opacity: 0.7, marginBottom: 12, writingDirection: 'rtl' },
  inputRow: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center' },
  inputFlag: { fontSize: 36, marginBottom: 4 },
  input: { fontSize: 24, fontWeight: '900', color: Colors.WHITE, width: 240, paddingVertical: 4, textAlign: 'center', outlineStyle: 'none' as any, borderWidth: 0 },

  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 8,
  },
  resultFlag: { fontSize: 22 },
  resultAmount: { fontSize: 24, fontWeight: '900', color: Colors.WHITE },
  resultName: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  rateText: { fontSize: 11, color: Colors.WHITE, opacity: 0.6, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
});
