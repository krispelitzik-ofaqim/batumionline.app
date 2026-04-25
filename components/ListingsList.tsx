import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, ScrollView, TextInput } from 'react-native';
import { Colors } from '../constants/colors';
import { API_BASE, resolveUri } from '../constants/api';

type Listing = {
  id: string; type: string; title: string; description?: string;
  price?: string; location?: string; phone?: string; images?: string[];
  size?: 'banner' | 'half' | 'full'; period?: string; createdAt?: string;
  highlighted?: boolean; bumped?: boolean;
};

const PERIOD_LABEL: Record<string, string> = { daily: 'יומי', monthly: 'חודשי', yearly: 'שנתי', other: 'אחר' };
const ADMIN_WA = '972XXXXXXXXX'; // TODO: replace with admin's WhatsApp number
const shortId = (id: string, createdAt?: string) => {
  // 4-digit numeric hash from id + "-" + 2-digit year
  const s = id.replace(/^lst_/, '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  const n4 = String(Math.abs(h) % 10000).padStart(4, '0');
  const yy = createdAt ? String(new Date(createdAt).getFullYear() % 100).padStart(2, '0') : '26';
  return `${n4}-${yy}`;
};

function Expanded({ l, onClose }: { l: Listing; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [removeMode, setRemoveMode] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [removeError, setRemoveError] = useState('');
  const imgs = l.images || [];
  const openWa = () => l.phone && Linking.openURL(`https://wa.me/${l.phone}`);
  const periodBadge = l.period ? PERIOD_LABEL[l.period] || l.period : null;
  const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '');
  const confirmRemove = () => {
    if (normalizePhone(phoneInput) === normalizePhone(l.phone || '') && phoneInput) {
      const msg = encodeURIComponent(`בקשה להסרת מודעה\nמס׳: ${shortId(l.id, (l as any).createdAt)}\nכותרת: ${l.title}\nטלפון: ${l.phone}`);
      Linking.openURL(`https://wa.me/${ADMIN_WA}?text=${msg}`);
      setRemoveMode(false);
      setPhoneInput('');
      setRemoveError('');
    } else {
      setRemoveError('טלפון לא תואם למפרסם');
    }
  };
  return (
    <View style={s.expanded}>
      <View style={s.expandedHeader}>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={s.expandedTitle} numberOfLines={1}>{l.title}</Text>
        <Text style={s.expandedId}>#{shortId(l.id, (l as any).createdAt)}</Text>
      </View>
      <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: '#000' }}>
        {imgs[idx] && <Image source={{ uri: resolveUri(imgs[idx]) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
        {imgs.length > 1 && (
          <>
            <TouchableOpacity style={[s.navArrow, { right: 8 }]} onPress={() => setIdx((idx - 1 + imgs.length) % imgs.length)}>
              <Text style={s.navArrowTxt}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.navArrow, { left: 8 }]} onPress={() => setIdx((idx + 1) % imgs.length)}>
              <Text style={s.navArrowTxt}>‹</Text>
            </TouchableOpacity>
            <View style={s.dots}>
              {imgs.map((_, i) => <View key={i} style={[s.dot, i === idx && s.dotActive]} />)}
            </View>
          </>
        )}
      </View>
      {imgs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 8 }} contentContainerStyle={{ gap: 6 }}>
          {imgs.map((u, i) => (
            <TouchableOpacity key={i} onPress={() => setIdx(i)}>
              <Image source={{ uri: resolveUri(u) }} style={[s.thumb, i === idx && s.thumbActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={{ padding: 12 }}>
        {l.location ? <Text style={s.expandedMeta}>📍 {l.location}</Text> : null}
        {l.description ? <Text style={s.expandedDesc}>{l.description}</Text> : null}
        <View style={s.expandedFooter}>
          <Text style={s.expandedPrice}>{l.price ? `$${l.price}${periodBadge ? ' · ' + periodBadge : ''}` : (periodBadge || '')}</Text>
          <TouchableOpacity onPress={openWa} style={s.waBtn}>
            <Text style={s.waBtnTxt}>📞 צור קשר בוואטסאפ</Text>
          </TouchableOpacity>
        </View>
        {removeMode ? (
          <View style={{ marginTop: 10, backgroundColor: 'rgba(220,38,38,0.15)', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12, color: '#fca5a5', writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 }}>אמת את הטלפון שלך כמפרסם:</Text>
            <TextInput
              style={{ backgroundColor: '#fff', borderRadius: 6, padding: 8, fontSize: 13, textAlign: 'right' }}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder="הזן את הטלפון שהזנת בפרסום"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            {removeError ? <Text style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{removeError}</Text> : null}
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginTop: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#dc2626', borderRadius: 6, paddingVertical: 8, alignItems: 'center' }} onPress={confirmRemove}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>אמת ושלח בקשת הסרה</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6 }} onPress={() => { setRemoveMode(false); setPhoneInput(''); setRemoveError(''); }}>
                <Text style={{ color: '#fff', fontSize: 11 }}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setRemoveMode(true)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', textDecorationLine: 'underline' }}>🗑️ אני המפרסם - הסר מודעה</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function CardImage({ images, height }: { images: string[]; height: number }) {
  if (images.length === 0) return <View style={{ height, backgroundColor: '#e2e8f0' }} />;
  return (
    <View style={{ height, position: 'relative', backgroundColor: '#000' }}>
      <Image source={{ uri: resolveUri(images[0]) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {images.length > 1 && (
        <View style={{ position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>📷 {images.length}</Text>
        </View>
      )}
    </View>
  );
}

function Card({ l, onPress }: { l: Listing; onPress: () => void }) {
  const size = l.size || 'half';
  const imgs = l.images || [];
  const img = imgs[0];
  const periodBadge = l.period ? PERIOD_LABEL[l.period] || l.period : null;
  const verified = !!l.phone;
  const openWa = (e: any) => { e.stopPropagation?.(); if (l.phone) Linking.openURL(`https://wa.me/${String(l.phone).replace(/\D/g, '')}`); };

  if (size === 'banner') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.banner, l.highlighted && s.highlighted]}>
        <View style={{ width: 140, height: 110, position: 'relative' }}>
          <CardImage images={imgs} height={110} />
        </View>
        <View style={s.bannerBody}>
          <View>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.bannerTitle} numberOfLines={1}>{l.title}</Text>
              <Text style={s.idBadge}>#{shortId(l.id, (l as any).createdAt)}</Text>
            </View>
            <Text style={s.bannerInfo} numberOfLines={1}>{l.location || ''}{l.description ? ` · ${l.description}` : ''}</Text>
          </View>
          <View style={s.bannerBottom}>
            <Text style={[s.bannerPrice, { fontSize: 16 }]}>{l.price ? `$${l.price}${periodBadge ? ' · ' + periodBadge : ''}` : (periodBadge || '')}</Text>
            <Text style={s.moreLink}>פרטים ‹</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (size === 'full') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={s.full}>
        <CardImage images={imgs} height={180} />
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.cardTitle} numberOfLines={1}>{l.title}</Text>
            <Text style={s.idBadge}>#{shortId(l.id, (l as any).createdAt)}</Text>
          </View>
          {l.location ? <Text style={s.cardSub}>📍 {l.location}</Text> : null}
          {l.description ? <Text style={s.cardDesc} numberOfLines={2}>{l.description}</Text> : null}
          <View style={[s.cardFooter, { marginTop: 8 }]}>
            <Text style={[s.cardPrice, { fontSize: 18 }]}>{l.price ? `$${l.price}${periodBadge ? ' · ' + periodBadge : ''}` : (periodBadge || '')}</Text>
            <Text style={s.moreLink}>פרטים נוספים ‹</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={s.half}>
      <CardImage images={imgs} height={110} />
      <View style={{ padding: 8 }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.cardTitle} numberOfLines={1}>{l.title}</Text>
          <Text style={s.idBadge}>#{shortId(l.id, (l as any).createdAt)}</Text>
        </View>
        {l.location ? <Text style={s.cardSub} numberOfLines={1}>📍 {l.location}</Text> : null}
        <View style={[s.cardFooter, { marginTop: 4 }]}>
          <Text style={[s.cardPrice, { fontSize: 14 }]}>{l.price ? `$${l.price}` : (periodBadge || '')}</Text>
          <Text style={[s.moreLink, { fontSize: 9 }]}>פרטים ‹</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ListingsList({ type, reloadKey }: { type: string; reloadKey?: number }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/listings?type=${encodeURIComponent(type)}`);
      const j = await r.json();
      setItems((j.listings || []).filter((l: Listing) => l.images && l.images.length > 0));
    } catch {}
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load, reloadKey]);

  if (items.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#94a3b8', writingDirection: 'rtl' }}>{loading ? 'טוען...' : 'אין מודעות עדיין - היה הראשון לפרסם'}</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        {items.map(l => {
          const open = openId === l.id;
          return (
            <React.Fragment key={l.id}>
              <Card l={l} onPress={() => setOpenId(open ? null : l.id)} />
              {open && <Expanded l={l} onClose={() => setOpenId(null)} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: { width: '100%', flexDirection: 'row-reverse', alignItems: 'stretch', height: 110, backgroundColor: Colors.WHITE, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  bannerImg: { width: 140, height: 110 },
  highlighted: { borderWidth: 2, borderColor: '#f59e0b', backgroundColor: '#fffbeb', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  highlightBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, zIndex: 5 },
  highlightBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  bannerBody: { flex: 1, padding: 8, justifyContent: 'space-between' },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  bannerInfo: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl' },
  bannerBottom: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  bannerPrice: { fontSize: 12, fontWeight: '900', color: '#10b981', textAlign: 'right' },

  full: { width: '100%', backgroundColor: Colors.WHITE, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  fullImg: { width: '100%', height: 180 },

  half: { width: '48.8%', backgroundColor: Colors.WHITE, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  halfImg: { width: '100%', height: 110 },

  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  cardDesc: { fontSize: 12, color: '#334155', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardPrice: { fontSize: 13, fontWeight: '900', color: '#10b981' },
  idBadge: { fontSize: 9, fontWeight: '700', color: '#94a3b8', fontFamily: 'Courier' },
  moreLink: { fontSize: 10, fontWeight: '700', color: Colors.PRIMARY },

  expanded: { width: '100%', backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  expandedHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e293b' },
  expandedTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  expandedId: { fontSize: 11, color: '#94a3b8', fontFamily: 'Courier', fontWeight: '700' },
  expandedMeta: { fontSize: 12, color: '#cbd5e1', textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  expandedDesc: { fontSize: 13, color: '#e2e8f0', textAlign: 'right', writingDirection: 'rtl', marginBottom: 10, lineHeight: 20 },
  expandedFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  expandedPrice: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },

  navArrow: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  navArrowTxt: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 24 },
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 16 },
  thumb: { width: 64, height: 48, borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: Colors.ACCENT },

  waBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#25D366', borderRadius: 6 },
  waBtnTxt: { color: Colors.WHITE, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
});
