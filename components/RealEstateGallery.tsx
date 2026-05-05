import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Animated, Easing } from 'react-native';
import { Colors } from '../constants/colors';
import { fetchContent, resolveUri, API_BASE } from '../constants/api';

type Slide = { uri: string; caption: string };

const FALLBACK_SLIDES: Slide[] = [
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
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const timer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/listings-images?_t=${Date.now()}`);
        const j = await r.json();
        const arr: Slide[] = (j.images || []).map((u: string) => ({ uri: resolveUri(u), caption: '' }));
        if (arr.length > 0) {
          for (let i = arr.length - 1; i > 0; i--) {
            const k = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[k]] = [arr[k], arr[i]];
          }
          setSlides(arr.slice(0, 30));
          return;
        }
      } catch {}
      try {
        const d = await fetchContent();
        if (Array.isArray(d?.realEstateGallery) && d.realEstateGallery.length > 0) {
          setSlides(d.realEstateGallery.map((sl: any) => ({ uri: resolveUri(sl.uri || sl.image || ''), caption: sl.caption || '' })));
        }
      } catch {}
    })();
  }, []);

  const validSlides = slides.map((s, i) => ({ ...s, _origIdx: i })).filter((_, i) => !failed.has(i));
  const fadeIn = useRef(new Animated.Value(1)).current;
  const fadeOut = useRef(new Animated.Value(0)).current;
  const [prevIdx, setPrevIdx] = useState(0);

  const advance = () => {
    setPrevIdx(idx);
    setIdx(i => (i + 1) % Math.max(1, validSlides.length));
    fadeIn.setValue(0);
    fadeOut.setValue(1);
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeOut, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    timer.current = setInterval(advance, 4000);
    return () => clearInterval(timer.current);
  }, [validSlides.length]);

  if (validSlides.length === 0) return null;
  const safeIdx = idx % validSlides.length;
  const current = validSlides[safeIdx];
  const previous = validSlides[prevIdx % validSlides.length];

  return (
    <View style={[s.wrap, { width: width - 32 }]}>
      {previous && previous._origIdx !== current._origIdx && (
        <Animated.Image
          source={{ uri: previous.uri }}
          style={[StyleSheet.absoluteFillObject, { opacity: fadeOut }]}
          resizeMode="cover"
        />
      )}
      <Animated.Image
        source={{ uri: current.uri }}
        style={[StyleSheet.absoluteFillObject, { opacity: fadeIn }]}
        resizeMode="cover"
        onError={() => setFailed(prev => new Set(prev).add(current._origIdx))}
      />
      {!!current.caption && (
        <View style={s.captionWrap}>
          <Text style={s.caption}>{current.caption}</Text>
        </View>
      )}
      <View style={s.dots}>
        {validSlides.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => { setPrevIdx(idx); setIdx(i); fadeIn.setValue(0); fadeOut.setValue(1); Animated.parallel([Animated.timing(fadeIn,{toValue:1,duration:600,useNativeDriver:true}),Animated.timing(fadeOut,{toValue:0,duration:600,useNativeDriver:true})]).start(); }}>
            <View style={[s.dot, i === safeIdx && s.dotActive]} />
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
