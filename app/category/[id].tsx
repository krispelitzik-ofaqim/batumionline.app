import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { PreviewContext } from '../../constants/previewContext';
import { AdminContext } from '../../constants/adminContext';
import DevicePreviewBar from '../../components/DevicePreviewBar';
import { fetchContent } from '../../constants/api';

type Hotel = { id: string; title: string; text: string; image: string; mapUrl?: string; pageUrl?: string; coords?: { lat: number; lng: number }; visible?: boolean };
type Item = {
  id: string; title: string; subtitle?: string; icon: string; bg?: string;
  bgDark?: string; description?: string; summary?: string; heroBg?: string;
  layout?: 'card' | 'banner'; children?: Item[]; hotels?: Hotel[];
};

function HotelImage({ uri }: { uri?: string }) {
  const [failed, setFailed] = useState(!uri);
  if (failed) {
    return (
      <View style={[st.hotelImg, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48 }}>🏨</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={st.hotelImg} resizeMode="cover" onError={() => setFailed(true)} />;
}

function HotelCard({ h, dark }: { h: Hotel; dark: boolean }) {
  const [showMap, setShowMap] = useState(false);
  return (
    <View style={[st.hotelCard, dark && { backgroundColor: '#2a3942' }]}>
      {showMap && h.coords ? (
        <HotelMap coords={h.coords} title={h.title} onClose={() => setShowMap(false)} />
      ) : (
        <HotelImage uri={h.image} />
      )}
      <View style={st.hotelBody}>
        <Text style={[st.hotelTitle, dark && { color: Colors.BACKGROUND }]}>{h.title}</Text>
        <Text style={[st.hotelText, dark && { color: '#cbd5e1' }]}>{h.text}</Text>
        <View style={st.hotelBtnRow}>
          <TouchableOpacity
            style={[st.hotelBtn, !h.pageUrl && st.hotelBtnDisabled]}
            activeOpacity={h.pageUrl ? 0.7 : 1}
            onPress={() => h.pageUrl && Linking.openURL(h.pageUrl)}
            disabled={!h.pageUrl}
          >
            <Text style={[st.hotelBtnTxt, !h.pageUrl && st.hotelBtnTxtDisabled]}>לדף המלון</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnAlt, !h.coords && st.hotelBtnDisabled]}
            activeOpacity={h.coords ? 0.7 : 1}
            onPress={() => h.coords && setShowMap(v => !v)}
            disabled={!h.coords}
          >
            <Text style={[st.hotelBtnTxt, !h.coords && st.hotelBtnTxtDisabled]}>{showMap ? 'הסתר מפה' : 'איפה זה'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, !h.mapUrl && st.hotelBtnDisabled]}
            activeOpacity={h.mapUrl ? 0.7 : 1}
            onPress={() => h.mapUrl && Linking.openURL(h.mapUrl)}
            disabled={!h.mapUrl}
          >
            <Text style={[st.hotelBtnTxt, !h.mapUrl && st.hotelBtnTxtDisabled]}>נווט למקום</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function HotelMap({ coords, title, onClose }: { coords: { lat: number; lng: number }; title: string; onClose: () => void }) {
  const src = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${encodeURIComponent(title)})&z=15&output=embed`;
  return (
    <View style={st.hotelImg}>
      {Platform.OS === 'web' ? (
        // @ts-ignore - iframe on web
        <iframe src={src} style={{ width: '100%', height: '100%', border: 0 }} />
      ) : (
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`)}
        >
          <Text style={{ fontSize: 14, color: Colors.PRIMARY }}>פתח במפות גוגל</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={st.mapClose} onPress={onClose}>
        <Text style={st.mapCloseX}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SubCard({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.card, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.cardTop} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cardTop}>
          <Text style={st.cardIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.cardBottom}>
        <Text style={st.cardTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={st.cardSub}>{item.subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function SubBanner({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.banner, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.bannerImg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.bannerImg}>
          <Text style={st.bannerImgIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.bannerText}>
        <Text style={st.bannerTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={st.bannerSub} numberOfLines={1}>{item.subtitle}</Text> : null}
        {item.summary ? <Text style={st.bannerSummary} numberOfLines={2}>{item.summary}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dark } = useContext(ThemeContext);
  const { simulatedWidth } = useContext(PreviewContext);
  const { isAdmin } = useContext(AdminContext);
  const { width: screenW } = useWindowDimensions();
  const w = simulatedWidth ? Math.min(simulatedWidth, screenW) : screenW;
  const cardW = (w - 48) / 2;

  const [cat, setCat] = useState<Item | null>(null);

  useEffect(() => {
    fetchContent().then(data => {
      const all = [...(data.mainCategories || []), ...(data.extraCategories || [])];
      const findDeep = (list: Item[]): Item | undefined => {
        for (const c of list) {
          if (c.id === id) return c;
          if (c.children) {
            const f = findDeep(c.children);
            if (f) return f;
          }
        }
        return undefined;
      };
      const found = findDeep(all);
      if (found) setCat(found);
    }).catch(() => {});
  }, [id]);

  if (!cat) {
    return (
      <SafeAreaView style={st.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'קטגוריה', headerBackTitle: 'חזרה' }} />
        <View style={st.emptyWrap}>
          <Text style={st.emptyTxt}>טוען…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const children = cat.children || [];

  return (
    <SafeAreaView style={[st.safe, dark && { backgroundColor: Colors.TEXT }]}>
      <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
      <DevicePreviewBar />
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxWidth: w, alignSelf: 'center', width: '100%' }}>
        <View style={[st.hero, { backgroundColor: cat.heroBg || cat.bg || '#3DA5C4' }]}>
          <Text style={st.heroTitle}>{cat.title}</Text>
          {cat.subtitle ? <Text style={st.heroSub}>{cat.subtitle}</Text> : null}
        </View>

        {children.length > 0 ? (
          (() => {
            const isBanner = children.some(c => c.layout === 'banner');
            const bannerW = Math.min(w - 32, 350);
            return (
              <View style={st.section}>
                {isBanner ? (
                  <View style={{ alignItems: 'center', gap: 12 }}>
                    {children.map(ch => (
                      <SubBanner
                        key={ch.id}
                        item={ch}
                        width={bannerW}
                        onPress={() => router.push(cat.id === '3' ? `/tour/${ch.id}` as any : `/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.banner, st.addBanner, { width: bannerW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף באנר</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={st.grid}>
                    {children.map(ch => (
                      <SubCard
                        key={ch.id}
                        item={ch}
                        width={cardW}
                        onPress={() => router.push(`/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.card, st.addCard, { width: cardW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף אייקון</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })()
        ) : cat.hotels && cat.hotels.length > 0 ? (
          <View style={st.hotelList}>
            {cat.hotels.filter(h => h.visible !== false).map(h => (
              <HotelCard key={h.id} h={h} dark={dark} />
            ))}
          </View>
        ) : (
          <View style={st.body}>
            <Text style={[st.content, dark && { color: Colors.BACKGROUND }]}>
              {cat.description || 'אין תוכן עדיין'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },

  hero: { paddingVertical: 30, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 14, color: Colors.WHITE, opacity: 0.85, marginTop: 4, textAlign: 'center', writingDirection: 'rtl' },

  section: { paddingHorizontal: 16, marginTop: 16, marginBottom: 24 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },

  card: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 4,
  },
  cardTop: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 68 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 10, paddingHorizontal: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 12, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },

  addCard: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    minHeight: 150, shadowOpacity: 0,
  },

  banner: {
    height: 100, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE,
    flexDirection: 'row-reverse', alignItems: 'center',
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  bannerImg: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  bannerImgIcon: { fontSize: 57, color: Colors.WHITE },
  bannerText: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  bannerSub: { fontSize: 12, fontWeight: '600', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 1 },
  bannerSummary: { fontSize: 11, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 3, lineHeight: 15 },
  addBanner: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0, flexDirection: 'column',
  },
  addPlus: { fontSize: 40, color: Colors.PRIMARY, fontWeight: '300' },
  addLabel: { fontSize: 13, color: Colors.PRIMARY, fontWeight: '600', marginTop: 4 },

  body: { padding: 24 },
  content: { fontSize: 16, color: Colors.TEXT, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },

  hotelList: { padding: 16, gap: 16 },
  hotelCard: {
    backgroundColor: Colors.WHITE, borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  hotelImg: { width: '100%', height: 200, position: 'relative' },
  mapClose: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  mapCloseX: { color: Colors.WHITE, fontSize: 16, fontWeight: '700' },
  hotelBody: { padding: 14 },
  hotelTitle: { fontSize: 20, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  hotelText: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  hotelBtnRow: { flexDirection: 'row-reverse', gap: 10 },
  hotelBtn: {
    flex: 1, backgroundColor: Colors.PRIMARY, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  hotelBtnAlt: { backgroundColor: '#F4A94E' },
  hotelBtnTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '700' },
  hotelBtnDisabled: { backgroundColor: '#d1d5db' },
  hotelBtnTxtDisabled: { color: '#6b7280' },
});
