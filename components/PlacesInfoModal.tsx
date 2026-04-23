import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Platform } from 'react-native';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';

type PlaceData = {
  found: boolean;
  name?: string;
  rating?: number | null;
  reviews?: number | null;
  address?: string;
  phone?: string;
  website?: string;
  mapsUri?: string;
  openingHours?: string[];
  openNow?: boolean | null;
};

export default function PlacesInfoModal({ query, title, onClose }: { query: string; title: string; onClose: () => void }) {
  const [data, setData] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/places?q=${encodeURIComponent(query)}`);
        const j = await r.json();
        if (!cancelled) { setData(j); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity style={s.close} onPress={onClose}>
            <Text style={s.closeX}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>{title}</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 30 }} />
          ) : !data?.found ? (
            <Text style={s.notFound}>לא נמצא מידע נוסף</Text>
          ) : (
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {typeof data.rating === 'number' && (
                <View style={s.rowCenter}>
                  <Text style={s.star}>⭐</Text>
                  <Text style={s.rating}>{data.rating.toFixed(1)}</Text>
                  {!!data.reviews && <Text style={s.reviews}>· {data.reviews.toLocaleString()} ביקורות</Text>}
                </View>
              )}
              {!!data.address && (
                <View style={s.infoRow}>
                  <Text style={s.infoIcon}>📍</Text>
                  <Text style={s.infoTxt}>{data.address}</Text>
                </View>
              )}
              {!!(data.openingHours && data.openingHours.length) && (
                <View style={s.hoursBlock}>
                  <Text style={s.hoursTitle}>🕐 שעות פתיחה{data.openNow != null ? (data.openNow ? ' · פתוח עכשיו' : ' · סגור') : ''}</Text>
                  {data.openingHours.map((line, i) => (
                    <Text key={i} style={s.hoursLine}>{line}</Text>
                  ))}
                </View>
              )}
              {(data.phone || data.website) && (
                <View style={s.btnCol}>
                  {!!data.phone && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)}>
                      <Text style={s.btnTxt}>📞 חייג · {data.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {!!data.website && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: Colors.PRIMARY }]} onPress={() => Linking.openURL(data.website!)}>
                      <Text style={s.btnTxt}>🌐 אתר רשמי</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 20 },
  close: { position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  closeX: { fontSize: 16, color: '#64748b', fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14, marginLeft: 32 },
  rowCenter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  star: { fontSize: 22 },
  rating: { fontSize: 28, fontWeight: '900', color: '#f59e0b' },
  reviews: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  infoIcon: { fontSize: 16 },
  infoTxt: { flex: 1, fontSize: 14, color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  hoursBlock: { marginBottom: 14, padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  hoursTitle: { fontSize: 14, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  hoursLine: { fontSize: 13, color: '#475569', writingDirection: 'rtl', textAlign: 'right', lineHeight: 20, fontWeight: '600' },
  btnCol: { gap: 8 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15, writingDirection: 'rtl' },
  notFound: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 30, writingDirection: 'rtl' },
});
