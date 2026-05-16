import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Image, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';
import { openInAppBrowser, bookingSearch, hotellookSearch, tiqetsBatumi } from '../constants/affiliates';
import MapEmbed from '../components/MapEmbed';

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
  photos?: { ref: string; url: string }[];
};

export default function PlacePage() {
  const { q, title, type } = useLocalSearchParams<{ q?: string; title?: string; type?: string }>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [mapBig, setMapBig] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/places?q=${encodeURIComponent(q || title || '')}`);
        const j = await r.json();
        if (!cancelled) { setData(j); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, title]);

  const isHotel = type === 'hotel';
  const isAttraction = type === 'attraction';
  const isRestaurant = type === 'restaurant';

  return (
    <View style={s.screen}>
      <View style={{ height: insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44), backgroundColor: '#fff' }} />
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ position: 'absolute', left: 14, top: (insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44)) + 6, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }}
      >
        <Text style={{ fontSize: 18, color: '#1C2B35', fontWeight: '900' }}>✕</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 40 }} />
      ) : !data?.found ? (
        <View style={{ padding: 24 }}><Text style={s.notFound}>לא נמצא מידע</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {!!(data.photos && data.photos.length) && (
            <View style={{ width: '100%', height: 260, backgroundColor: '#e2e8f0', position: 'relative' }}>
              <Image source={{ uri: data.photos[photoIdx].url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {data.photos.length > 1 && (
                <>
                  <TouchableOpacity onPress={() => setPhotoIdx(i => (i - 1 + data.photos!.length) % data.photos!.length)} style={[s.navArrow, { left: 10 }]}>
                    <Text style={s.arrowTxt}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPhotoIdx(i => (i + 1) % data.photos!.length)} style={[s.navArrow, { right: 10 }]}>
                    <Text style={s.arrowTxt}>›</Text>
                  </TouchableOpacity>
                  <View style={s.counter}><Text style={s.counterTxt}>{photoIdx + 1} / {data.photos.length}</Text></View>
                </>
              )}
            </View>
          )}

          {!!data.mapsUri && (
            <View style={{ height: mapBig ? 480 : 240, marginTop: 8, position: 'relative' }}>
              <MapEmbed src={`https://www.google.com/maps?q=${encodeURIComponent(`${title || data.name} Batumi`)}&output=embed`} style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setMapBig(v => !v)} style={s.expand}>
                <Text style={s.expandTxt}>{mapBig ? '−' : '×2'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ padding: 14, gap: 10 }}>
            {typeof data.rating === 'number' && (
              <View style={s.rowCenter}>
                <Text style={s.star}>★</Text>
                <Text style={s.rating}>{data.rating.toFixed(1)}</Text>
                {!!data.reviews && <Text style={s.reviews}>· {data.reviews.toLocaleString()} ביקורות</Text>}
              </View>
            )}
            {!!data.address && (
              <Text style={s.addr}>{data.address}</Text>
            )}
            {!!data.website && (
              <Text style={s.addr}>
                {isHotel ? 'לאתר המלון - ' : isRestaurant ? 'לאתר המסעדה - ' : 'לאתר הרשמי - '}
                <Text style={{ color: Colors.PRIMARY, fontWeight: '900', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(data.website!)}>כאן</Text>
              </Text>
            )}
            {!!(data.openingHours && data.openingHours.length) && (
              <View style={s.hours}>
                <Text style={s.hoursTitle}>שעות פתיחה</Text>
                {data.openingHours.map((l, i) => <Text key={i} style={s.hoursLine}>{l}</Text>)}
              </View>
            )}

            <View style={{ gap: 8, marginTop: 6 }}>
              {!!data.phone && (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)}>
                  <Text style={s.btnTxt}>{isRestaurant ? 'להזמנת שולחן' : 'חייג'} · {data.phone}</Text>
                </TouchableOpacity>
              )}
              {/* website link embedded in address above */}
              {isHotel && (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#FF6B00' }]} onPress={() => openInAppBrowser(hotellookSearch(title || data.name || ''))}>
                  <Text style={s.btnTxt}>השווה מחירים</Text>
                </TouchableOpacity>
              )}
              {isAttraction && (
                <TouchableOpacity style={[s.btn, { backgroundColor: '#f97316' }]} onPress={() => openInAppBrowser(tiqetsBatumi(title || data.name || ''))}>
                  <Text style={s.btnTxt}>כרטיסים ב-Tiqets</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  headerBar: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 10 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
  backTxt: { fontSize: 14, fontWeight: '800', color: Colors.PRIMARY },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right' },
  notFound: { fontSize: 16, color: '#64748b', textAlign: 'center', paddingVertical: 30, writingDirection: 'rtl' },
  navArrow: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  arrowTxt: { color: '#fff', fontSize: 24, fontWeight: '900' },
  counter: { position: 'absolute', bottom: 10, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)' },
  counterTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  expand: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: 'rgba(28,43,53,0.85)', alignItems: 'center', justifyContent: 'center' },
  expandTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  rowCenter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  star: { fontSize: 22, color: '#f59e0b' },
  rating: { fontSize: 28, fontWeight: '900', color: '#f59e0b' },
  reviews: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  addr: { fontSize: 14, color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  hours: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  hoursTitle: { fontSize: 14, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  hoursLine: { fontSize: 13, color: '#475569', writingDirection: 'rtl', textAlign: 'right', lineHeight: 20, fontWeight: '600' },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15, writingDirection: 'rtl' },
});
