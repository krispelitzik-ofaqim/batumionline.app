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

  return (
    <View style={s.wrap}>
      {typeof data.rating === 'number' && (
        <View style={s.row}>
          <Text style={s.gIcon}>G</Text>
          <Text style={s.star}>⭐</Text>
          <Text style={s.rating}>{data.rating.toFixed(1)}</Text>
          {!!data.reviews && <Text style={s.reviews}>({data.reviews.toLocaleString()})</Text>}
          {!!data.phone && (
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)} activeOpacity={0.85}>
              <Text style={s.iconTxt}>📞</Text>
            </TouchableOpacity>
          )}
          {!!data.mapsUri && (
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#3b82f6' }]} onPress={() => Linking.openURL(data.mapsUri!)} activeOpacity={0.85}>
              <Text style={s.iconTxt}>🗺️</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gIcon: { width: 20, height: 20, lineHeight: 20, textAlign: 'center', borderRadius: 10, backgroundColor: '#1a73e8', color: '#fff', fontSize: 12, fontWeight: '900' },
  star: { fontSize: 14 },
  rating: { fontSize: 16, fontWeight: '900', color: '#f59e0b' },
  reviews: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  iconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  iconTxt: { fontSize: 13 },
});
