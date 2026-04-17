import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { fetchContent } from '../../constants/api';

type MapPoint = { name: string; lat: number; lng: number; description?: string };
type MapLayer = { name: string; points: MapPoint[] };

export default function MapScreen() {
  const { dark } = useContext(ThemeContext);
  const [active, setActive] = useState('הכל');
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;
  const { lat, lng, name } = useLocalSearchParams<{ lat?: string; lng?: string; name?: string }>();

  useEffect(() => {
    fetchContent().then(data => {
      if (data.mapLayers) setLayers(data.mapLayers);
    }).catch(() => {});
  }, []);

  const buildMapSrc = () => {
    if (focusPoint) {
      return `https://www.google.com/maps?q=${focusPoint.lat},${focusPoint.lng}(${encodeURIComponent(focusPoint.name)})&hl=iw&z=16&output=embed`;
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barContent} style={styles.bar}>
        {categories.map((c) => {
          const on = c === active;
          return (
            <TouchableOpacity key={c} onPress={() => { setActive(c); setFocusPoint(null); }} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <iframe
            title="batumi-map"
            src={buildMapSrc()}
            style={{ width: '100%', height: 'calc(100% + 50px)', border: 0, marginTop: -50 } as any}
          />
        </View>
        {active !== 'הכל' && (() => {
          const layer = layers.find(l => l.name === active);
          if (!layer) return null;
          return (
            <View style={styles.panel}>
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
                    onPress={() => setFocusPoint({ lat: p.lat, lng: p.lng, name: p.name })}>
                    <Text style={styles.panelIcon}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.panelName} numberOfLines={1}>{p.name}</Text>
                      {p.description ? <Text style={styles.panelDesc} numberOfLines={2}>{p.description.replace(/<[^>]+>/g, '').substring(0, 60)}</Text> : null}
                    </View>
                    <Text style={styles.panelArrow}>←</Text>
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
    backgroundColor: Colors.WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10,
    paddingHorizontal: 14,
  },
  panelHandle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  panelHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  panelTitle: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  panelCount: { fontSize: 12, color: '#888', fontWeight: '600' },
  panelScroll: { paddingBottom: 20 },
  panelItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  panelIcon: { fontSize: 18 },
  panelName: { fontSize: 14, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right' },
  panelDesc: { fontSize: 11, color: '#888', writingDirection: 'rtl', textAlign: 'right', marginTop: 2 },
  panelArrow: { fontSize: 16, color: Colors.PRIMARY, fontWeight: '700' },
  panelClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  panelCloseX: { fontSize: 16, color: '#666', fontWeight: '700' },
});

