import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, Image, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { openInAppBrowser } from '../constants/affiliates';
import { fetchBoard, createAd, updateAd, deleteAd, payAd, uploadLocalUri, resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';

// Trimmed, localized real-estate: For Sale + For Rent, plus a rich
// "Post a listing" window (size + highlight incl. negative + photos) and
// manage-by-phone (edit / delete). Listings are shared via the server board.
type Lang = 'he' | 'en' | 'fa' | 'ru';
type HL = 'none' | 'yellow' | 'yellow-border' | 'negative';
const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';

const TR: Record<Lang, Record<string, string>> = {
  he: { title: 'נדל״ן בבטומי', kicker: 'BATUMI REAL ESTATE', sale: 'למכירה', rent: 'להשכרה', month: '/חודש',
        postCta: '📢 פרסם מודעת נדל״ן', manageCta: '⚙️ המודעות שלי', postTitle: 'העלאת מודעה', editTitle: 'עריכת מודעה',
        typeLbl: 'סוג תצוגה', small: 'מודעה קטנה', large: 'מודעה גדולה', free: 'חינם',
        hlLbl: 'הדגשה', hlNone: 'ללא', hlYellow: 'צהוב', hlNeg: 'נגטיב', hlYb: 'מסגרת כתומה',
        planLbl: 'סוג מודעה', planFree: 'מודעה לבנה', planFreeSub: 'חינם', planPaid: 'מודעה מובלטת', priceTag: '$20 · 90 יום', styleLbl: 'סגנון הבלטה', payNote: 'התשלום בעת הפרסום · PayPal',
        photos: 'תמונות', addPhotos: '＋ הוסף תמונות',
        fTitle: 'כותרת המודעה', fPrice: 'מחיר', fPhone: 'טלפון ליצירת קשר', submit: 'פרסם מודעה', save: 'שמור שינויים',
        done: 'המודעה נשלחה! נחזור אליך בהקדם.', close: 'סגור', missing: 'נא למלא כותרת וטלפון',
        managePrompt: 'הזן את הטלפון שפרסמת איתו', find: 'חפש', none: 'לא נמצאו מודעות לטלפון זה', edit: 'ערוך', del: 'מחק' },
  en: { title: 'Batumi Real Estate', kicker: 'BATUMI REAL ESTATE', sale: 'For sale', rent: 'For rent', month: '/mo',
        postCta: '📢 Post a property listing', manageCta: '⚙️ My listings', postTitle: 'Post a listing', editTitle: 'Edit listing',
        typeLbl: 'Display type', small: 'Small listing', large: 'Large listing', free: 'Free',
        hlLbl: 'Highlight', hlNone: 'None', hlYellow: 'Yellow', hlNeg: 'Negative', hlYb: 'Orange border',
        planLbl: 'Listing type', planFree: 'White listing', planFreeSub: 'Free', planPaid: 'Featured listing', priceTag: '$20 · 90 days', styleLbl: 'Highlight style', payNote: 'Paid on posting · PayPal',
        photos: 'Photos', addPhotos: '＋ Add photos',
        fTitle: 'Listing title', fPrice: 'Price', fPhone: 'Contact phone', submit: 'Post listing', save: 'Save changes',
        done: 'Listing submitted! We’ll get back to you soon.', close: 'Close', missing: 'Please fill in a title and phone',
        managePrompt: 'Enter the phone you posted with', find: 'Find', none: 'No listings for this phone', edit: 'Edit', del: 'Delete' },
  fa: { title: 'املاک در باتومی', kicker: 'BATUMI REAL ESTATE', sale: 'برای فروش', rent: 'برای اجاره', month: '/ماه',
        postCta: '📢 ثبت آگهی ملک', manageCta: '⚙️ آگهی‌های من', postTitle: 'ثبت آگهی', editTitle: 'ویرایش آگهی',
        typeLbl: 'نوع نمایش', small: 'آگهی کوچک', large: 'آگهی بزرگ', free: 'رایگان',
        hlLbl: 'برجسته‌سازی', hlNone: 'بدون', hlYellow: 'زرد', hlNeg: 'نگاتیو', hlYb: 'قاب نارنجی',
        planLbl: 'نوع آگهی', planFree: 'آگهی ساده', planFreeSub: 'رایگان', planPaid: 'آگهی ویژه', priceTag: '۲۰$ · ۹۰ روز', styleLbl: 'سبک برجسته‌سازی', payNote: 'پرداخت هنگام ثبت · PayPal',
        photos: 'عکس‌ها', addPhotos: '＋ افزودن عکس',
        fTitle: 'عنوان آگهی', fPrice: 'قیمت', fPhone: 'تلفن تماس', submit: 'ثبت آگهی', save: 'ذخیره تغییرات',
        done: 'آگهی ارسال شد! به‌زودی با شما تماس می‌گیریم.', close: 'بستن', missing: 'لطفاً عنوان و تلفن را وارد کنید',
        managePrompt: 'تلفنی که با آن ثبت کردید را وارد کنید', find: 'جستجو', none: 'آگهی‌ای یافت نشد', edit: 'ویرایش', del: 'حذف' },
  ru: { title: 'Недвижимость в Батуми', kicker: 'BATUMI REAL ESTATE', sale: 'Продажа', rent: 'Аренда', month: '/мес',
        postCta: '📢 Разместить объявление', manageCta: '⚙️ Мои объявления', postTitle: 'Разместить объявление', editTitle: 'Редактировать',
        typeLbl: 'Тип показа', small: 'Малое объявление', large: 'Большое объявление', free: 'Бесплатно',
        hlLbl: 'Выделение', hlNone: 'Нет', hlYellow: 'Жёлтый', hlNeg: 'Негатив', hlYb: 'Оранжевая рамка',
        planLbl: 'Тип объявления', planFree: 'Обычное объявление', planFreeSub: 'Бесплатно', planPaid: 'Выделенное объявление', priceTag: '$20 · 90 дней', styleLbl: 'Стиль выделения', payNote: 'Оплата при публикации · PayPal',
        photos: 'Фото', addPhotos: '＋ Добавить фото',
        fTitle: 'Заголовок объявления', fPrice: 'Цена', fPhone: 'Телефон для связи', submit: 'Разместить', save: 'Сохранить',
        done: 'Объявление отправлено! Мы скоро свяжемся с вами.', close: 'Закрыть', missing: 'Заполните заголовок и телефон',
        managePrompt: 'Введите телефон, с которого разместили', find: 'Найти', none: 'Объявлений нет', edit: 'Изменить', del: 'Удалить' },
};

const FEAT: Record<string, Record<Lang, string>> = {
  center: { he: 'מרכז העיר', en: 'City center', fa: 'مرکز شهر', ru: 'Центр города' },
  boardwalk: { he: 'טיילת', en: 'Boardwalk', fa: 'گردشگاه ساحلی', ru: 'Набережная' },
  seaView: { he: 'נוף לים', en: 'Sea view', fa: 'چشم‌انداز دریا', ru: 'Вид на море' },
  furnished: { he: 'מרוהטת', en: 'Furnished', fa: 'مبله', ru: 'С мебелью' },
  parking: { he: 'חניה', en: 'Parking', fa: 'پارکینگ', ru: 'Парковка' },
  renovated: { he: 'משופצת', en: 'Renovated', fa: 'بازسازی‌شده', ru: 'После ремонта' },
  balcony: { he: 'מרפסת', en: 'Balcony', fa: 'بالکن', ru: 'Балкон' },
  ac: { he: 'מיזוג', en: 'A/C', fa: 'تهویه', ru: 'Кондиционер' },
};

type Unit = { id: string; img: string; price: string; rooms: number; sqm: number; area: 'center' | 'boardwalk'; feats: string[] };
type Post = { id: string; mode: 'sale' | 'rent'; hl: HL; title: string; price: string; phone: string; images: string[]; featured?: boolean };
const ROOMS: Record<Lang, (n: number) => string> = {
  he: (n) => `דירת ${n} חד׳`, en: (n) => `${n}-room apartment`, fa: (n) => `آپارتمان ${n} خوابه`, ru: (n) => `${n}-комн. квартира`,
};

const SALE: Unit[] = [
  { id: 's1', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', price: '$72,000', rooms: 2, sqm: 65, area: 'center', feats: ['renovated', 'balcony', 'ac'] },
  { id: 's2', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$125,000', rooms: 3, sqm: 95, area: 'boardwalk', feats: ['seaView', 'parking', 'furnished'] },
  { id: 's3', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$54,000', rooms: 1, sqm: 45, area: 'center', feats: ['renovated', 'furnished'] },
];
const RENT: Unit[] = [
  { id: 'r1', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', price: '$650', rooms: 2, sqm: 60, area: 'center', feats: ['furnished', 'ac'] },
  { id: 'r2', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', price: '$1,200', rooms: 3, sqm: 90, area: 'boardwalk', feats: ['seaView', 'furnished', 'parking'] },
];

const hlBg = (hl: HL) => hl === 'yellow' ? '#fffbeb' : hl === 'negative' ? '#0c1e3a' : '#fff';
const hlBorder = (hl: HL) => hl === 'yellow-border' ? { borderWidth: 2, borderColor: '#f59e0b' } : hl === 'negative' ? { borderWidth: 2, borderColor: '#1e3a8a' } : {};

export default function RealEstateScreen() {
  const { lang, isRTL } = useI18n();
  const L = (lang as Lang) in TR ? (lang as Lang) : 'en';
  const t = TR[L];
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: 'sale' | 'rent' = params.mode === 'rent' ? 'rent' : 'sale';
  const [posts, setPosts] = useState<Post[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [plan, setPlan] = useState<'free' | 'paid'>('free');
  const [hl, setHl] = useState<HL>('none');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mPhone, setMPhone] = useState('');
  const [mResult, setMResult] = useState<Post[] | null>(null);
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';

  const [busy, setBusy] = useState(false);
  const load = async () => { try { setPosts(await fetchBoard('realestate') as Post[]); } catch {} };
  useEffect(() => { load(); }, []);

  const pickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, allowsMultipleSelection: true, selectionLimit: 6, quality: 0.6 });
      if (!res.canceled) setImages(res.assets.map(a => a.uri).slice(0, 6));
    } catch {}
  };

  const resetForm = () => { setPlan('free'); setHl('none'); setTitle(''); setPrice(''); setPhone(''); setImages([]); setEditId(null); };
  const submit = async () => {
    if (!title.trim() || !phone.trim()) { alert(t.missing); return; }
    if (busy) return;
    setBusy(true);
    try {
      const imgs: string[] = [];
      for (const u of images) imgs.push(await uploadLocalUri(u, 'image'));
      const rec = { board: 'realestate', mode, hl: (plan === 'paid' ? hl : 'none') as HL, title: title.trim(), price: price.trim(), phone: phone.trim(), images: imgs };
      const ad = editId ? await updateAd(editId, rec) : await createAd(rec);
      if (plan === 'paid' && ad?.id) { const pay = await payAd(ad.id); if (pay?.url) openInAppBrowser(pay.url); }
      await load();
      resetForm(); setDone(true);
    } catch { alert(t.missing); }
    finally { setBusy(false); }
  };
  const closePost = () => { setPostOpen(false); setDone(false); resetForm(); };
  const startEdit = (p: Post) => { setEditId(p.id); setPlan(p.featured || p.hl !== 'none' ? 'paid' : 'free'); setHl(p.hl); setTitle(p.title); setPrice(p.price); setPhone(p.phone); setImages(p.images || []); setManageOpen(false); setDone(false); setPostOpen(true); };
  const remove = async (id: string) => { try { await deleteAd(id, mPhone.trim()); } catch {} await load(); setMResult(posts.filter(p => p.phone === mPhone.trim() && p.id !== id)); };
  const find = () => setMResult(posts.filter(p => p.phone === mPhone.trim()));

  const units = mode === 'sale' ? SALE : RENT;
  const myPosts = posts.filter(p => p.mode === mode);

  const PostCard = ({ p }: { p: Post }) => {
    const effHl: HL = p.featured ? p.hl : 'none';
    const neg = effHl === 'negative';
    return (
      <View style={[s.card, { backgroundColor: hlBg(effHl) }, hlBorder(effHl)]}>
        {p.images[0] ? <Image source={{ uri: resolveUri(p.images[0]) }} style={s.cardImg} resizeMode="cover" /> : null}
        <View style={s.cardBody}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[{ fontSize: 16, fontWeight: '900', color: neg ? '#fff' : Colors.TEXT, flex: 1 }, { textAlign: ta, writingDirection: wd }]} numberOfLines={2}>{p.title}</Text>
            {!!p.price && <Text style={{ fontSize: 16, fontWeight: '900', color: neg ? GOLD : '#10b981', marginHorizontal: 8 }}>{p.price}</Text>}
          </View>
          {!!p.phone && (
            <View style={[s.contactRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${p.phone.replace(/\D/g, '')}`)} style={[s.cBtn, { backgroundColor: '#25D366' }]}><Text style={s.cBtnTxt}>WhatsApp</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.phone}`)} style={[s.cBtn, { backgroundColor: neg ? GOLD : Colors.PRIMARY }]}><Text style={[s.cBtnTxt, neg && { color: '#fff' }]}>{'☎'} {p.phone}</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const Card = ({ u }: { u: Unit }) => (
    <View style={s.card}>
      <Image source={{ uri: u.img }} style={s.cardImg} resizeMode="cover" />
      <View style={s.cardBody}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.cardTitle, { textAlign: ta, writingDirection: wd, flex: 1 }]} numberOfLines={1}>{ROOMS[L](u.rooms)} · {FEAT[u.area][L]}</Text>
          <Text style={s.cardPrice}>{u.price}{mode === 'rent' ? t.month : ''}</Text>
        </View>
        <View style={[s.chips, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={s.chip}><Text style={s.chipTxt}>{u.sqm} m²</Text></View>
          {u.feats.map(f => (<View key={f} style={s.chip}><Text style={s.chipTxt}>{FEAT[f][L]}</Text></View>))}
        </View>
      </View>
    </View>
  );

  const Chip = ({ on, label, onPress, sub }: { on: boolean; label: string; sub?: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.selChip, on && s.selChipOn]}>
      <Text style={[s.selTxt, on && s.selTxtOn]}>{label}</Text>
      {sub ? <Text style={[s.selSub, on && { color: '#e6f2f7' }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>{t.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' }} style={s.hero}>
          <LinearGradient colors={['rgba(9,26,42,0.02)', 'rgba(9,26,42,0.8)']} style={StyleSheet.absoluteFillObject as any} />
          <View style={[s.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={s.heroKicker}>{t.kicker}</Text>
            <Text style={[s.heroTitle, { textAlign: ta, writingDirection: wd }]}>{mode === 'sale' ? t.sale : t.rent}</Text>
          </View>
        </ImageBackground>

        <View style={{ padding: 16 }}>
          {myPosts.filter(p => p.featured).map(p => <PostCard key={p.id} p={p} />)}
          {units.map(u => <Card key={u.id} u={u} />)}
          {myPosts.filter(p => !p.featured).map(p => <PostCard key={p.id} p={p} />)}
          <TouchableOpacity style={s.postBtn} activeOpacity={0.85} onPress={() => { setDone(false); resetForm(); setPostOpen(true); }}><Text style={s.postBtnTxt}>{t.postCta}</Text></TouchableOpacity>
          <TouchableOpacity style={s.manageBtn} activeOpacity={0.85} onPress={() => { setMResult(null); setMPhone(''); setManageOpen(true); }}><Text style={s.manageTxt}>{t.manageCta}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <BottomTabBar />

      {/* Post / edit */}
      <Modal visible={postOpen} transparent animationType="slide" onRequestClose={closePost}>
        <View style={s.modalBg}>
          <View style={s.sheet}>
            {done ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 40 }}>✅</Text>
                <Text style={[s.doneTxt, { textAlign: 'center', writingDirection: wd }]}>{t.done}</Text>
                <TouchableOpacity style={s.postBtn} onPress={closePost}><Text style={s.postBtnTxt}>{t.close}</Text></TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[s.sheetTitle, { textAlign: ta, writingDirection: wd }]}>{editId ? t.editTitle : t.postTitle}</Text>

                <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd }]}>{t.planLbl}</Text>
                <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Chip on={plan === 'free'} label={t.planFree} sub={t.planFreeSub} onPress={() => { setPlan('free'); setHl('none'); }} />
                  <Chip on={plan === 'paid'} label={t.planPaid} sub={t.priceTag} onPress={() => { setPlan('paid'); if (hl === 'none') setHl('yellow-border'); }} />
                </View>

                {plan === 'paid' && (
                  <>
                    <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd, marginTop: 6 }]}>{t.styleLbl}</Text>
                    <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Chip on={hl === 'yellow-border'} label={t.hlYb} onPress={() => setHl('yellow-border')} />
                      <Chip on={hl === 'negative'} label={t.hlNeg} onPress={() => setHl('negative')} />
                    </View>
                    <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd, marginTop: 4 }]}>💳 {t.payNote}</Text>
                  </>
                )}

                <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd, marginTop: 6 }]}>{t.photos} ({images.length}/6)</Text>
                <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {images.map((u, i) => <Image key={i} source={{ uri: u }} style={s.thumb} />)}
                  <TouchableOpacity onPress={pickImages} style={s.addThumb}><Text style={{ fontSize: 22, color: Colors.PRIMARY }}>＋</Text></TouchableOpacity>
                </View>

                <TextInput value={title} onChangeText={setTitle} placeholder={t.fTitle} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TextInput value={price} onChangeText={setPrice} placeholder={t.fPrice} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TextInput value={phone} onChangeText={setPhone} placeholder={t.fPhone} placeholderTextColor="#9aa5b1" keyboardType="phone-pad" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TouchableOpacity style={[s.postBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}><Text style={s.postBtnTxt}>{busy ? '…' : (editId ? t.save : t.submit)}</Text></TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center' }} onPress={closePost}><Text style={{ color: '#64748b', fontWeight: '700' }}>{t.close}</Text></TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Manage by phone */}
      <Modal visible={manageOpen} transparent animationType="slide" onRequestClose={() => setManageOpen(false)}>
        <View style={s.modalBg}>
          <View style={s.sheet}>
            <ScrollView>
              <Text style={[s.sheetTitle, { textAlign: ta, writingDirection: wd }]}>{t.manageCta}</Text>
              <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd }]}>{t.managePrompt}</Text>
              <TextInput value={mPhone} onChangeText={setMPhone} placeholder={t.fPhone} placeholderTextColor="#9aa5b1" keyboardType="phone-pad" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
              <TouchableOpacity style={s.postBtn} onPress={find}><Text style={s.postBtnTxt}>{t.find}</Text></TouchableOpacity>
              {mResult !== null && (mResult.length === 0 ? (
                <Text style={[s.sheetLabel, { textAlign: 'center', marginTop: 16 }]}>{t.none}</Text>
              ) : mResult.map(p => (
                <View key={p.id} style={s.mineRow}>
                  <Text style={[{ flex: 1, fontWeight: '800', color: Colors.TEXT }, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{p.title} {p.price ? `· ${p.price}` : ''}</Text>
                  <TouchableOpacity onPress={() => startEdit(p)} style={[s.miniBtn, { backgroundColor: Colors.PRIMARY }]}><Text style={s.miniTxt}>{t.edit}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(p.id)} style={[s.miniBtn, { backgroundColor: '#C63E3E' }]}><Text style={s.miniTxt}>{t.del}</Text></TouchableOpacity>
                </View>
              )))}
              <TouchableOpacity style={{ paddingVertical: 12, alignItems: 'center' }} onPress={() => setManageOpen(false)}><Text style={{ color: '#64748b', fontWeight: '700' }}>{t.close}</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: NAVY },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontFamily: F.r },
  hTitle: { flex: 1, fontSize: 26, fontFamily: F.m, color: '#fff' },
  hero: { width: '100%', height: 160, marginBottom: 0, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#dfe6ea' },
  heroText: { padding: 16 },
  heroKicker: { color: GOLD, fontSize: 11, fontFamily: F.b, letterSpacing: 2 },
  heroTitle: { fontSize: 30, fontFamily: F.m, color: '#fff', marginTop: 3 },
  tabs: { gap: 10, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e7e0d4' },
  tabActive: { backgroundColor: NAVY, borderColor: NAVY },
  tabTxt: { fontSize: 15, fontFamily: F.sb, color: NAVY },
  tabTxtActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', marginBottom: 14, shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  cardImg: { width: '100%', height: 170 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 19, fontFamily: F.m, color: '#16222c' },
  cardPrice: { fontSize: 18, fontFamily: F.b, color: NAVY, marginHorizontal: 8 },
  chips: { flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { backgroundColor: '#f2ede3', borderRadius: 4, paddingVertical: 5, paddingHorizontal: 9 },
  chipTxt: { fontSize: 12, fontFamily: F.sb, color: '#7a7261' },
  contactRow: { gap: 8, marginTop: 12 },
  cBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, alignItems: 'center' },
  cBtnTxt: { color: '#fff', fontFamily: F.b, fontSize: 13 },
  postBtn: { backgroundColor: GOLD, borderRadius: 4, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  postBtnTxt: { fontSize: 16, fontFamily: F.b, color: '#fff' },
  manageBtn: { borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: NAVY },
  manageTxt: { fontSize: 14, fontFamily: F.sb, color: NAVY },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, maxHeight: '90%' },
  sheetTitle: { fontSize: 22, fontFamily: F.m, color: '#16222c', marginBottom: 12 },
  sheetLabel: { fontSize: 14, fontFamily: F.sb, color: '#7a7261', marginBottom: 8 },
  rowWrap: { flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  selChip: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  selChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  selTxt: { fontSize: 14, fontFamily: F.sb, color: '#16222c' },
  selTxtOn: { color: '#fff' },
  selSub: { fontSize: 11, fontFamily: F.sb, color: '#a9b2ba', marginTop: 1 },
  thumb: { width: 60, height: 60, borderRadius: 4 },
  addThumb: { width: 60, height: 60, borderRadius: 4, borderWidth: 1.5, borderColor: NAVY, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, marginTop: 10, color: '#16222c', fontFamily: F.r },
  doneTxt: { fontSize: 16, fontFamily: F.sb, color: '#16222c', marginTop: 12, marginBottom: 16 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#efe9df', paddingVertical: 12 },
  miniBtn: { borderRadius: 4, paddingVertical: 7, paddingHorizontal: 12 },
  miniTxt: { color: '#fff', fontFamily: F.b, fontSize: 13 },
});
