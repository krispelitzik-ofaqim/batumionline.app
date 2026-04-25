import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { fetchContent, resolveUri } from '../../constants/api';

type Broker = {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  whatsapp?: string;
  image?: string;
  description?: string;
  city?: string;
  yearsActive?: string;
  visible?: boolean;
};

const BROKER_IMAGES = [
  '/uploads/1775910069485-6.jpg',
  '/uploads/1775910069516-30.jpg',
  '/uploads/1775910069548-933.jpg',
  '/uploads/1775910069562-341.jpg',
  '/uploads/1775910069573-698.jpg',
  '/uploads/1775910069590-365.jpg',
];

const FALLBACK: Broker[] = Array.from({ length: 6 }, (_, i) => ({
  id: `b${i + 1}`,
  name: 'דודי ספיר',
  title: 'מתווך נדל״ן מומלץ בבטומי',
  phone: '+995-555-123-456',
  whatsapp: '972501234567',
  image: BROKER_IMAGES[i],
  description: 'מתווך מורשה עם 8 שנות ניסיון בבטומי. דובר עברית, רוסית וגאורגית. ליווי מלא בעסקאות נדל"ן מתחילתן ועד החתימה הסופית.',
  city: 'בטומי',
  yearsActive: '8 שנים',
  visible: true,
}));

export default function BrokersPortal() {
  const [items, setItems] = useState<Broker[]>(FALLBACK);

  useEffect(() => {
    fetchContent().then(d => {
      if (Array.isArray(d?.brokers) && d.brokers.length > 0) setItems(d.brokers.filter((b: Broker) => b.visible !== false));
    }).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/portal/realestate' as any)} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>מתווכי נדל"ן מורשים</Text>
      </View>

      <View style={s.intro}>
        <Text style={s.introTxt}>✓ כל המתווכים נבדקו ואושרו על ידי פורטל הנדל"ן. רישיון, ניסיון, ושירות בעברית.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.map(b => (
          <View key={b.id} style={s.card}>
            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
              {b.image && <Image source={{ uri: resolveUri(b.image) }} style={s.img} resizeMode="cover" />}
              <View style={{ flex: 1 }}>
                {!!b.title && <Text style={s.cardKicker}>✓ {b.title}</Text>}
                <Text style={s.cardName}>{b.name}</Text>
                {!!b.city && <Text style={s.cardMeta}>📍 {b.city}{b.yearsActive ? ` · ${b.yearsActive}` : ''}</Text>}
              </View>
            </View>
            {!!b.description && <Text style={s.desc}>{b.description}</Text>}
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 10 }}>
              {b.whatsapp && (
                <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`)} style={[s.btn, { backgroundColor: '#25D366' }]}>
                  <Text style={s.btnTxt}>💬 WhatsApp</Text>
                </TouchableOpacity>
              )}
              {b.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${b.phone}`)} style={[s.btn, { backgroundColor: Colors.PRIMARY }]}>
                  <Text style={s.btnTxt}>📞 חייג</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {items.length === 0 && <Text style={s.empty}>אין מתווכים זמינים כרגע</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '300' },
  title: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  intro: { padding: 12, backgroundColor: '#dcfce7', borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  introTxt: { fontSize: 12, color: '#166534', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  img: { width: 80, height: 80, borderRadius: 8 },
  cardKicker: { fontSize: 11, fontWeight: '700', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl' },
  cardName: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  desc: { fontSize: 12, color: '#475569', textAlign: 'right', writingDirection: 'rtl', lineHeight: 18, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  empty: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40, writingDirection: 'rtl' },
});
