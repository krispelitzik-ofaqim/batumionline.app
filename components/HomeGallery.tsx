import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native';

type GalleryFile = { filename: string; url: string };

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    fetch('/api/uploads')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          const galleryFiles = (j.files || []).filter((f: any) => (f.tags || []).includes('gallery_main'));
          setFiles(galleryFiles);
        }
      })
      .catch(() => {});
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
