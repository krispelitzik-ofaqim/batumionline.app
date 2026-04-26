import React from 'react';
import { Platform, View, StyleProp, ViewStyle, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

function extractLatLng(src: string): { lat: number; lng: number } | null {
  const m = src.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || src.match(/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

export default function MapEmbed({ src, style }: { src: string; style?: StyleProp<ViewStyle> }) {
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

  if (isMyMaps) {
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <WebView
          source={{ uri: src }}
          style={{ flex: 1, marginTop: -60, marginBottom: -10 }}
          scalesPageToFit
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>
    );
  }

  const coords = extractLatLng(src);
  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#e5edf2', alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>🗺️</Text>
      <Text style={{ fontSize: 14, color: '#475569', writingDirection: 'rtl', textAlign: 'center', marginBottom: 16 }}>
        לצפייה במפה אינטראקטיבית פתח באפליקציית מפות
      </Text>
      <TouchableOpacity
        onPress={() => {
          const url = coords
            ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
            : src.replace('output=embed', '').replace('&output=', '&');
          Linking.openURL(url);
        }}
        style={{ backgroundColor: '#1A6B8A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>📍 פתח במפות גוגל</Text>
      </TouchableOpacity>
    </View>
  );
}
