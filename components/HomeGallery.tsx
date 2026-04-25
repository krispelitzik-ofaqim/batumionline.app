import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { API_BASE, resolveUri, fetchContent } from '../constants/api';

type GalleryFile = { filename: string; url: string };

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    const FALLBACK: GalleryFile[] = [
      { filename: 'b1', url: '/uploads/1775910069485-6.jpg' },
      { filename: 'b2', url: '/uploads/1775910069516-30.jpg' },
      { filename: 'b3', url: '/uploads/1775910069548-933.jpg' },
      { filename: 'b4', url: '/uploads/1775910069562-341.jpg' },
      { filename: 'b5', url: '/uploads/1775910069573-698.jpg' },
      { filename: 'b6', url: '/uploads/1775910069590-365.jpg' },
    ];
    fetchContent().then((d: any) => {
      if (Array.isArray(d?.homeBanner) && d.homeBanner.length > 0) {
        setFiles(d.homeBanner.map((u: string, i: number) => ({ filename: `hb${i}`, url: u })));
      } else {
        setFiles(FALLBACK);
      }
    }).catch(() => setFiles(FALLBACK));
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
      <Image source={{ uri: resolveUri(current.url) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
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
