import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking, Image, Modal, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { openInAppBrowser } from '../constants/affiliates';
import { fetchBoard, createAd, updateAd, deleteAd, payAd, uploadLocalUri, resolveUri } from '../constants/api';
import BottomTabBar from '../components/BottomTabBar';
import ListingDetailModal from '../components/ListingDetailModal';

type Lang = 'he' | 'en' | 'fa' | 'ru';
type HL = 'none' | 'yellow-border' | 'negative';
type Item = { id: string; title: string; description?: string; price: string; phone: string; images: string[]; video?: string; hl?: HL; featured?: boolean };
const hlBg = (hl?: HL) => hl === 'negative' ? '#0c1e3a' : '#fff';
const hlBorder = (hl?: HL) => hl === 'yellow-border' ? { borderWidth: 5, borderColor: '#f59e0b' } : hl === 'negative' ? { borderWidth: 2, borderColor: '#1e3a8a' } : {};
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

const PREVIEW_TXT: Record<Lang, string> = { he: 'כך המודעה תיראה', en: 'How your ad will look', fa: 'آگهی شما این‌گونه دیده می‌شود', ru: 'Как будет выглядеть объявление' };
const SUMMARY_TXT: Record<Lang, string> = { he: 'סיכום', en: 'Summary', fa: 'خلاصه', ru: 'Итог' };
const DESC_TXT: Record<Lang, string> = { he: 'תיאור המודעה (תוכן)', en: 'Description', fa: 'توضیحات آگهی', ru: 'Описание' };
const TOP_TXT: Record<Lang, string> = { he: 'קפיצה לראש הרשימה', en: 'Bumped to the top', fa: 'انتقال به بالای فهرست', ru: 'Поднятие в топ' };
const FEATURED_TXT: Record<Lang, string> = { he: 'מובלט', en: 'Featured', fa: 'ویژه', ru: 'ТОП' };

// Swipeable image gallery for a listing card: shows every photo with a counter + dots.
function MediaGallery({ images, height }: { images: string[]; height: number }) {
  const [w, setW] = useState(0);
  const [idx, setIdx] = useState(0);
  const imgs = (images || []).filter(Boolean);
  if (imgs.length === 0) return null;
  if (imgs.length === 1) return <Image source={{ uri: imgs[0] }} style={{ width: '100%', height }} resizeMode="cover" />;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => w && setIdx(Math.round(e.nativeEvent.contentOffset.x / w))}>
        {imgs.map((u, i) => <Image key={i} source={{ uri: u }} style={{ width: w || 1, height }} resizeMode="cover" />)}
      </ScrollView>
      <View style={gal.counter}><Text style={gal.counterTxt}>{idx + 1}/{imgs.length}</Text></View>
      <View style={gal.dots}>{imgs.map((_, i) => <View key={i} style={[gal.dot, i === idx && gal.dotOn]} />)}</View>
    </View>
  );
}
const gal = StyleSheet.create({
  counter: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  counterTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotOn: { backgroundColor: '#fff', width: 8, height: 8, borderRadius: 4 },
});

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
  const [desc, setDesc] = useState('');
  const [cur, setCur] = useState<'$' | '₾'>('$');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | undefined>(undefined);
  const [editId, setEditId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mPhone, setMPhone] = useState('');
  const [mResult, setMResult] = useState<Item[] | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);

  const load = async () => { try { setItems(await fetchBoard('market') as Item[]); } catch {} };
  useEffect(() => { load(); }, []);

  const pickImages = async () => {
    try { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, allowsMultipleSelection: true, selectionLimit: 6, quality: 0.6 }); if (!r.canceled) setImages(r.assets.map(a => a.uri).slice(0, 6)); } catch {}
  };
  const pickVideo = async () => {
    try { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] as any, quality: 0.6 }); if (!r.canceled && r.assets[0]) setVideo(r.assets[0].uri); } catch {}
  };

  const [busy, setBusy] = useState(false);
  const reset = () => { setPlan('free'); setHl('none'); setTitle(''); setDesc(''); setCur('$'); setPrice(''); setPhone(''); setImages([]); setVideo(undefined); setEditId(null); };
  const priceStr = price.trim() ? `${cur}${price.trim()}` : '';
  const submit = async () => {
    if (!title.trim() || !phone.trim()) { alert(t.missing); return; }
    if (busy) return;
    setBusy(true);
    try {
      const imgs: string[] = [];
      for (const u of images) imgs.push(await uploadLocalUri(u, 'image'));
      const vid = video ? await uploadLocalUri(video, 'video') : null;
      const rec = { board: 'market', title: title.trim(), description: desc.trim(), price: priceStr, phone: phone.trim(), images: imgs, video: vid, hl: (plan === 'paid' ? hl : 'none') as HL };
      const ad = editId ? await updateAd(editId, rec) : await createAd(rec);
      if (plan === 'paid' && ad?.id) { const pay = await payAd(ad.id); if (pay?.url) openInAppBrowser(pay.url); }
      await load();
      reset(); setDone(true);
    } catch { alert(t.missing); }
    finally { setBusy(false); }
  };
  const closePost = () => { setPostOpen(false); setDone(false); reset(); };
  const startEdit = (x: Item) => { setEditId(x.id); setPlan(x.hl && x.hl !== 'none' ? 'paid' : 'free'); setHl(x.hl || 'none'); setTitle(x.title); setDesc(x.description || ''); const pc = (x.price || '').trim(); setCur(pc.startsWith('₾') ? '₾' : '$'); setPrice(pc.replace(/^[$₾]/, '')); setPhone(x.phone); setImages(x.images || []); setVideo(x.video); setManageOpen(false); setDone(false); setPostOpen(true); };
  const remove = async (id: string) => { try { await deleteAd(id, mPhone.trim()); } catch {} await load(); setMResult((items.filter(x => x.phone === mPhone.trim() && x.id !== id))); };
  const find = () => setMResult(items.filter(x => x.phone === mPhone.trim()));

  const ItemCard = ({ x }: { x: Item }) => {
    const effHl: HL = x.featured ? (x.hl || 'none') : 'none';
    const neg = effHl === 'negative';
    return (
    <View style={[s.card, { backgroundColor: hlBg(effHl) }, hlBorder(effHl), x.featured && s.featuredCard]}>
      {x.featured && (
        <View style={[s.ribbon, isRTL ? { left: 10 } : { right: 10 }]}>
          <Text style={s.ribbonTxt}>⭐ {FEATURED_TXT[L]}</Text>
        </View>
      )}
      <View>
        {x.video ? (
          <Video source={{ uri: resolveUri(x.video) }} style={s.media} resizeMode={ResizeMode.COVER} useNativeControls isMuted />
        ) : (
          <MediaGallery images={(x.images || []).map(resolveUri)} height={240} />
        )}
        {!!x.price && <View style={s.priceBadge}><Text style={s.priceBadgeTxt}>{x.price}</Text></View>}
      </View>
      <View style={s.cardBody}>
        <Text style={[s.itemTitle, { textAlign: ta, writingDirection: wd }, neg && { color: '#fff' }]} numberOfLines={3}>{x.title}</Text>
        {!!x.description && <Text style={[s.itemDesc, { textAlign: ta, writingDirection: wd }, neg && { color: '#cbd5e1' }]}>{x.description}</Text>}
        {!!x.phone && x.phone !== '—' && (
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${x.phone}`)} style={[s.phonePill, neg && { borderColor: GOLD, backgroundColor: 'rgba(224,168,46,0.14)' }]}>
              <Text style={[s.phonePillTxt, { color: neg ? GOLD : NAVY }]}>☎ {x.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${x.phone.replace(/\D/g, '')}`)} style={s.waCircle}><Text style={s.waIcon}>✆</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  ); };

  const Chip = ({ on, label, sub, onPress }: { on: boolean; label: string; sub?: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.selChip, on && s.selChipOn]}>
      <Text style={[s.selTxt, on && s.selTxtOn]}>{label}</Text>
      {sub ? <Text style={[s.selSub, on && { color: '#e6f2f7' }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );

  const shown = [...items].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

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
          {items.length === 0 ? <Text style={[s.empty, { writingDirection: wd }]}>{t.empty}</Text> : shown.map(x => <TouchableOpacity key={x.id} activeOpacity={0.9} onPress={() => setDetail(x)}><ItemCard x={x} /></TouchableOpacity>)}
          <TouchableOpacity style={s.postBtn} activeOpacity={0.85} onPress={() => { setDone(false); reset(); setPostOpen(true); }}><Text style={s.postBtnTxt}>{t.postCta}</Text></TouchableOpacity>
          <TouchableOpacity style={s.manageBtn} activeOpacity={0.85} onPress={() => { setMResult(null); setMPhone(''); setManageOpen(true); }}><Text style={s.manageTxt}>{t.manageCta}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <BottomTabBar />

      <ListingDetailModal visible={!!detail} listing={detail} onClose={() => setDetail(null)} isRTL={isRTL} lang={L} />

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
                <TextInput value={desc} onChangeText={setDesc} placeholder={DESC_TXT[L]} placeholderTextColor="#9aa5b1" multiline style={[s.input, s.inputArea, { textAlign: ta, writingDirection: wd }]} />
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setCur('$')} style={[s.curChip, cur === '$' && s.curChipOn]}><Text style={[s.curTxt, cur === '$' && s.curTxtOn]}>$</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setCur('₾')} style={[s.curChip, cur === '₾' && s.curChipOn]}><Text style={[s.curTxt, cur === '₾' && s.curTxtOn]}>₾</Text></TouchableOpacity>
                  <TextInput value={price} onChangeText={setPrice} placeholder={t.fPrice} placeholderTextColor="#9aa5b1" keyboardType="numeric" style={[s.input, { flex: 1, marginTop: 0, textAlign: ta, writingDirection: wd }]} />
                </View>
                <TextInput value={phone} onChangeText={setPhone} placeholder={t.fPhone} placeholderTextColor="#9aa5b1" keyboardType="phone-pad" style={[s.input, { textAlign: ta, writingDirection: wd }]} />

                <Text style={[s.sheetLabel, { textAlign: ta, writingDirection: wd, marginTop: 14 }]}>👁 {PREVIEW_TXT[L]}</Text>
                <ItemCard x={{ id: 'preview', title: title.trim() || t.fTitle, description: desc.trim(), price: priceStr, phone: phone.trim() || '—', images, video, hl: plan === 'paid' ? hl : 'none', featured: plan === 'paid' }} />

                <View style={s.summaryBox}>
                  <Text style={[s.summaryLine, { textAlign: ta, writingDirection: wd }]}>{SUMMARY_TXT[L]}</Text>
                  <View style={[s.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[s.summaryK, { textAlign: ta, writingDirection: wd }]}>{plan === 'paid' ? t.planPaid : t.planFree}</Text>
                    <Text style={s.summaryV}>{plan === 'paid' ? t.priceTag : t.planFreeSub}</Text>
                  </View>
                  {plan === 'paid' && (
                    <View style={[s.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 6 }]}>
                      <Text style={[s.summarySub, { textAlign: ta, writingDirection: wd }]}>• {TOP_TXT[L]}</Text>
                      <Text style={[s.summarySub, { textAlign: ta, writingDirection: wd }]}>• {hl === 'negative' ? t.hlNeg : t.hlYb}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={[s.postBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}><Text style={s.postBtnTxt}>{busy ? '…' : (editId ? t.save : t.submit)}</Text></TouchableOpacity>
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
  featuredCard: { shadowColor: '#E0A82E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 10 },
  ribbon: { position: 'absolute', top: 10, zIndex: 5, backgroundColor: '#E0A82E', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  ribbonTxt: { color: '#16222c', fontFamily: F.x, fontSize: 12.5 },
  media: { width: '100%', height: 200, backgroundColor: '#000' },
  cardBody: { padding: 14 },
  itemTitle: { fontSize: 26, fontFamily: F.m, color: '#16222c', lineHeight: 32 },
  phoneTxt: { fontSize: 15, fontFamily: F.b, marginTop: 4 },
  priceBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(22,34,44,0.92)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 6 },
  priceBadgeTxt: { color: '#fff', fontSize: 28, fontFamily: F.x },
  phonePill: { flex: 1, borderWidth: 1.5, borderColor: NAVY, backgroundColor: '#eef3f6', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 14 },
  phonePillTxt: { fontSize: 20, fontFamily: F.b, textAlign: 'center' },
  curChip: { borderWidth: 1.5, borderColor: '#e7e0d4', borderRadius: 8, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  curChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  curTxt: { fontSize: 22, fontFamily: F.b, color: NAVY },
  curTxtOn: { color: '#fff' },
  waCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  waIcon: { color: '#fff', fontSize: 24, fontFamily: F.b },
  itemPrice: { fontSize: 18, fontFamily: F.b, color: '#2E9E6B', marginHorizontal: 8 },
  itemDesc: { fontSize: 14, fontFamily: F.r, color: '#5c6b76', marginTop: 6, lineHeight: 20 },
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
  summaryBox: { backgroundColor: '#f7f2e9', borderRadius: 4, borderWidth: 1, borderColor: '#e7e0d4', padding: 14, marginTop: 12 },
  summaryLine: { fontSize: 13, fontFamily: F.sb, color: '#7a7261', marginBottom: 8 },
  summaryRow: { justifyContent: 'space-between', alignItems: 'center' },
  summaryK: { fontSize: 16, fontFamily: F.m, color: '#16222c', flex: 1 },
  summaryV: { fontSize: 16, fontFamily: F.b, color: GOLD, marginHorizontal: 8 },
  summarySub: { fontSize: 12.5, fontFamily: F.sb, color: '#7a7261', flex: 1 },
  inputArea: { minHeight: 84, textAlignVertical: 'top', paddingTop: 12 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#efe9df', paddingVertical: 12 },
  miniBtn: { borderRadius: 4, paddingVertical: 7, paddingHorizontal: 12 },
  miniTxt: { color: '#fff', fontFamily: F.b, fontSize: 13 },
});
