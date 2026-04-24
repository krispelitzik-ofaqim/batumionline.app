import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { resolveUri } from '../constants/api';

export type DevUnit = {
  id: string;
  title: string;
  image?: string;
  price: string;
  size?: string;
  description?: string;
  images?: string[];
  sold?: boolean;
  soldAt?: string;
};

export type Developer = {
  id: string;
  logo?: string;
  company: string;
  projectName: string;
  brandColor?: string;
  location?: string;
  deliveryDate?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  units?: DevUnit[];
  package?: 'basic' | 'premium';
};

export default function DeveloperCard({ d }: { d: Developer }) {
  const [selectedUnit, setSelectedUnit] = useState<DevUnit | null>(null);
  const premium = d.package === 'premium';
  const brand = d.brandColor || Colors.PRIMARY;
  const tint = brand + '0D';
  const units = d.units || [];
  const featured = units[0];
  const rest = units.slice(1, 5);
  const isRtl = /[\u0590-\u05FF]/.test((d.company || '') + (d.projectName || ''));
  const textAlign: 'left' | 'right' = isRtl ? 'right' : 'left';
  const writingDirection: 'ltr' | 'rtl' = isRtl ? 'rtl' : 'ltr';
  const headerDir: 'row' | 'row-reverse' = isRtl ? 'row-reverse' : 'row';
  const badgePos = isRtl ? { left: 8 } : { right: 8 };
  const metaLine = [d.location, d.deliveryDate].filter(Boolean).join(' · ');

  return (
    <View style={[s.card, { backgroundColor: tint, borderColor: brand + '40' }, premium && { borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }]}>
      {premium && <View style={[s.badge, { backgroundColor: '#f59e0b', top: 8 }, badgePos]}><Text style={s.badgeTxt}>✨ Premium</Text></View>}

      <View style={[s.headerRow, { flexDirection: headerDir }]}>
        {d.logo && <Image source={{ uri: resolveUri(d.logo) }} style={[s.logoSide, { borderColor: brand + '40' }]} />}
        <View style={{ flex: 1 }}>
          <Text style={[s.company, { color: brand, textAlign, writingDirection }]} numberOfLines={1}>{d.company}</Text>
          <Text style={[s.project, { textAlign, writingDirection }]} numberOfLines={1}>{d.projectName}</Text>
          {metaLine.length > 0 && <Text style={[s.metaTxt, { textAlign, writingDirection }]} numberOfLines={1}>📍 {metaLine}</Text>}
        </View>
      </View>

      {featured && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedUnit(featured)} style={s.featured}>
          {featured.image && <Image source={{ uri: resolveUri(featured.image) }} style={s.featuredImg} />}
          {featured.sold && <View style={s.soldStamp}><Text style={s.soldStampTxt}>נמכר</Text></View>}
          <View style={[s.unitOverlay, { backgroundColor: brand + 'DD' }]}>
            <Text style={s.unitTitleBig}>{featured.title}</Text>
            <Text style={s.unitPriceBig}>{featured.price}</Text>
          </View>
        </TouchableOpacity>
      )}

      {rest.length > 0 && (
        <View style={s.grid}>
          {rest.map(u => (
            <TouchableOpacity key={u.id} activeOpacity={0.85} onPress={() => setSelectedUnit(u)} style={[s.smallUnit, { borderColor: brand + '30' }]}>
              <View style={{ position: 'relative' }}>
                {u.image && <Image source={{ uri: resolveUri(u.image) }} style={s.smallUnitImg} />}
                {u.sold && <View style={s.soldStampSmall}><Text style={s.soldStampTxtSmall}>נמכר</Text></View>}
              </View>
              <View style={{ padding: 6 }}>
                <Text style={s.smallTitle} numberOfLines={1}>{u.title}</Text>
                <Text style={[s.smallPrice, { color: brand }]}>{u.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.actions}>
        {d.whatsapp && (
          <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${d.whatsapp}`)} style={s.waBtn}>
            <Text style={s.waBtnTxt}>💬 WhatsApp</Text>
          </TouchableOpacity>
        )}
        {d.phone && !d.whatsapp && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${d.phone}`)} style={s.waBtn}>
            <Text style={s.waBtnTxt}>📞 חיוג</Text>
          </TouchableOpacity>
        )}
        {d.website && (
          <TouchableOpacity onPress={() => Linking.openURL(d.website!)} style={[s.siteBtn, { backgroundColor: brand }]}>
            <Text style={s.siteBtnTxt}>🌐 אתר החברה</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedUnit && (
        <View style={s.unitModal}>
          <View style={s.unitModalHeader}>
            <TouchableOpacity onPress={() => setSelectedUnit(null)} style={s.closeBtn}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={s.unitModalTitle}>{selectedUnit.title}</Text>
          </View>
          {selectedUnit.image && <Image source={{ uri: resolveUri(selectedUnit.image) }} style={{ width: '100%', aspectRatio: 16 / 10 }} />}
          <View style={{ padding: 12 }}>
            {selectedUnit.size && <Text style={s.unitDetailMeta}>📐 {selectedUnit.size}</Text>}
            {selectedUnit.description && <Text style={s.unitDetailDesc}>{selectedUnit.description}</Text>}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={s.unitModalPrice}>{selectedUnit.price}</Text>
              {d.whatsapp && (
                <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${d.whatsapp}?text=${encodeURIComponent('מתעניין ב' + selectedUnit.title)}`)} style={s.waBtn}>
                  <Text style={s.waBtnTxt}>💬 בירור</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { width: '100%', borderRadius: 14, overflow: 'hidden', borderWidth: 1, marginBottom: 12, position: 'relative', padding: 10 },
  badge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, zIndex: 5 },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },

  headerRow: { alignItems: 'center', gap: 10, marginBottom: 10, paddingTop: 4 },
  logo: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1 },
  logoSide: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1 },
  logoWrap: { alignItems: 'center', marginBottom: 6 },
  logoTop: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1 },
  company: { fontSize: 11, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  project: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  meta: { flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  metaTxt: { fontSize: 11, color: '#475569' },

  featured: { width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  featuredImg: { width: '100%', height: '100%' },
  unitOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  unitTitleBig: { fontSize: 13, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'right', writingDirection: 'rtl' },
  unitPriceBig: { fontSize: 14, fontWeight: '900', color: '#fff' },

  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  smallUnit: { width: '48%', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  smallUnitImg: { width: '100%', height: 70 },
  smallTitle: { fontSize: 11, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  smallPrice: { fontSize: 12, fontWeight: '900', marginTop: 2 },

  actions: { flexDirection: 'row-reverse', gap: 6, marginTop: 4 },
  waBtn: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#25D366', alignItems: 'center' },
  waBtnTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },
  siteBtn: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  siteBtnTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },

  unitModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', borderRadius: 14, overflow: 'hidden', zIndex: 10 },
  unitModalHeader: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, backgroundColor: '#1e293b', gap: 10 },
  unitModalTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontWeight: '900' },
  unitDetailMeta: { fontSize: 12, color: '#cbd5e1', textAlign: 'right', writingDirection: 'rtl' },
  unitDetailDesc: { fontSize: 13, color: '#e2e8f0', marginTop: 6, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  unitModalPrice: { fontSize: 18, fontWeight: '900', color: '#10b981' },

  soldStamp: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(220,38,38,0.95)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, transform: [{ rotate: '-12deg' }], borderWidth: 2, borderColor: '#fff', zIndex: 3 },
  soldStampTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  soldStampSmall: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(220,38,38,0.95)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, transform: [{ rotate: '-10deg' }], borderWidth: 1, borderColor: '#fff', zIndex: 3 },
  soldStampTxtSmall: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
