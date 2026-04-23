import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { API_BASE } from '../constants/api';

type GalleryFile = { filename: string; url: string };

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/uploads`);
        const j = await r.json();
        const galleryFiles = j.success ? (j.files || []).filter((f: any) => (f.tags || []).includes('gallery_main')) : [];
        if (galleryFiles.length > 0) { setFiles(galleryFiles); return; }
        // fallback: Unsplash Batumi photos
        const ur = await fetch(`${API_BASE}/api/unsplash?q=batumi%20georgia&count=15`);
        const uj = await ur.json();
        const photos = (uj.photos || []).map((p: any, i: number) => ({ filename: `unsplash_${p.id}`, url: p.url }));
        setFiles(photos);
      } catch {}
    })();
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
      <Image source={{ uri: current.url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
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
    height: 180, borderRadius: 16, overflow: 'hidden',
    alignSelf: 'center', marginBottom: 18, backgroundColor: '#eee',
  },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
});
