import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { fetchContent, resolveUri } from '../constants/api';

const FALLBACK = [
  require('../assets/welcome/galery1.jpg'),
  require('../assets/welcome/galery2.jpg'),
  require('../assets/welcome/galery3.jpg'),
  require('../assets/welcome/galery4.jpg'),
  require('../assets/welcome/galery5.jpg'),
  require('../assets/welcome/galery6.jpg'),
];

const DWELL_MS = 5000;
const FADE_MS = 1500;

const isBadUrl = (u: any): boolean => typeof u !== 'string' || u.trim().length === 0 || u.includes('localhost') || u.includes('127.0.0.1');

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [sources, setSources] = useState<any[]>(FALLBACK);
  const [idx, setIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    fetchContent().then((d: any) => {
      if (!active) return;
      const arr = Array.isArray(d?.homeGallery) ? d.homeGallery.filter((u: any) => !isBadUrl(u)) : [];
      if (arr.length > 0) setSources(arr.map((u: string) => ({ uri: resolveUri(u) })));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sources.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start(() => {
        setIdx(prev => (prev + 1) % sources.length);
        setNextIdx(prev => (prev + 1) % sources.length);
        fade.setValue(0);
      });
    }, DWELL_MS);
    return () => clearInterval(t);
  }, [sources.length]);

  return (
    <View style={[styles.wrap, { width: width - 32 }]}>
      <Animated.Image
        source={sources[idx]}
        style={[StyleSheet.absoluteFillObject, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        resizeMode="cover"
      />
      {sources.length > 1 && (
        <Animated.Image
          source={sources[nextIdx]}
          style={[StyleSheet.absoluteFillObject, { opacity: fade }]}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
});
