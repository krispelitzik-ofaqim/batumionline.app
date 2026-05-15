import React from 'react';
import { Platform, View, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { API_BASE } from '../constants/api';

type Point = { name: string; lat: number; lng: number };
type Props = {
  points: Point[];
  color?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  height?: number;
};

export default function CategoryHeaderMap({ points, color = '#1A6B8A', style, onPress, height = 180 }: Props) {
  if (!points || points.length === 0) return null;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const dLat = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.4);
  const dLng = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.4);

  const inner = Platform.OS === 'web'
    ? (() => {
        const pointsParam = points.map(p => `${p.lat},${p.lng}`).join(';');
        const colorParam = color.startsWith('#') ? '0x' + color.slice(1) : color;
        const src = `${API_BASE}/api/static-map?points=${encodeURIComponent(pointsParam)}&w=640&h=${height}&color=${encodeURIComponent(colorParam)}`;
        return React.createElement('img', {
          key: 'staticmap',
          src,
          alt: 'category-map',
          style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as any,
        });
      })()
    : (
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
    );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[style, { overflow: 'hidden' }]}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[style, { overflow: 'hidden' }]}>{inner}</View>;
}
