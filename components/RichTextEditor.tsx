import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const FONT_SIZES = [10, 12, 14, 16, 18, 20];
const FONT_FAMILIES = [
  { key: 'Arial', label: 'אריאל' },
  { key: 'Assistant', label: 'אסיסטנט' },
  { key: 'Arimo', label: 'ארימו' },
  { key: 'Heebo', label: 'הייבו' },
  { key: 'Open Sans Hebrew', label: 'אופן סאנס' },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
};

export default function RichTextEditor({ value, onChange, minHeight = 200 }: Props) {
  const ref = useRef<any>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (ref.current && value !== lastValueRef.current) {
      ref.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (ref.current && !ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
    }
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <TextInput
        style={[styles.fallback, { minHeight }]}
        value={value}
        onChangeText={onChange}
        multiline
        textAlign="right"
        placeholder="תוכן מלא..."
        placeholderTextColor="#bbb"
      />
    );
  }

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    (document as any).execCommand(cmd, false, val);
    if (ref.current) {
      onChange(ref.current.innerHTML);
      lastValueRef.current = ref.current.innerHTML;
    }
  };

  const handleInput = () => {
    if (ref.current) {
      const html = ref.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  };

  const Btn = ({ label, cmd, val, width }: { label: string; cmd: string; val?: string; width?: number }) => (
    <TouchableOpacity
      onPress={() => exec(cmd, val)}
      style={[styles.btn, width ? { minWidth: width } : null]}
    >
      <Text style={styles.btnTxt}>{label}</Text>
    </TouchableOpacity>
  );

  const DivEditable: any = 'div';

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Btn label="B" cmd="bold" />
        <Btn label="I" cmd="italic" />
        <Btn label="U" cmd="underline" />
        <Btn label="S" cmd="strikeThrough" />
        <View style={styles.sep} />
        <Btn label="↱" cmd="justifyRight" />
        <Btn label="≡" cmd="justifyCenter" />
        <Btn label="↰" cmd="justifyLeft" />
        <Btn label="⇹" cmd="justifyFull" />
        <View style={styles.sep} />
        <Btn label="• רשימה" cmd="insertUnorderedList" />
        <Btn label="1. רשימה" cmd="insertOrderedList" />
        <View style={styles.sep} />
        <Btn label="H1" cmd="formatBlock" val="H1" />
        <Btn label="H2" cmd="formatBlock" val="H2" />
        <Btn label="H3" cmd="formatBlock" val="H3" />
        <Btn label="פסקה" cmd="formatBlock" val="P" />
        <View style={styles.sep} />
        <Btn label="↶" cmd="undo" />
        <Btn label="↷" cmd="redo" />
        <Btn label="נקה" cmd="removeFormat" />
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.toolLabel}>גודל:</Text>
        {FONT_SIZES.map(sz => (
          <TouchableOpacity
            key={sz}
            onPress={() => {
              ref.current?.focus();
              (document as any).execCommand('fontSize', false, '7');
              const fontEls = ref.current?.querySelectorAll('font[size="7"]');
              fontEls?.forEach((el: any) => {
                el.removeAttribute('size');
                el.style.fontSize = sz + 'px';
              });
              handleInput();
            }}
            style={styles.btn}
          >
            <Text style={styles.btnTxt}>{sz}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.sep} />
        <Text style={styles.toolLabel}>גופן:</Text>
        {FONT_FAMILIES.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => exec('fontName', f.key)}
            style={styles.btn}
          >
            <Text style={[styles.btnTxt, { fontFamily: f.key }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <DivEditable
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dir="rtl"
        style={{
          minHeight,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          backgroundColor: '#fff',
          color: '#1C2B35',
          fontSize: 14,
          lineHeight: '1.6',
          outline: 'none',
          textAlign: 'right',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 28,
    alignItems: 'center',
  },
  btnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT,
  },
  toolLabel: {
    fontSize: 10,
    color: '#888',
    marginHorizontal: 4,
  },
  sep: {
    width: 1,
    height: 20,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  fallback: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.TEXT,
  },
});
