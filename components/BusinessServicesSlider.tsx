import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type ActionType = 'modal' | 'link' | 'article';
export type Service = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;        // Ionicons name
  colors?: string[];   // gradient [from, to]
  order?: number;
  actionType?: ActionType;
  url?: string;
  body?: string;
  visible?: boolean;
};

// 7 branded services — each with its own gradient + line icon (no stock photos)
const DEFAULT_SERVICES: Service[] = [
  { id: 'lawyer',      order: 1, title: 'שירותי עורך דין',    subtitle: 'LEGAL SERVICES',     icon: 'shield-checkmark', colors: ['#1A6B8A', '#0E4A60'] },
  { id: 'cpa',         order: 2, title: 'שירותי רואה חשבון',  subtitle: 'ACCOUNTING & TAX',   icon: 'calculator',       colors: ['#3DA5C4', '#1A6B8A'] },
  { id: 'bank',        order: 3, title: 'פתיחת חשבון בנק',    subtitle: 'BANKING IN GEORGIA', icon: 'card',             colors: ['#F4A94E', '#D97E2B'] },
  { id: 'residency',   order: 4, title: 'אישור תושבות',       subtitle: 'RESIDENCY',          icon: 'home',             colors: ['#2E9E8F', '#16726A'] },
  { id: 'business',    order: 5, title: 'פתיחת עסק או חברה',  subtitle: 'BUSINESS SETUP',     icon: 'storefront',       colors: ['#5A6FB0', '#34467E'] },
  { id: 'citizenship', order: 6, title: 'אזרחות גאורגית',     subtitle: 'CITIZENSHIP',        icon: 'ribbon',           colors: ['#C0392B', '#8E2A20'] },
  { id: 'passport',    order: 7, title: 'דרכון גאורגי',       subtitle: 'GEORGIAN PASSPORT',  icon: 'book',             colors: ['#2D4A6B', '#16314A'] },
];

const FALLBACK_COLORS = ['#1A6B8A', '#0E4A60'];
const SERVICES = DEFAULT_SERVICES.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

type Props = { variant: 'large' | 'small'; onPressService?: (svc: Service) => void };

export default function BusinessServicesSlider({ variant, onPressService }: Props) {
  const { width: winW } = useWindowDimensions();
  const isLarge = variant === 'large';
  const cardW = isLarge ? Math.min(360, winW - 64) : 168;
  const cardH = isLarge ? 200 : 190;
  const sidePad = isLarge ? Math.max(10, (winW - cardW) / 2 - 16) : 16;
  const titleSize = isLarge ? 22 : 15;
  const subSize = isLarge ? 12 : 10;
  const iconSize = isLarge ? 48 : 32;
  const [idx, setIdx] = useState(0);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchContent().then((d: any) => {
      if (Array.isArray(d?.businessServices) && d.businessServices.length > 0) {
        // Backend may override text/order/action — keep branded icon+colors from local defaults by id
        const merged = d.businessServices
          .filter((bs: Service) => bs.visible !== false)
          .map((bs: Service) => {
            const def = DEFAULT_SERVICES.find(x => x.id === bs.id);
            return {
              ...bs,
              icon: def?.icon ?? bs.icon ?? 'ellipse',
              colors: def?.colors ?? FALLBACK_COLORS,
            };
          })
          .sort((a: Service, b: Service) => (a.order ?? 99) - (b.order ?? 99));
        if (merged.length) setServices(merged);
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
        snapToInterval={cardW + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (cardW + 12)))}
      >
        {services.map(svc => (
          <TouchableOpacity
            key={svc.id}
            activeOpacity={0.88}
            style={[s.card, { width: cardW, height: cardH }]}
            onPress={() => onPressService?.(svc)}
          >
            <LinearGradient
              colors={(svc.colors && svc.colors.length >= 2 ? svc.colors : FALLBACK_COLORS) as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.cardInner}
            >
              {/* faint watermark icon */}
              <Ionicons
                name={svc.icon as any}
                size={cardH * 0.9}
                color="rgba(255,255,255,0.08)"
                style={s.watermark}
              />
              <View style={s.iconBadge}>
                <Ionicons name={svc.icon as any} size={iconSize} color={Colors.WHITE} />
              </View>
              <View>
                <Text style={[s.title, { fontSize: titleSize }]}>{svc.title}</Text>
                <Text style={[s.sub, { fontSize: subSize }]}>{svc.subtitle}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.dots}>
        {services.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => { setIdx(i); scrollRef.current?.scrollTo({ x: i * (cardW + 12), animated: true }); }}>
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
  row: { gap: 12, paddingHorizontal: 16 },
  card: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
  },
  cardInner: { flex: 1, borderRadius: 18, padding: 18, justifyContent: 'space-between', alignItems: 'flex-end', overflow: 'hidden' },
  watermark: { position: 'absolute', left: -10, bottom: -18 },
  iconBadge: {
    width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  title: { fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontWeight: '700', color: Colors.WHITE, opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 3, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 18 },
});
