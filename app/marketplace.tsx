import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking, Image, Modal, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import BottomTabBar from '../components/BottomTabBar';

type Lang = 'he' | 'en' | 'fa' | 'ru';
type HL = 'none' | 'yellow-border' | 'negative';
type Item = { id: string; title: string; price: string; phone: string; images: string[]; video?: string; hl?: HL };
const hlBg = (hl?: HL) => hl === 'negative' ? '#0c1e3a' : '#fff';
const hlBorder = (hl?: HL) => hl === 'yellow-border' ? { borderWidth: 2, borderColor: '#f59e0b' } : hl === 'negative' ? { borderWidth: 2, borderColor: '#1e3a8a' } : {};
const STORE = '@market:items/v2';
const HERO = 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1000&q=80';
const F = { x: 'Assistant_800ExtraBold', b: 'Assistant_700Bold', sb: 'Assistant_600SemiBold', m: 'Assistant_500Medium', r: 'Assistant_400Regular' };
const NAVY = '#16222C', CREAM = '#F5F1EA', GOLD = '#4F8A6E';

const TR: Record<Lang, Record<string, string>> = {
  he: { title: 'יד2 בטומי', kicker: 'BATUMI CLASSIFIEDS', sub: 'קנייה ומכירה בין הגולשים', postCta: '📢 פרסם מוצר', manageCta: '⚙️ המוצרים שלי',
        postTitle: 'פרסום מוצר', editTitle: 'עריכת מוצר', fTitle: 'מה מוכרים?', fPrice: 'מחיר', fPhone: 'טלפון ליצירת קשר',
        photos: 'תמונות', addPhotos: '＋ הוסף תמונות', video: 'וידאו', addVideo: '🎥 הוסף וידאו', submit: 'פרסם', save: 'שמור שינויים',
        planLbl: 'סוג מודעה', planFree: 'מודעה לבנה', planFreeSub: 'חינם', planPaid: 'מודעה מובלטת', priceTag: '$20 · 90 יום', styleLbl: 'סגנון הבלטה', hlYb: 'מסגרת כתומה', hlNeg: 'נגטיב', payNote: 'התשלום בעת הפרסום · PayPal',
        empty: 'עדיין אין מוצרים — היו הראשונים!', missing: 'נא למלא כותרת וטלפון', done: 'המוצר פורסם!', close: 'סגור',
        managePrompt: 'הזן את הטלפון שפרסמת איתו', find: 'חפש', none: 'לא נמצאו מוצרים לטלפון זה', edit: 'ערוך', del: 'מחק' },
  en: { title: 'Batumi Classifieds', kicker: 'BATUMI CLASSIFIEDS', sub: 'Community buy & sell', postCta: '📢 Post an item', manageCta: '⚙️ My items',
        postTitle: 'Post an item', editTitle: 'Edit item', fTitle: 'What are you selling?', fPrice: 'Price', fPhone: 'Contact phone',
        photos: 'Photos', addPhotos: '＋ Add photos', video: 'Video', addVideo: '🎥 Add video', submit: 'Post', save: 'Save changes',
        planLbl: 'Listing type', planFree: 'White listing', planFreeSub: 'Free', planPaid: 'Featured listing', priceTag: '$20 · 90 days', styleLbl: 'Highlight style', hlYb: 'Orange border', hlNeg: 'Negative', payNote: 'Paid on posting · PayPal',
        empty: 'No items yet — be the first!', missing: 'Please fill in a title and phone', done: 'Item posted!', close: 'Close',
        managePrompt: 'Enter the phone you posted with', find: 'Find', none: 'No items for this phone', edit: 'Edit', del: 'Delete' },
  fa: { title: 'نیازمندی‌های باتومی', kicker: 'BATUMI CLASSIFIEDS', sub: 'خرید و فروش بین کاربران', postCta: '📢 ثبت آگهی', manageCta: '⚙️ آگهی‌های من',
        postTitle: 'ثبت آگهی', editTitle: 'ویرایش آگهی', fTitle: 'چه می‌فروشید؟', fPrice: 'قیمت', fPhone: 'تلفن تماس',
        photos: 'عکس‌ها', addPhotos: '＋ افزودن عکس', video: 'ویدیو', addVideo: '🎥 افزودن ویدیو', submit: 'ثبت', save: 'ذخیره',
        planLbl: 'نوع آگهی', planFree: 'آگهی ساده', planFreeSub: 'رایگان', planPaid: 'آگهی ویژه', priceTag: '۲۰$ · ۹۰ روز', styleLbl: 'سبک برجسته‌سازی', hlYb: 'قاب نارنجی', hlNeg: 'نگاتیو', payNote: 'پرداخت هنگام ثبت · PayPal',
        empty: 'هنوز آگهی‌ای نیست — اولین نفر باشید!', missing: 'لطفاً عنوان و تلفن را وارد کنید', done: 'آگهی ثبت شد!', close: 'بستن',
        managePrompt: 'تلفنی که با آن ثبت کردید را وارد کنید', find: 'جستجو', none: 'آگهی‌ای یافت نشد', edit: 'ویرایش', del: 'حذف' },
  ru: { title: 'Объявления Батуми', kicker: 'BATUMI CLASSIFIEDS', sub: 'Купля-продажа между пользователями', postCta: '📢 Разместить товар', manageCta: '⚙️ Мои товары',
        postTitle: 'Разместить товар', editTitle: 'Редактировать', fTitle: 'Что продаёте?', fPrice: 'Цена', fPhone: 'Телефон для связи',
        photos: 'Фото', addPhotos: '＋ Добавить фото', video: 'Видео', addVideo: '🎥 Добавить видео', submit: 'Разместить', save: 'Сохранить',
        planLbl: 'Тип объявления', planFree: 'Обычное', planFreeSub: 'Бесплатно', planPaid: 'Выделенное', priceTag: '$20 · 90 дней', styleLbl: 'Стиль выделения', hlYb: 'Оранжевая рамка', hlNeg: 'Негатив', payNote: 'Оплата при публикации · PayPal',
        empty: 'Пока нет товаров — будьте первым!', missing: 'Заполните заголовок и телефон', done: 'Товар размещён!', close: 'Закрыть',
        managePrompt: 'Введите телефон, с которого разместили', find: 'Найти', none: 'Товаров нет', edit: 'Изменить', del: 'Удалить' },
};

export default function MarketplaceScreen() {
  const { lang, isRTL } = useI18n();
  const L = (lang as Lang) in TR ? (lang as Lang) : 'en';
  const t = TR[L];
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';
  const [items, setItems] = useState<Item[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [plan, setPlan] = useState<'free' | 'paid'>('free');
  const [hl, setHl] = useState<HL>('none');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | undefined>(undefined);
  const [editId, setEditId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mPhone, setMPhone] = useState('');
  const [mResult, setMResult] = useState<Item[] | null>(null);

  useEffect(() => { AsyncStorage.getItem(STORE).then((r) => { if (r) try { setItems(JSON.parse(r)); } catch {} }).catch(() => {}); }, []);
  const persist = (list: Item[]) => { setItems(list); AsyncStorage.setItem(STORE, JSON.stringify(list)).catch(() => {}); };

  const pickImages = async () => {
    try { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, allowsMultipleSelection: true, selectionLimit: 6, quality: 0.6 }); if (!r.canceled) setImages(r.assets.map(a => a.uri).slice(0, 6)); } catch {}
  };
  const pickVideo = async () => {
    try { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] as any, quality: 0.6 }); if (!r.canceled && r.assets[0]) setVideo(r.assets[0].uri); } catch {}
  };

  const reset = () => { setPlan('free'); setHl('none'); setTitle(''); setPrice(''); setPhone(''); setImages([]); setVideo(undefined); setEditId(null); };
  const submit = () => {
    if (!title.trim() || !phone.trim()) { alert(t.missing); return; }
    const rec = { title: title.trim(), price: price.trim(), phone: phone.trim(), images, video, hl: (plan === 'paid' ? hl : 'none') as HL };
    if (editId) persist(items.map(x => x.id === editId ? { ...x, ...rec } : x));
    else persist([{ id: `m_${items.length}_${title.length}_${phone.slice(-4)}`, ...rec }, ...items]);
    reset(); setDone(true);
  };
  const closePost = () => { setPostOpen(false); setDone(false); reset(); };
  const startEdit = (x: Item) => { setEditId(x.id); setPlan(x.hl && x.hl !== 'none' ? 'paid' : 'free'); setHl(x.hl || 'none'); setTitle(x.title); setPrice(x.price); setPhone(x.phone); setImages(x.images || []); setVideo(x.video); setManageOpen(false); setDone(false); setPostOpen(true); };
  const remove = (id: string) => { const list = items.filter(x => x.id !== id); persist(list); setMResult(list.filter(x => x.phone === mPhone.trim())); };
  const find = () => setMResult(items.filter(x => x.phone === mPhone.trim()));

  const ItemCard = ({ x }: { x: Item }) => {
    const neg = x.hl === 'negative';
    return (
    <View style={[s.card, { backgroundColor: hlBg(x.hl) }, hlBorder(x.hl)]}>
      {x.video ? (
        <Video source={{ uri: x.video }} style={s.media} resizeMode={ResizeMode.COVER} useNativeControls isMuted />
      ) : x.images?.[0] ? (
        <Image source={{ uri: x.images[0] }} style={s.media} resizeMode="cover" />
      ) : null}
      <View style={s.cardBody}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.itemTitle, { textAlign: ta, writingDirection: wd, flex: 1 }, neg && { color: '#fff' }]} numberOfLines={2}>{x.title}</Text>
          {!!x.price && <Text style={[s.itemPrice, neg && { color: GOLD }]}>{x.price}</Text>}
        </View>
        <View style={[s.contactRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${x.phone.replace(/\D/g, '')}`)} style={[s.cBtn, { backgroundColor: '#25D366' }]}><Text style={s.cBtnTxt}>WhatsApp</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${x.phone}`)} style={[s.cBtn, { backgroundColor: Colors.PRIMARY }]}><Text style={s.cBtnTxt}>{'☎'} {x.phone}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  ); };

  const Chip = ({ on, label, sub, onPress }: { on: boolean; label: string; sub?: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.selChip, on && s.selChipOn]}>
      <Text style={[s.selTxt, on && s.selTxtOn]}>{label}</Text>
      {sub ? <Text style={[s.selSub, on && { color: '#e6f2f7' }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );

  const shown = [...items].sort((a, b) => ((b.hl && b.hl !== 'none') ? 1 : 0) - ((a.hl && a.hl !== 'none') ? 1 : 0));

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>🛒 {t.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: HERO }} style={s.hero}>
          <LinearGradient colors={['rgba(9,26,42,0.02)', 'rgba(9,26,42,0.8)']} style={StyleSheet.absoluteFillObject as any} />
          <View style={[s.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={s.heroKicker}>{t.kicker}</Text>
            <Text style={[s.heroTitle, { textAlign: ta, writingDirection: wd }]}>{t.title}</Text>
            <Text style={[s.heroSub, { textAlign: ta, writingDirection: wd }]}>{t.sub}</Text>
          </View>
        </ImageBackground>

        <View style={{ padding: 16 }}>
          {items.length === 0 ? <Text style={[s.empty, { writingDirection: wd }]}>{t.empty}</Text> : shown.map(x => <ItemCard key={x.id} x={x} />)}
          <TouchableOpacity style={s.postBtn} activeOpacity={0.85} onPress={() => { setDone(false); reset(); setPostOpen(true); }}><Text style={s.postBtnTxt}>{t.postCta}</Text></TouchableOpacity>
          <TouchableOpacity style={s.manageBtn} activeOpacity={0.85} onPress={() => { setMResult(null); setMPhone(''); setManageOpen(true); }}><Text style={s.manageTxt}>{t.manageCta}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <BottomTabBar />

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

                <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd, marginTop: 6 }]}>{t.photos} ({images.length}/6){video ? ' · 🎥' : ''}</Text>
                <View style={[s.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {images.map((u, i) => <Image key={i} source={{ uri: u }} style={s.thumb} />)}
                  <TouchableOpacity onPress={pickImages} style={s.addThumb}><Text style={{ fontSize: 22, color: Colors.PRIMARY }}>＋</Text></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={pickVideo} style={s.videoBtn}><Text style={s.videoBtnTxt}>{video ? '🎥 ✓' : t.addVideo}</Text></TouchableOpacity>
                <TextInput value={title} onChangeText={setTitle} placeholder={t.fTitle} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TextInput value={price} onChangeText={setPrice} placeholder={t.fPrice} placeholderTextColor="#9aa5b1" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TextInput value={phone} onChangeText={setPhone} placeholder={t.fPhone} placeholderTextColor="#9aa5b1" keyboardType="phone-pad" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
                <TouchableOpacity style={s.postBtn} onPress={submit}><Text style={s.postBtnTxt}>{editId ? t.save : t.submit}</Text></TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center' }} onPress={closePost}><Text style={{ color: '#64748b', fontWeight: '700' }}>{t.close}</Text></TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
              ) : mResult.map(x => (
                <View key={x.id} style={s.mineRow}>
                  <Text style={[{ flex: 1, fontWeight: '800', color: Colors.TEXT }, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{x.title} {x.price ? `· ${x.price}` : ''}</Text>
                  <TouchableOpacity onPress={() => startEdit(x)} style={[s.miniBtn, { backgroundColor: Colors.PRIMARY }]}><Text style={s.miniTxt}>{t.edit}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(x.id)} style={[s.miniBtn, { backgroundColor: '#C63E3E' }]}><Text style={s.miniTxt}>{t.del}</Text></TouchableOpacity>
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
  hTitle: { flex: 1, fontSize: 24, fontFamily: F.m, color: '#fff' },
  hero: { width: '100%', height: 160, marginBottom: 0, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#dfe6ea' },
  heroText: { padding: 16 },
  heroKicker: { color: GOLD, fontSize: 11, fontFamily: F.b, letterSpacing: 2 },
  heroTitle: { fontSize: 30, fontFamily: F.m, color: '#fff', marginTop: 3 },
  heroSub: { fontSize: 13, fontFamily: F.sb, color: '#fff', opacity: 0.9, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', marginBottom: 14, shadowColor: '#1a2b35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  media: { width: '100%', height: 200, backgroundColor: '#000' },
  cardBody: { padding: 14 },
  itemTitle: { fontSize: 19, fontFamily: F.m, color: '#16222c' },
  itemPrice: { fontSize: 18, fontFamily: F.b, color: '#2E9E6B', marginHorizontal: 8 },
  contactRow: { gap: 8, marginTop: 12 },
  cBtn: { flex: 1, paddingVertical: 11, borderRadius: 4, alignItems: 'center' },
  cBtnTxt: { color: '#fff', fontFamily: F.b, fontSize: 13 },
  empty: { textAlign: 'center', color: '#a9b2ba', fontSize: 14, fontFamily: F.r, marginVertical: 24 },
  postBtn: { backgroundColor: GOLD, borderRadius: 4, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  postBtnTxt: { fontSize: 16, fontFamily: F.b, color: '#fff' },
  manageBtn: { borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: NAVY },
  manageTxt: { fontSize: 14, fontFamily: F.sb, color: NAVY },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, maxHeight: '90%' },
  sheetTitle: { fontSize: 22, fontFamily: F.m, color: '#16222c', marginBottom: 12 },
  selChip: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  selChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  selTxt: { fontSize: 14, fontFamily: F.sb, color: '#16222c' },
  selTxtOn: { color: '#fff' },
  selSub: { fontSize: 11, fontFamily: F.sb, color: '#a9b2ba', marginTop: 1 },
  sheetLabel: { fontSize: 14, fontFamily: F.sb, color: '#7a7261', marginBottom: 8 },
  rowWrap: { flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  thumb: { width: 60, height: 60, borderRadius: 4 },
  addThumb: { width: 60, height: 60, borderRadius: 4, borderWidth: 1.5, borderColor: NAVY, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  videoBtn: { borderWidth: 1.5, borderColor: NAVY, borderRadius: 4, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  videoBtnTxt: { color: NAVY, fontFamily: F.sb, fontSize: 14 },
  input: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, marginTop: 10, color: '#16222c', fontFamily: F.r },
  doneTxt: { fontSize: 16, fontFamily: F.sb, color: '#16222c', marginTop: 12, marginBottom: 16 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#efe9df', paddingVertical: 12 },
  miniBtn: { borderRadius: 4, paddingVertical: 7, paddingHorizontal: 12 },
  miniTxt: { color: '#fff', fontFamily: F.b, fontSize: 13 },
});
