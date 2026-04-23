import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Linking } from 'react-native';
import { API_BASE } from '../constants/api';

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
  photos?: { url: string; ref: string }[];
};

export default function PlacesInfoBlock({ query }: { query: string }) {
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

  if (loading || !data?.found) return null;

  const todayIdx = new Date().getDay(); // 0=Sun
  const hoursIdx = (todayIdx + 6) % 7; // Google returns Mon..Sun, shift
  const todayHours = data.openingHours?.[hoursIdx] || '';

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.gIcon}>G</Text>
        <Text style={s.headerTxt}>מידע מ-Google</Text>
      </View>

      {typeof data.rating === 'number' && (
        <View style={s.row}>
          <Text style={s.star}>⭐</Text>
          <Text style={s.rating}>{data.rating.toFixed(1)}</Text>
          {!!data.reviews && <Text style={s.reviews}>({data.reviews.toLocaleString()} ביקורות)</Text>}
          {data.openNow !== null && data.openNow !== undefined && (
            <View style={[s.openBadge, { backgroundColor: data.openNow ? '#16a34a' : '#dc2626' }]}>
              <Text style={s.openTxt}>{data.openNow ? 'פתוח עכשיו' : 'סגור'}</Text>
            </View>
          )}
        </View>
      )}

      {!!todayHours && <Text style={s.hours}>🕐 {todayHours}</Text>}

      <View style={s.btnRow}>
        {!!data.phone && (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)} activeOpacity={0.85}>
            <Text style={s.btnTxt}>📞 חייג</Text>
          </TouchableOpacity>
        )}
        {!!data.mapsUri && (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#3b82f6' }]} onPress={() => Linking.openURL(data.mapsUri!)} activeOpacity={0.85}>
            <Text style={s.btnTxt}>🗺️ נווט</Text>
          </TouchableOpacity>
        )}
        {!!data.website && (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#6366f1' }]} onPress={() => Linking.openURL(data.website!)} activeOpacity={0.85}>
            <Text style={s.btnTxt}>🌐 אתר</Text>
          </TouchableOpacity>
        )}
      </View>

      {data.photos && data.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photosScroll}>
          {data.photos.map((p, i) => (
            <Image key={i} source={{ uri: p.url }} style={s.photo} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  gIcon: { width: 22, height: 22, lineHeight: 22, textAlign: 'center', borderRadius: 11, backgroundColor: '#1a73e8', color: '#fff', fontSize: 13, fontWeight: '900' },
  headerTxt: { fontSize: 13, fontWeight: '800', color: '#475569', writingDirection: 'rtl' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  star: { fontSize: 18 },
  rating: { fontSize: 22, fontWeight: '900', color: '#f59e0b' },
  reviews: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  openBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 8 },
  openTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  hours: { fontSize: 13, color: '#1e293b', fontWeight: '600', writingDirection: 'rtl', textAlign: 'right' },
  btnRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  photosScroll: { marginTop: 4 },
  photo: { width: 140, height: 100, borderRadius: 10, marginLeft: 8 },
});
