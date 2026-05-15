import React from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity, Text } from 'react-native';
import { API_BASE } from '../constants/api';

type Point = { name: string; lat: number; lng: number };
type Props = {
  points: Point[];
  color?: string;
  style?: StyleProp<ViewStyle>;
  onExpand?: () => void;
};

export default function CategoryHeaderMap({ points, color = '#1A6B8A', style, onExpand }: Props) {
  if (!points || points.length === 0) return null;

  const pointsParam = points.map(p => `${p.lat},${p.lng},${encodeURIComponent(p.name)}`).join(';');
  const colorParam = color;
  const src = `${API_BASE}/api/map-html?points=${encodeURIComponent(pointsParam)}&color=${encodeURIComponent(colorParam)}`;

  const frame = React.createElement('iframe', {
    key: 'mapframe',
    src,
    title: 'category-map',
    style: { width: '100%', height: '100%', border: 0, display: 'block' } as any,
  });

  return (
    <View style={[style, { overflow: 'hidden', position: 'relative' }]}>
      {frame}
      {onExpand && (
        <TouchableOpacity
          onPress={onExpand}
          style={{ position: 'absolute', left: 8, bottom: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(28,43,53,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>⤢</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
