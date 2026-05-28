import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export default function MapEmbed({ src, style }: { src: string; style?: StyleProp<ViewStyle> }) {
  const isMyMaps = src.includes('/maps/d/embed') || src.includes('mid=');
  return (
    <View style={[style, { overflow: 'hidden' as any }]}>
      {React.createElement('iframe', {
        src,
        title: 'map',
        style: isMyMaps
          ? { width: '100%', height: 'calc(100% + 60px)', border: 0, marginTop: -60 } as any
          : { width: '100%', height: '100%', border: 0 } as any,
      })}
    </View>
  );
}
