import React from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapEmbed({ src, style }: { src: string; style?: StyleProp<ViewStyle> }) {
  // MyMaps embed has a 60px black header bar that we hide via negative top offset.
  const isMyMaps = src.includes('/maps/d/embed') || src.includes('mid=');

  if (Platform.OS === 'web') {
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

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <WebView
        source={{ uri: src }}
        style={isMyMaps ? { flex: 1, marginTop: -60, marginBottom: -10 } : { flex: 1 }}
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}
