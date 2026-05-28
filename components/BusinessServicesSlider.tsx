import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { fetchContent, resolveUri } from '../constants/api';

type ActionType = 'modal' | 'link' | 'article';
export type Service = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
  order?: number;
  actionType?: ActionType;
  url?: string;
  body?: string;
  visible?: boolean;
};

const DEFAULT_SERVICES: Service[] = [
  { id: 'realestate', order: 1, title: 'סוכני נדל״ן מורשים', subtitle: 'BATUMIONLINE REAL ESTATE', icon: '🏠', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80' },
  { id: 'relocation', order: 2, title: 'לחיות בבטומי', subtitle: 'RELOCATION', icon: '🌅', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80' },
  { id: 'bank',       order: 3, title: 'פתיחת חשבון בנק', subtitle: 'בגאורגיה מרחוק', icon: '🏦', image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80' },
  { id: 'lawyer',     order: 4, title: 'עורכי דין',        subtitle: 'ליווי משפטי',   icon: '⚖️', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80' },
  { id: 'cpa',        order: 5, title: 'רואה חשבון',       subtitle: 'חשבונאות ומיסוי', icon: '📊', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80' },
  { id: 'residency',  order: 6, title: 'אישור תושבות',     subtitle: 'תהליך מלא',      icon: '📝', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' },
  { id: 'citizenship',order: 7, title: 'אזרחות גאורגית',   subtitle: 'ליווי מקצועי',   icon: '🇬🇪', image: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=600&q=80' },
  { id: 'passport',   order: 8, title: 'דרכון גאורגי',     subtitle: 'הוצאה ומעקב',    icon: '📘', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80' },
];

const SERVICES = DEFAULT_SERVICES.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

type Props = { variant: 'large' | 'small'; onPressService?: (svc: Service) => void };

export default function BusinessServicesSlider({ variant, onPressService }: Props) {
  const { width: winW } = useWindowDimensions();
  const isLarge = variant === 'large';
  const cardW = isLarge ? Math.min(360, winW - 64) : 160;
  const cardH = isLarge ? 240 : 200;
  const sidePad = isLarge ? Math.max(10, (winW - cardW) / 2 - 16) : 16;
  const titleSize = isLarge ? 22 : 15;
  const subSize = isLarge ? 15 : 11;
  const iconSize = isLarge ? 56 : 34;
  const [idx, setIdx] = useState(0);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchContent().then((d: any) => {
      if (Array.isArray(d?.businessServices) && d.businessServices.length > 0) {
        const sorted = d.businessServices.slice().sort((a: Service, b: Service) => (a.order ?? 99) - (b.order ?? 99));
        setServices(sorted);
      }
    }).catch(() => {});
  }, []);

  return (
    <View style={s.wrap}>
      <Text style={s.header}>שירותי פורטל העסקים</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.row, { paddingHorizontal: sidePad }]}
        snapToInterval={cardW + 10}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (cardW + 10)))}
      >
        {services.map(svc => (
          <TouchableOpacity
            key={svc.id}
            activeOpacity={0.85}
            style={[s.card, { width: cardW, height: cardH }]}
            onPress={() => onPressService?.(svc)}
          >
            <ImageBackground source={{ uri: resolveUri(svc.image) }} style={{ flex: 1 }} imageStyle={{ borderRadius: 16 }}>
              <LinearGradient
                colors={['rgba(10,30,50,0.15)', 'rgba(10,30,50,0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.overlay}
              >
                <Text style={[s.icon, { fontSize: iconSize }]}>{svc.icon}</Text>
                <View>
                  <Text style={[s.title, { fontSize: titleSize }]}>{svc.title}</Text>
                  <Text style={[s.sub, { fontSize: subSize }]}>{svc.subtitle}</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.dots}>
        {services.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => { setIdx(i); scrollRef.current?.scrollTo({ x: i * (cardW + 10), animated: true }); }}>
            <View style={[s.dot, i === idx && s.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 18, paddingHorizontal: 16 },
  header: { fontSize: 18, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  row: { gap: 10, paddingHorizontal: 16 },
  card: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  overlay: { flex: 1, borderRadius: 16, padding: 14, justifyContent: 'space-between', alignItems: 'flex-end' },
  icon: { color: Colors.WHITE },
  title: { fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontWeight: '500', color: Colors.WHITE, opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 18 },
});
