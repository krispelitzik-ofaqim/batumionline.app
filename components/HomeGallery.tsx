import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { resolveUri, fetchContent } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOME_IMAGES } from '../assets/images/home';

type GalleryItem = { key: string; source: any; url?: string };

const LOCAL_FALLBACK: GalleryItem[] = HOME_IMAGES.map(h => ({ key: h.key, source: h.source }));

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryItem[]>(LOCAL_FALLBACK);
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('@homeBanner').then(cached => {
      if (cached) {
        try {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr) && arr.length > 0) {
            setFiles(arr.map((u: string, i: number) => ({ key: `hb${i}`, source: { uri: resolveUri(u) }, url: u })));
          }
        } catch {}
      }
    });
    fetchContent().then((d: any) => {
      if (Array.isArray(d?.homeBanner)) {
        const valid = d.homeBanner.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
        if (valid.length > 0) {
          setFiles(valid.map((u: string, i: number) => ({ key: `hb${i}`, source: { uri: resolveUri(u) }, url: u })));
          AsyncStorage.setItem('@homeBanner', JSON.stringify(valid)).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (files.length < 2) return;
    timer.current = setInterval(() => {
      setIdx(i => (i + 1) % files.length);
    }, 4000);
    return () => clearInterval(timer.current);
  }, [files.length]);

  if (files.length === 0) return null;

  const current = files[idx];

  return (
    <View style={[styles.wrap, { width: width - 32 }]}>
      <Image source={current.source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      {files.length > 1 && (
        <View style={styles.dots}>
          {files.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setIdx(i)}>
              <View style={[styles.dot, i === idx && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 180, borderRadius: 18, overflow: 'hidden',
    alignSelf: 'center', marginBottom: 18, backgroundColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
  },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
});
