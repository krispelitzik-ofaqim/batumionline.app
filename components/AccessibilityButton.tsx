import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAccessibility } from '../constants/accessibilityContext';

export default function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const { settings, update, reset } = useAccessibility();

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={st.btn} accessibilityLabel="פתח תפריט נגישות" accessibilityRole="button">
        <Ionicons name="accessibility" size={20} color="#fff" />
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
                <Text style={{ fontSize: 12, color: '#475569', writingDirection: 'rtl', textAlign: 'right', marginBottom: 8, lineHeight: 18 }}>
                  גודל הטקסט נקבע לפי הגדרות המכשיר. ניתן להגדיל/להקטין דרך:
                  {'\n'}הגדרות → תצוגה ובהירות → גודל טקסט
                </Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => Linking.openURL('app-settings:').catch(() => Alert.alert('פתח ידנית: הגדרות → תצוגה ובהירות → גודל טקסט'))} style={[st.chip, { paddingVertical: 12 }]}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: Colors.PRIMARY }}>⚙️ פתח הגדרות מכשיר</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Toggle label="🌗 ניגודיות גבוהה" value={settings.highContrast} onChange={v => update({ highContrast: v })} />

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
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0077be', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
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
