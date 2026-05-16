import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image, Linking, Platform, Modal, TextInput as RNTextInput } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { PreviewContext } from '../../constants/previewContext';
import { AdminContext } from '../../constants/adminContext';
import DevicePreviewBar from '../../components/DevicePreviewBar';
import { fetchContent, fetchRatings, submitRating, API_BASE, resolveUri } from '../../constants/api';
import { openLocation, openDirections, openMapUrl } from '../../constants/maps';

type MapPoint = { name: string; lat: number; lng: number; description?: string };
import AudioPlayer from '../../components/AudioPlayer';
import FlightsModal from '../../components/FlightsModal';
import BottomTabBar from '../../components/BottomTabBar';
import Breadcrumb from '../../components/Breadcrumb';
import AppHeader from '../../components/AppHeader';
import PlacesInfoModal from '../../components/PlacesInfoModal';
import HtmlContent from '../../components/HtmlContent';
import MapEmbed from '../../components/MapEmbed';
import CategoryHeaderMap from '../../components/CategoryHeaderMap';
import AddToTourButton from '../../components/AddToTourButton';
import RecommendGuideButton from '../../components/RecommendGuideButton';
import RecommendDriverButton from '../../components/RecommendDriverButton';
import DeleteMySubmission from '../../components/DeleteMySubmission';

type Hotel = { id: string; title: string; titleEn?: string; text: string; image: string; mapUrl?: string; pageUrl?: string; coords?: { lat: number; lng: number }; visible?: boolean; images?: string[]; amenities?: string[]; price?: string; audio?: string; photoAttribution?: { name: string; uri?: string } };
type TourBlock = { id: string; title: string; subtitle?: string; text: string; color: string; images: string[]; audios: { title?: string; url: string }[]; visible?: boolean; coords?: { lat: number; lng: number } };
type Item = {
  id: string; title: string; subtitle?: string; icon: string; bg?: string;
  bgDark?: string; description?: string; summary?: string; heroBg?: string;
  layout?: 'card' | 'banner'; children?: Item[]; hotels?: Hotel[]; tours?: TourBlock[]; pageBtnLabel?: string; cardStyle?: string;
  theme?: 'dark' | 'light'; modal?: string; longText?: string; introAudio?: string;
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
    <TouchableOpacity activeOpacity={0.85} onPress={() => h.mapUrl && openMapUrl(h.mapUrl, h.title)}
      style={{ paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#e0e0e0' }}>
      <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
        <View style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
          {!imgFailed ? (
            <Image source={{ uri: resolveUri(h.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setImgFailed(true)} />
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
            <Image source={{ uri: resolveUri(h.image) }} style={passSt.photo} resizeMode="cover" onError={() => setImgFailed(true)} />
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
          onPress={() => h.mapUrl && openMapUrl(h.mapUrl, h.title)}
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

function HotelImage({ uri, titleEn, placesQuery, hideBadge, badgeText }: { uri?: string; titleEn?: string; placesQuery?: string; hideBadge?: boolean; badgeText?: string }) {
  const [failed, setFailed] = useState(!uri);
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const isSvg = uri && uri.endsWith('.svg');
  useEffect(() => {
    if (titleEn || !placesQuery) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/places?q=${encodeURIComponent(placesQuery)}&lang=en`)
      .then(r => r.json())
      .then(j => { if (!cancelled && j?.found && j?.name) setFetchedName(j.name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [placesQuery, titleEn]);
  const displayEn = badgeText || titleEn || fetchedName;
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
        <Image source={{ uri: resolveUri('/uploads/city.jpg') }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }}>
          {React.createElement('img', { src: uri, style: { width: 28, height: 28, objectFit: 'contain' }, alt: titleEn || '' })}
        </View>
        {displayEn ? (
          <View style={st.enBadge}>
            <Text style={st.enBadgeTxt}>{displayEn}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View style={st.hotelImg}>
      <Image source={{ uri: resolveUri(uri) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setFailed(true)} />
      {displayEn && !hideBadge ? (
        <View style={st.enBadge}>
          <Text style={st.enBadgeTxt}>{displayEn}</Text>
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
        <TouchableOpacity key={i} onPress={() => r.mapUrl && openMapUrl(r.mapUrl, r.name)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, backgroundColor: r.category?.includes('קפה') ? '#efebe9' : r.category?.includes('רחוב') ? '#fff3e0' : r.category?.includes('מקומי') ? '#fce4ec' : '#fff8e1', borderRadius: 8, borderWidth: 1, borderColor: r.category?.includes('קפה') ? '#bcaaa4' : r.category?.includes('רחוב') ? '#ff6b35' : r.category?.includes('מקומי') ? '#f48fb1' : '#f4a94e' }}>
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

function isLight(hex: string): boolean {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return false;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 170;
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

  const toggle = async (idx: number) => {
    const track = tracks[idx];
    if (!track) return;
    if (Platform.OS === 'web') {
      if (playingIdx === idx && audioRef.current) {
        audioRef.current.pause();
        setPlayingIdx(-1);
        return;
      }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const au = new (window as any).Audio(resolveUri(track.url));
      au.ontimeupdate = () => { setPos(au.currentTime || 0); setDur(au.duration || 0); };
      au.onended = () => setPlayingIdx(-1);
      au.play();
      audioRef.current = au;
    } else {
      try {
        const { Audio } = require('expo-av');
        if (playingIdx === idx && audioRef.current) {
          await audioRef.current.pauseAsync();
          setPlayingIdx(-1);
          return;
        }
        if (audioRef.current) { try { await audioRef.current.unloadAsync(); } catch {} audioRef.current = null; }
        const { sound } = await Audio.Sound.createAsync({ uri: resolveUri(track.url) }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((st: any) => {
          if (!st.isLoaded) return;
          setPos((st.positionMillis || 0) / 1000);
          setDur((st.durationMillis || 0) / 1000);
          if (st.didJustFinish) setPlayingIdx(-1);
        });
        audioRef.current = sound;
      } catch {}
    }
    setPlayingIdx(idx);
    onActiveChange(idx, track);
    if (track.coords) onNavigate(track.coords);
  };

  useEffect(() => { return () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (Platform.OS === 'web') { a.pause(); }
      else if (typeof a.unloadAsync === 'function') { a.unloadAsync().catch(() => {}); }
    } catch {}
  }; }, []);

  const fmt = (s: number) => { const m = Math.floor(s / 60); const r = Math.floor(s % 60); return `${m}:${r.toString().padStart(2, '0')}`; };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, color: '#555', textAlign: 'center', writingDirection: 'rtl', paddingVertical: 2 }}>▶ לחץ להאזנה | ≡ לשינוי הסדר</Text>
      {tracks.map((au, i) => {
        const isPlaying = playingIdx === i;
        const pct = isPlaying && dur > 0 ? (pos / dur) * 100 : 0;
        const row = (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 10, borderWidth: isPlaying ? 2 : 0, borderColor: color, borderTopWidth: 3, borderTopColor: dragIdx === i ? color : 'transparent' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, color: '#999', fontWeight: '700', paddingHorizontal: 4, ...(Platform.OS === 'web' ? { cursor: 'grab' } as any : {}) }}>≡</Text>
              <TouchableOpacity onPress={() => toggle(i)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isPlaying ? '#F4A94E' : Colors.PRIMARY, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>{isPlaying ? '❚❚' : '▶'}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: isPlaying ? '900' : '700', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>{au.title || `תחנה ${i + 1}`}</Text>
                {isPlaying && <Text style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>{fmt(pos)} / {fmt(dur)}</Text>}
              </View>
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
                    <TouchableOpacity key={ri} onPress={() => r.mapUrl && openMapUrl(r.mapUrl, r.name)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, backgroundColor: r.category?.includes('קפה') ? '#efebe9' : r.category?.includes('רחוב') ? '#fff3e0' : r.category?.includes('מקומי') ? '#fce4ec' : '#fff8e1', borderRadius: 8, borderWidth: 1, borderColor: r.category?.includes('קפה') ? '#bcaaa4' : r.category?.includes('רחוב') ? '#ff6b35' : r.category?.includes('מקומי') ? '#f48fb1' : '#f4a94e' }}>
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

function TourAlbum({ tourId, color, refreshKey }: { tourId: string; color: string; refreshKey?: number }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const PHOTOS_PER_FAN = 20;
  const visiblePhotos = photos.slice(0, visibleCount);
  const hasMore = photos.length > visibleCount;

  useEffect(() => {
    fetch(`${API_BASE}/api/tour-album/${tourId}`).then(r => r.json()).then(j => { if (j.success) setPhotos(j.data); }).catch(() => {});
  }, [tourId, refreshKey]);

  return (
    <View>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginHorizontal: 12, marginTop: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl' }}>📸 אלבום גולשים</Text>
        {photos.length > 0 && <Text style={{ fontSize: 11, color: '#64748b' }}>{photos.length}/100</Text>}
      </View>

      {photos.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 0, marginBottom: 8 }}>
            {visiblePhotos.map((p: any) => (
              <TouchableOpacity key={p.id} onPress={() => setPreviewPhoto(p)} style={{ width: '25%' }} activeOpacity={0.85}>
                <View style={{ aspectRatio: 1, overflow: 'hidden', backgroundColor: '#f0f0f0', position: 'relative' }}>
                  <Image source={{ uri: resolveUri(p.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 4, paddingTop: 20, paddingBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: '900', textAlign: 'center', writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center', writingDirection: 'rtl', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} numberOfLines={1}>{p.city}</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {hasMore && (
            <TouchableOpacity onPress={() => setVisibleCount(c => Math.min(c + PHOTOS_PER_FAN, photos.length))} style={{ marginHorizontal: 12, marginVertical: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: color, alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>פתח עוד {Math.min(PHOTOS_PER_FAN, photos.length - visibleCount)} תמונות ▼</Text>
            </TouchableOpacity>
          )}
          {visibleCount > PHOTOS_PER_FAN && (
            <TouchableOpacity onPress={() => setVisibleCount(PHOTOS_PER_FAN)} style={{ marginHorizontal: 12, marginVertical: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#94a3b8', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>סגור ▲</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 12, writingDirection: 'rtl' }}>עדיין אין תמונות. היו הראשונים!</Text>
      )}

      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <TouchableOpacity onPress={() => setPreviewPhoto(null)} style={{ position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
          {previewPhoto && (
            <>
              <Image source={{ uri: resolveUri(previewPhoto.image) }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} resizeMode="contain" />
              <View style={{ marginTop: 16, alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', writingDirection: 'rtl', textAlign: 'center' }}>{previewPhoto.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, writingDirection: 'rtl', textAlign: 'center', marginTop: 4 }}>📍 {previewPhoto.city} · {previewPhoto.date}</Text>
              </View>
            </>
          )}
        </View>
      </Modal>

    </View>
  );
}

function TourAlbumUpload({ tourId, color, onUploaded }: { tourId: string; color: string; onUploaded?: () => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [uploadedSlots, setUploadedSlots] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const MAX_UPLOADS = 5;
  const uploaded = uploadedSlots.length >= MAX_UPLOADS;

  return (
    <View style={{ margin: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e0e0e0' }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: open ? 10 : 0, paddingVertical: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl' }}>העלאת תמונות לאלבום</Text>
        <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Text style={{ fontSize: 9, color: open ? '#cbd5e1' : '#1A6B8A', fontWeight: '900' }}>▼</Text>
          <Text style={{ fontSize: 9, color: open ? '#1A6B8A' : '#cbd5e1', fontWeight: '900' }}>▲</Text>
        </View>
      </TouchableOpacity>
      {open && (uploaded ? (
        <View style={{ padding: 10, backgroundColor: '#dcfce7', borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>✓ העלת {MAX_UPLOADS} תמונות. תודה!</Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <RNTextInput value={name} onChangeText={setName} placeholder="✏️ השם שלך" placeholderTextColor="#888" style={{ backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8, fontSize: 13, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#e0e0e0' }} />
          <RNTextInput value={city} onChangeText={setCity} placeholder="🏙️ מאיפה את/ה?" placeholderTextColor="#888" style={{ backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8, fontSize: 13, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#e0e0e0' }} />
          <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', writingDirection: 'rtl' }}>📷 ניתן להעלות עד {MAX_UPLOADS} תמונות ({uploadedSlots.length}/{MAX_UPLOADS})</Text>
          <View style={{ flexDirection: 'row-reverse', gap: 5, justifyContent: 'center', marginVertical: 4 }}>
            {Array.from({ length: MAX_UPLOADS }).map((_, i) => {
              const filled = i < uploadedSlots.length;
              return (
                <View key={i} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: filled ? color : '#f1f5f9', borderWidth: 1.5, borderColor: filled ? color : '#cbd5e1', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, color: filled ? '#fff' : '#94a3b8', fontWeight: '900' }}>{filled ? '✓' : i + 1}</Text>
                </View>
              );
            })}
          </View>
          {Platform.OS === 'web' ? React.createElement('label', {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A6B8A', borderRadius: 10, padding: 14, cursor: 'pointer', borderWidth: 2, borderColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
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
                    .then(r => r.json()).then((j: any) => { setUploadedSlots(prev => [...prev, j?.data?.id || String(Date.now())]); onUploaded?.(); }).catch(() => {});
                }
              },
            }),
            React.createElement('span', { key: 'txt', style: { color: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: 0.3 } }, '📸 העלה תמונה'),
          ]) : (
            <TouchableOpacity
              onPress={async () => {
                try {
                  const ImagePicker = require('expo-image-picker');
                  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (!perm.granted) return;
                  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                  if (r.canceled || !r.assets?.[0]) return;
                  const asset = r.assets[0];
                  const fd = new FormData();
                  fd.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
                  fd.append('name', name || 'גולש');
                  fd.append('city', city || '');
                  const r2 = await fetch(`${API_BASE}/api/tour-album/${tourId}`, { method: 'POST', body: fd });
                  const j2 = await r2.json();
                  setUploadedSlots(prev => [...prev, j2?.data?.id || String(Date.now())]);
                  onUploaded?.();
                } catch {}
              }}
              style={{ backgroundColor: '#1A6B8A', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>📸 העלה תמונה</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

function TourLegendDropdown({ tours, onSelect }: { tours: TourBlock[]; onSelect: (t: TourBlock) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl' }}>📍 מקרא הסיורים</Text>
        <Text style={{ fontSize: 14, color: '#1A6B8A', fontWeight: '900' }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ padding: 10, gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
          {tours.map(t => (
            <TouchableOpacity key={t.id} onPress={() => { onSelect(t); setOpen(false); }} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: t.color }} activeOpacity={0.85}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: isLight(t.color) ? '#1C2B35' : '#fff', writingDirection: 'rtl', textAlign: 'right' }} numberOfLines={1}>{t.title}</Text>
              <Text style={{ fontSize: 14, color: isLight(t.color) ? '#1C2B35' : '#fff', fontWeight: '900' }}>‹</Text>
            </TouchableOpacity>
          ))}
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
  const [albumKey, setAlbumKey] = useState(0);
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
            <Image source={{ uri: resolveUri(images[imgIdx]) }} style={tourSt.img} resizeMode="cover" />
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
      <Text style={tourSt.title} numberOfLines={2}>{t.title || 'ללא כותרת'}</Text>
      <Text style={[tourSt.text, !t.text && { fontStyle: 'italic', color: '#777' }]}>
        {t.text || 'תיאור הסיור יופיע כאן — ערוך דרך פאנל הניהול'}
      </Text>
      <View style={[tourSt.mapWrap, { height: mapBig ? 400 : 200, overflow: 'hidden' }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe src={mapSrc} style={{ width: '100%', height: 'calc(100% + 60px)', border: 0, pointerEvents: 'none', marginTop: -60 }} />
        ) : (
          <MapEmbed src={mapSrc} style={{ flex: 1 }} />
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

      <View style={[tourSt.ratingRow, { flexDirection: 'column', gap: 6, alignItems: 'center' }]}>
        <Text style={[tourSt.ratingLabel, { fontSize: 10 }]}>דרג את הסיור</Text>
        <View style={tourSt.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => !ratingSubmitted && setRating(n)} disabled={ratingSubmitted}>
              <Text style={[tourSt.star, n <= rating && tourSt.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[tourSt.submitBtn, { alignSelf: 'stretch', alignItems: 'center' }, (rating === 0 || ratingSubmitted) && { opacity: 0.4 }]}
          onPress={() => { if (rating > 0) { setRatingSubmitted(true); onRate(t.id, rating); } }}
          disabled={rating === 0 || ratingSubmitted}
        >
          <Text style={tourSt.submitTxt}>{ratingSubmitted ? '✓ תודה' : 'בחר'}</Text>
        </TouchableOpacity>
      </View>

      <TourAlbumUpload tourId={t.id} color={t.color} onUploaded={() => setAlbumKey(k => k + 1)} />
      <TourAlbum tourId={t.id} color={t.color} refreshKey={albumKey} />
    </View>
  );
}

function CategoryNativeMap({ points, focus, setFocus, color, mapSrc }: { points: MapPoint[]; focus: MapPoint | null; setFocus: (p: MapPoint | null) => void; color: string; mapSrc: string }) {
  return <MapEmbed src={mapSrc} style={{ width: '100%', height: 350 }} />;
}

function CategoryMapModal({ visible, points, focusName, focusCoords, layerColor, onClose }: { visible: boolean; points: MapPoint[]; focusName: string; focusCoords?: { lat: number; lng: number }; layerColor?: string; onClose: () => void }) {
  const [focus, setFocus] = useState<MapPoint | null>(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (focusCoords) {
      setFocus({ name: focusName || '', lat: focusCoords.lat, lng: focusCoords.lng });
      return;
    }
    if (focusName) {
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
      const target = norm(focusName);
      const p = points.find(pt => norm(pt.name) === target)
        || points.find(pt => norm(pt.name).includes(target) || target.includes(norm(pt.name)));
      setFocus(p || null);
      return;
    }
    setFocus(null);
  }, [visible, focusName, focusCoords?.lat, focusCoords?.lng]);

  if (!visible || points.length === 0) return null;

  const color = layerColor || Colors.PRIMARY;
  const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const mapSrc = focus
    ? `https://www.google.com/maps?q=${focus.lat},${focus.lng}(${encodeURIComponent(focus.name)})&hl=iw&z=16&output=embed`
    : `https://www.google.com/maps?q=${centerLat},${centerLng}&hl=iw&z=13&output=embed`;

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
                  style: { cursor: 'pointer', fontSize: 32, color: '#dc2626', fontWeight: 900, textAlign: 'center', userSelect: 'none', padding: '6px 0', marginTop: 4, lineHeight: 1 },
                }, '▲'),
              ])}
            </View>
          )}
          <CategoryNativeMap points={points} focus={focus} setFocus={setFocus} color={color} mapSrc={mapSrc} />
          {focus && (
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>📍 {focus.name}</Text>
              <TouchableOpacity
                style={{ marginTop: 8, backgroundColor: color, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                onPress={() => openDirections(focus.lat, focus.lng, focus.name)}
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

function HotelCard({ h, dark, pageBtnLabel, mapPoints, layerColor, placesQuery, isHotel, isAttraction, isRestaurant, isNightlife, sourcePath }: { h: Hotel; dark: boolean; pageBtnLabel: string; mapPoints?: MapPoint[]; layerColor?: string; placesQuery?: string; isHotel?: boolean; isAttraction?: boolean; isRestaurant?: boolean; isNightlife?: boolean; sourcePath?: string }) {
  const [showMap, setShowMap] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showCatMapModal, setShowCatMapModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
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
              <Image key={i} source={{ uri: resolveUri(src) }} style={st.galleryImg} resizeMode="cover" />
            ))}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={[st.hotelCard, dark && { backgroundColor: '#2a3942' }]}>
      <View style={{ position: 'relative' }}>
        <HotelImage uri={h.image} titleEn={h.titleEn} placesQuery={placesQuery} badgeText={isNightlife ? h.title : undefined} hideBadge={!isNightlife && !!h.titleEn && h.title === h.titleEn} />
        <AddToTourButton
          itemId={h.id || `${h.title}_${h.titleEn || ''}`}
          itemTitle={h.title}
          itemImage={h.image}
          itemType={isHotel ? 'hotel' : isAttraction ? 'attraction' : isRestaurant ? 'restaurant' : undefined}
          sourcePath={sourcePath}
        />
        {h.photoAttribution?.name ? (
          <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }} numberOfLines={1}>📷 {h.photoAttribution.name}</Text>
          </View>
        ) : null}
      </View>
      {h.audio ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <AudioPlayer tracks={[{ title: h.title, url: h.audio }]} compact playOnLeft tint={dark ? '#1A6B8A' : undefined} textLight={dark} />
        </View>
      ) : null}
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
              else if (h.coords) {
                if (Platform.OS === 'web') setShowMap(v => !v);
                else openLocation(h.coords.lat, h.coords.lng, h.title);
              }
            }}
            disabled={!h.coords && !(mapPoints && mapPoints.length > 0)}
          >
            <Text style={[st.hotelBtnTxt, !h.coords && !(mapPoints && mapPoints.length > 0) && st.hotelBtnTxtDisabled]}>{showMap ? 'הסתר מפה' : 'איפה זה'}</Text>
          </TouchableOpacity>
          <CategoryMapModal visible={showCatMapModal} points={mapPoints || []} focusName={h.title} focusCoords={h.coords} layerColor={layerColor} onClose={() => setShowCatMapModal(false)} />
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnPrimary, !placesQuery && !btnEnabled && st.hotelBtnDisabled]}
            activeOpacity={0.7}
            onPress={() => {
              if (placesQuery) {
                const t = isHotel ? 'hotel' : isAttraction ? 'attraction' : isRestaurant ? 'restaurant' : '';
                router.push(`/place?q=${encodeURIComponent(placesQuery)}&title=${encodeURIComponent(h.title)}&type=${t}` as any);
              }
              else if (hasGallery) setShowGallery(true);
              else if (h.pageUrl) Linking.openURL(h.pageUrl);
            }}
            disabled={!placesQuery && !btnEnabled}
          >
            <Text style={[st.hotelBtnTxt, !placesQuery && !btnEnabled && st.hotelBtnTxtDisabled]}>{placesQuery ? 'מידע' : pageBtnLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnSecondary, !h.mapUrl && st.hotelBtnDisabled]}
            activeOpacity={h.mapUrl ? 0.7 : 1}
            onPress={() => h.mapUrl && openMapUrl(h.mapUrl, h.title)}
            disabled={!h.mapUrl}
          >
            <Text style={[st.hotelBtnTxt, !h.mapUrl && st.hotelBtnTxtDisabled]}>{h.mapUrl && h.mapUrl.includes('wa.me') ? 'WhatsApp' : 'נווט למקום'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {placesQuery && showInfoModal && (
        <PlacesInfoModal query={placesQuery} title={h.title} onClose={() => setShowInfoModal(false)} hideHours={isHotel} showHotelPrices={isHotel} showAttractionTickets={isAttraction} isRestaurant={isRestaurant} />
      )}
    </View>
  );
}

function HotelMap({ coords, title, onClose }: { coords: { lat: number; lng: number }; title: string; onClose: () => void }) {
  const src = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${encodeURIComponent(title)})&z=15&output=embed`;
  return (
    <View style={{ height: 420, position: 'relative' }}>
      <MapEmbed src={src} style={{ flex: 1 }} />
      <TouchableOpacity style={st.mapClose} onPress={onClose}>
        <Text style={st.mapCloseX}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SubCard({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http') || item.icon.startsWith('/'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  const count =
    (item.hotels?.filter(h => h.visible !== false).length) ||
    (item.tours?.filter(t => t.visible !== false).length) ||
    (item.children?.filter((c: any) => c.visible !== false).length) || 0;
  return (
    <TouchableOpacity style={[st.card, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: resolveUri(item.icon) }} style={st.cardTop} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cardTop}>
          <Text style={st.cardIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.cardBottom}>
        <Text style={st.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.subtitle || count > 0 ? (
          <Text style={st.cardSub} numberOfLines={1}>
            {item.subtitle || ''}
            {count > 0 ? <Text style={{ color: 'rgba(28,43,53,0.5)', fontWeight: '600' }}>{item.subtitle ? ' ' : ''}({count})</Text> : null}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function SubBanner({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http') || item.icon.startsWith('/'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.banner, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: resolveUri(item.icon) }} style={st.bannerImg} resizeMode="cover" />
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
  const { width: screenW, height: screenH } = useWindowDimensions();
  const w = simulatedWidth ? Math.min(simulatedWidth, screenW) : screenW;
  const cardW = (w - 48) / 2;
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [guideMode, setGuideMode] = useState<'israeli' | 'local'>('israeli');

  const [cat, setCat] = useState<Item | null>(null);
  const [rootId, setRootId] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<{ title: string; path?: string }[]>([]);
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

      const findPath = (list: Item[], targetId: string, trail: Item[] = []): Item[] | null => {
        for (const c of list) {
          const next = [...trail, c];
          if (c.id === targetId) return next;
          if (c.children) {
            const r = findPath(c.children, targetId, next);
            if (r) return r;
          }
        }
        return null;
      };
      const targetId = aliased || (id as string);
      const path = findPath(all, targetId) || [];
      const computed = path.map((c, i) => ({
        title: c.title,
        path: i < path.length - 1 ? `/category/${c.id}` : undefined,
      }));
      setCrumbs(computed);
      if (path.length > 0) setRootId(path[0].id);
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

  const children = (cat.children || []).filter((c: any) => c.visible !== false);
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
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 10, color: '#888' }}>חזרה</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  if (cat.modal === 'flights') {
    return (
      <SafeAreaView style={[st.safe, darkCat && { backgroundColor: cat.heroBg || '#0f1419' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <FlightsModal visible={true} onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} bgColor="#2D4A5E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top','left','right']} style={[st.safe, { backgroundColor: '#fff' }, darkCat && { backgroundColor: cat.heroBg || '#0f1419' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <DevicePreviewBar />
      <AppHeader crumbs={crumbs} dark={darkCat} />
      {lockedOverlay}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ maxWidth: w, alignSelf: 'center', width: '100%' }}
        onScroll={(e) => setShowTopBtn(e.nativeEvent.contentOffset.y > screenH)}
        scrollEventThrottle={64}
      >
        {cat.heroImage ? (
          <View style={st.heroImgWrap}>
            <Image source={{ uri: resolveUri(cat.heroImage) }} style={st.heroImgBg} resizeMode="cover" />
            <View style={st.heroImgBottomBar}>
              <Text style={st.heroImgBarTxt}>{cat.titleEn || ''}</Text>
              <Text style={st.heroImgBarTxt}>{cat.titleGe || ''}</Text>
              <Text style={st.heroImgBarTxt}>{cat.title}</Text>
            </View>
          </View>
        ) : (
          (() => {
            const heroBg = cat.heroBg || cat.bg || (darkCat ? '#1a1a2e' : '#3DA5C4');
            const lightBg = isLight(heroBg);
            const titleColor = darkCat ? '#F4A94E' : lightBg ? '#1C2B35' : Colors.WHITE;
            const subColor = darkCat ? '#d4af37' : lightBg ? '#475569' : Colors.WHITE;
            return (
          <View style={[st.hero, { backgroundColor: heroBg }]}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              {cat.icon ? (
                (cat.icon.startsWith('/') || cat.icon.startsWith('http') || cat.icon.startsWith('data:'))
                  ? <Image source={{ uri: resolveUri(cat.icon) }} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="cover" />
                  : <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
              ) : null}
              <Text style={[st.heroTitle, { color: titleColor }]}>{cat.title}</Text>
            </View>
            {(() => {
              const heroCount =
                (cat.hotels?.filter(h => h.visible !== false).length) ||
                (cat.tours?.filter(t => t.visible !== false).length) ||
                (cat.children?.filter((c: any) => c.visible !== false).length) || 0;
              if (cat.subtitle || heroCount > 0) {
                return (
                  <Text style={[st.heroSub, { color: subColor }]}>
                    {cat.subtitle || ''}
                    {heroCount > 0 ? <Text style={{ opacity: 0.7 }}>{cat.subtitle ? ' ' : ''}({heroCount})</Text> : null}
                  </Text>
                );
              }
              return null;
            })()}
          </View>
            );
          })()
        )}

        {isAdmin && trialHoursLeft !== null && trialHoursLeft > 0 && !isLocked && paywall.mode === 'premium' && paywall.lockedCategories.includes(id as string) && (
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff8e1', paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f4a94e' }}>
            <Text style={{ fontSize: 16 }}>⏳</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e', writingDirection: 'rtl' }}>תקופת ניסיון חינם - נותרו {trialHoursLeft} שעות</Text>
          </View>
        )}

        {id === '5' && (() => {
          const aviasalesUrl = `https://www.aviasales.com/?origin_iata=TLV&destination_iata=BUS&marker=X5SEJjUA`;
          return (
            <View style={{ marginHorizontal: 12, marginTop: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL(aviasalesUrl)}
                activeOpacity={0.9}
                style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A6B8A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 26 }}>✈️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', writingDirection: 'rtl' }}>חפש טיסה לבטומי</Text>
                    <Text style={{ fontSize: 12, color: '#fff', writingDirection: 'rtl', opacity: 0.85 }}>טיסות מתל-אביב במחיר הטוב ביותר</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#F4A94E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 }}>
                  <Text style={{ color: '#1C2B35', fontSize: 13, fontWeight: '900' }}>חפש</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })()}

        {(rootId === '2' || rootId === '6' || rootId === '7') && cat.id !== 'a8' && (() => {
          const fallback = (cat.hotels || [])
            .filter(h => h.coords && h.visible !== false)
            .map(h => ({ name: h.title, lat: h.coords!.lat, lng: h.coords!.lng }));
          const pts = mapPoints.length ? mapPoints : fallback;
          if (pts.length === 0) return null;
          const bannerText = rootId === '2' ? 'איזו אטרקציה קרובה למיקום שלי עכשיו?' : rootId === '6' ? 'איזו מסעדה מומלצת קרובה למיקום שלי עכשיו?' : 'איזו חנות קרובה למיקום שלי עכשיו?';
          const filterParam = rootId === '2' ? 'אטרקצי' : rootId === '6' ? 'מסעד' : 'קני';
          const expandToTab = () => router.push('/(tabs)/map' as any);
          return (
            <View style={{ marginBottom: 8 }}>
              <View style={{ overflow: 'hidden' }}>
                <CategoryHeaderMap points={pts} color={mapLayerColor} />
              </View>
              <View style={{ marginHorizontal: 12 }}>
                {cat.id === 'r6' ? (
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/map?near=1&filter=${encodeURIComponent(filterParam)}` as any)}
                    activeOpacity={0.85}
                    style={{ marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 2, borderColor: '#F4A94E' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl', textAlign: 'center' }}>{bannerText}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/map?near=1&filter=${encodeURIComponent(filterParam)}` as any)}
                    activeOpacity={0.85}
                    style={{ marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e2e8f0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1A6B8A', writingDirection: 'rtl', textAlign: 'center' }}>{bannerText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })()}

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
                style={{ marginHorizontal: 0, marginTop: -16, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, backgroundColor: cat.heroBg || cat.bg || (darkCat ? '#1a1a2e' : '#3DA5C4'), shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, padding: 2 }}
                onPress={() => setTourMapOpen(!tourMapOpen)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingTop: 30, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, borderLeftWidth: 0.8, borderRightWidth: 0.8, borderBottomWidth: 0.8, borderColor: 'rgba(255,255,255,0.75)' }}>
                  <View style={{ position: 'absolute', top: 18, left: 8, right: 8, height: 0.8, backgroundColor: 'rgba(255,255,255,0.75)' }} />
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>⌬ מפת כל המסלולים</Text>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
                    <Text style={{ fontSize: 11, color: '#fff', fontWeight: '900', lineHeight: 14 }}>{tourMapOpen ? '▲' : '▼'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {tourMapOpen && (
                <View style={{ marginHorizontal: 8, marginTop: 8, borderRadius: 14, overflow: 'hidden', height: 500, borderWidth: 1, borderColor: '#ddd', position: 'relative' }}>
                  <MapEmbed src="https://www.google.com/maps/d/embed?mid=1ruTENTudaTnlMJh50IZ6Y_Odmu3Y4DE&ehbc=2E312F&z=13" style={{ flex: 1 }} />
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
                    <Text style={st.tourGridIcon}>🎧</Text>
                    <View style={st.tourGridStars}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Text key={n} style={[st.tourGridStar, n <= avg && st.tourGridStarOn]}>★</Text>
                      ))}
                      {r && r.count > 0 && <Text style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', marginRight: 3 }}>({r.count})</Text>}
                    </View>
                    <Text style={st.tourGridTitle} numberOfLines={3}>{t.title || 'ללא כותרת'}</Text>
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
                    {(cat.id === '2' || (cat.title || '').includes('אטרקציות')) && (
                      <SubCard
                        item={{ id: 'my-tours', title: 'הסיורים שלי', icon: '❤️', bg: '#FFD6E0', subtitle: 'סיורים שאתה מרכיב' } as any}
                        width={cardW}
                        onPress={() => router.push('/my-tours' as any)}
                      />
                    )}
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
            {cat.id === '10' && (
              <View style={{ paddingTop: 4 }}>
                <View style={{ flexDirection: 'row-reverse', backgroundColor: '#f1f5f9', borderRadius: 22, padding: 4, marginBottom: 6 }}>
                  {(['israeli','local'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setGuideMode(m)}
                      activeOpacity={0.85}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 18, backgroundColor: guideMode === m ? Colors.PRIMARY : 'transparent', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '900', color: guideMode === m ? '#fff' : '#475569', writingDirection: 'rtl' }}>
                        {m === 'israeli' ? '🇮🇱 ישראלים' : '🇬🇪 מקומיים'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <RecommendGuideButton categoryId="10" mode={guideMode} />
                <DeleteMySubmission accentColor="#F4A94E" />
              </View>
            )}
            {cat.id === 'a8' && (
              <View style={{ paddingTop: 4 }}>
                <RecommendDriverButton categoryId="a8" />
                <DeleteMySubmission accentColor="#F4A94E" />
              </View>
            )}
            {cat.longText && cat.hotels.length <= 10 && (
              <View style={{ width: '100%', alignSelf: 'stretch', paddingHorizontal: 16, paddingTop: 8 }}>
                <HtmlContent html={cat.longText} baseStyle={{ color: darkCat ? '#e2e8f0' : Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} />
              </View>
            )}
            {cat.introAudio && (
              <View style={{ paddingHorizontal: 0, paddingTop: 4, paddingBottom: 8 }}>
                <AudioPlayer tracks={[{ title: cat.title, url: cat.introAudio }]} compact playOnLeft tint={darkCat ? '#1A6B8A' : undefined} textLight={darkCat} ringPlay={darkCat} />
              </View>
            )}
            {cat.hotels.filter(h => h.visible !== false && (cat.id !== '10' || Boolean((h as any).isLocal) === (guideMode === 'local'))).map(h => (
              cat.cardStyle === 'passport'
                ? <PassportCard key={h.id} h={h} pageBtnLabel={cat.pageBtnLabel || 'אתר/פייסבוק'} />
                : cat.cardStyle === 'foodie'
                ? <FoodieCard key={h.id} h={h} isLast={cat.hotels!.filter(x => x.visible !== false).indexOf(h) === cat.hotels!.filter(x => x.visible !== false).length - 1} />
                : <HotelCard key={h.id} h={h} dark={darkCat} pageBtnLabel={cat.pageBtnLabel || 'לדף המלון'} mapPoints={mapPoints} layerColor={mapLayerColor || (mapPoints.length > 0 ? Colors.PRIMARY : undefined)} placesQuery={`${h.title} Batumi`} isHotel={rootId === '1'} isAttraction={rootId === '2'} isRestaurant={rootId === '6'} isNightlife={rootId === '4'} sourcePath={`/category/${cat.id}`} />
            ))}
            {cat.longText && cat.hotels.length > 10 && (
              <View style={{ width: '100%', alignSelf: 'stretch', paddingBottom: 16, paddingHorizontal: 16 }}>
                <HtmlContent html={cat.longText} baseStyle={{ color: darkCat ? '#e2e8f0' : Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} />
              </View>
            )}
            {(cat as any).longTextBottom && (
              <View style={{ width: '100%', alignSelf: 'stretch', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
                <HtmlContent html={(cat as any).longTextBottom} baseStyle={{ color: darkCat ? '#e2e8f0' : Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }} />
              </View>
            )}
            {cat.id === '10' && (
              <TouchableOpacity
                onPress={() => router.push('/category/a8' as any)}
                activeOpacity={0.85}
                style={{ marginHorizontal: 0, marginTop: 10, marginBottom: 20, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eef6fa', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1A6B8A33' }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ fontSize: 24 }}>🚖</Text>
                  <Text style={{ flex: 1, color: '#1C2B35', fontSize: 14, fontWeight: '800', writingDirection: 'rtl' }}>צריך נהג / טרנספר? עבור לנסיעות פרטיות</Text>
                </View>
                <Text style={{ color: '#1A6B8A', fontSize: 18, fontWeight: '900' }}>←</Text>
              </TouchableOpacity>
            )}
            {cat.cardStyle === 'foodie' && (
              <View style={{ backgroundColor: '#1e1e2a', borderRadius: 16, margin: 16, marginTop: 8, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#ff6b35', textAlign: 'center', writingDirection: 'rtl', marginBottom: 12 }}>💬 המלצות הגולשים</Text>
                {recommendations.length > 0 ? recommendations.map((r: any, i: number) => (
                  <View key={r.id} style={{ paddingVertical: 10, borderBottomWidth: i < recommendations.length - 1 ? 1 : 0, borderBottomColor: '#333' }}>
                    <View style={{ flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' }}>
                      {r.image && (
                        <Image source={{ uri: resolveUri(r.image) }} style={{ width: 50, height: 50, borderRadius: 8 }} resizeMode="cover" />
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
            <HtmlContent html={cat.longText} baseStyle={{ color: darkCat ? '#e2e8f0' : Colors.TEXT, lineHeight: 26, fontSize: 15, textAlign: 'right', writingDirection: 'rtl' }} />
          </View>
        ) : (
          <View style={st.body}>
            <Text style={[st.content, darkCat && { color: Colors.BACKGROUND }]}>
              {cat.description || 'אין תוכן עדיין'}
            </Text>
          </View>
        )}
      </ScrollView>
      {showTopBtn && (
        <TouchableOpacity
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={{
            position: 'absolute',
            left: 12,
            bottom: 84,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#1C2B35',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
            zIndex: 10,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 18, color: '#F4A94E', fontWeight: '900' }}>▲</Text>
        </TouchableOpacity>
      )}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },

  hero: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 13, color: Colors.WHITE, opacity: 0.85, marginTop: 2, textAlign: 'center', writingDirection: 'rtl' },
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
  cardTop: { height: 80, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 48 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 6, paddingHorizontal: 10, height: 72 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 10, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 1 },

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
  hotelBtnRow: { flexDirection: 'row-reverse', gap: 6 },
  hotelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  hotelBtnPrimary: { backgroundColor: '#1A6B8A' },
  hotelBtnSecondary: { backgroundColor: '#3DA5C4' },
  hotelBtnAccent: { backgroundColor: '#F4A94E' },
  hotelBtnTxt: { color: Colors.WHITE, fontSize: 12, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
  hotelBtnDisabled: { opacity: 0.6 },
  hotelBtnTxtDisabled: {},

  tourGrid: { padding: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  tourGridWrap: { width: '47%' },
  tourGridStars: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 0, marginVertical: 4, paddingHorizontal: 4 },
  tourGridStar: { fontSize: 11, color: '#d1d5db' },
  tourGridStarOn: { color: '#F4A94E' },
  tourGridPopular: { fontSize: 10, fontWeight: '800', color: '#B45309', textAlign: 'center', writingDirection: 'rtl', marginTop: 2, marginBottom: 4 },
  tourGridCard: {
    width: '47%', aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  tourGridIcon: { fontSize: 36, marginBottom: 4 },
  tourGridTitle: { fontSize: 12, fontWeight: '900', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  tourGridSub: { fontSize: 11, fontWeight: '600', color: 'rgba(0,0,0,0.6)', textAlign: 'center', writingDirection: 'rtl', marginTop: 4, minHeight: 28, lineHeight: 14 },
  tourBack: {
    alignSelf: 'flex-start', padding: 10, marginBottom: 8,
  },
  tourBackTxt: { fontSize: 15, fontWeight: '700', color: Colors.PRIMARY, writingDirection: 'rtl' },
});

function TerminalClock({ light }: { light?: boolean }) {
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
      <Text style={[termSt.clockLabel, light && { color: '#475569' }]}>🕐 זמן בטומי</Text>
      <Text style={[termSt.clock, light && { color: '#1C2B35' }]}>{time.replace(/:/g, blink ? ':' : ' ')}</Text>
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
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <View style={[termSt.liveRow, !dark && { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
            <BlinkDot />
            <Text style={[termSt.liveText, !dark && { color: '#fff' }]}>LIVE</Text>
          </View>
          <TouchableOpacity onPress={() => setRefreshKey(k => k + 1)} style={[termSt.refreshBtn, !dark && { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' }]}>
            <Text style={[termSt.refreshTxt, !dark && { color: '#1C2B35' }]}>🔄 רענן</Text>
          </TouchableOpacity>
        </View>
        <TerminalClock light={!dark} />
      </View>
      <View style={[artSt.cardHeader, dark && { marginBottom: 4 }]}>
        <Text style={[artSt.cardIcon, { fontSize: dark ? 22 : 28 }]}>{dark ? '🚆' : '🚌'}</Text>
        <Text style={[artSt.cardTitle, dark && { color: '#4ade80' }]}>{timetable.title || 'לוח זמנים'}</Text>
      </View>
      {timetable.source ? (
        <Text style={{ fontSize: 11, color: dark ? '#6b7280' : '#888', textAlign: 'center', writingDirection: 'rtl', marginBottom: 10 }}>{timetable.source}</Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
        {days.map((d, i) => {
          const isOn = selectedDay === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                termSt.dayBtn,
                !dark && { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#cbd5e1' },
                isOn && (dark
                  ? { backgroundColor: '#86efac' }
                  : { backgroundColor: color || Colors.PRIMARY, borderColor: color || Colors.PRIMARY }),
              ]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[
                termSt.dayLabel,
                !dark && { color: '#1C2B35', fontWeight: '900' },
                isOn && { color: '#0f172a', fontWeight: '900' },
              ]}>{d.label}</Text>
              <Text style={[
                termSt.dayDate,
                !dark && { color: '#1C2B35', fontWeight: '700' },
                isOn && { color: '#0f172a', fontWeight: '800' },
              ]}>{d.date}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
        {timetable.tabs.map((t, i) => {
          const on = activeTab === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                artSt.tab,
                { backgroundColor: dark ? '#1e293b' : '#fff', borderWidth: 1.5, borderColor: dark ? '#334155' : '#cbd5e1' },
                on && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
              ]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[
                artSt.tabTxt,
                { color: dark ? '#94a3b8' : '#475569', fontWeight: '700' },
                on && { color: '#fff', fontWeight: '900' },
              ]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  const termMode = !!art.terminal;
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
              style={[artSt.actionBtn, termMode
                ? { backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: btn.type === 'map' ? '#fbbf24' : btn.type === 'navigate' ? '#38bdf8' : btn.type === 'ticket' ? '#4ade80' : '#94a3b8' }
                : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: btn.type === 'map' ? '#D97706' : btn.type === 'navigate' ? '#0E7490' : btn.type === 'ticket' ? '#047857' : '#1A6B8A' }
              ]}
              onPress={() => {
                if (btn.type === 'link' && btn.url) Linking.openURL(btn.url);
                else if (btn.type === 'navigate' && btn.coords)
                  openDirections(btn.coords.lat, btn.coords.lng, btn.label);
                else if (btn.type === 'map' && btn.coords) {
                  if (Platform.OS === 'web') setShowMap(showMap ? null : btn.coords);
                  else openLocation(btn.coords.lat, btn.coords.lng, btn.label);
                }
                else if (btn.type === 'ticket' && btn.coords) {
                  if (Platform.OS === 'web') setShowMap(showMap ? null : btn.coords);
                  else openLocation(btn.coords.lat, btn.coords.lng, btn.label);
                }
              }}
            >
              <Text style={[artSt.actionBtnTxt, { fontWeight: '900' },
                termMode
                  ? { color: btn.type === 'map' ? '#fbbf24' : btn.type === 'navigate' ? '#38bdf8' : btn.type === 'ticket' ? '#4ade80' : '#94a3b8' }
                  : { color: btn.type === 'map' ? '#D97706' : btn.type === 'navigate' ? '#0E7490' : btn.type === 'ticket' ? '#047857' : '#1A6B8A' }
              ]}>{btn.type === 'map' && showMap ? 'סגור מפה' : btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {art.apps && art.apps.length > 0 && (
        <View style={artSt.appsCard}>
          <Text style={artSt.appsTitle}>📲 אפליקציות מומלצות להורדה</Text>
          {art.apps.map((app, i) => (
            <TouchableOpacity key={i} style={artSt.appRow} onPress={() => Linking.openURL(app.url)} activeOpacity={0.7}>
              <Image source={{ uri: resolveUri(app.logo) }} style={artSt.appLogo} resizeMode="contain" />
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
        <View key={i} style={[artSt.card, { backgroundColor: darkCat ? 'rgba(255,255,255,0.08)' : (art.color || '#f0f4f8') + '60' }]}>
          <View style={artSt.cardHeader}>
            <Text style={artSt.cardIcon}>{sec.icon}</Text>
            <Text style={[artSt.cardTitle, darkCat && { color: '#f1f5f9' }]}>{sec.title}</Text>
          </View>
          <Text style={[artSt.cardTip, darkCat && { color: '#cbd5e1' }]}>{sec.tip}</Text>
          {sec.image ? <Image source={{ uri: resolveUri(sec.image) }} style={artSt.cardImg} resizeMode="cover" /> : null}
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
  btnRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: { minWidth: 140, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnTxt: { color: Colors.WHITE, fontWeight: '800', fontSize: 13 },
  tableHeader: { flexDirection: 'row-reverse', borderBottomWidth: 2, borderBottomColor: '#cbd5e1', paddingBottom: 8, marginBottom: 4 },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 8, borderRadius: 6 },
  tableCell: { flex: 1, fontSize: 12, color: '#1C2B35', textAlign: 'center', writingDirection: 'rtl', fontWeight: '600' },
  tableBold: { fontWeight: '900', color: Colors.TEXT },
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
    marginTop: 12, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2,
  },
  ratingLabel: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  stars: { flexDirection: 'row-reverse', gap: 2 },
  star: { fontSize: 26, color: '#d1d5db', paddingHorizontal: 1 },
  starOn: { color: '#F4A94E' },
  submitBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.PRIMARY,
  },
  submitTxt: { color: Colors.WHITE, fontSize: 11, fontWeight: '800' },
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
