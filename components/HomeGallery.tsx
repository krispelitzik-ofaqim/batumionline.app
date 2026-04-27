import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { resolveUri, fetchContent } from '../constants/api';

type GalleryItem = { key: string; source: any; url?: string };

const isBadUrl = (u: any): boolean => {
  if (typeof u !== 'string') return true;
  if (u.trim().length === 0) return true;
  if (u.includes('localhost')) return true;
  if (u.includes('127.0.0.1')) return true;
  return false;
};

export default function HomeGallery({ field = 'homeBanner' }: { field?: string } = {}) {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchContent().then((d: any) => {
      if (!active) return;
      if (Array.isArray(d?.[field])) {
        const valid = d[field].filter((u: any) => !isBadUrl(u));
        if (valid.length > 0) {
          setFiles(valid.map((u: string, i: number) => ({ key: `hb${i}`, source: { uri: resolveUri(u) }, url: u })));
        } else {
          setFiles([]);
        }
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [field]);

  if (files.length === 0) return null;
  const current = files[0];

  return (
    <View style={[styles.wrap, { width: width - 32 }]}>
      <Image source={current.source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 180, borderRadius: 18, overflow: 'hidden',
    alignSelf: 'center', marginBottom: 18, backgroundColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
  },
});
