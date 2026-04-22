import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchContent } from '../constants/api';

type Popup = {
  id: string;
  title: string;
  message: string;
  target: string;
  position: 'top' | 'center' | 'bottom';
  visible: boolean;
  startAt?: string;
  endAt?: string;
  bgColor?: string;
  redeemCode?: string;
};

const DISMISSED_KEY = '@popup_dismissed_ids';

export default function PopupDisplay({ page }: { page: string }) {
  const [active, setActive] = useState<Popup | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DISMISSED_KEY);
        setDismissedIds(raw ? JSON.parse(raw) : []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchContent();
        const popups: Popup[] = Array.isArray(data?.popups) ? data.popups : [];
        const now = new Date();
        const match = popups.find(p => {
          if (!p.visible) return false;
          if (dismissedIds.includes(p.id)) return false;
          if (p.target !== 'all' && p.target !== page) return false;
          if (p.startAt && new Date(p.startAt) > now) return false;
          if (p.endAt && new Date(p.endAt + 'T23:59:59') < now) return false;
          return true;
        });
        setActive(match || null);
      } catch {}
    };
    load();
  }, [page, dismissedIds]);

  const dismiss = async () => {
    if (!active) return;
    const next = [...dismissedIds, active.id];
    setDismissedIds(next);
    try { await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)); } catch {}
    setActive(null);
  };

  if (!active) return null;

  const pos = active.position === 'top' ? s.top : active.position === 'bottom' ? s.bottom : s.center;
  const cardBg = active.bgColor || '#fff';
  const hex = cardBg.replace('#','');
  const r = parseInt(hex.slice(0,2) || 'ff', 16);
  const g = parseInt(hex.slice(2,4) || 'ff', 16);
  const b = parseInt(hex.slice(4,6) || 'ff', 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  const isDarkBg = luminance < 140;
  const titleColor = isDarkBg ? '#ffffff' : '#1C2B35';
  const msgColor = isDarkBg ? '#e2e8f0' : '#475569';

  return (
    <View style={[s.overlay, pos]} pointerEvents="box-none">
      <View style={[s.card, { backgroundColor: cardBg }]}>
        <View style={s.brandRow}>
          <Image source={isDarkBg ? require('../assets/images/batumi_icon_light.png') : require('../assets/images/batumi_icon.png')} style={s.brandLogo} resizeMode="contain" />
          <Text style={[s.brandText, { color: isDarkBg ? '#F4A94E' : '#1A6B8A' }]}>Batumionline</Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={s.closeBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: titleColor }]}>{active.title}</Text>
        <Text style={[s.msg, { color: msgColor }]}>{active.message}</Text>
        {!!active.redeemCode && (
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>🎁 קוד למימוש ההטבה</Text>
            <Text selectable style={s.codeVal}>{active.redeemCode}</Text>
          </View>
        )}
        <View style={s.signatureRow}>
          <Text style={[s.signature, { color: isDarkBg ? 'rgba(255,255,255,0.6)' : '#94a3b8' }]}>— Batumionline.app</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    left: 0, right: 0, padding: 16, zIndex: 9999,
    alignItems: 'center',
  },
  top: { top: 20 },
  center: { top: '40%' },
  bottom: { bottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 20, maxWidth: 420, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    borderTopWidth: 4, borderTopColor: '#a855f7',
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(241,245,249,0.9)', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  closeTxt: { fontSize: 14, color: '#64748b', fontWeight: '900' },
  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 14, alignSelf: 'flex-start',
  },
  brandLogo: { width: 36, height: 36 },
  brandText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  title: {
    fontSize: 18, fontWeight: '900', color: '#1C2B35',
    writingDirection: 'rtl', textAlign: 'right', marginBottom: 10,
  },
  msg: {
    fontSize: 14, color: '#475569', writingDirection: 'rtl', textAlign: 'right', lineHeight: 22,
  },
  codeBox: {
    marginTop: 16, padding: 14, borderRadius: 10,
    backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13, fontWeight: '800', color: '#78350f', writingDirection: 'rtl', marginBottom: 6,
  },
  codeVal: {
    fontSize: 22, fontWeight: '900', color: '#b45309', letterSpacing: 3,
  },
  signatureRow: {
    marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
    alignItems: 'flex-start',
  },
  signature: {
    fontSize: 12, fontWeight: '700', fontStyle: 'italic',
  },
});
