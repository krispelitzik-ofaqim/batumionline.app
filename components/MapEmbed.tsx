import React from 'react';
import { Platform, View, StyleProp, ViewStyle, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps';

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
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          showsUserLocation={false}
          showsPointsOfInterest
        >
          <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} title={title || ''} />
        </MapView>
        <TouchableOpacity
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`)}
          style={{ position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: '#1A6B8A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>🧭 נווט</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#e5edf2', alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>🗺️</Text>
      <TouchableOpacity onPress={() => Linking.openURL(src.replace('output=embed', '').replace('&output=', '&'))} style={{ backgroundColor: '#1A6B8A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>📍 פתח במפות</Text>
      </TouchableOpacity>
    </View>
  );
}
