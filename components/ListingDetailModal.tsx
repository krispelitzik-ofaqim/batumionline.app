import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { resolveUri } from '../constants/api';

const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#E0A82E';

const CLOSE_TXT: Record<string, string> = { he: 'סגור', en: 'Close', fa: 'بستن', ru: 'Закрыть' };
const FEATURED_TXT: Record<string, string> = { he: 'מובלט', en: 'Featured', fa: 'ویژه', ru: 'ТОП' };

type Listing = { title?: string; price?: string; description?: string; phone?: string; images?: string[]; featured?: boolean } | null;

export default function ListingDetailModal({ visible, listing, onClose, isRTL, lang }: { visible: boolean; listing: Listing; onClose: () => void; isRTL: boolean; lang: string }) {
  const { width } = useWindowDimensions();
  const scRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';
  if (!listing) return null;
  const imgs = (listing.images || []).map(resolveUri).filter(Boolean);
  const W = width;
  const H = Math.min(Math.round(width * 0.8), 460);
  const jump = (i: number) => { setIdx(i); scRef.current?.scrollTo({ x: i * W, animated: true }); };
  const phone = listing.phone && listing.phone !== '—' ? listing.phone : '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}><Text style={s.closeX}>✕</Text></TouchableOpacity>
          <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{listing.title || ''}</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Big gallery */}
          {imgs.length > 0 && (
            <View>
              <ScrollView ref={scRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}>
                {imgs.map((u, i) => <Image key={i} source={{ uri: u }} style={{ width: W, height: H }} resizeMode="cover" />)}
              </ScrollView>
              {listing.featured && <View style={s.ribbon}><Text style={s.ribbonTxt}>⭐ {FEATURED_TXT[lang] || 'Featured'}</Text></View>}
              {imgs.length > 1 && <View style={s.counter}><Text style={s.counterTxt}>{idx + 1}/{imgs.length}</Text></View>}
            </View>
          )}
          {/* Thumbnails */}
          {imgs.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10, gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {imgs.map((u, i) => (
                <TouchableOpacity key={i} onPress={() => jump(i)} activeOpacity={0.8}>
                  <Image source={{ uri: u }} style={[s.thumb, i === idx && s.thumbOn]} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {/* Details */}
          <View style={{ padding: 18 }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[s.title, { textAlign: ta, writingDirection: wd, flex: 1 }]}>{listing.title}</Text>
              {!!listing.price && <Text style={s.price}>{listing.price}</Text>}
            </View>
            {!!listing.description && <Text style={[s.desc, { textAlign: ta, writingDirection: wd }]}>{listing.description}</Text>}
            {!!phone && (
              <View style={[s.contactRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`)} style={s.waBtn}>
                  <Text style={s.waTxt}>✆ WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={s.callBtn}>
                  <Text style={s.callTxt}>☎ {phone}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={s.bottomClose}><Text style={s.bottomCloseTxt}>{CLOSE_TXT[lang] || 'Close'}</Text></TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, paddingTop: 48, gap: 8, backgroundColor: NAVY },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#fff', fontSize: 18, fontFamily: F.b },
  hTitle: { flex: 1, fontSize: 18, fontFamily: F.m, color: '#fff' },
  ribbon: { position: 'absolute', top: 12, right: 12, backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  ribbonTxt: { color: '#16222c', fontFamily: F.x, fontSize: 13 },
  counter: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  counterTxt: { color: '#fff', fontSize: 12, fontFamily: F.b },
  thumb: { width: 64, height: 64, borderRadius: 4, borderWidth: 2, borderColor: 'transparent' },
  thumbOn: { borderColor: GOLD },
  title: { fontSize: 26, fontFamily: F.m, color: '#16222c', lineHeight: 32 },
  price: { fontSize: 24, fontFamily: F.x, color: '#10b981', marginHorizontal: 10 },
  desc: { fontSize: 16, fontFamily: F.r, color: '#3d4a54', lineHeight: 25, marginTop: 12 },
  contactRow: { gap: 10, marginTop: 20 },
  waBtn: { flex: 1, backgroundColor: '#25D366', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  waTxt: { color: '#fff', fontFamily: F.b, fontSize: 16 },
  callBtn: { flex: 1, backgroundColor: NAVY, borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  callTxt: { color: '#fff', fontFamily: F.b, fontSize: 16 },
  bottomClose: { padding: 16, alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e7e0d4' },
  bottomCloseTxt: { color: NAVY, fontFamily: F.b, fontSize: 16 },
});
