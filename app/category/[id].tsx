import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image, Linking, Platform, Modal, TextInput as RNTextInput } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { PreviewContext } from '../../constants/previewContext';
import { AdminContext } from '../../constants/adminContext';
import DevicePreviewBar from '../../components/DevicePreviewBar';
import { fetchContent, fetchRatings, submitRating, API_BASE } from '../../constants/api';

type MapPoint = { name: string; lat: number; lng: number; description?: string };
import AudioPlayer from '../../components/AudioPlayer';
import FlightsModal from '../../components/FlightsModal';

type Hotel = { id: string; title: string; titleEn?: string; text: string; image: string; mapUrl?: string; pageUrl?: string; coords?: { lat: number; lng: number }; visible?: boolean; images?: string[]; amenities?: string[]; price?: string };
type TourBlock = { id: string; title: string; subtitle?: string; text: string; color: string; images: string[]; audios: { title?: string; url: string }[]; visible?: boolean; coords?: { lat: number; lng: number } };
type Item = {
  id: string; title: string; subtitle?: string; icon: string; bg?: string;
  bgDark?: string; description?: string; summary?: string; heroBg?: string;
  layout?: 'card' | 'banner'; children?: Item[]; hotels?: Hotel[]; tours?: TourBlock[]; pageBtnLabel?: string; cardStyle?: string;
  theme?: 'dark' | 'light'; modal?: string; longText?: string;
  titleEn?: string; titleGe?: string; heroImage?: string; tourMapEmbed?: string;
  article?: {
    heroImage?: string; color?: string;
    sections: { icon: string; title: string; tip: string; image?: string; actionLabel?: string; actionUrl?: string }[];
    buttons?: { label: string; type: 'map' | 'navigate' | 'link' | 'ticket'; coords?: { lat: number; lng: number }; url?: string }[];
    apps?: { name: string; subtitle: string; logo: string; url: string }[];
    timetable?: {
      title?: string; source?: string;
      tabs: { label: string; icon: string; rows: { depart: string; arrive: string; duration: string; price: string; note?: string }[] }[];
    };
    terminal?: boolean;
  };
};

function FoodieCard({ h, isLast }: { h: Hotel; isLast?: boolean }) {
  const [imgFailed, setImgFailed] = useState(!h.image || h.image.includes('city.jpg'));
  const badge = h.amenities?.[0] || '🔥 חובה לטעום';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => h.mapUrl && Linking.openURL(h.mapUrl)}
      style={{ paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#e0e0e0' }}>
      <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
          {!imgFailed ? (
            <Image source={{ uri: h.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setImgFailed(true)} />
          ) : (
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 }}>🍽️</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl' }}>{h.title}</Text>
            {h.price && <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981' }}>{h.price}</Text>}
          </View>
          {h.titleEn ? <Text style={{ fontSize: 10, color: '#888' }}>{h.titleEn}</Text> : null}
          <Text style={{ fontSize: 11, color: '#666', writingDirection: 'rtl', lineHeight: 16 }} numberOfLines={2}>{h.text}</Text>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <View style={{ backgroundColor: '#ff6b35', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{badge}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#ff6b35', fontWeight: '700' }}>📍 לחץ לנווט</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PassportCard({ h, pageBtnLabel }: { h: Hotel; pageBtnLabel: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <View style={passSt.card}>
      <View style={passSt.header}>
        <Text style={passSt.headerIcon}>🛂</Text>
        <Text style={passSt.headerTxt}>כרטיס מדריך</Text>
        <Text style={passSt.headerTxt}>GUIDE CARD</Text>
      </View>
      <View style={passSt.body}>
        <View style={passSt.photoWrap}>
          {h.image && !imgFailed ? (
            <Image source={{ uri: h.image }} style={passSt.photo} resizeMode="cover" onError={() => setImgFailed(true)} />
          ) : (
            <View style={[passSt.photo, { backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 36 }}>👤</Text>
            </View>
          )}
        </View>
        <View style={passSt.info}>
          <Text style={passSt.name}>{h.title}</Text>
          {h.titleEn ? <Text style={passSt.nameEn}>{h.titleEn}</Text> : null}
          <View style={passSt.divider} />
          <Text style={passSt.bio}>{h.text}</Text>
        </View>
      </View>
      <View style={passSt.stamp}>
        <Text style={passSt.stampTxt}>BATUMI ✈ GEORGIA</Text>
      </View>
      <View style={passSt.btnRow}>
        {h.pageUrl ? (
          <TouchableOpacity style={[passSt.btn, { backgroundColor: '#1A6B8A' }]} onPress={() => Linking.openURL(h.pageUrl!)}>
            <Text style={passSt.btnTxt}>{pageBtnLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[passSt.btn, { backgroundColor: '#25D366' }]}
          onPress={() => h.mapUrl && Linking.openURL(h.mapUrl)}
          disabled={!h.mapUrl}
        >
          <Text style={passSt.btnTxt}>📱 WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const passSt = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a', borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    borderWidth: 2, borderColor: '#c9a84c',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  header: {
    backgroundColor: '#1e293b', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#c9a84c40',
  },
  headerIcon: { fontSize: 18 },
  headerTxt: { fontSize: 12, fontWeight: '800', color: '#c9a84c', letterSpacing: 1 },
  body: { flexDirection: 'row-reverse', padding: 16, gap: 14 },
  photoWrap: {
    width: 100, height: 120, borderRadius: 8, overflow: 'hidden',
    borderWidth: 2, borderColor: '#c9a84c60',
  },
  photo: { width: '100%', height: '100%' },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '900', color: '#f8fafc', textAlign: 'right', writingDirection: 'rtl' },
  nameEn: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#c9a84c40', marginVertical: 8 },
  bio: { fontSize: 13, color: '#cbd5e1', lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  stamp: {
    alignSelf: 'center', marginBottom: 12, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: '#c9a84c40', borderRadius: 20,
  },
  stampTxt: { fontSize: 10, color: '#c9a84c80', letterSpacing: 2, fontWeight: '700' },
  btnRow: { flexDirection: 'row-reverse', gap: 8, padding: 12, paddingTop: 0 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

function HotelImage({ uri, titleEn }: { uri?: string; titleEn?: string }) {
  const [failed, setFailed] = useState(!uri);
  const isSvg = uri && uri.endsWith('.svg');
  if (failed) {
    return (
      <View style={[st.hotelImg, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48 }}>🏨</Text>
      </View>
    );
  }
  if (isSvg && Platform.OS === 'web') {
    return (
      <View style={st.hotelImg}>
        <Image source={{ uri: 'http://localhost:3001/uploads/city.jpg' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }}>
          {React.createElement('img', { src: uri, style: { width: 28, height: 28, objectFit: 'contain' }, alt: titleEn || '' })}
        </View>
        {titleEn ? (
          <View style={st.enBadge}>
            <Text style={st.enBadgeTxt}>{titleEn}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={st.hotelImg}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setFailed(true)} />
      {titleEn ? (
        <View style={st.enBadge}>
          <Text style={st.enBadgeTxt}>{titleEn}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FoodRecGps({ restaurants }: { restaurants: { name: string; lat: number; lng: number; mapUrl?: string; category?: string }[] }) {
  const [nearby, setNearby] = useState<{ name: string; dist: number; mapUrl?: string; category?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findNearby = (myLat: number, myLng: number) => {
      const dists = restaurants.map(r => {
        const d = Math.sqrt(Math.pow((r.lat - myLat) * 111000, 2) + Math.pow((r.lng - myLng) * 85000, 2));
        return { ...r, dist: Math.round(d) };
      }).filter(r => r.dist < 1000).sort((a, b) => a.dist - b.dist).slice(0, 3);
      setNearby(dists);
      setLoading(false);
    };

    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => findNearby(pos.coords.latitude, pos.coords.longitude),
        () => {
          // GPS failed - use demo location in Batumi center
          findNearby(41.6505, 41.6355);
        }
      );
    } else {
      findNearby(41.6505, 41.6355);
    }
  }, []);

  if (loading) return <Text style={{ fontSize: 9, color: '#888', textAlign: 'center', marginTop: 4 }}>📍 מחפש מסעדות בקרבתך...</Text>;
  if (nearby.length === 0) return null;

  return (
    <View style={{ marginTop: 6, gap: 4 }}>
      {nearby.map((r, i) => (
        <TouchableOpacity key={i} onPress={() => r.mapUrl && Linking.openURL(r.mapUrl)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, backgroundColor: r.category?.includes('קפה') ? '#efebe9' : r.category?.includes('רחוב') ? '#fff3e0' : r.category?.includes('מקומי') ? '#fce4ec' : '#fff8e1', borderRadius: 8, borderWidth: 1, borderColor: r.category?.includes('קפה') ? '#bcaaa4' : r.category?.includes('רחוב') ? '#ff6b35' : r.category?.includes('מקומי') ? '#f48fb1' : '#f4a94e' }}>
          <Text style={{ fontSize: 14 }}>{r.category?.includes('קפה') ? '☕' : r.category?.includes('רחוב') ? '🔥' : r.category?.includes('מקומי') ? '🥙' : '🍽️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1C2B35', writingDirection: 'rtl' }}>{r.name}</Text>
            <Text style={{ fontSize: 9, color: '#888', writingDirection: 'rtl' }}>{r.category} · {r.dist} מטר · לחץ לנווט</Text>
          </View>
          <Text style={{ fontSize: 12 }}>📍</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TourStations({ audios, color, onNavigate, onActiveChange, nearbyRestaurants, foodRecEnabled }: {
  audios: { title?: string; url: string; coords?: { lat: number; lng: number } }[];
  color: string;
  onNavigate: (c: { lat: number; lng: number }) => void;
  onActiveChange: (i: number, trk: any) => void;
  nearbyRestaurants?: { name: string; lat: number; lng: number; mapUrl?: string; category?: string }[];
  foodRecEnabled?: boolean;
}) {
  const [tracks, setTracks] = useState(audios);
  const [playingIdx, setPlayingIdx] = useState<number>(-1);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [dragIdx, setDragIdx] = useState<number>(-1);
  const audioRef = useRef<any>(null);

  useEffect(() => { setTracks(audios); }, [audios]);

  const toggle = (idx: number) => {
    if (Platform.OS !== 'web') return;
    if (playingIdx === idx && audioRef.current) {
      audioRef.current.pause();
      setPlayingIdx(-1);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const track = tracks[idx];
    const au = new (window as any).Audio(track.url);
    au.ontimeupdate = () => { setPos(au.currentTime || 0); setDur(au.duration || 0); };
    au.onended = () => setPlayingIdx(-1);
    au.play();
    audioRef.current = au;
    setPlayingIdx(idx);
    onActiveChange(idx, track);
    if (track.coords) onNavigate(track.coords);
  };

  useEffect(() => { return () => { if (audioRef.current) audioRef.current.pause(); }; }, []);

  const fmt = (s: number) => { const m = Math.floor(s / 60); const r = Math.floor(s % 60); return `${m}:${r.toString().padStart(2, '0')}`; };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, color: '#555', textAlign: 'center', writingDirection: 'rtl', paddingVertical: 2 }}>▶ לחץ להאזנה | 📌 נווט למקום | ≡ לשינוי הסדר</Text>
      {tracks.map((au, i) => {
        const isPlaying = playingIdx === i;
        const pct = isPlaying && dur > 0 ? (pos / dur) * 100 : 0;
        const row = (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 10, borderWidth: isPlaying ? 2 : 0, borderColor: color, borderTopWidth: 3, borderTopColor: dragIdx === i ? color : 'transparent' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, color: '#999', fontWeight: '700', paddingHorizontal: 4, ...(Platform.OS === 'web' ? { cursor: 'grab' } as any : {}) }}>≡</Text>
              <TouchableOpacity onPress={() => toggle(i)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isPlaying ? color : 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>{isPlaying ? '❚❚' : '▶'}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: isPlaying ? '900' : '700', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }}>{au.title || `תחנה ${i + 1}`}</Text>
                {isPlaying && <Text style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>{fmt(pos)} / {fmt(dur)}</Text>}
              </View>
              {au.coords && (
                <TouchableOpacity onPress={() => onNavigate(au.coords!)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: color }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>📌 נווט</Text>
                </TouchableOpacity>
              )}
            </View>
            {isPlaying && (
              <View style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginTop: 6 }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 2 } as any} />
              </View>
            )}
            {isPlaying && foodRecEnabled && nearbyRestaurants && nearbyRestaurants.length > 0 && (() => {
              const myLat = 41.6505;
              const myLng = 41.6355;
              const dists = nearbyRestaurants.map(r => {
                const d = Math.sqrt(Math.pow((r.lat - myLat) * 111000, 2) + Math.pow((r.lng - myLng) * 85000, 2));
                return { ...r, dist: Math.round(d) };
              }).filter(r => r.dist < 1500).sort((a, b) => a.dist - b.dist).slice(0, 3);
              if (dists.length === 0) return null;
              return (
                <View style={{ marginTop: 6, gap: 4 }}>
                  {dists.map((r, ri) => (
                    <TouchableOpacity key={ri} onPress={() => r.mapUrl && Linking.openURL(r.mapUrl)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, backgroundColor: r.category?.includes('קפה') ? '#efebe9' : r.category?.includes('רחוב') ? '#fff3e0' : r.category?.includes('מקומי') ? '#fce4ec' : '#fff8e1', borderRadius: 8, borderWidth: 1, borderColor: r.category?.includes('קפה') ? '#bcaaa4' : r.category?.includes('רחוב') ? '#ff6b35' : r.category?.includes('מקומי') ? '#f48fb1' : '#f4a94e' }}>
                      <Text style={{ fontSize: 14 }}>{r.category?.includes('קפה') ? '☕' : r.category?.includes('רחוב') ? '🔥' : r.category?.includes('מקומי') ? '🥙' : '🍽️'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#1C2B35', writingDirection: 'rtl' }}>{r.name}</Text>
                        <Text style={{ fontSize: 9, color: '#888', writingDirection: 'rtl' }}>{r.category} · {r.dist} מטר · לחץ לנווט</Text>
                      </View>
                      <Text style={{ fontSize: 12 }}>📍</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}
          </View>
        );
        if (Platform.OS === 'web') {
          return React.createElement('div', {
            key: i, draggable: true,
            onDragStart: (e: any) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
            onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragIdx(i); },
            onDragLeave: () => setDragIdx(-1),
            onDrop: (e: any) => { e.preventDefault(); setDragIdx(-1); const from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!isNaN(from) && from !== i) { const arr = [...tracks]; const [moved] = arr.splice(from, 1); arr.splice(i, 0, moved); setTracks(arr); } },
            onDragEnd: () => setDragIdx(-1),
            style: { cursor: 'move' },
          }, row);
        }
        return <View key={i}>{row}</View>;
      })}
    </View>
  );
}

function buildTourRouteUrl(audios: { title?: string; url: string; coords?: { lat: number; lng: number } }[]): string | null {
  const pts = audios.filter(a => a.coords).map(a => a.coords!);
  if (pts.length < 1) return null;
  const avgLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const avgLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return `https://www.google.com/maps?q=${avgLat},${avgLng}&hl=iw&z=15&output=embed`;
}

function TourAlbum({ tourId, color }: { tourId: string; color: string }) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/api/tour-album/${tourId}`).then(r => r.json()).then(j => { if (j.success) setPhotos(j.data); }).catch(() => {});
    }
  }, [open, uploaded]);

  if (!open) {
    return (
      <TouchableOpacity onPress={() => setOpen(true)} style={{ marginHorizontal: 12, marginTop: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: color, alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>📸 פתח אלבום גולשים</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ margin: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' }}>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl' }}>📸 אלבום גולשים</Text>
        <TouchableOpacity onPress={() => setOpen(false)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#999' }}>✕</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 ? (
        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {photos.map((p: any) => (
            <View key={p.id} style={{ width: '32%' }}>
              <View style={{ aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                <Image source={{ uri: p.image.startsWith('/') ? `http://localhost:3001${p.image}` : p.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <Text style={{ fontSize: 9, color: '#1C2B35', fontWeight: '700', textAlign: 'center', marginTop: 3, writingDirection: 'rtl' }}>{p.name}</Text>
              <Text style={{ fontSize: 8, color: '#888', textAlign: 'center', writingDirection: 'rtl' }}>{p.city} · {p.date}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 12, writingDirection: 'rtl' }}>עדיין אין תמונות. היו הראשונים!</Text>
      )}

      {uploaded ? (
        <View style={{ padding: 10, backgroundColor: '#dcfce7', borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>✓ התמונה נשלחה לאישור. תודה!</Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <RNTextInput value={name} onChangeText={setName} placeholder="✏️ השם שלך" placeholderTextColor="#888" style={{ backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8, fontSize: 13, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#e0e0e0' }} />
          <RNTextInput value={city} onChangeText={setCity} placeholder="🏙️ מאיפה את/ה?" placeholderTextColor="#888" style={{ backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8, fontSize: 13, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#e0e0e0' }} />
          {Platform.OS === 'web' && React.createElement('label', {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: color, borderRadius: 8, padding: 10, cursor: 'pointer' },
          }, [
            React.createElement('input', { key: 'inp', type: 'file', accept: 'image/*', style: { display: 'none' },
              onChange: (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('name', name || 'גולש');
                  fd.append('city', city || '');
                  fetch(`${API_BASE}/api/tour-album/${tourId}`, { method: 'POST', body: fd })
                    .then(r => r.json()).then(() => setUploaded(true)).catch(() => {});
                }
              },
            }),
            React.createElement('span', { key: 'txt', style: { color: '#fff', fontSize: 13, fontWeight: 800 } }, '📸 העלה תמונה'),
          ])}
        </View>
      )}
    </View>
  );
}

function TourCard({ t, onRate, nearbyRestaurants }: { t: TourBlock; onRate: (id: string, score: number) => void; nearbyRestaurants?: { name: string; lat: number; lng: number; mapUrl?: string }[] }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [mapBig, setMapBig] = useState(false);
  const [navCoords, setNavCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stationTitle, setStationTitle] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [foodRec, setFoodRec] = useState(false);
  const [nearbyFood, setNearbyFood] = useState<{ name: string; dist: number; mapUrl?: string } | null>(null);
  const demoScore = 4;
  const displayedScore = ratingSubmitted ? rating : demoScore;
  const images = t.images && t.images.length > 0 ? t.images : [];
  const activeCoords = navCoords || t.coords;
  const routeUrl = buildTourRouteUrl(t.audios || []);
  const mapSrc = navCoords
    ? `https://www.google.com/maps?q=${navCoords.lat},${navCoords.lng}&z=16&output=embed`
    : routeUrl || (activeCoords ? `https://www.google.com/maps?q=${activeCoords.lat},${activeCoords.lng}&z=14&output=embed` : 'https://www.google.com/maps?q=Batumi,Georgia&z=13&output=embed');
  return (
    <View style={[tourSt.card, { backgroundColor: t.color }]}>
      <View style={tourSt.imgWrap}>
        {images.length > 0 ? (
          <>
            <Image source={{ uri: images[imgIdx] }} style={tourSt.img} resizeMode="cover" />
            {stationTitle && (
              <View style={tourSt.stationOverlay}>
                <Text style={tourSt.stationOverlayTxt}>{stationTitle}</Text>
              </View>
            )}
            {images.length > 1 && (
              <>
                <TouchableOpacity style={[tourSt.arrow, tourSt.arrowLeft]} onPress={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}>
                  <Text style={tourSt.arrowTxt}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[tourSt.arrow, tourSt.arrowRight]} onPress={() => setImgIdx((imgIdx + 1) % images.length)}>
                  <Text style={tourSt.arrowTxt}>›</Text>
                </TouchableOpacity>
                <View style={tourSt.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[tourSt.dot, imgIdx === i && tourSt.dotActive]} />
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={[tourSt.img, { backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 40 }}>🎧</Text>
          </View>
        )}
      </View>
      <Text style={tourSt.title}>{t.title || 'ללא כותרת'}</Text>
      {t.subtitle ? <Text style={tourSt.subtitle}>{t.subtitle}</Text> : null}
      <Text style={[tourSt.text, !t.text && { fontStyle: 'italic', color: '#777' }]}>
        {t.text || 'תיאור הסיור יופיע כאן — ערוך דרך פאנל הניהול'}
      </Text>
      <View style={[tourSt.mapWrap, { height: mapBig ? 400 : 200, overflow: 'hidden' }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe src={mapSrc} style={{ width: '100%', height: 'calc(100% + 60px)', border: 0, pointerEvents: 'none', marginTop: -60 }} />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
            <Text>מפה</Text>
          </View>
        )}
        {!mapBig && (
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.85} onPress={() => setMapBig(true)} />
        )}
        {mapBig && (
          <TouchableOpacity style={tourSt.mapClose} onPress={() => setMapBig(false)}>
            <Text style={tourSt.mapHintTxt}>✕</Text>
          </TouchableOpacity>
        )}
        {!mapBig && (
          <View style={tourSt.mapHint} pointerEvents="none">
            <Text style={tourSt.mapHintTxt}>🔍 הגדל מפה</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={() => setFoodRec(!foodRec)} style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginHorizontal: 12 }}>
        <View style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: foodRec ? '#00c853' : '#f48fb1', justifyContent: 'center', padding: 2 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', alignSelf: foodRec ? 'flex-end' : 'flex-start' }} />
        </View>
        <Text style={{ fontSize: 10, color: foodRec ? '#00c853' : '#e91e63', fontWeight: '700', writingDirection: 'rtl' }}>{foodRec ? '🍽️ המלצה למסעדות בקרבתך - פעיל' : 'הפעל המלצות מסעדות בקרבתך'}</Text>
      </TouchableOpacity>

      <View style={tourSt.audioWrap}>
        {t.audios && t.audios.length > 0 ? (
          <TourStations
            audios={t.audios}
            color={t.color}
            nearbyRestaurants={nearbyRestaurants}
            foodRecEnabled={foodRec}
            onNavigate={(c) => { setNavCoords(c); setMapBig(true); }}
            onActiveChange={(i, trk) => {
              if (images.length > 0) setImgIdx(i % images.length);
              setStationTitle(trk.title || null);
            }}
          />
        ) : (
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 12 }}>
            🎧 נגני אודיו יתווספו דרך פאנל הניהול
          </Text>
        )}
      </View>

      <TourAlbum tourId={t.id} color={t.color} />

      <View style={tourSt.ratingRow}>
        <Text style={tourSt.ratingLabel}>דרג את הסיור</Text>
        <View style={tourSt.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => !ratingSubmitted && setRating(n)} disabled={ratingSubmitted}>
              <Text style={[tourSt.star, n <= rating && tourSt.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[tourSt.submitBtn, (rating === 0 || ratingSubmitted) && { opacity: 0.4 }]}
          onPress={() => { if (rating > 0) { setRatingSubmitted(true); onRate(t.id, rating); } }}
          disabled={rating === 0 || ratingSubmitted}
        >
          <Text style={tourSt.submitTxt}>{ratingSubmitted ? '✓ תודה' : 'בחר'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CategoryMapModal({ visible, points, focusName, layerColor, onClose }: { visible: boolean; points: MapPoint[]; focusName: string; layerColor?: string; onClose: () => void }) {
  const [focus, setFocus] = useState<MapPoint | null>(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (visible && focusName) {
      const p = points.find(pt => pt.name === focusName) || points[0];
      if (p) setFocus(p);
    }
  }, [visible, focusName]);

  if (!visible || points.length === 0) return null;

  const color = layerColor || Colors.PRIMARY;
  const mapSrc = focus
    ? `https://www.google.com/maps?q=${focus.lat},${focus.lng}(${encodeURIComponent(focus.name)})&hl=iw&z=16&output=embed`
    : `https://www.google.com/maps?q=${points[0].lat},${points[0].lng}&hl=iw&z=14&output=embed`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 12 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', maxHeight: '85%' }}>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <View style={{ borderBottom: '1px solid #eee', padding: 8, backgroundColor: '#fff' } as any}>
              {React.createElement('div', {
                style: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
              }, [
                React.createElement('div', {
                  key: 'toggle',
                  onClick: () => setListOpen(!listOpen),
                  style: { cursor: 'pointer', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl', width: '100%', justifyContent: 'center' },
                }, [
                  React.createElement('span', { key: 'txt', style: { fontSize: 14, fontWeight: 700, color: color, fontFamily: 'Arial, sans-serif' } }, `📍 ${focus?.name || focusName} (${points.length})`),
                  React.createElement('span', { key: 'arr', style: { fontSize: 12, color: color } }, listOpen ? '▲' : '▼'),
                ]),
                listOpen && React.createElement('div', { key: 'au',
                  onClick: () => { const el = (document as any).getElementById('modal-carousel'); if (el) el.scrollBy({ top: -120, behavior: 'smooth' }); },
                  style: { cursor: 'pointer', fontSize: 12, color: color, fontWeight: 900, textAlign: 'center', userSelect: 'none', padding: '4px 0' },
                }, '▲'),
                listOpen && React.createElement('div', {
                  key: 'list',
                  id: 'modal-carousel',
                  style: { display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'hidden', maxHeight: 190, width: '100%', scrollBehavior: 'smooth', direction: 'rtl' },
                }, points.map((p, i) => {
                    const on = focus?.name === p.name;
                    const isKosher = p.name.includes('כשר') || p.name.toLowerCase().includes('kosher');
                    const itemColor = isKosher ? '#2E7D32' : color;
                    return React.createElement('div', {
                      key: p.name + i,
                      onClick: () => { setFocus(p); setListOpen(false); },
                      style: {
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'right',
                        background: on ? itemColor : isKosher ? '#E8F5E9' : '#f8f9fa', color: on ? '#fff' : itemColor,
                        fontSize: 14, fontWeight: on ? 800 : 600, fontFamily: 'Arial, sans-serif',
                        border: on ? 'none' : `1.5px solid ${itemColor}30`,
                        transition: 'all 0.15s ease', flexShrink: 0,
                      },
                    }, `${isKosher ? '✡️' : '📍'} ${p.name}`);
                  })
                ),
                listOpen && React.createElement('div', { key: 'ad',
                  onClick: () => { const el = (document as any).getElementById('modal-carousel'); if (el) el.scrollBy({ top: 120, behavior: 'smooth' }); },
                  style: { cursor: 'pointer', fontSize: 12, color: color, fontWeight: 900, textAlign: 'center', userSelect: 'none', padding: '4px 0' },
                }, '▼'),
                listOpen && React.createElement('div', { key: 'close',
                  onClick: () => setListOpen(false),
                  style: { cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 800, textAlign: 'center', userSelect: 'none', padding: '6px 0', marginTop: 4, backgroundColor: color, borderRadius: 8 },
                }, '▲ סגור תפריט'),
              ])}
            </View>
          )}
          {Platform.OS === 'web' && React.createElement('iframe', {
            src: mapSrc,
            style: { width: '100%', height: 350, border: 0 },
            title: 'block-map',
          })}
          {focus && (
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>📍 {focus.name}</Text>
              <TouchableOpacity
                style={{ marginTop: 8, backgroundColor: color, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${focus.lat},${focus.lng}`)}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>🧭 נווט למקום</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function HotelCard({ h, dark, pageBtnLabel, mapPoints, layerColor }: { h: Hotel; dark: boolean; pageBtnLabel: string; mapPoints?: MapPoint[]; layerColor?: string }) {
  const [showMap, setShowMap] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showCatMapModal, setShowCatMapModal] = useState(false);
  const hasGallery = !!(h.images && h.images.length > 0);
  const btnEnabled = hasGallery || !!h.pageUrl;
  if (showMap && h.coords) {
    return (
      <View style={[st.hotelCard, st.hotelCardExpanded, dark && { backgroundColor: '#2a3942' }]}>
        <HotelMap coords={h.coords} title={h.title} onClose={() => setShowMap(false)} />
      </View>
    );
  }
  if (showGallery && hasGallery) {
    return (
      <View style={[st.hotelCard, st.hotelCardExpanded, dark && { backgroundColor: '#2a3942' }]}>
        <View style={st.galleryWrap}>
          <TouchableOpacity style={st.mapClose} onPress={() => setShowGallery(false)}>
            <Text style={st.mapCloseX}>✕</Text>
          </TouchableOpacity>
          <View style={st.galleryGrid}>
            {h.images!.slice(0, 9).map((src, i) => (
              <Image key={i} source={{ uri: src }} style={st.galleryImg} resizeMode="cover" />
            ))}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={[st.hotelCard, dark && { backgroundColor: '#2a3942' }]}>
      <HotelImage uri={h.image} titleEn={h.titleEn} />
      <View style={st.hotelBody}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[st.hotelTitle, dark && { color: Colors.BACKGROUND }, { flex: 1 }]}>{h.title}</Text>
          {h.price ? <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>{h.price}</Text> : null}
        </View>
        {h.amenities && h.amenities.length > 0 && (
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {h.amenities.map((a, i) => (
              <View key={i} style={{ backgroundColor: dark ? 'rgba(26,107,138,0.3)' : '#e8f4f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: dark ? 'rgba(61,165,196,0.3)' : '#c7e6f5' }}>
                <Text style={{ fontSize: 10, color: dark ? '#3DA5C4' : '#1A6B8A', fontWeight: '800', letterSpacing: 0.5 }}>{a}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[st.hotelText, dark && { color: '#cbd5e1' }]}>{h.text}</Text>
        <View style={st.hotelBtnRow}>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnAccent, !h.coords && st.hotelBtnDisabled]}
            activeOpacity={h.coords ? 0.7 : 1}
            onPress={() => {
              if (mapPoints && mapPoints.length > 0) setShowCatMapModal(true);
              else if (h.coords) setShowMap(v => !v);
            }}
            disabled={!h.coords && !(mapPoints && mapPoints.length > 0)}
          >
            <Text style={[st.hotelBtnTxt, !h.coords && !(mapPoints && mapPoints.length > 0) && st.hotelBtnTxtDisabled]}>{showMap ? 'הסתר מפה' : 'איפה זה'}</Text>
          </TouchableOpacity>
          <CategoryMapModal visible={showCatMapModal} points={mapPoints || []} focusName={h.title} layerColor={layerColor} onClose={() => setShowCatMapModal(false)} />
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnPrimary, !btnEnabled && st.hotelBtnDisabled]}
            activeOpacity={btnEnabled ? 0.7 : 1}
            onPress={() => {
              if (hasGallery) setShowGallery(true);
              else if (h.pageUrl) Linking.openURL(h.pageUrl);
            }}
            disabled={!btnEnabled}
          >
            <Text style={[st.hotelBtnTxt, !btnEnabled && st.hotelBtnTxtDisabled]}>{pageBtnLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnSecondary, !h.mapUrl && st.hotelBtnDisabled]}
            activeOpacity={h.mapUrl ? 0.7 : 1}
            onPress={() => h.mapUrl && Linking.openURL(h.mapUrl)}
            disabled={!h.mapUrl}
          >
            <Text style={[st.hotelBtnTxt, !h.mapUrl && st.hotelBtnTxtDisabled]}>{h.mapUrl && h.mapUrl.includes('wa.me') ? 'WhatsApp' : 'נווט למקום'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function HotelMap({ coords, title, onClose }: { coords: { lat: number; lng: number }; title: string; onClose: () => void }) {
  const src = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${encodeURIComponent(title)})&z=15&output=embed`;
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {Platform.OS === 'web' ? (
        // @ts-ignore - iframe on web
        <iframe src={src} style={{ width: '100%', height: '100%', border: 0 }} />
      ) : (
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`)}
        >
          <Text style={{ fontSize: 14, color: Colors.PRIMARY }}>פתח במפות גוגל</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={st.mapClose} onPress={onClose}>
        <Text style={st.mapCloseX}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SubCard({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.card, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.cardTop} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cardTop}>
          <Text style={st.cardIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.cardBottom}>
        <Text style={st.cardTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={st.cardSub}>{item.subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function SubBanner({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.banner, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.bannerImg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.bannerImg}>
          <Text style={st.bannerImgIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.bannerText}>
        <Text style={st.bannerTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={st.bannerSub} numberOfLines={1}>{item.subtitle}</Text> : null}
        {item.summary ? <Text style={st.bannerSummary} numberOfLines={2}>{item.summary}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dark } = useContext(ThemeContext);
  const { simulatedWidth } = useContext(PreviewContext);
  const { isAdmin } = useContext(AdminContext);
  const { width: screenW } = useWindowDimensions();
  const w = simulatedWidth ? Math.min(simulatedWidth, screenW) : screenW;
  const cardW = (w - 48) / 2;

  const [cat, setCat] = useState<Item | null>(null);
  const [selectedTour, setSelectedTour] = useState<TourBlock | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [tourMapOpen, setTourMapOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [mapLayerColor, setMapLayerColor] = useState<string | undefined>(undefined);
  const [mapFocus, setMapFocus] = useState<MapPoint | null>(null);
  const [showCatMap, setShowCatMap] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<{ name: string; lat: number; lng: number; mapUrl?: string }[]>([]);
  const [paywall, setPaywall] = useState<{ mode: string; lockedCategories: string[] }>({ mode: 'free', lockedCategories: [] });
  const [isLocked, setIsLocked] = useState(false);
  const [trialHoursLeft, setTrialHoursLeft] = useState<number | null>(null);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recName, setRecName] = useState('');
  const [recText, setRecText] = useState('');
  const [recLocation, setRecLocation] = useState('');
  const [recPrice, setRecPrice] = useState('');
  const [recSent, setRecSent] = useState(false);

  useEffect(() => {
    fetchRatings().then(setRatings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cat) return;
    fetchContent().then(data => {
      if (data.mapLayers) {
        const layers = data.mapLayers as any[];
        const scored = layers.filter((l: any) => l.name).map((l: any) => {
          if (l.name === cat.title) return { layer: l, score: 100 };
          if (cat.title.includes(l.name)) return { layer: l, score: l.name.length };
          if (l.name.includes(cat.title)) return { layer: l, score: cat.title.length };
          const words = l.name.split(/\s+/).filter((w: string) => w.length > 2);
          const matching = words.filter((w: string) => cat.title.includes(w) && w !== 'של');
          return matching.length > 0 ? { layer: l, score: matching.join('').length } : null;
        }).filter(Boolean) as { layer: any; score: number }[];
        scored.sort((a, b) => b.score - a.score);
        if (scored.length > 0) { setMapPoints(scored[0].layer.points || []); setMapLayerColor(scored[0].layer.color); }
      }
    }).catch(() => {});
  }, [cat]);

  const handleRatingSubmit = async (tourId: string, score: number) => {
    try {
      const r = await submitRating(tourId, score);
      setRatings(prev => ({ ...prev, [tourId]: { sum: r.sum, count: r.count } }));
    } catch {}
  };

  useEffect(() => {
    fetchContent().then(data => {
      const all = [...(data.mainCategories || []), ...(data.extraCategories || [])];
      const findDeep = (list: Item[]): Item | undefined => {
        for (const c of list) {
          if (c.id === id) return c;
          if (c.children) {
            const f = findDeep(c.children);
            if (f) return f;
          }
        }
        return undefined;
      };
      const ALIASES: Record<string, string> = { a4: '3' };
      const aliased = ALIASES[id as string];
      const found = aliased
        ? all.find((c: Item) => c.id === aliased)
        : findDeep(all);
      if (found) setCat(found);
      if (data.paywall) {
        setPaywall(data.paywall);
        if (data.paywall.mode === 'premium' && data.paywall.lockedCategories.includes(id as string)) {
          if (data.paywall.trialEnabled === false) {
            setIsLocked(true);
          } else {
            const key = '@batumi_first_open';
            let firstOpen = null as string | null;
            try { firstOpen = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch {}
            if (!firstOpen) {
              try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, new Date().toISOString()); } catch {}
              setTrialHoursLeft(24);
            } else {
              const elapsed = Date.now() - new Date(firstOpen).getTime();
              const hours24 = 24 * 60 * 60 * 1000;
              const hoursLeft = Math.max(0, Math.ceil((hours24 - elapsed) / (60 * 60 * 1000)));
              setTrialHoursLeft(hoursLeft);
              if (elapsed > hours24) {
                setIsLocked(true);
              }
            }
          }
        }
      }
      if (found?.cardStyle === 'foodie') {
        fetch(`${API_BASE}/api/recommendations`).then(r => r.json()).then(j => { if (j.success) setRecommendations(j.data); }).catch(() => {});
      }
      if (found?.tours && found.tours.length > 0) {
        const cat6 = [...(data.mainCategories || [])].find((c: any) => c.id === '6' || c.id === 6);
        if (cat6?.children) {
          const rests: any[] = [];
          cat6.children.forEach((sub: any) => {
            if (sub.id === 'r2') return;
            (sub.hotels || []).forEach((h: any) => {
              if (h.coords && h.visible !== false) rests.push({ name: h.title, lat: h.coords.lat, lng: h.coords.lng, mapUrl: h.mapUrl, category: sub.title });
            });
          });
          setAllRestaurants(rests);
        }
      }
    }).catch(() => {});
  }, [id]);

  if (!cat) {
    return (
      <SafeAreaView style={st.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'קטגוריה', headerBackTitle: 'חזרה' }} />
        <View style={st.emptyWrap}>
          <Text style={st.emptyTxt}>טוען…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const children = cat.children || [];
  const darkCat = cat.theme === 'dark' || dark;

  const lockedOverlay = isLocked ? (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'center', alignItems: 'center' }}>
      {Platform.OS === 'web' && React.createElement('div', {
        style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backdropFilter: 'blur(1px)', backgroundColor: 'rgba(255,255,255,0.3)' },
      })}
      <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', maxWidth: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
        <Text style={{ fontSize: 24 }}>🔒</Text>
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#1C2B35', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>תוכן פרימיום</Text>
        <Text style={{ fontSize: 11, color: '#888', textAlign: 'center', writingDirection: 'rtl', marginTop: 4 }}>שדרג למנוי לגישה מלאה</Text>
        <TouchableOpacity
          onPress={() => router.push('/welcome/6' as any)}
          style={{ marginTop: 10, backgroundColor: '#F4A94E', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 10 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>שדרג עכשיו</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 10, color: '#888' }}>חזרה</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  if (cat.modal === 'flights') {
    return (
      <SafeAreaView style={[st.safe, darkCat && { backgroundColor: cat.heroBg || '#0f1419' }]}>
        <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
        <FlightsModal visible={true} onClose={() => router.back()} bgColor={cat.bg || '#2D4A5E'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.safe, darkCat && { backgroundColor: cat.heroBg || '#0f1419' }]}>
      <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
      <DevicePreviewBar />
      {lockedOverlay}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} style={{ maxWidth: w, alignSelf: 'center', width: '100%' }}>
        {cat.heroImage ? (
          <View style={st.heroImgWrap}>
            <Image source={{ uri: cat.heroImage }} style={st.heroImgBg} resizeMode="cover" />
            <View style={st.heroImgBottomBar}>
              <Text style={st.heroImgBarTxt}>{cat.titleEn || ''}</Text>
              <Text style={st.heroImgBarTxt}>{cat.titleGe || ''}</Text>
              <Text style={st.heroImgBarTxt}>{cat.title}</Text>
            </View>
          </View>
        ) : (
          <View style={[st.hero, { backgroundColor: cat.heroBg || cat.bg || (darkCat ? '#1a1a2e' : '#3DA5C4') }]}>
            <Text style={[st.heroTitle, darkCat && { color: '#F4A94E' }]}>{cat.title}</Text>
            {cat.subtitle ? <Text style={[st.heroSub, darkCat && { color: '#d4af37' }]}>{cat.subtitle}</Text> : null}
          </View>
        )}

        {isAdmin && trialHoursLeft !== null && trialHoursLeft > 0 && !isLocked && paywall.mode === 'premium' && paywall.lockedCategories.includes(id as string) && (
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff8e1', paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f4a94e' }}>
            <Text style={{ fontSize: 16 }}>⏳</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e', writingDirection: 'rtl' }}>תקופת ניסיון חינם - נותרו {trialHoursLeft} שעות</Text>
          </View>
        )}

        {cat.tours && cat.tours.length > 0 ? (
          selectedTour ? (
            <View style={st.hotelList}>
              <TouchableOpacity onPress={() => setSelectedTour(null)} style={st.tourBack}>
                <Text style={st.tourBackTxt}>‹ חזרה לבחירת סיור</Text>
              </TouchableOpacity>
              <TourCard t={selectedTour} onRate={handleRatingSubmit} nearbyRestaurants={allRestaurants} />
            </View>
          ) : (
            <View>
              <TouchableOpacity
                style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginHorizontal: 16, marginTop: 4, borderRadius: 14, backgroundColor: tourMapOpen ? '#e8f4f8' : Colors.PRIMARY }}
                onPress={() => setTourMapOpen(!tourMapOpen)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: tourMapOpen ? Colors.PRIMARY : '#fff' }}>🗺️ מפת כל המסלולים</Text>
                <Text style={{ fontSize: 12, color: tourMapOpen ? Colors.PRIMARY : '#fff' }}>{tourMapOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {tourMapOpen && Platform.OS === 'web' && (
                <View style={{ marginHorizontal: 8, marginTop: 8, borderRadius: 14, overflow: 'hidden', height: 500, borderWidth: 1, borderColor: '#ddd', position: 'relative' }}>
                  {React.createElement('iframe', {
                    src: 'https://www.google.com/maps/d/embed?mid=1ruTENTudaTnlMJh50IZ6Y_Odmu3Y4DE&ehbc=2E312F&z=13',
                    style: { width: '100%', height: 'calc(100% + 60px)', border: 0, marginTop: -60 },
                    title: 'tour-routes-map',
                  })}
                  <TouchableOpacity
                    onPress={() => setTourMapOpen(false)}
                    style={{ position: 'absolute', top: 10, left: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={st.tourGrid}>
              {cat.tours.filter(t => t.visible !== false).map(t => {
                const r = ratings[t.id];
                const avg = r && r.count > 0 ? Math.round(r.sum / r.count) : 0;
                return (
                  <TouchableOpacity key={t.id} style={[st.tourGridCard, { backgroundColor: t.color }]} onPress={() => setSelectedTour(t)} activeOpacity={0.8}>
                    <View style={st.tourGridStars}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Text key={n} style={[st.tourGridStar, n <= avg && st.tourGridStarOn]}>★</Text>
                      ))}
                      {r && r.count > 0 && <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', marginRight: 4 }}>({r.count})</Text>}
                    </View>
                    {avg >= 4 && <Text style={st.tourGridPopular}>סיור זה פופולרי בקרב הגולשים</Text>}
                    <Text style={st.tourGridIcon}>🎧</Text>
                    <Text style={st.tourGridTitle} numberOfLines={2}>{t.title || 'ללא כותרת'}</Text>
                    <Text style={st.tourGridSub} numberOfLines={2}>{t.subtitle || ' '}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            </View>
          )
        ) : children.length > 0 ? (
          (() => {
            const isBanner = children.some(c => c.layout === 'banner');
            const bannerW = Math.min(w - 32, 350);
            return (
              <View style={st.section}>
                {isBanner ? (
                  <View style={{ alignItems: 'center', gap: 12 }}>
                    {children.map(ch => (
                      <SubBanner
                        key={ch.id}
                        item={ch}
                        width={bannerW}
                        onPress={() => router.push(cat.id === '3' ? `/tour/${ch.id}` as any : `/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.banner, st.addBanner, { width: bannerW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף באנר</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={st.grid}>
                    {children.map(ch => (
                      <SubCard
                        key={ch.id}
                        item={ch}
                        width={cardW}
                        onPress={() => router.push(`/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.card, st.addCard, { width: cardW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף אייקון</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })()
        ) : cat.hotels && cat.hotels.length > 0 ? (
          <View style={st.hotelList}>
            {cat.longText && Platform.OS === 'web' && cat.hotels.length <= 10 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                {React.createElement('div', {
                  dangerouslySetInnerHTML: { __html: cat.longText },
                  style: { direction: 'rtl', textAlign: 'right' },
                })}
              </View>
            )}
            {cat.hotels.filter(h => h.visible !== false).map(h => (
              cat.cardStyle === 'passport'
                ? <PassportCard key={h.id} h={h} pageBtnLabel={cat.pageBtnLabel || 'אתר/פייסבוק'} />
                : cat.cardStyle === 'foodie'
                ? <FoodieCard key={h.id} h={h} isLast={cat.hotels!.filter(x => x.visible !== false).indexOf(h) === cat.hotels!.filter(x => x.visible !== false).length - 1} />
                : <HotelCard key={h.id} h={h} dark={darkCat} pageBtnLabel={cat.pageBtnLabel || 'לדף המלון'} mapPoints={mapPoints} layerColor={mapLayerColor || (mapPoints.length > 0 ? Colors.PRIMARY : undefined)} />
            ))}
            {cat.longText && Platform.OS === 'web' && cat.hotels.length > 10 && (
              <View style={{ paddingBottom: 16 }}>
                {React.createElement('div', {
                  dangerouslySetInnerHTML: { __html: cat.longText },
                  style: { direction: 'rtl', textAlign: 'right' },
                })}
              </View>
            )}
            {cat.cardStyle === 'foodie' && (
              <View style={{ backgroundColor: '#1e1e2a', borderRadius: 16, margin: 16, marginTop: 8, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#ff6b35', textAlign: 'center', writingDirection: 'rtl', marginBottom: 12 }}>💬 המלצות הגולשים</Text>
                {recommendations.length > 0 ? recommendations.map((r: any, i: number) => (
                  <View key={r.id} style={{ paddingVertical: 10, borderBottomWidth: i < recommendations.length - 1 ? 1 : 0, borderBottomColor: '#333' }}>
                    <View style={{ flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' }}>
                      {r.image && (
                        <Image source={{ uri: r.image.startsWith('/') ? `http://localhost:3001${r.image}` : r.image }} style={{ width: 50, height: 50, borderRadius: 8 }} resizeMode="cover" />
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', writingDirection: 'rtl' }}>{r.name}</Text>
                          <Text style={{ fontSize: 9, color: '#666' }}>{r.date}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#ccc', writingDirection: 'rtl', lineHeight: 18, marginTop: 2 }}>{r.text}</Text>
                        <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 2 }}>
                          {r.location ? <Text style={{ fontSize: 10, color: '#ff6b35', writingDirection: 'rtl' }}>📍 {r.location}</Text> : null}
                          {r.price ? <Text style={{ fontSize: 10, color: '#10b981', writingDirection: 'rtl' }}>💰 {r.price}</Text> : null}
                        </View>
                      </View>
                    </View>
                  </View>
                )) : (
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', writingDirection: 'rtl' }}>עדיין אין המלצות. היו הראשונים!</Text>
                )}
                {!showRecForm ? (
                  <TouchableOpacity onPress={() => setShowRecForm(true)} style={{ marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#ff6b35', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>✍️ הוסף המלצה</Text>
                  </TouchableOpacity>
                ) : recSent ? (
                  <View style={{ marginTop: 14, padding: 14, backgroundColor: '#10b981', borderRadius: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>✓ ההמלצה נשלחה לאישור. תודה!</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 14, gap: 8 }}>
                    <RNTextInput value={recName} onChangeText={setRecName} placeholder="✏️ השם שלך" placeholderTextColor="#888" style={{ backgroundColor: '#2a2a3a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14, textAlign: 'right', writingDirection: 'rtl' }} />
                    <RNTextInput value={recText} onChangeText={setRecText} placeholder="🍽️ מה אכלת ואיך היה?" placeholderTextColor="#888" multiline numberOfLines={3} style={{ backgroundColor: '#2a2a3a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', minHeight: 70 }} />
                    <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                      <RNTextInput value={recLocation} onChangeText={setRecLocation} placeholder="📍 מיקום" placeholderTextColor="#888" style={{ flex: 1, backgroundColor: '#2a2a3a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14, textAlign: 'right', writingDirection: 'rtl' }} />
                      <TouchableOpacity
                        onPress={() => {
                          if (Platform.OS === 'web' && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => setRecLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
                              () => setRecLocation('לא הצלחתי לזהות מיקום')
                            );
                          }
                        }}
                        style={{ backgroundColor: '#ff6b35', borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 16 }}>📍</Text>
                      </TouchableOpacity>
                    </View>
                    <RNTextInput value={recPrice} onChangeText={setRecPrice} placeholder="💰 כמה עלה? (לדוגמה: 5 לארי)" placeholderTextColor="#888" style={{ backgroundColor: '#2a2a3a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14, textAlign: 'right', writingDirection: 'rtl' }} />
                    {Platform.OS === 'web' && React.createElement('label', {
                      style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2a2a3a', borderRadius: 8, padding: 10, cursor: 'pointer' },
                    }, [
                      React.createElement('input', { key: 'inp', type: 'file', accept: 'image/*', style: { display: 'none' },
                        onChange: (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('name', recName || 'גולש');
                            fd.append('text', recText);
                            fd.append('location', recLocation);
                            fetch(`${API_BASE}/api/recommendations`, { method: 'POST', body: fd })
                              .then(r => r.json()).then(() => setRecSent(true)).catch(() => {});
                          }
                        },
                      }),
                      React.createElement('span', { key: 'txt', style: { color: '#888', fontSize: 14 } }, '📸 הוסף תמונה'),
                    ])}
                    <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                      <TouchableOpacity
                        onPress={async () => {
                          if (!recText.trim()) return;
                          try {
                            await fetch(`${API_BASE}/api/recommendations`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: recName || 'גולש אנונימי', text: recText, location: recLocation, price: recPrice }),
                            });
                            setRecSent(true);
                          } catch {}
                        }}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#ff6b35', alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>שלח המלצה</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowRecForm(false)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#333' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#999' }}>ביטול</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : cat.article ? (
          <ArticleView cat={cat} darkCat={darkCat} />
        ) : cat.longText ? (
          <View style={st.body}>
            {Platform.OS === 'web' ? (
              React.createElement('div', {
                dangerouslySetInnerHTML: { __html: cat.longText },
                style: { direction: 'rtl', textAlign: 'right', color: darkCat ? '#e2e8f0' : Colors.TEXT, lineHeight: 1.8, fontSize: 15 },
              })
            ) : (
              <Text style={[st.content, darkCat && { color: Colors.BACKGROUND }]}>
                {cat.description || ''}
              </Text>
            )}
          </View>
        ) : (
          <View style={st.body}>
            <Text style={[st.content, darkCat && { color: Colors.BACKGROUND }]}>
              {cat.description || 'אין תוכן עדיין'}
            </Text>
          </View>
        )}
        {((cat.hotels && cat.hotels.filter(h => h.visible !== false).length >= 10) || (cat.children && cat.children.length >= 10) || (cat.tours && cat.tours.filter(t => t.visible !== false).length >= 10)) && (
          <TouchableOpacity
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            style={{ alignSelf: 'center', marginVertical: 20, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: '#1C2B35' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#F4A94E' }}>▲ חזור לראש הדף</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },

  hero: { paddingVertical: 30, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 14, color: Colors.WHITE, opacity: 0.85, marginTop: 4, textAlign: 'center', writingDirection: 'rtl' },
  heroImgWrap: { width: '100%', height: 180, position: 'relative' },
  heroImgBg: { width: '100%', height: '100%' },
  heroImgOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  heroImgBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroImgBarTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 16, marginBottom: 24 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },

  card: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 4,
  },
  cardTop: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 68 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 10, paddingHorizontal: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 12, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },

  addCard: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    minHeight: 150, shadowOpacity: 0,
  },

  banner: {
    height: 100, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE,
    flexDirection: 'row-reverse', alignItems: 'center',
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  bannerImg: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  bannerImgIcon: { fontSize: 57, color: Colors.WHITE },
  bannerText: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  bannerSub: { fontSize: 12, fontWeight: '600', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 1 },
  bannerSummary: { fontSize: 11, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 3, lineHeight: 15 },
  addBanner: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0, flexDirection: 'column',
  },
  addPlus: { fontSize: 40, color: Colors.PRIMARY, fontWeight: '300' },
  addLabel: { fontSize: 13, color: Colors.PRIMARY, fontWeight: '600', marginTop: 4 },

  body: { padding: 24 },
  content: { fontSize: 16, color: Colors.TEXT, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },

  hotelList: { padding: 16, gap: 16 },
  hotelCard: {
    backgroundColor: Colors.WHITE, borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  hotelImg: { width: '100%', height: 200, position: 'relative', overflow: 'hidden' },
  enBadge: {
    position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  enBadgeTxt: { color: Colors.WHITE, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  hotelCardExpanded: { minHeight: 420 },
  galleryWrap: { flex: 1, padding: 10, position: 'relative' },
  galleryGrid: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 },
  galleryImg: { width: '32%', aspectRatio: 1, borderRadius: 6 },
  mapClose: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  mapCloseX: { color: Colors.WHITE, fontSize: 16, fontWeight: '700' },
  hotelBody: { padding: 14 },
  hotelTitle: { fontSize: 20, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  hotelText: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  hotelBtnRow: { flexDirection: 'row-reverse', gap: 10 },
  hotelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  hotelBtnPrimary: { backgroundColor: '#1A6B8A' },
  hotelBtnSecondary: { backgroundColor: '#3DA5C4' },
  hotelBtnAccent: { backgroundColor: '#F4A94E' },
  hotelBtnTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '700' },
  hotelBtnDisabled: { opacity: 0.6 },
  hotelBtnTxtDisabled: {},

  tourGrid: { padding: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  tourGridWrap: { width: '47%' },
  tourGridStars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 2, marginBottom: 4 },
  tourGridStar: { fontSize: 16, color: '#d1d5db' },
  tourGridStarOn: { color: '#F4A94E' },
  tourGridPopular: { fontSize: 10, fontWeight: '800', color: '#B45309', textAlign: 'center', writingDirection: 'rtl', marginTop: 2, marginBottom: 4 },
  tourGridCard: {
    width: '47%', aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  tourGridIcon: { fontSize: 44, marginBottom: 10 },
  tourGridTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  tourGridSub: { fontSize: 11, fontWeight: '600', color: 'rgba(0,0,0,0.6)', textAlign: 'center', writingDirection: 'rtl', marginTop: 4, minHeight: 28, lineHeight: 14 },
  tourBack: {
    alignSelf: 'flex-start', padding: 10, marginBottom: 8,
  },
  tourBackTxt: { fontSize: 15, fontWeight: '700', color: Colors.PRIMARY, writingDirection: 'rtl' },
});

function TerminalClock() {
  const [time, setTime] = useState('');
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const update = () => { setTime(fmt.format(new Date())); setBlink(v => !v); };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <View style={termSt.clockWrap}>
      <Text style={termSt.clockLabel}>🕐 זמן בטומי</Text>
      <Text style={termSt.clock}>{time.replace(/:/g, blink ? ':' : ' ')}</Text>
    </View>
  );
}

function BlinkDot() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setOn(v => !v), 800);
    return () => clearInterval(iv);
  }, []);
  return <View style={[termSt.liveDot, { opacity: on ? 1 : 0.2 }]} />;
}

function TimetableTabs({ timetable, color, terminal }: { timetable: { title?: string; source?: string; tabs: { label: string; icon: string; rows: { depart: string; arrive: string; duration: string; price: string; note?: string }[] }[] }; color?: string; terminal?: boolean }) {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const tab = timetable.tabs[activeTab];
  const dark = !!terminal;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNames = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
    const label = i === 0 ? 'היום' : i === 1 ? 'מחר' : dayNames[d.getDay()];
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    return { label, date };
  });

  return (
    <View style={[dark ? termSt.card : artSt.card, !dark && { backgroundColor: '#f8fafc' }]}>
      {dark && (
        <View style={termSt.headerRow}>
          <View style={termSt.liveRow}>
            <BlinkDot />
            <Text style={termSt.liveText}>LIVE</Text>
          </View>
          <TerminalClock />
          <TouchableOpacity onPress={() => setRefreshKey(k => k + 1)} style={termSt.refreshBtn}>
            <Text style={termSt.refreshTxt}>🔄 רענן</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={[artSt.cardHeader, dark && { marginBottom: 4 }]}>
        <Text style={[artSt.cardIcon, { fontSize: dark ? 22 : 28 }]}>{dark ? '🚆' : '🚌'}</Text>
        <Text style={[artSt.cardTitle, dark && { color: '#4ade80' }]}>{timetable.title || 'לוח זמנים'}</Text>
      </View>
      {timetable.source ? (
        <Text style={{ fontSize: 11, color: dark ? '#6b7280' : '#888', textAlign: 'center', writingDirection: 'rtl', marginBottom: 10 }}>{timetable.source}</Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
        {days.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[termSt.dayBtn, selectedDay === i && { backgroundColor: dark ? '#86efac' : (color || Colors.PRIMARY) }]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[termSt.dayLabel, selectedDay === i && { color: dark ? '#0f172a' : Colors.WHITE }]}>{d.label}</Text>
            <Text style={[termSt.dayDate, selectedDay === i && { color: dark ? '#0f172a' : Colors.WHITE }]}>{d.date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={artSt.tabRow}>
        {timetable.tabs.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={[artSt.tab, { backgroundColor: dark ? '#1e293b' : '#e2e8f0' }, activeTab === i && { backgroundColor: dark ? '#4ade80' : (color || Colors.PRIMARY) }]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[artSt.tabTxt, { color: dark ? '#94a3b8' : Colors.TEXT }, activeTab === i && { color: dark ? '#0f172a' : Colors.WHITE }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[artSt.tableHeader, dark && { borderBottomColor: '#334155' }]}>
        <Text style={[artSt.tableCell, artSt.tableBold, dark && { color: '#94a3b8' }]}>יציאה</Text>
        <Text style={[artSt.tableCell, artSt.tableBold, dark && { color: '#94a3b8' }]}>הגעה</Text>
        <Text style={[artSt.tableCell, artSt.tableBold, dark && { color: '#94a3b8' }]}>משך</Text>
        <Text style={[artSt.tableCell, artSt.tableBold, dark && { color: '#94a3b8' }]}>מחיר</Text>
      </View>
      {tab.rows.map((row, i) => (
        <View key={`${refreshKey}-${i}`}>
          {row.note && <Text style={{ fontSize: 11, color: dark ? '#6b7280' : '#666', textAlign: 'right', writingDirection: 'rtl', paddingTop: 6, paddingHorizontal: 4 }}>{row.note}</Text>}
          <View style={[artSt.tableRow, { backgroundColor: dark ? (i % 2 === 0 ? '#1e293b' : '#0f172a') : (i % 2 === 0 ? '#f0f4f8' : 'transparent') }]}>
            <Text style={[artSt.tableCell, dark && { color: '#e2e8f0', fontWeight: '700' }]}>{row.depart}</Text>
            <Text style={[artSt.tableCell, dark && { color: '#e2e8f0' }]}>{row.arrive}</Text>
            <Text style={[artSt.tableCell, dark && { color: '#94a3b8' }]}>{row.duration}</Text>
            <Text style={[artSt.tableCell, dark && { color: '#4ade80', fontWeight: '700' }]}>{row.price}</Text>
          </View>
        </View>
      ))}
      <View style={termSt.countRow}>
        <Text style={[termSt.countTxt, !dark && { color: Colors.PRIMARY }]}>
          {dark ? '🚆' : '🚌'} {tab.rows.length} {dark ? 'רכבות' : 'קווים'} — {days[selectedDay].label} ({days[selectedDay].date}) — {tab.label}
        </Text>
      </View>
    </View>
  );
}

const termSt = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e293b',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { fontSize: 12, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  clockWrap: { alignItems: 'center' },
  clockLabel: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  clock: { fontSize: 24, fontWeight: '900', color: '#f8fafc', fontVariant: ['tabular-nums'], letterSpacing: 2, fontFamily: 'Courier' },
  refreshBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshTxt: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  dayBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignItems: 'center', minWidth: 60 },
  dayBtnActive: { backgroundColor: '#22c55e' },
  dayLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  dayDate: { fontSize: 9, color: '#6b7280', marginTop: 2, fontWeight: '400' },
  countRow: { marginTop: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  countTxt: { fontSize: 11, fontWeight: '400', color: '#4ade80', textAlign: 'center', writingDirection: 'rtl' },
});

function ArticleView({ cat, darkCat }: { cat: Item; darkCat: boolean }) {
  const [showMap, setShowMap] = useState<{ lat: number; lng: number } | null>(null);
  const art = cat.article!;
  return (
    <View style={artSt.wrap}>
      {art.timetable && art.timetable.tabs && (
        <TimetableTabs timetable={art.timetable} color={art.color} terminal={art.terminal} />
      )}

      {showMap && (
        <View style={[artSt.card, { backgroundColor: '#f8fafc', minHeight: 300, position: 'relative' }]}>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <iframe
              src={`https://www.google.com/maps?q=${showMap.lat},${showMap.lng}&z=15&output=embed`}
              style={{ width: '100%', height: 280, border: 0, borderRadius: 12 }}
            />
          ) : null}
          <TouchableOpacity
            style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setShowMap(null)}
          >
            <Text style={{ color: Colors.WHITE, fontSize: 16, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {art.buttons && art.buttons.length > 0 && (
        <View style={artSt.btnRow}>
          {art.buttons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[artSt.actionBtn, {
                backgroundColor: btn.type === 'map' ? '#F4A94E' : btn.type === 'navigate' ? '#3DA5C4' : btn.type === 'ticket' ? '#10b981' : '#1A6B8A',
              }]}
              onPress={() => {
                if (btn.type === 'link' && btn.url) Linking.openURL(btn.url);
                else if (btn.type === 'navigate' && btn.coords)
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${btn.coords.lat},${btn.coords.lng}`);
                else if ((btn.type === 'map' || btn.type === 'ticket') && btn.coords)
                  setShowMap(showMap ? null : btn.coords);
              }}
            >
              <Text style={artSt.actionBtnTxt}>{btn.type === 'map' && showMap ? 'סגור מפה' : btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {art.apps && art.apps.length > 0 && (
        <View style={artSt.appsCard}>
          <Text style={artSt.appsTitle}>📲 אפליקציות מומלצות להורדה</Text>
          {art.apps.map((app, i) => (
            <TouchableOpacity key={i} style={artSt.appRow} onPress={() => Linking.openURL(app.url)} activeOpacity={0.7}>
              <Image source={{ uri: app.logo }} style={artSt.appLogo} resizeMode="contain" />
              <View style={artSt.appInfo}>
                <Text style={artSt.appName}>{app.name}</Text>
                <Text style={artSt.appSub}>{app.subtitle}</Text>
              </View>
              <Text style={artSt.appArrow}>←</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {art.sections.map((sec, i) => (
        <View key={i} style={[artSt.card, { backgroundColor: (art.color || '#f0f4f8') + '60' }]}>
          <View style={artSt.cardHeader}>
            <Text style={artSt.cardIcon}>{sec.icon}</Text>
            <Text style={artSt.cardTitle}>{sec.title}</Text>
          </View>
          <Text style={artSt.cardTip}>{sec.tip}</Text>
          {sec.image ? <Image source={{ uri: sec.image }} style={artSt.cardImg} resizeMode="cover" /> : null}
          {sec.actionLabel && sec.actionUrl ? (
            <TouchableOpacity style={[artSt.cardBtn, { backgroundColor: art.color || Colors.PRIMARY }]} onPress={() => Linking.openURL(sec.actionUrl!)}>
              <Text style={artSt.cardBtnTxt}>{sec.actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const artSt = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  heroWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  hero: { width: '100%', height: 180 },
  heroBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between' },
  heroBottomTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { fontSize: 28 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  cardTip: { fontSize: 14, color: '#444', lineHeight: 22, writingDirection: 'rtl', textAlign: 'right' },
  cardImg: { width: '100%', height: 140, borderRadius: 12, marginTop: 12 },
  cardBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  cardBtnTxt: { color: Colors.WHITE, fontWeight: '800', fontSize: 14 },
  appsCard: {
    backgroundColor: Colors.WHITE, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  appsTitle: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  appRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  appLogo: { width: 50, height: 50, borderRadius: 12 },
  appInfo: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  appSub: { fontSize: 12, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  appArrow: { fontSize: 18, color: Colors.PRIMARY, fontWeight: '700' },
  tabRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tab: { flex: 1, minWidth: 90, paddingVertical: 10, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' },
  tabTxt: { fontSize: 12, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  btnRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 100, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnTxt: { color: Colors.WHITE, fontWeight: '800', fontSize: 13 },
  tableHeader: { flexDirection: 'row-reverse', borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingBottom: 8, marginBottom: 4 },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 8, borderRadius: 6 },
  tableCell: { flex: 1, fontSize: 12, color: '#334155', textAlign: 'center', writingDirection: 'rtl' },
  tableBold: { fontWeight: '800', color: Colors.TEXT },
});

const tourSt = StyleSheet.create({
  card: {
    borderRadius: 20, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  imgWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  img: { width: '100%', height: 200 },
  arrow: {
    position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  arrowTxt: { color: Colors.WHITE, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  dots: {
    position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 5,
    left: 0, right: 0, justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  stationOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 12, paddingHorizontal: 14,
  },
  stationOverlayTxt: { color: Colors.WHITE, fontSize: 18, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  dotActive: { backgroundColor: Colors.WHITE, width: 18 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  subtitle: { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.65)', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  text: { fontSize: 14, color: '#333', lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  audioWrap: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 8 },
  hint: { fontSize: 11, color: '#555', textAlign: 'center', writingDirection: 'rtl', paddingVertical: 4 },
  ratingRow: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  },
  ratingLabel: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  stars: { flexDirection: 'row-reverse', gap: 2 },
  star: { fontSize: 28, color: '#d1d5db', paddingHorizontal: 2 },
  starOn: { color: '#F4A94E' },
  submitBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.PRIMARY,
  },
  submitTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '800' },
  topStars: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 2, marginBottom: 8,
  },
  topStar: { fontSize: 22, color: 'rgba(255,255,255,0.8)' },
  topStarOn: { color: '#F4A94E' },
  topScore: { fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: '700', marginRight: 6 },
  mapWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  mapHint: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  mapClose: {
    position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  mapHintTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
