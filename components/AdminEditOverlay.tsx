import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { AdminContext } from '../constants/adminContext';

// ─── Floating Admin Button ─────────────────────────────────────
export function AdminFloatingButton({ onEnterEdit }: { onEnterEdit: () => void }) {
  const { isAdmin } = useContext(AdminContext);
  if (!isAdmin) return null;

  return (
    <View style={fab.container}>
      <TouchableOpacity style={fab.btn} onPress={onEnterEdit} activeOpacity={0.8}>
        <Text style={fab.icon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[fab.btn, fab.btnSmall]} onPress={() => router.push('/admin/dashboard')} activeOpacity={0.8}>
        <Text style={fab.iconSmall}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const fab = StyleSheet.create({
  container: { position: 'absolute', bottom: 70, left: 16, gap: 8, zIndex: 100 },
  btn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.PRIMARY,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  btnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.SECONDARY },
  icon: { fontSize: 22 },
  iconSmall: { fontSize: 16 },
});

// ─── Edit Mode Toolbar ─────────────────────────────────────────
export function EditToolbar({ onSave, onExit }: { onSave: () => void; onExit: () => void }) {
  return (
    <View style={tb.bar}>
      <Text style={tb.label}>מצב עריכה</Text>
      <View style={tb.btns}>
        <TouchableOpacity style={tb.saveBtn} onPress={onSave}>
          <Text style={tb.saveTxt}>שמור</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tb.exitBtn} onPress={onExit}>
          <Text style={tb.exitTxt}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    backgroundColor: Colors.PRIMARY, flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
  },
  label: { fontSize: 15, fontWeight: '700', color: Colors.WHITE, writingDirection: 'rtl' },
  btns: { flexDirection: 'row-reverse', gap: 8 },
  saveBtn: { backgroundColor: '#2ecc71', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveTxt: { fontSize: 14, fontWeight: '700', color: Colors.WHITE },
  exitBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  exitTxt: { fontSize: 14, fontWeight: '600', color: Colors.WHITE },
});

// ─── Inline Editable Text ──────────────────────────────────────
export function EditableText({
  value, onChangeText, style, editMode, textStyle,
}: {
  value: string; onChangeText: (t: string) => void; style?: any; editMode: boolean; textStyle?: any;
}) {
  const [editing, setEditing] = useState(false);

  if (!editMode) {
    return <Text style={[textStyle, style]}>{value}</Text>;
  }

  if (editing) {
    return (
      <TextInput
        style={[textStyle, style, et.input]}
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setEditing(false)}
        autoFocus
        textAlign="right"
      />
    );
  }

  return (
    <TouchableOpacity onPress={() => setEditing(true)} style={et.wrap}>
      <Text style={[textStyle, style]}>{value}</Text>
      <View style={et.editBadge}>
        <Text style={et.editBadgeIcon}>✏️</Text>
      </View>
    </TouchableOpacity>
  );
}

const et = StyleSheet.create({
  wrap: { position: 'relative' },
  input: {
    borderWidth: 1.5, borderColor: Colors.PRIMARY, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fff',
  },
  editBadge: {
    position: 'absolute', top: -6, left: -6,
    width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.PRIMARY,
    justifyContent: 'center', alignItems: 'center',
  },
  editBadgeIcon: { fontSize: 10 },
});

// ─── Reorder Controls ──────────────────────────────────────────
export function ReorderControls({
  index, total, onMove,
}: {
  index: number; total: number; onMove: (dir: -1 | 1) => void;
}) {
  return (
    <View style={rc.wrap}>
      <TouchableOpacity onPress={() => onMove(-1)} disabled={index === 0} style={rc.btn}>
        <Text style={[rc.arrow, index === 0 && { opacity: 0.2 }]}>▲</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onMove(1)} disabled={index === total - 1} style={rc.btn}>
        <Text style={[rc.arrow, index === total - 1 && { opacity: 0.2 }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const rc = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 4, right: 4, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 2,
  },
  btn: { padding: 4 },
  arrow: { fontSize: 12, color: Colors.WHITE, fontWeight: '700' },
});
