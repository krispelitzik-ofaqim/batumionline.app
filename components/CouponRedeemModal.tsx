import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE } from '../constants/api';
import { useI18n } from '../constants/i18n';

export default function CouponRedeemModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; discount?: string } | null>(null);

  const validate = async () => {
    if (!code.trim()) { setResult({ ok: false, msg: t('fm.enterCode') }); return; }
    setBusy(true); setResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await r.json();
      if (j.success && j.coupon) {
        const c = j.coupon;
        const discount = c.type === 'percent' ? `${c.value}% ${t('fm.discount')}` : `${t('fm.discountOf')} ₪${c.value}`;
        setResult({ ok: true, msg: c.label || t('fm.codeValid'), discount });
      } else {
        setResult({ ok: false, msg: j.error || t('fm.codeInvalid') });
      }
    } catch {
      setResult({ ok: false, msg: t('fm.commError') });
    }
    setBusy(false);
  };

  const close = () => { setCode(''); setResult(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.card}>
          <LinearGradient colors={['#16a34a', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
            <Text style={s.headerIcon}>🎟️</Text>
            <Text style={s.headerTitle}>{t('fm.redeemCoupon')}</Text>
          </LinearGradient>
          <View style={s.body}>
            {result?.ok ? (
              <View style={{ alignItems: 'center', gap: 14 }}>
                <Text style={{ fontSize: 52 }}>🎉</Text>
                <Text style={s.successTitle}>{t('fm.codeValid')}</Text>
                <Text style={s.successDiscount}>{result.discount}</Text>
                {!!result.msg && result.msg !== t('fm.codeValid') && <Text style={s.successMsg}>{result.msg}</Text>}
                <TouchableOpacity onPress={close} style={s.closeBtn}>
                  <Text style={s.closeBtnTxt}>{t('c.close')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.label}>{t('fm.enterCouponCode')}</Text>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  placeholder="BATUMI25"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  style={s.input}
                  textAlign="center"
                  onSubmitEditing={validate}
                />
                {!!result && !result.ok && <Text style={s.errMsg}>❌ {result.msg}</Text>}
                <TouchableOpacity onPress={validate} disabled={busy} style={[s.submitBtn, busy && { opacity: 0.5 }]}>
                  <Text style={s.submitTxt}>{busy ? t('fm.checking') : t('fm.checkCode')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={close} style={s.cancelBtn}>
                  <Text style={s.cancelTxt}>{t('c.cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  header: { padding: 24, alignItems: 'center' },
  headerIcon: { fontSize: 48, marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', writingDirection: 'rtl' },
  body: { padding: 22, gap: 14 },
  label: { fontSize: 15, fontWeight: '700', color: '#334155', writingDirection: 'rtl', textAlign: 'right' },
  input: { borderWidth: 2, borderColor: '#86efac', borderRadius: 12, padding: 14, fontSize: 22, fontWeight: '900', letterSpacing: 4, backgroundColor: '#f0fdf4', color: '#14532d' },
  errMsg: { fontSize: 14, color: '#dc2626', fontWeight: '800', writingDirection: 'rtl', textAlign: 'center' },
  submitBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelTxt: { color: '#64748b', fontWeight: '700', fontSize: 14 },
  closeBtn: { backgroundColor: '#1A6B8A', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  closeBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#16a34a', writingDirection: 'rtl' },
  successDiscount: { fontSize: 28, fontWeight: '900', color: '#0369a1', letterSpacing: 1 },
  successMsg: { fontSize: 14, color: '#475569', writingDirection: 'rtl', textAlign: 'center' },
});
