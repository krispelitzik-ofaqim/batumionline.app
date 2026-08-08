import React from 'react';
import { Platform, View, StyleProp, ViewStyle, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps';
import { useI18n } from '../constants/i18n';

const OPEN_MAPS: Record<string, string> = { he: 'פתח במפות', en: 'Open in Maps', fa: 'باز کردن در نقشه', ru: 'Открыть в картах' };

function extractLatLng(src: string): { lat: number; lng: number } | null {
  const m = src.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || src.match(/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

function extractTitle(src: string): string | null {
  const m = src.match(/\((.*?)\)/);
  if (m) return decodeURIComponent(m[1]);
  return null;
}

export default function MapEmbed({ src, style }: { src: string; style?: StyleProp<ViewStyle> }) {
  const { lang } = useI18n();
  const openMaps = OPEN_MAPS[lang] || OPEN_MAPS.en;
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
  const title = extractTitle(src);

  if (coords) {
    const region = { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <MapView
          style={{ flex: 1 }}
          region={region}
          showsUserLocation={false}
          showsPointsOfInterest
        >
          <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={title || ''} />
        </MapView>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#e5edf2', alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>🗺️</Text>
      <TouchableOpacity onPress={() => Linking.openURL(src.replace('output=embed', '').replace('&output=', '&'))} style={{ backgroundColor: '#1A6B8A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>📍 {openMaps}</Text>
      </TouchableOpacity>
    </View>
  );
}
