import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

const KEY = '@accessibility_settings';

type Settings = {
  fontScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
};

const DEFAULTS: Settings = {
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
};

export default function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) try { setS({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
    });
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const fontOptions = [
    { key: 'normal' as const, label: 'רגיל', val: 'A' },
    { key: 'large' as const, label: 'גדול', val: 'A' },
    { key: 'xlarge' as const, label: 'ענק', val: 'A' },
  ];
  const fontSizes = { normal: 18, large: 24, xlarge: 30 };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={st.btn} accessibilityLabel="פתח תפריט נגישות" accessibilityRole="button">
        <Ionicons name="accessibility" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={st.backdrop}>
          <View style={st.sheet}>
            <View style={st.header}>
              <Ionicons name="accessibility" size={24} color={Colors.PRIMARY} />
              <Text style={st.title}>תפריט נגישות</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={st.close}>
                <Text style={st.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
              <View>
                <Text style={st.sectionTitle}>גודל טקסט</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                  {fontOptions.map(opt => {
                    const on = s.fontScale === opt.key;
                    return (
                      <TouchableOpacity key={opt.key} onPress={() => update({ fontScale: opt.key })} style={[st.chip, on && st.chipOn]}>
                        <Text style={[{ fontSize: fontSizes[opt.key], fontWeight: '900', color: on ? '#fff' : Colors.PRIMARY }]}>{opt.val}</Text>
                        <Text style={[st.chipLabel, on && { color: '#fff' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Toggle label="🌗 ניגודיות גבוהה" value={s.highContrast} onChange={v => update({ highContrast: v })} />
              <Toggle label="🎬 הפחתת אנימציות" value={s.reduceMotion} onChange={v => update({ reduceMotion: v })} />
              <Toggle label="🔗 הדגשת קישורים" value={s.underlineLinks} onChange={v => update({ underlineLinks: v })} />

              <TouchableOpacity onPress={() => update(DEFAULTS)} style={st.reset}>
                <Text style={st.resetTxt}>↻ אפס הגדרות</Text>
              </TouchableOpacity>

              <Text style={st.note}>הגדרות אלו נשמרות ויחולו בכל האפליקציה.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={st.toggleRow} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Text style={st.toggleLabel}>{label}</Text>
      <View style={[st.toggleTrack, value && { backgroundColor: Colors.PRIMARY }]}>
        <View style={[st.toggleThumb, value && { marginLeft: 22 }]} />
      </View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  btn: { position: 'absolute', left: 16, bottom: 56, width: 44, height: 44, borderRadius: 22, backgroundColor: '#0077be', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6, zIndex: 100 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 16, fontWeight: '800', color: '#64748b' },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#fff', gap: 4 },
  chipOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  chipLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: Colors.TEXT, writingDirection: 'rtl' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#cbd5e1', padding: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  reset: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10 },
  resetTxt: { color: '#475569', fontSize: 13, fontWeight: '800' },
  note: { fontSize: 11, color: '#94a3b8', textAlign: 'center', writingDirection: 'rtl', marginTop: 4 },
});
