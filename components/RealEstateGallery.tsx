import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';

type Slide = { uri: string; caption: string };

const SLIDES: Slide[] = [
  { uri: 'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=1200&q=80', caption: 'Orbi Sea Towers' },
  { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80', caption: 'Riviera Residence' },
  { uri: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80', caption: 'Palm Tower' },
  { uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80', caption: 'Pullman Batumi' },
  { uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', caption: 'דירה במרכז העיר' },
  { uri: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', caption: 'פנטהאוז עם נוף לים' },
];

export default function RealEstateGallery() {
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setIdx(i => (i + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer.current);
  }, []);

  const current = SLIDES[idx];

  return (
    <View style={[s.wrap, { width: width - 32 }]}>
      <Image source={{ uri: current.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={s.captionWrap}>
        <Text style={s.caption}>{current.caption}</Text>
      </View>
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setIdx(i)}>
            <View style={[s.dot, i === idx && s.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    alignSelf: 'center', marginTop: 14, marginBottom: 4, backgroundColor: '#eee',
  },
  captionWrap: { position: 'absolute', bottom: 32, right: 16, backgroundColor: 'rgba(10,30,50,0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  caption: { fontSize: 14, fontWeight: '800', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
});
