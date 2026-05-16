import React, { useState } from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Point = { name: string; lat: number; lng: number };
type Props = {
  points: Point[];
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function CategoryHeaderMap({ points, color = '#1A6B8A', style }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!points || points.length === 0) return null;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const dLat = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.4);
  const dLng = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.4);

  return (
    <View style={[style, { overflow: 'hidden', position: 'relative', height: expanded ? 360 : 180 }]}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: dLat, longitudeDelta: dLng }}
      >
        {points.map((p, i) => (
          <Marker
            key={`${p.name}-${i}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.name}
            pinColor={color}
          />
        ))}
      </MapView>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 10, height: 36, borderRadius: 18, backgroundColor: 'rgba(28,43,53,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>{expanded ? '−' : '×2'}</Text>
      </TouchableOpacity>
    </View>
  );
}
