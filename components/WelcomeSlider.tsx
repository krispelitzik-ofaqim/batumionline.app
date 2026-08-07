import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Text, Image, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { fetchContent, resolveUri } from '../constants/api';
import { useI18n } from '../constants/i18n';

function fireConfetti() {
  if (Platform.OS !== 'web') return;
  const colors = ['#F4A94E', '#3DA5C4', '#1A6B8A', '#ff6b6b', '#ffd93d', '#6bcb77'];
  const container = (window as any).document.createElement('div');
  Object.assign(container.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999 });
  (window as any).document.body.appendChild(container);
  for (let i = 0; i < 200; i++) {
    const p = (window as any).document.createElement('div');
    const x = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const dur = 1.2 + Math.random() * 2;
    const size = 8 + Math.random() * 10;
    const rot = Math.random() * 360;
    const sway = (Math.random() - 0.5) * 200;
    Object.assign(p.style, {
      position: 'absolute', top: '-20px', left: `${x}%`,
      width: `${size}px`, height: `${size * 0.5}px`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      transform: `rotate(${rot}deg)`,
      animation: `confetti-fall-${i % 3} ${dur}s ease-in ${delay}s forwards`,
    });
    container.appendChild(p);
  }
  const style = (window as any).document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall-0 { 0% { top: -20px; opacity: 1; transform: rotate(0deg) translateX(0); } 100% { top: 110vh; opacity: 0; transform: rotate(1080deg) translateX(150px); } }
    @keyframes confetti-fall-1 { 0% { top: -20px; opacity: 1; transform: rotate(0deg) translateX(0); } 100% { top: 110vh; opacity: 0; transform: rotate(-900deg) translateX(-120px); } }
    @keyframes confetti-fall-2 { 0% { top: -20px; opacity: 1; transform: rotate(0deg) translateX(0); } 100% { top: 110vh; opacity: 0; transform: rotate(720deg) translateX(80px); } }
  `;
  container.appendChild(style);
  setTimeout(() => container.remove(), 5000);
}

type Item = { id: string; title: string; subtitle?: string; icon: string; bg?: string; localImage?: any; route?: string };

const CARD_W = 140;
const GAP = 10;

const INITIAL_ITEMS: Item[] = [
  { id: '1', title: 'ברוכים הבאים', subtitle: 'מדריך מקיף לבטומי', icon: '👋', bg: Colors.PRIMARY },
  { id: '2', title: 'נחיתה רכה', subtitle: 'מה צריך לדעת', icon: '✈️', bg: Colors.SECONDARY },
  { id: '3', title: 'היסטוריה כללית', subtitle: 'סיפור העיר', icon: '🏛️', bg: Colors.TEXT },
  { id: '4', title: 'היסטוריה יהודית', subtitle: 'קהילה ומורשת', icon: '✡️', bg: Colors.ACCENT },
  { id: '5', title: 'חוזרים הביתה', subtitle: 'טיפים ליום האחרון', icon: '🏠', bg: Colors.PRIMARY },
];

export default function WelcomeSlider() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const scrollRef = useRef<ScrollView>(null);
  const didInit = useRef(false);

  useEffect(() => {
    fetchContent().then(data => {
      if (Array.isArray(data.welcome)) setItems(data.welcome.filter((x: any) => x.visible !== false));
    }).catch(() => {});
  }, []);

  // Tickets & Coupon as the first cards in the welcome slider.
  const ticketsItem: Item = { id: '__tickets__', title: t('tk2.tickets'), subtitle: t('tk2.ticketsSub'), icon: '/uploads/1786082390271-386.jpg', route: '/tickets' };
  const couponItem: Item = { id: '__coupon__', title: t('cp.coupon'), subtitle: t('cp.couponSub'), icon: '/uploads/1786082391353-69.jpg', route: '/coupon' };
  const yad2Item: Item = { id: '__yad2__', title: t('mk.classifieds'), subtitle: t('mk.classifiedsSub'), icon: '/uploads/1786082392340-392.jpg', route: '/marketplace' };
  // Hebrew has no "The Market" banner, so surface the classifieds board here instead.
  const displayItems = [ticketsItem, couponItem, ...(lang === 'he' ? [yad2Item] : []), ...items];

  const looped = [...displayItems, ...displayItems, ...displayItems];
  const singleWidth = displayItems.length * (CARD_W + GAP);

  const onLayout = useCallback(() => {
    if (!didInit.current && scrollRef.current && displayItems.length > 0) {
      didInit.current = true;
      scrollRef.current.scrollTo({ x: singleWidth, animated: false });
    }
  }, [singleWidth, displayItems.length]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x <= 0) {
      scrollRef.current?.scrollTo({ x: singleWidth, animated: false });
    } else if (x >= singleWidth * 2) {
      scrollRef.current?.scrollTo({ x: singleWidth, animated: false });
    }
  }, [singleWidth]);

  const renderCard = (item: Item, idx: number) => {
    const isImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http') || item.icon.startsWith('/'));
    return (
      <TouchableOpacity key={`${item.id}-${idx}`} style={[styles.card, !!item.route && styles.ctaCard]} activeOpacity={0.7} onPress={() => { if (item.route) { router.push(item.route as any); return; } if (item.id === '1') fireConfetti(); router.push(`/welcome/${item.id}` as any); }}>
        {item.localImage ? (
          <>
            <Image source={item.localImage} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFillObject} />
          </>
        ) : isImage ? (
          <>
            <Image source={{ uri: resolveUri(item.icon) }} style={item.route ? styles.ctaImgZoom : StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFillObject} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: item.bg || Colors.PRIMARY }]}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
        )}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.subtitle ? <Text style={styles.sub} numberOfLines={1}>{item.subtitle}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('wl.welcome')}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {looped.map(renderCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  row: { gap: GAP, paddingVertical: 4 },
  card: {
    width: CARD_W, height: 120, borderRadius: 16, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  ctaImg: { position: 'absolute', top: 10, left: 14, right: 14, height: 62 },
  ctaImgZoom: { position: 'absolute', top: -22, left: -22, right: -22, bottom: -22 },
  ctaCard: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 3,
  },
  icon: { fontSize: 44, textAlign: 'center', marginTop: 14 },
  textWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 11, color: Colors.WHITE, opacity: 0.9, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});

