import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { fetchContent } from '../../constants/api';
import MapEmbed from '../../components/MapEmbed';

type MapPoint = { name: string; lat: number; lng: number; description?: string };
type MapLayer = { name: string; points: MapPoint[] };

export default function MapScreen() {
  const { dark } = useContext(ThemeContext);
  const [active, setActive] = useState('הכל');
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;
  const { lat, lng, name, near } = useLocalSearchParams<{ lat?: string; lng?: string; name?: string; near?: string }>();
  const nearMode = near === '1';

  useEffect(() => {
    if (!nearMode) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocError(err.message || 'לא ניתן לקבל מיקום'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocError('זמין כרגע רק בגרסת ה-Web');
    }
  }, [nearMode]);

  const allPoints = layers.flatMap(l => l.points.map(p => ({ ...p, category: l.name })));
  const nearby = userLoc ? allPoints
    .map(p => {
      const R = 6371;
      const dLat = (p.lat - userLoc.lat) * Math.PI / 180;
      const dLng = (p.lng - userLoc.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(a));
      return { ...p, distKm: dist };
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 10) : [];

  useEffect(() => {
    const load = () => fetchContent().then(data => {
      if (data.mapLayers) setLayers(data.mapLayers);
    }).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const buildMapSrc = () => {
    if (focusPoint) {
      return `https://www.google.com/maps?q=${focusPoint.lat},${focusPoint.lng}(${encodeURIComponent(focusPoint.name)})&hl=iw&z=16&output=embed`;
    }
    if (nearMode && userLoc) {
      return `https://www.google.com/maps?q=${userLoc.lat},${userLoc.lng}&hl=iw&z=15&output=embed`;
    }
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}${name ? `(${encodeURIComponent(name)})` : ''}&hl=iw&z=16&output=embed`;
    }
    if (active !== 'הכל') {
      const layer = layers.find(l => l.name === active);
      if (layer && layer.points.length > 0) {
        const center = layer.points[0];
        return `https://www.google.com/maps?q=${center.lat},${center.lng}(${encodeURIComponent(center.name)})&hl=iw&z=14&output=embed`;
      }
    }
    return 'https://www.google.com/maps/d/embed?mid=1gr51dJM54EabXWSMhPE5f8n2J3-iiyQ&ehbc=2E312F';
  };

  const categories = ['הכל', ...layers.map(l => l.name)];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setMenuOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 20 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' }}>קטגוריות מפה</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map(c => {
                const on = c === active;
                const layer = layers.find(l => l.name === c) as any;
                const color = layer?.color || (c === 'הכל' ? Colors.PRIMARY : '#64748b');
                return (
                  <TouchableOpacity key={c} onPress={() => { setActive(c); setFocusPoint(null); setMenuOpen(false); }} style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: on ? color + '20' : 'transparent', borderRightWidth: 4, borderRightColor: color }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: on ? '900' : '700', color, textAlign: 'right', writingDirection: 'rtl' }}>{c}</Text>
                    {layer?.points && <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>{layer.points.length}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <MapEmbed src={buildMapSrc()} style={{ flex: 1 }} />
        </View>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.openMenuBtn} activeOpacity={0.85}>
          <Text style={styles.openMenuTxt}>📍 {active === 'הכל' ? 'בחר קטגוריה' : active}</Text>
          <Text style={styles.openMenuArrow}>▲</Text>
        </TouchableOpacity>

        {nearMode && (
          <View style={[styles.panel, { backgroundColor: '#F4A94E', maxHeight: '55%' }]}>
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>📍 קרוב אליי</Text>
              <Text style={styles.panelCount}>{nearby.length} מיקומים קרובים</Text>
              <TouchableOpacity onPress={() => { setUserLoc(null); setLocError(null); setActive('הכל'); }} style={styles.panelClose}>
                <Text style={styles.panelCloseX}>✕</Text>
              </TouchableOpacity>
            </View>
            {locError ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', writingDirection: 'rtl', textAlign: 'right' }}>{locError}</Text>
              </View>
            ) : !userLoc ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', writingDirection: 'rtl', textAlign: 'right' }}>טוען מיקום...</Text>
              </View>
            ) : (
              <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
                {nearby.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.panelItem}
                    activeOpacity={0.7}
                    onPress={() => setFocusPoint(focusPoint?.name === p.name ? null : { lat: p.lat, lng: p.lng, name: p.name })}
                  >
                    <Text style={styles.panelIcon}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.panelName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.panelDesc}>{(p as any).category} · {(p as any).distKm < 1 ? `${Math.round((p as any).distKm * 1000)} מ׳` : `${(p as any).distKm.toFixed(1)} ק״מ`}</Text>
                    </View>
                    <Text style={styles.panelArrow}>←</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        {active !== 'הכל' && (() => {
          const layer = layers.find(l => l.name === active);
          if (!layer) return null;
          return (
            <View style={[styles.panel, { backgroundColor: (layer as any).color || '#fff' }]}>
              <View style={styles.panelHandle} />
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>{active}</Text>
                <Text style={styles.panelCount}>{layer.points.length} מיקומים</Text>
                <TouchableOpacity onPress={() => { setActive('הכל'); setFocusPoint(null); }} style={styles.panelClose}>
                  <Text style={styles.panelCloseX}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
                {layer.points.map((p, i) => (
                  <TouchableOpacity key={i} style={styles.panelItem} activeOpacity={0.7}
                    onPress={() => setFocusPoint(focusPoint?.name === p.name ? null : { lat: p.lat, lng: p.lng, name: p.name })}>
                    <Text style={styles.panelIcon}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.panelName, focusPoint?.name === p.name && { fontWeight: '900' }]} numberOfLines={1}>{p.name}</Text>
                      {focusPoint?.name === p.name && p.description ? (
                        Platform.OS === 'web' ? (
                          React.createElement('div', {
                            dangerouslySetInnerHTML: { __html: p.description },
                            style: {
                              marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.9)',
                              direction: 'rtl', textAlign: 'right', lineHeight: '1.6',
                              maxHeight: 150, overflow: 'auto',
                            },
                          })
                        ) : <Text style={styles.panelDesc}>{(p.description || '').replace(/<[^>]+>/g, '')}</Text>
                      ) : p.description ? <Text style={styles.panelDesc} numberOfLines={1}>{p.description.replace(/<[^>]+>/g, '').substring(0, 40)}</Text> : null}
                    </View>
                    <Text style={styles.panelArrow}>{focusPoint?.name === p.name ? '▼' : '←'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: { maxHeight: 52, flexGrow: 0 },
  barContent: { paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.WHITE, marginHorizontal: 4, borderWidth: 1, borderColor: Colors.SECONDARY },
  chipOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  chipAccent: { backgroundColor: Colors.ACCENT, borderColor: Colors.ACCENT },
  chipText: { color: Colors.PRIMARY, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: Colors.WHITE },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '45%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10,
    paddingHorizontal: 14,
  },
  panelHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  panelHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  panelTitle: { fontSize: 16, fontWeight: '900', color: '#fff', writingDirection: 'rtl' },
  panelCount: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  panelScroll: { paddingBottom: 20 },
  panelItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  panelIcon: { fontSize: 18 },
  panelName: { fontSize: 14, fontWeight: '700', color: '#fff', writingDirection: 'rtl', textAlign: 'right' },
  panelDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  panelArrow: { fontSize: 16, color: '#fff', fontWeight: '700' },
  panelClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  panelCloseX: { fontSize: 16, color: '#fff', fontWeight: '700' },
  layerGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, padding: 8 },
  layerChip: { backgroundColor: '#f0f4f8', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  layerChipOn: { backgroundColor: Colors.PRIMARY },
  layerChipTxt: { fontSize: 12, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  layerChipTxtOn: { color: '#fff' },
  openMenuBtn: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  openMenuTxt: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  openMenuArrow: { fontSize: 10, color: Colors.PRIMARY, fontWeight: '900' },
});

