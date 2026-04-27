import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAccessibility } from '../constants/accessibilityContext';

export default function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const { settings, update, reset } = useAccessibility();

  const fontOptions = [
    { key: 'normal' as const, label: 'רגיל', size: 18 },
    { key: 'large' as const, label: 'גדול', size: 24 },
    { key: 'xlarge' as const, label: 'ענק', size: 30 },
  ];

  return (
    <>
      <View style={st.btnWrap} pointerEvents="box-none">
        <Text style={[st.arrow, { opacity: 0.5 }]}>⌃</Text>
        <Text style={[st.arrow, { opacity: 0.85, marginTop: -8 }]}>⌃</Text>
        <TouchableOpacity onPress={() => setOpen(true)} style={st.btn} accessibilityLabel="פתח תפריט נגישות" accessibilityRole="button">
          <Ionicons name="accessibility" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

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
                    const on = settings.fontScale === opt.key;
                    return (
                      <TouchableOpacity key={opt.key} onPress={() => update({ fontScale: opt.key })} style={[st.chip, on && st.chipOn]}>
                        <Text style={[{ fontSize: opt.size, fontWeight: '900', color: on ? '#fff' : Colors.PRIMARY }]}>A</Text>
                        <Text style={[st.chipLabel, on && { color: '#fff' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Toggle label="🌗 ניגודיות גבוהה" value={settings.highContrast} onChange={v => update({ highContrast: v })} />
              <Toggle label="🎬 הפחתת אנימציות" value={settings.reduceMotion} onChange={v => update({ reduceMotion: v })} />
              <Toggle label="🔗 הדגשת קישורים" value={settings.underlineLinks} onChange={v => update({ underlineLinks: v })} />

              <TouchableOpacity onPress={reset} style={st.reset}>
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
  btnWrap: { alignItems: 'center', marginTop: 0, marginBottom: 0 },
  arrow: { fontSize: 16, color: '#0077be', fontWeight: '900', lineHeight: 16 },
  btn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0077be', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
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
