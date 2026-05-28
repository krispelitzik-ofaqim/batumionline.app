import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Platform, Image } from 'react-native';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';
import { openInAppBrowser, bookingSearch, hotellookSearch, woltSearch } from '../constants/affiliates';
import MapEmbed from './MapEmbed';

function PhotoGallery({ photos }: { photos: { ref: string; url: string }[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return null;
  const cur = photos[idx];
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#e2e8f0', overflow: 'hidden', position: 'relative' }}>
        <Image source={{ uri: cur.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {photos.length > 1 && (
          <>
            <TouchableOpacity
              onPress={prev}
              style={{ position: 'absolute', left: 8, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={next}
              style={{ position: 'absolute', right: 8, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>›</Text>
            </TouchableOpacity>
            <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{idx + 1} / {photos.length}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

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

export default function PlacesInfoModal({ query, title, onClose, hideHours, showHotelPrices, showAttractionTickets, isRestaurant, ticketType, ticketUrl, ticketUrlAlt }: { query: string; title: string; onClose: () => void; hideHours?: boolean; showHotelPrices?: boolean; showAttractionTickets?: boolean; isRestaurant?: boolean; ticketType?: string; ticketUrl?: string; ticketUrlAlt?: string }) {
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
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {!!(data.photos && data.photos.length) && (
                <PhotoGallery photos={data.photos} />
              )}
              {!!data.mapsUri && (
                <View style={{ height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <MapEmbed src={`https://www.google.com/maps?q=${encodeURIComponent(`${title} Batumi`)}&output=embed`} style={{ flex: 1 }} />
                </View>
              )}
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
              {!hideHours && !!(data.openingHours && data.openingHours.length) && (() => {
                const hours = data.openingHours!;
                const timesOnly = hours.map(l => l.replace(/^[^:]+:\s*/, ''));
                const allSame = timesOnly.every(t => t === timesOnly[0]);
                return (
                  <View style={s.hoursBlock}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={s.hoursTitle}>🕐 שעות פתיחה</Text>
                      {data.openNow != null && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: data.openNow ? '#dcfce7' : '#fee2e2' }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: data.openNow ? '#16a34a' : '#dc2626' }}>
                            {data.openNow ? '🟢 פתוח כעת' : '🔴 סגור כעת'}
                          </Text>
                        </View>
                      )}
                    </View>
                    {allSame ? (
                      <Text style={s.hoursLine}>כל ימות השבוע: {timesOnly[0]}</Text>
                    ) : (
                      hours.map((line, i) => (
                        <Text key={i} style={s.hoursLine}>{line}</Text>
                      ))
                    )}
                  </View>
                );
              })()}
              {(data.phone || data.website || data.mapsUri) && (
                <View style={s.btnCol}>
                  {!!data.phone && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)}>
                      <Text style={s.btnTxt}>{isRestaurant ? 'להזמנת שולחן' : 'חייג'} · {data.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {!!data.website && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: Colors.PRIMARY }]} onPress={() => Linking.openURL(data.website!)}>
                      <Text style={s.btnTxt}>אתר רשמי</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {showHotelPrices && (
                <View style={[s.btnRow, { marginTop: 10 }]}>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#FF6B00' }]} onPress={() => openInAppBrowser(hotellookSearch(title))}>
                    <Text style={s.btnTxt}>ראה מחיר וזמינות</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#003580' }]} onPress={() => openInAppBrowser(bookingSearch(title))}>
                    <Text style={s.btnTxt}>Booking</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showAttractionTickets && (() => {
                const config: Record<string, { color: string; label: string; clickable: boolean }> = {
                  online: { color: '#f97316', label: 'רכישת כרטיס', clickable: true },
                  onsite: { color: '#64748b', label: 'תשלום בכניסה', clickable: false },
                  free: { color: '#10b981', label: 'חינם', clickable: false },
                  appointment: { color: '#3DA5C4', label: 'בתיאום מראש', clickable: false },
                };
                const c = ticketType ? config[ticketType] : null;
                if (!c || ticketType === 'skip') return null;
                return (
                  <View style={[s.btnCol, { marginTop: 10 }]}>
                    {c.clickable && ticketUrl ? (
                      <TouchableOpacity style={[s.btn, { backgroundColor: c.color }]} onPress={() => openInAppBrowser(ticketUrl)}>
                        <Text style={s.btnTxt}>{c.label}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[s.btn, { backgroundColor: c.color }]}>
                        <Text style={s.btnTxt}>{c.label}</Text>
                      </View>
                    )}
                    {c.clickable && ticketUrlAlt && (
                      <TouchableOpacity onPress={() => openInAppBrowser(ticketUrlAlt)} style={{ marginTop: 6, alignSelf: 'center' }}>
                        <Text style={{ color: '#1A6B8A', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>לא מצאתם? ראו גם כאן</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
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
  btnRow: { flexDirection: 'row-reverse', gap: 8 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15, writingDirection: 'rtl' },
  notFound: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 30, writingDirection: 'rtl' },
});
