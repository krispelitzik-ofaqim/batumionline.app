import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useI18n } from '../constants/i18n';

// Bottom CTA on the restaurants category page + individual restaurant pages,
// driving traffic to the coupons list (/coupons).
const TR: Record<string, { title: string; sub: string }> = {
  he: { title: 'קבל הנחה במסעדות', sub: 'כל קופוני ההנחה במקום אחד' },
  en: { title: 'Get a discount at restaurants', sub: 'All discount coupons in one place' },
  fa: { title: 'در رستوران‌ها تخفیف بگیرید', sub: 'همه کوپن‌های تخفیف در یک جا' },
  ru: { title: 'Получите скидку в ресторанах', sub: 'Все купоны на скидку в одном месте' },
};

export default function RestaurantCouponBanner() {
  const { lang } = useI18n();
  const isRTL = lang === 'he' || lang === 'fa';
  const c = TR[lang] || TR.en;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/coupons' as any)}
      style={[s.wrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Text style={s.emoji}>🎫</Text>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={[s.title, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]} numberOfLines={1}>{c.title}</Text>
        <Text style={[s.sub, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]} numberOfLines={1}>{c.sub}</Text>
      </View>
      <Text style={s.arrow}>{isRTL ? '‹' : '›'}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center', backgroundColor: '#4F8A6E', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  emoji: { fontSize: 26 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  arrow: { color: '#fff', fontSize: 26, fontWeight: '300' },
});
