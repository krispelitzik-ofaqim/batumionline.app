import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Platform, Linking, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/colors';
import { fetchContent, resolveUri } from '../constants/api';
import MapEmbed from './MapEmbed';

type Camera = { id: string; name: string; url: string; lat?: number; lng?: number; poster?: string; external?: boolean };

const STREAM_URLS: string[] = [
  'https://rtsp.me/embed/AdtR7Kan/',
  'https://rtsp.me/embed/9GZkEdKh/',
  'https://rtsp.me/embed/HYdb5Dbf/',
  'https://rtsp.me/embed/AZ28Sih4/',
];

const POSTER_URLS: string[] = [
  '/uploads/1776681329648-973.png',
  '/uploads/1776681347754-653.png',
  '/uploads/1776681374874-256.png',
  '/uploads/1776680848799-463.png',
];

export default function CamerasModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor: string }) {
  const [selected, setSelected] = useState<Camera | null>(null);
  const [mapCam, setMapCam] = useState<Camera | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    if (!visible) return;
    fetchContent().then((d: any) => {
      const layers = d.mapLayers || [];
      const camLayer = layers.find((l: any) => (l.name || '').includes('מצלמ'));
      if (camLayer && camLayer.points) {
        const list: Camera[] = camLayer.points.slice(0, 4).map((p: any, i: number) => ({
          id: `cam${i + 1}`,
          name: p.name || `מצלמה ${i + 1}`,
          url: STREAM_URLS[i] || '',
          poster: POSTER_URLS[i] || '',
          lat: p.lat,
          lng: p.lng,
        }));
        list.push({
          id: 'cam5',
          name: 'Alliance Privilege (קניון)',
          url: 'https://alliance.ge/en/live/alliance-privilege',
          external: true,
          poster: '/uploads/1776681974391-806.png',
        });
        list.push({
          id: 'cam6',
          name: 'Alliance Centropolis',
          url: 'https://alliance.ge/en/live/alliance-centropolis',
          external: true,
          poster: '/uploads/1776682079343-887.png',
        });
        setCameras(list);
      }
    }).catch(() => {});
  }, [visible]);

  const openCam = (cam: Camera) => {
    if (!cam.url) return;
    if (Platform.OS === 'web' && !cam.external) { setSelected(cam); return; }
    if (Platform.OS === 'web') Linking.openURL(cam.url);
    else WebBrowser.openBrowserAsync(cam.url).catch(() => Linking.openURL(cam.url));
  };

  const renderTile = (cam: Camera, featured: boolean) => (
    <View key={cam.id} style={[featured ? s.featured : s.tile, !cam.url && s.tileDisabled]}>
      <TouchableOpacity
        activeOpacity={cam.url ? 0.85 : 1}
        onPress={() => openCam(cam)}
        disabled={!cam.url}
        style={featured ? s.featuredInner : s.tileInner}
      >
        {cam.poster ? (
          <View style={featured ? s.posterFull : s.posterThumb}>
            <Image source={{ uri: resolveUri(cam.poster) }} style={s.posterImg} resizeMode="cover" />
            {cam.url && <Text style={s.liveTag}>● חי</Text>}
          </View>
        ) : (
          <View style={featured ? s.posterFull : s.posterThumb}>
            <Text style={{ fontSize: featured ? 40 : 22 }}>📷</Text>
          </View>
        )}
        <View style={s.meta}>
          <Text style={[s.name, featured && s.nameFeatured]} numberOfLines={1}>{cam.name}</Text>
          {cam.lat && cam.lng ? (
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setMapCam(cam); }} style={s.locBtn}>
              <Text style={s.locTxt}>📍 מיקום</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );

  const featured = cameras.find(c => c.id === 'cam4');
  const rest = cameras.filter(c => c.id !== 'cam4');

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>📹 מצלמות חיות מבטומי</Text>
          <Text style={s.subtitle}>לחץ לצפייה בשידור חי</Text>

          {featured && renderTile(featured, true)}

          <View style={s.grid}>
            {rest.map(cam => renderTile(cam, false))}
          </View>
        </ScrollView>

        {/* Stream player */}
        {selected && (
          <View style={s.playerOverlay}>
            <TouchableOpacity style={s.playerClose} onPress={() => setSelected(null)}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <View style={s.playerContent}>
              <Text style={s.playerTitle}>{selected.name}</Text>
              <View style={s.playerFrame}>
                <MapEmbed src={selected.url} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        )}

        {/* Location map */}
        {mapCam && (
          <View style={s.playerOverlay}>
            <TouchableOpacity style={s.playerClose} onPress={() => setMapCam(null)}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <View style={s.playerContent}>
              <Text style={s.playerTitle}>📍 מיקום: {mapCam.name}</Text>
              <View style={s.playerFrame}>
                <MapEmbed src={`https://maps.google.com/maps?q=${mapCam.lat},${mapCam.lng}(${encodeURIComponent(mapCam.name)})&z=15&output=embed`} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeX: { fontSize: 18, color: Colors.WHITE, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.WHITE, textAlign: 'center', marginBottom: 4, writingDirection: 'rtl' },
  subtitle: { fontSize: 11, color: Colors.WHITE, opacity: 0.6, textAlign: 'center', marginBottom: 14, writingDirection: 'rtl' },

  // Featured (wide)
  featured: {
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10, overflow: 'hidden',
  },
  featuredInner: { gap: 0 },
  posterFull: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', position: 'relative' },

  // Small tile (horizontal row)
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  tile: {
    width: '48%',
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  tileInner: { gap: 0 },
  posterThumb: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  posterImg: { width: '100%', height: '100%' },

  tileDisabled: { opacity: 0.5 },
  liveTag: { position: 'absolute', top: 4, right: 4, fontSize: 9, fontWeight: '900', color: '#fff', backgroundColor: 'rgba(220,38,38,0.9)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, letterSpacing: 0.5 },

  meta: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  name: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  nameFeatured: { fontSize: 13, fontWeight: '800' },
  locBtn: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
  locTxt: { fontSize: 10, fontWeight: '700', color: Colors.WHITE },

  playerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100 },
  playerClose: { position: 'absolute', top: 40, right: 20, zIndex: 110, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  playerContent: { flex: 1, paddingTop: 100, paddingHorizontal: 16, paddingBottom: 20 },
  playerTitle: { fontSize: 15, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', marginBottom: 10, writingDirection: 'rtl' },
  playerFrame: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
});
