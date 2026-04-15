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
import { fetchContent, fetchRatings, submitRating } from '../../constants/api';
import AudioPlayer from '../../components/AudioPlayer';

type Hotel = { id: string; title: string; titleEn?: string; text: string; image: string; mapUrl?: string; pageUrl?: string; coords?: { lat: number; lng: number }; visible?: boolean; images?: string[] };
type TourBlock = { id: string; title: string; subtitle?: string; text: string; color: string; images: string[]; audios: { title?: string; url: string }[]; visible?: boolean; coords?: { lat: number; lng: number } };
type Item = {
  id: string; title: string; subtitle?: string; icon: string; bg?: string;
  bgDark?: string; description?: string; summary?: string; heroBg?: string;
  layout?: 'card' | 'banner'; children?: Item[]; hotels?: Hotel[]; tours?: TourBlock[]; pageBtnLabel?: string;
  theme?: 'dark' | 'light';
};

function HotelImage({ uri, titleEn }: { uri?: string; titleEn?: string }) {
  const [failed, setFailed] = useState(!uri);
  if (failed) {
    return (
      <View style={[st.hotelImg, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48 }}>🏨</Text>
      </View>
    );
  }
  return (
    <View style={st.hotelImg}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setFailed(true)} />
      {titleEn ? (
        <View style={st.enBadge}>
          <Text style={st.enBadgeTxt}>{titleEn}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TourCard({ t, onRate }: { t: TourBlock; onRate: (id: string, score: number) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [mapBig, setMapBig] = useState(false);
  const [navCoords, setNavCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stationTitle, setStationTitle] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const demoScore = 4;
  const displayedScore = ratingSubmitted ? rating : demoScore;
  const images = t.images && t.images.length > 0 ? t.images : [];
  const activeCoords = navCoords || t.coords;
  const mapQ = activeCoords ? `${activeCoords.lat},${activeCoords.lng}` : 'Batumi,Georgia';
  const mapSrc = `https://www.google.com/maps?q=${mapQ}${t.title ? `(${encodeURIComponent(t.title)})` : ''}&z=${navCoords ? 16 : 14}&output=embed`;
  return (
    <View style={[tourSt.card, { backgroundColor: t.color }]}>
      <View style={tourSt.imgWrap}>
        {images.length > 0 ? (
          <>
            <Image source={{ uri: images[imgIdx] }} style={tourSt.img} resizeMode="cover" />
            {stationTitle && (
              <View style={tourSt.stationOverlay}>
                <Text style={tourSt.stationOverlayTxt}>{stationTitle}</Text>
              </View>
            )}
            {images.length > 1 && (
              <>
                <TouchableOpacity style={[tourSt.arrow, tourSt.arrowLeft]} onPress={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}>
                  <Text style={tourSt.arrowTxt}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[tourSt.arrow, tourSt.arrowRight]} onPress={() => setImgIdx((imgIdx + 1) % images.length)}>
                  <Text style={tourSt.arrowTxt}>›</Text>
                </TouchableOpacity>
                <View style={tourSt.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[tourSt.dot, imgIdx === i && tourSt.dotActive]} />
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={[tourSt.img, { backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 40 }}>🎧</Text>
          </View>
        )}
      </View>
      <Text style={tourSt.title}>{t.title || 'ללא כותרת'}</Text>
      {t.subtitle ? <Text style={tourSt.subtitle}>{t.subtitle}</Text> : null}
      <Text style={[tourSt.text, !t.text && { fontStyle: 'italic', color: '#777' }]}>
        {t.text || 'תיאור הסיור יופיע כאן — ערוך דרך פאנל הניהול'}
      </Text>
      <View style={[tourSt.mapWrap, { height: mapBig ? 400 : 200 }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe src={mapSrc} style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }} />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
            <Text>מפה</Text>
          </View>
        )}
        {!mapBig && (
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.85} onPress={() => setMapBig(true)} />
        )}
        {mapBig && (
          <TouchableOpacity style={tourSt.mapClose} onPress={() => setMapBig(false)}>
            <Text style={tourSt.mapHintTxt}>✕</Text>
          </TouchableOpacity>
        )}
        {!mapBig && (
          <View style={tourSt.mapHint} pointerEvents="none">
            <Text style={tourSt.mapHintTxt}>🔍 הגדל מפה</Text>
          </View>
        )}
      </View>

      <View style={tourSt.audioWrap}>
        {t.audios && t.audios.length > 0 ? (
          <>
            <Text style={tourSt.hint}>💡 ניתן לגרור תחנות (≡) ולסדר לפי סדר הסיור שלך</Text>
            <AudioPlayer
              tracks={t.audios}
              tint={t.color}
              onNavigate={(c) => { setNavCoords(c); setMapBig(true); }}
              onActiveChange={(i, trk) => {
                if (images.length > 0) setImgIdx(i % images.length);
                setStationTitle(trk.title || null);
              }}
            />
          </>
        ) : (
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 12 }}>
            🎧 נגני אודיו יתווספו דרך פאנל הניהול
          </Text>
        )}
      </View>

      <View style={tourSt.ratingRow}>
        <Text style={tourSt.ratingLabel}>דרג את הסיור</Text>
        <View style={tourSt.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => !ratingSubmitted && setRating(n)} disabled={ratingSubmitted}>
              <Text style={[tourSt.star, n <= rating && tourSt.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[tourSt.submitBtn, (rating === 0 || ratingSubmitted) && { opacity: 0.4 }]}
          onPress={() => { if (rating > 0) { setRatingSubmitted(true); onRate(t.id, rating); } }}
          disabled={rating === 0 || ratingSubmitted}
        >
          <Text style={tourSt.submitTxt}>{ratingSubmitted ? '✓ תודה' : 'בחר'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HotelCard({ h, dark, pageBtnLabel }: { h: Hotel; dark: boolean; pageBtnLabel: string }) {
  const [showMap, setShowMap] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const hasGallery = !!(h.images && h.images.length > 0);
  const btnEnabled = hasGallery || !!h.pageUrl;
  if (showMap && h.coords) {
    return (
      <View style={[st.hotelCard, st.hotelCardExpanded, dark && { backgroundColor: '#2a3942' }]}>
        <HotelMap coords={h.coords} title={h.title} onClose={() => setShowMap(false)} />
      </View>
    );
  }
  if (showGallery && hasGallery) {
    return (
      <View style={[st.hotelCard, st.hotelCardExpanded, dark && { backgroundColor: '#2a3942' }]}>
        <View style={st.galleryWrap}>
          <TouchableOpacity style={st.mapClose} onPress={() => setShowGallery(false)}>
            <Text style={st.mapCloseX}>✕</Text>
          </TouchableOpacity>
          <View style={st.galleryGrid}>
            {h.images!.slice(0, 9).map((src, i) => (
              <Image key={i} source={{ uri: src }} style={st.galleryImg} resizeMode="cover" />
            ))}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={[st.hotelCard, dark && { backgroundColor: '#2a3942' }]}>
      <HotelImage uri={h.image} titleEn={h.titleEn} />
      <View style={st.hotelBody}>
        <Text style={[st.hotelTitle, dark && { color: Colors.BACKGROUND }]}>{h.title}</Text>
        <Text style={[st.hotelText, dark && { color: '#cbd5e1' }]}>{h.text}</Text>
        <View style={st.hotelBtnRow}>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnPrimary, !btnEnabled && st.hotelBtnDisabled]}
            activeOpacity={btnEnabled ? 0.7 : 1}
            onPress={() => {
              if (hasGallery) setShowGallery(true);
              else if (h.pageUrl) Linking.openURL(h.pageUrl);
            }}
            disabled={!btnEnabled}
          >
            <Text style={[st.hotelBtnTxt, !btnEnabled && st.hotelBtnTxtDisabled]}>{pageBtnLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnAccent, !h.coords && st.hotelBtnDisabled]}
            activeOpacity={h.coords ? 0.7 : 1}
            onPress={() => h.coords && setShowMap(v => !v)}
            disabled={!h.coords}
          >
            <Text style={[st.hotelBtnTxt, !h.coords && st.hotelBtnTxtDisabled]}>{showMap ? 'הסתר מפה' : 'איפה זה'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.hotelBtn, st.hotelBtnSecondary, !h.mapUrl && st.hotelBtnDisabled]}
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
    <View style={{ flex: 1, position: 'relative' }}>
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
  const [selectedTour, setSelectedTour] = useState<TourBlock | null>(null);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});

  useEffect(() => {
    fetchRatings().then(setRatings).catch(() => {});
  }, []);

  const handleRatingSubmit = async (tourId: string, score: number) => {
    try {
      const r = await submitRating(tourId, score);
      setRatings(prev => ({ ...prev, [tourId]: { sum: r.sum, count: r.count } }));
    } catch {}
  };

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
      const ALIASES: Record<string, string> = { a4: '3' };
      const aliased = ALIASES[id as string];
      const found = aliased
        ? all.find((c: Item) => c.id === aliased)
        : findDeep(all);
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
  const darkCat = cat.theme === 'dark' || dark;

  return (
    <SafeAreaView style={[st.safe, darkCat && { backgroundColor: '#0f1419' }]}>
      <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
      <DevicePreviewBar />
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxWidth: w, alignSelf: 'center', width: '100%' }}>
        <View style={[st.hero, { backgroundColor: darkCat ? '#1a1a2e' : (cat.heroBg || cat.bg || '#3DA5C4') }]}>
          <Text style={[st.heroTitle, darkCat && { color: '#F4A94E' }]}>{cat.title}</Text>
          {cat.subtitle ? <Text style={[st.heroSub, darkCat && { color: '#d4af37' }]}>{cat.subtitle}</Text> : null}
        </View>

        {cat.tours && cat.tours.length > 0 ? (
          selectedTour ? (
            <View style={st.hotelList}>
              <TouchableOpacity onPress={() => setSelectedTour(null)} style={st.tourBack}>
                <Text style={st.tourBackTxt}>‹ חזרה לבחירת סיור</Text>
              </TouchableOpacity>
              <TourCard t={selectedTour} onRate={handleRatingSubmit} />
            </View>
          ) : (
            <View style={st.tourGrid}>
              {cat.tours.filter(t => t.visible !== false).map(t => {
                const r = ratings[t.id];
                const avg = r && r.count > 0 ? Math.round(r.sum / r.count) : 0;
                return (
                  <TouchableOpacity key={t.id} style={[st.tourGridCard, { backgroundColor: t.color }]} onPress={() => setSelectedTour(t)} activeOpacity={0.8}>
                    <View style={st.tourGridStars}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Text key={n} style={[st.tourGridStar, n <= avg && st.tourGridStarOn]}>★</Text>
                      ))}
                      {r && r.count > 0 && <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', marginRight: 4 }}>({r.count})</Text>}
                    </View>
                    {avg >= 4 && <Text style={st.tourGridPopular}>סיור זה פופולרי בקרב הגולשים</Text>}
                    <Text style={st.tourGridIcon}>🎧</Text>
                    <Text style={st.tourGridTitle} numberOfLines={2}>{t.title || 'ללא כותרת'}</Text>
                    <Text style={st.tourGridSub} numberOfLines={2}>{t.subtitle || ' '}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : children.length > 0 ? (
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
              <HotelCard key={h.id} h={h} dark={darkCat} pageBtnLabel={cat.pageBtnLabel || 'לדף המלון'} />
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
  hotelImg: { width: '100%', height: 200, position: 'relative', overflow: 'hidden' },
  enBadge: {
    position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  enBadgeTxt: { color: Colors.WHITE, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  hotelCardExpanded: { minHeight: 420 },
  galleryWrap: { flex: 1, padding: 10, position: 'relative' },
  galleryGrid: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 },
  galleryImg: { width: '32%', aspectRatio: 1, borderRadius: 6 },
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
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  hotelBtnPrimary: { backgroundColor: '#1A6B8A' },
  hotelBtnSecondary: { backgroundColor: '#3DA5C4' },
  hotelBtnAccent: { backgroundColor: '#F4A94E' },
  hotelBtnTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '700' },
  hotelBtnDisabled: { opacity: 0.35 },
  hotelBtnTxtDisabled: {},

  tourGrid: { padding: 16, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  tourGridWrap: { width: '47%' },
  tourGridStars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 2, marginBottom: 4 },
  tourGridStar: { fontSize: 16, color: '#d1d5db' },
  tourGridStarOn: { color: '#F4A94E' },
  tourGridPopular: { fontSize: 10, fontWeight: '800', color: '#B45309', textAlign: 'center', writingDirection: 'rtl', marginTop: 2, marginBottom: 4 },
  tourGridCard: {
    width: '47%', aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  tourGridIcon: { fontSize: 44, marginBottom: 10 },
  tourGridTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  tourGridSub: { fontSize: 11, fontWeight: '600', color: 'rgba(0,0,0,0.6)', textAlign: 'center', writingDirection: 'rtl', marginTop: 4, minHeight: 28, lineHeight: 14 },
  tourBack: {
    alignSelf: 'flex-start', padding: 10, marginBottom: 8,
  },
  tourBackTxt: { fontSize: 15, fontWeight: '700', color: Colors.PRIMARY, writingDirection: 'rtl' },
});

const tourSt = StyleSheet.create({
  card: {
    borderRadius: 20, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  imgWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  img: { width: '100%', height: 200 },
  arrow: {
    position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  arrowTxt: { color: Colors.WHITE, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  dots: {
    position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 5,
    left: 0, right: 0, justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  stationOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 12, paddingHorizontal: 14,
  },
  stationOverlayTxt: { color: Colors.WHITE, fontSize: 18, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  dotActive: { backgroundColor: Colors.WHITE, width: 18 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 },
  subtitle: { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.65)', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  text: { fontSize: 14, color: '#333', lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  audioWrap: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 8 },
  hint: { fontSize: 11, color: '#555', textAlign: 'center', writingDirection: 'rtl', paddingVertical: 4 },
  ratingRow: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  },
  ratingLabel: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  stars: { flexDirection: 'row-reverse', gap: 2 },
  star: { fontSize: 28, color: '#d1d5db', paddingHorizontal: 2 },
  starOn: { color: '#F4A94E' },
  submitBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.PRIMARY,
  },
  submitTxt: { color: Colors.WHITE, fontSize: 13, fontWeight: '800' },
  topStars: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 2, marginBottom: 8,
  },
  topStar: { fontSize: 22, color: 'rgba(255,255,255,0.8)' },
  topStarOn: { color: '#F4A94E' },
  topScore: { fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: '700', marginRight: 6 },
  mapWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  mapHint: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  mapClose: {
    position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  mapHintTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
