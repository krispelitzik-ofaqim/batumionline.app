import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

type Service = { id: string; title: string; subtitle: string; icon: string; image: string };

const SERVICES: Service[] = [
  { id: 'bank',       title: 'פתיחת חשבון בנק', subtitle: 'בגאורגיה מרחוק', icon: '🏦', image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80' },
  { id: 'lawyer',     title: 'עורכי דין',        subtitle: 'ליווי משפטי',   icon: '⚖️', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80' },
  { id: 'cpa',        title: 'רואה חשבון',       subtitle: 'חשבונאות ומיסוי', icon: '📊', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80' },
  { id: 'residency',  title: 'אישור תושבות',     subtitle: 'תהליך מלא',      icon: '📝', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80' },
  { id: 'citizenship',title: 'אזרחות גאורגית',   subtitle: 'ליווי מקצועי',   icon: '🇬🇪', image: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=600&q=80' },
  { id: 'passport',   title: 'דרכון גאורגי',     subtitle: 'הוצאה ומעקב',    icon: '📘', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80' },
];

type Props = { variant: 'large' | 'small'; onPressService?: (id: string) => void };

export default function BusinessServicesSlider({ variant, onPressService }: Props) {
  const isLarge = variant === 'large';
  const cardW = isLarge ? 340 : 160;
  const cardH = isLarge ? 180 : 200;
  const titleSize = isLarge ? 20 : 15;
  const subSize = isLarge ? 14 : 11;
  const iconSize = isLarge ? 46 : 34;

  return (
    <View style={s.wrap}>
      <Text style={s.header}>שירותי פורטל העסקים</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {SERVICES.map(svc => (
          <TouchableOpacity
            key={svc.id}
            activeOpacity={0.85}
            style={[s.card, { width: cardW, height: cardH }]}
            onPress={() => onPressService?.(svc.id)}
          >
            <ImageBackground source={{ uri: svc.image }} style={{ flex: 1 }} imageStyle={{ borderRadius: 16 }}>
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
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 18 },
  header: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10, paddingHorizontal: 16 },
  row: { gap: 10, paddingHorizontal: 16 },
  card: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  overlay: { flex: 1, borderRadius: 16, padding: 14, justifyContent: 'space-between', alignItems: 'flex-end' },
  icon: { color: Colors.WHITE },
  title: { fontWeight: '900', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontWeight: '500', color: Colors.WHITE, opacity: 0.85, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});
