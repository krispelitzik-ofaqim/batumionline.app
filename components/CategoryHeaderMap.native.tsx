import React from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Point = { name: string; lat: number; lng: number };
type Props = {
  points: Point[];
  color?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  height?: number;
};

export default function CategoryHeaderMap({ points, color = '#1A6B8A', style, onPress }: Props) {
  if (!points || points.length === 0) return null;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const dLat = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.4);
  const dLng = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.4);

  const inner = (
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
