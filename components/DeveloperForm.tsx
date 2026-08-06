import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { API_BASE } from '../constants/api';
import { useI18n } from '../constants/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

type Unit = {
  id: string;
  title: string;
  image: string;
  price: string;
  size: string;
  description: string;
};

import { FEATURES } from '../constants/features';

const PACKAGES_PAID = [
  { key: 'basic', label: 'Basic', units: 5, price: 'fm.price100mo' },
  { key: 'premium', label: 'Premium', units: 10, price: 'fm.price180mo' },
] as const;
const PACKAGES_FREE = [
  { key: 'basic', label: 'Basic', units: 5, price: 'tk.free' },
  { key: 'premium', label: 'Premium', units: 10, price: 'tk.free' },
] as const;
const PACKAGES = FEATURES.PAID_LISTING_OPTIONS ? PACKAGES_PAID : PACKAGES_FREE;

const BRAND_COLORS = ['#1A6B8A', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

function newUnit(): Unit {
  return { id: 'u_' + Math.random().toString(36).slice(2, 8), title: '', image: '', price: '', size: '', description: '' };
}

export default function DeveloperForm({ visible, onClose, onSubmitted }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pkg, setPkg] = useState<'basic' | 'premium'>('basic');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [logo, setLogo] = useState('');
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0]);
  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [units, setUnits] = useState<Unit[]>([newUnit()]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const maxUnits = pkg === 'premium' ? 10 : 5;

  const reset = () => {
    setStep(1); setPkg('basic'); setCompany(''); setProjectName(''); setLogo(''); setBrandColor(BRAND_COLORS[0]);
    setLocation(''); setDeliveryDate(''); setDescription(''); setPhone(''); setWhatsapp(''); setWebsite('');
    setUnits([newUnit()]); setDone(false);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (Platform.OS !== 'web') return null;
    return new Promise((resolve) => {
      const input = (document as any).createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const f: File = e.target.files?.[0];
        if (!f) return resolve(null);
        setUploading(true);
        const fd = new FormData();
        fd.append('file', f);
        try {
          const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
          const j = await r.json();
          resolve(j.url || null);
        } catch { resolve(null); }
        setUploading(false);
      };
      input.click();
    });
  };

  const pickLogo = async () => { const url = await uploadFile(); if (url) setLogo(url); };
  const pickUnitImage = async (idx: number) => {
    const url = await uploadFile();
    if (url) setUnits(prev => prev.map((u, i) => i === idx ? { ...u, image: url } : u));
  };

  const updateUnit = (idx: number, patch: Partial<Unit>) => {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, ...patch } : u));
  };
  const removeUnit = (idx: number) => setUnits(prev => prev.filter((_, i) => i !== idx));
  const addUnit = () => { if (units.length < maxUnits) setUnits(prev => [...prev, newUnit()]); };

  const submit = async () => {
    if (!company || !projectName || !phone) return;
    setSubmitting(true);
    try {
      const payload = {
        package: pkg, company, projectName, logo, brandColor, location, deliveryDate,
        description, phone, whatsapp, website,
        units: units.filter(u => u.title && u.price),
      };
      await fetch(`${API_BASE}/api/developers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setDone(true);
      onSubmitted?.();
    } catch {}
    setSubmitting(false);
  };

  const canGoStep2 = pkg === 'basic' || pkg === 'premium';
  const canGoStep3 = company && projectName && phone;
  const canSubmit = units.filter(u => u.title && u.price).length >= 1;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <Text style={s.title}>{t('fm.developerStepTitle')} {step}/3</Text>
          </View>

          {done ? (
            <View style={{ padding: 40, alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>{t('fm.profileSentApproval')}</Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', writingDirection: 'rtl' }}>{FEATURES.PAID_LISTING_OPTIONS ? `${t('fm.contactPayment')} (${pkg === 'premium' ? '$180' : '$100'}/${t('fm.monthWord')})` : t('fm.contactWithListingDetails')}</Text>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={s.primaryBtn}>
                <Text style={s.primaryTxt}>{t('c.close')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
              {step === 1 && (
                <View style={{ gap: 10 }}>
                  <Text style={s.sectionLabel}>{t('fm.choosePackage')}</Text>
                  {PACKAGES.map(p => (
                    <TouchableOpacity key={p.key} onPress={() => setPkg(p.key)} style={[s.pkgCard, pkg === p.key && s.pkgCardActive]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.pkgLabel, pkg === p.key && { color: '#fff' }]}>{p.label}</Text>
                        <Text style={[s.pkgSub, pkg === p.key && { color: '#e0f2fe' }]}>{t('fm.upTo')} {p.units} {t('fm.housingUnits')}</Text>
                      </View>
                      <Text style={[s.pkgPrice, pkg === p.key && { color: '#fff' }]}>{t(p.price)}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={s.infoBox}>
                    <Text style={s.infoTxt}>
                      {t('fm.devInfoLine1')}{'\n'}
                      {t('fm.devInfoLine2')}{FEATURES.PAID_LISTING_OPTIONS ? '\n' + t('fm.devInfoBump') : ''}
                    </Text>
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={{ gap: 10 }}>
                  <Text style={s.sectionLabel}>{t('fm.companyProjectDetails')}</Text>
                  <TextInput style={s.input} placeholder={t('fm.companyName')} value={company} onChangeText={setCompany} textAlign="right" placeholderTextColor="#94a3b8" />
                  <TextInput style={s.input} placeholder={t('fm.projectName')} value={projectName} onChangeText={setProjectName} textAlign="right" placeholderTextColor="#94a3b8" />

                  <View>
                    <Text style={s.sectionLabel}>{t('fm.logo')}</Text>
                    <TouchableOpacity onPress={pickLogo} disabled={uploading} style={s.logoPick}>
                      {logo ? (
                        <Image source={{ uri: logo }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                      ) : (
                        <Text style={{ fontSize: 24, color: '#94a3b8' }}>{uploading ? '…' : '+'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View>
                    <Text style={s.sectionLabel}>{t('fm.brandColor')}</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
                      {BRAND_COLORS.map(c => (
                        <TouchableOpacity key={c} onPress={() => setBrandColor(c)} style={[s.colorSwatch, { backgroundColor: c }, brandColor === c && s.colorSwatchActive]} />
                      ))}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                    <TextInput style={[s.input, { flex: 1 }]} placeholder={t('fm.location')} value={location} onChangeText={setLocation} textAlign="right" placeholderTextColor="#94a3b8" />
                    <TextInput style={[s.input, { flex: 1 }]} placeholder={t('fm.deliveryDate')} value={deliveryDate} onChangeText={setDeliveryDate} textAlign="right" placeholderTextColor="#94a3b8" />
                  </View>
                  <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]} placeholder={t('fm.projectDescription')} value={description} onChangeText={setDescription} textAlign="right" multiline placeholderTextColor="#94a3b8" />
                  <TextInput style={s.input} placeholder={t('c.phone')} value={phone} onChangeText={setPhone} textAlign="right" keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
                  <TextInput style={s.input} placeholder={t('fm.whatsappIfDifferent')} value={whatsapp} onChangeText={setWhatsapp} textAlign="right" keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
                  <TextInput style={s.input} placeholder={t('fm.websiteUrlPh')} value={website} onChangeText={setWebsite} textAlign="right" autoCapitalize="none" placeholderTextColor="#94a3b8" />
                </View>
              )}

              {step === 3 && (
                <View style={{ gap: 10 }}>
                  <Text style={s.sectionLabel}>{t('fm.housingUnitsHdr')} ({units.length}/{maxUnits})</Text>
                  {units.map((u, idx) => (
                    <View key={u.id} style={s.unitCard}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontWeight: '800', color: Colors.TEXT }}>{t('fm.unit')} {idx + 1}</Text>
                        {units.length > 1 && (
                          <TouchableOpacity onPress={() => removeUnit(idx)}>
                            <Text style={{ color: '#dc2626', fontWeight: '800' }}>{t('c.delete')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                        <TouchableOpacity onPress={() => pickUnitImage(idx)} disabled={uploading} style={s.unitImgPick}>
                          {u.image ? <Image source={{ uri: u.image }} style={{ width: 70, height: 70, borderRadius: 6 }} /> : <Text style={{ fontSize: 22, color: '#94a3b8' }}>{uploading ? '…' : '+'}</Text>}
                        </TouchableOpacity>
                        <View style={{ flex: 1, gap: 6 }}>
                          <TextInput style={s.inputSm} placeholder={t('fm.unitTitlePh')} value={u.title} onChangeText={val => updateUnit(idx, { title: val })} textAlign="right" placeholderTextColor="#94a3b8" />
                          <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                            <TextInput style={[s.inputSm, { flex: 1 }]} placeholder={t('fm.price')} value={u.price} onChangeText={val => updateUnit(idx, { price: val })} textAlign="right" placeholderTextColor="#94a3b8" />
                            <TextInput style={[s.inputSm, { flex: 1 }]} placeholder={t('fm.sizeSqm')} value={u.size} onChangeText={val => updateUnit(idx, { size: val })} textAlign="right" placeholderTextColor="#94a3b8" />
                          </View>
                        </View>
                      </View>
                      <TextInput style={[s.inputSm, { marginTop: 6, minHeight: 50, textAlignVertical: 'top' }]} placeholder={t('fm.shortDescription')} value={u.description} onChangeText={val => updateUnit(idx, { description: val })} textAlign="right" multiline placeholderTextColor="#94a3b8" />
                    </View>
                  ))}
                  {units.length < maxUnits && (
                    <TouchableOpacity onPress={addUnit} style={s.addUnitBtn}>
                      <Text style={s.addUnitTxt}>{t('fm.addUnit')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 10 }}>
                {step > 1 && (
                  <TouchableOpacity onPress={() => setStep(prev => (prev - 1) as 1 | 2 | 3)} style={s.secondaryBtn}>
                    <Text style={s.secondaryTxt}>{t('fm.prev')}</Text>
                  </TouchableOpacity>
                )}
                {step < 3 && (
                  <TouchableOpacity
                    onPress={() => setStep(prev => (prev + 1) as 1 | 2 | 3)}
                    disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)}
                    style={[s.primaryBtn, { flex: 1 }, ((step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)) && { opacity: 0.5 }]}
                  >
                    <Text style={s.primaryTxt}>{t('fm.next')}</Text>
                  </TouchableOpacity>
                )}
                {step === 3 && (
                  <TouchableOpacity
                    onPress={submit}
                    disabled={!canSubmit || submitting}
                    style={[s.primaryBtn, { flex: 1 }, (!canSubmit || submitting) && { opacity: 0.5 }]}
                  >
                    <Text style={s.primaryTxt}>{submitting ? t('fm.sending') : t('fm.submitForApproval')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { height: '90%', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 18, color: '#64748b', fontWeight: '700', padding: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#475569', writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, fontSize: 14, color: Colors.TEXT, writingDirection: 'rtl' },
  inputSm: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, fontSize: 12, color: Colors.TEXT, writingDirection: 'rtl' },
  primaryBtn: { backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  primaryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  secondaryBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  secondaryTxt: { color: Colors.TEXT, fontSize: 14, fontWeight: '800' },
  pkgCard: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0' },
  pkgCardActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  pkgLabel: { fontSize: 16, fontWeight: '900', color: Colors.TEXT },
  pkgSub: { fontSize: 12, color: '#64748b', marginTop: 2, writingDirection: 'rtl' },
  pkgPrice: { fontSize: 14, fontWeight: '900', color: Colors.PRIMARY },
  infoBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  infoTxt: { fontSize: 11, color: '#1e40af', writingDirection: 'rtl', lineHeight: 18 },
  logoPick: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: '#0f172a' },
  unitCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  unitImgPick: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addUnitBtn: { borderWidth: 1, borderColor: Colors.PRIMARY, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addUnitTxt: { color: Colors.PRIMARY, fontWeight: '800', fontSize: 13 },
});
