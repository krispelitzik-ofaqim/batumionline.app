import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';
import { useAccessibility } from '../constants/accessibilityContext';
import { useI18n } from '../constants/i18n';

function useBatumiClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tbilisi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

const LANGS: { code: 'he' | 'en' | 'fa'; label: string }[] = [
  { code: 'he', label: 'עב' },
  { code: 'en', label: 'EN' },
  { code: 'fa', label: 'فا' },
];

export default function HeaderBar() {
  const { dark, toggle } = useContext(ThemeContext);
  const { lang, setLang } = useI18n();
  const time = useBatumiClock();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/index';
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;
  const fg = dark ? Colors.BACKGROUND : Colors.TEXT;
  const accent = dark ? Colors.ACCENT : Colors.PRIMARY;
  const [a11yOpen, setA11yOpen] = useState(false);
  const { settings, update, reset } = useAccessibility();

  return (
    <View style={[styles.bar, { backgroundColor: bg, borderBottomColor: dark ? Colors.PRIMARY : Colors.SECONDARY + '30' }]}>
      {/* LEFT — back arrow (when not home) + clock */}
      <View style={styles.sideLeft}>
        {!isHome && (
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
            <Text style={{ fontSize: 28, color: fg, fontWeight: '300' }}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.clock, { color: fg }]}>{time}</Text>
      </View>

      {/* CENTER — wide language segmented control */}
      <View style={[styles.langSeg, { borderColor: accent + '55' }]}>
        {LANGS.map((L) => {
          const on = lang === L.code;
          return (
            <TouchableOpacity
              key={L.code}
              onPress={() => setLang(L.code)}
              activeOpacity={0.7}
              style={[styles.langSegBtn, on && { backgroundColor: accent }]}
            >
              <Text style={[styles.langSegTxt, { color: on ? (dark ? Colors.TEXT : '#fff') : fg }]}>{L.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* RIGHT — light/dark toggle */}
      <View style={styles.sideRight}>
        <TouchableOpacity style={styles.btn} onPress={toggle}>
          <Ionicons name={dark ? 'sunny' : 'moon'} size={22} color={accent} />
        </TouchableOpacity>
      </View>

      <Modal visible={a11yOpen} transparent animationType="slide" onRequestClose={() => setA11yOpen(false)}>
        <View style={ms.backdrop}>
          <View style={ms.sheet}>
            <View style={ms.header}>
              <Ionicons name="accessibility" size={24} color={Colors.PRIMARY} />
              <Text style={ms.title}>תפריט נגישות</Text>
              <TouchableOpacity onPress={() => setA11yOpen(false)} style={ms.close}>
                <Text style={ms.closeX}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
              <View>
                <Text style={ms.sectionTitle}>גודל טקסט</Text>
                <Text style={{ fontSize: 12, color: '#475569', writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, lineHeight: 18 }}>
                  גודל הטקסט נקבע לפי הגדרות המכשיר. ניתן להגדיל/להקטין דרך:
                  {'\n'}הגדרות → תצוגה ובהירות → גודל טקסט
                </Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => Linking.openURL('app-settings:').catch(() => Alert.alert('פתח ידנית: הגדרות → תצוגה ובהירות → גודל טקסט'))} style={ms.chip}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: Colors.PRIMARY }}>⚙️ פתח הגדרות מכשיר</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => update({ highContrast: !settings.highContrast })} style={ms.toggleRow}>
                <Text style={ms.toggleLabel}>🌗 ניגודיות גבוהה</Text>
                <View style={[ms.toggleTrack, settings.highContrast && { backgroundColor: Colors.PRIMARY }]}>
                  <View style={[ms.toggleThumb, settings.highContrast && { marginLeft: 22 }]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={ms.reset}>
                <Text style={ms.resetTxt}>↻ אפס הגדרות</Text>
              </TouchableOpacity>
              <Text style={ms.note}>הגדרות אלו נשמרות ויחולו בכל האפליקציה.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' },
  sheet: { backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 16, fontWeight: '800', color: '#64748b' },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8 },
  chip: { alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#cbd5e1', padding: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  reset: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10 },
  resetTxt: { color: '#475569', fontSize: 13, fontWeight: '800' },
  note: { fontSize: 11, color: '#94a3b8', textAlign: 'center', writingDirection: 'rtl', marginTop: 4 },
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sideLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sideRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontSize: 18,
    fontWeight: '800',
  },
  langSeg: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  langSegBtn: {
    minWidth: 46,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSegTxt: {
    fontSize: 14,
    fontWeight: '900',
  },
});
