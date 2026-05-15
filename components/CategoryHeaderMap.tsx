import React from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
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

  const pointsParam = points.map(p => `${p.lat},${p.lng}`).join(';');
  const colorParam = color.startsWith('#') ? '0x' + color.slice(1) : color;
  const src = `${API_BASE}/api/static-map?points=${encodeURIComponent(pointsParam)}&w=640&h=${height}&color=${encodeURIComponent(colorParam)}`;

  const inner = React.createElement('img', {
    key: 'staticmap',
    src,
    alt: 'category-map',
    style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as any,
  });

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[style, { overflow: 'hidden' }]}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[style, { overflow: 'hidden' }]}>{inner}</View>;
}
