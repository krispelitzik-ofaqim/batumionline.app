import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Platform, Image } from 'react-native';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';
import { openInAppBrowser, bookingSearch, hotellookSearch, woltSearch } from '../constants/affiliates';
import { useI18n } from '../constants/i18n';
import MapEmbed from './MapEmbed';

type PLang = 'he' | 'en' | 'fa' | 'ru';
const P_TR: Record<PLang, Record<string, string>> = {
  he: { notFound: 'לא נמצא מידע נוסף', reviews: 'ביקורות', hours: '🕐 שעות פתיחה', openNow: '🟢 פתוח כעת', closedNow: '🔴 סגור כעת', allWeek: 'כל ימות השבוע:', bookTable: 'להזמנת שולחן', call: 'חייג', site: 'אתר רשמי', priceAvail: 'ראה מחיר וזמינות', buyTicket: 'רכישת כרטיס', payAtEntry: 'תשלום בכניסה', free: 'חינם', byAppt: 'בתיאום מראש', seeAlso: 'לא מצאתם? ראו גם כאן' },
  en: { notFound: 'No further info found', reviews: 'reviews', hours: '🕐 Opening hours', openNow: '🟢 Open now', closedNow: '🔴 Closed now', allWeek: 'Every day:', bookTable: 'Book a table', call: 'Call', site: 'Official website', priceAvail: 'See price & availability', buyTicket: 'Buy a ticket', payAtEntry: 'Pay at entrance', free: 'Free', byAppt: 'By appointment', seeAlso: "Didn't find it? See also here" },
  fa: { notFound: 'اطلاعات بیشتری یافت نشد', reviews: 'نظر', hours: '🕐 ساعات کاری', openNow: '🟢 اکنون باز است', closedNow: '🔴 اکنون بسته است', allWeek: 'همه روزها:', bookTable: 'رزرو میز', call: 'تماس', site: 'وب‌سایت رسمی', priceAvail: 'مشاهده قیمت و موجودی', buyTicket: 'خرید بلیط', payAtEntry: 'پرداخت در ورودی', free: 'رایگان', byAppt: 'با تعیین وقت قبلی', seeAlso: 'پیدا نکردید؟ اینجا هم ببینید' },
  ru: { notFound: 'Доп. информация не найдена', reviews: 'отзывов', hours: '🕐 Часы работы', openNow: '🟢 Открыто сейчас', closedNow: '🔴 Закрыто сейчас', allWeek: 'Каждый день:', bookTable: 'Забронировать стол', call: 'Позвонить', site: 'Официальный сайт', priceAvail: 'Цена и наличие', buyTicket: 'Купить билет', payAtEntry: 'Оплата на входе', free: 'Бесплатно', byAppt: 'По записи', seeAlso: 'Не нашли? Смотрите также здесь' },
};
const PPL = (l: string): PLang => (['he', 'en', 'fa', 'ru'].includes(l) ? (l as PLang) : 'en');

function PhotoGallery({ photos }: { photos: { ref: string; url: string }[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return null;
  const cur = photos[idx];
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#e2e8f0', overflow: 'hidden', position: 'relative' }}>
        <Image source={{ uri: cur.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {photos.length > 1 && (
          <>
            <TouchableOpacity
              onPress={prev}
              style={{ position: 'absolute', left: 8, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={next}
              style={{ position: 'absolute', right: 8, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>›</Text>
            </TouchableOpacity>
            <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{idx + 1} / {photos.length}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

type PlaceData = {
  found: boolean;
  name?: string;
  rating?: number | null;
  reviews?: number | null;
  address?: string;
  phone?: string;
  website?: string;
  mapsUri?: string;
  openingHours?: string[];
  openNow?: boolean | null;
  photos?: { ref: string; url: string }[];
};

export default function PlacesInfoModal({ query, title, onClose, hideHours, showHotelPrices, showAttractionTickets, isRestaurant, ticketType, ticketUrl, ticketUrlAlt }: { query: string; title: string; onClose: () => void; hideHours?: boolean; showHotelPrices?: boolean; showAttractionTickets?: boolean; isRestaurant?: boolean; ticketType?: string; ticketUrl?: string; ticketUrlAlt?: string }) {
  const { lang, isRTL } = useI18n();
  const L = PPL(lang);
  const P = P_TR[L];
  const dir = { textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left', writingDirection: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr' };
  const [data, setData] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/places?q=${encodeURIComponent(query)}`);
        const j = await r.json();
        if (!cancelled) { setData(j); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity style={s.close} onPress={onClose}>
            <Text style={s.closeX}>✕</Text>
          </TouchableOpacity>
          <Text style={[s.title, dir]}>{title}</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginVertical: 30 }} />
          ) : !data?.found ? (
            <Text style={[s.notFound, dir]}>{P.notFound}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {!!(data.photos && data.photos.length) && (
                <PhotoGallery photos={data.photos} />
              )}
              {!!data.mapsUri && (
                <View style={{ height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <MapEmbed src={`https://www.google.com/maps?q=${encodeURIComponent(`${title} Batumi`)}&output=embed`} style={{ flex: 1 }} />
                </View>
              )}
              {typeof data.rating === 'number' && (
                <View style={s.rowCenter}>
                  <Text style={s.star}>⭐</Text>
                  <Text style={s.rating}>{data.rating.toFixed(1)}</Text>
                  {!!data.reviews && <Text style={s.reviews}>· {data.reviews.toLocaleString()} {P.reviews}</Text>}
                </View>
              )}
              {!!data.address && (
                <View style={s.infoRow}>
                  <Text style={s.infoIcon}>📍</Text>
                  <Text style={[s.infoTxt, dir]}>{data.address}</Text>
                </View>
              )}
              {!hideHours && !!(data.openingHours && data.openingHours.length) && (() => {
                const hours = data.openingHours!;
                const timesOnly = hours.map(l => l.replace(/^[^:]+:\s*/, ''));
                const allSame = timesOnly.every(t => t === timesOnly[0]);
                return (
                  <View style={s.hoursBlock}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={[s.hoursTitle, dir]}>{P.hours}</Text>
                      {data.openNow != null && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: data.openNow ? '#dcfce7' : '#fee2e2' }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: data.openNow ? '#16a34a' : '#dc2626' }}>
                            {data.openNow ? P.openNow : P.closedNow}
                          </Text>
                        </View>
                      )}
                    </View>
                    {allSame ? (
                      <Text style={[s.hoursLine, dir]}>{P.allWeek} {timesOnly[0]}</Text>
                    ) : (
                      hours.map((line, i) => (
                        <Text key={i} style={s.hoursLine}>{line}</Text>
                      ))
                    )}
                  </View>
                );
              })()}
              {(data.phone || data.website || data.mapsUri) && (
                <View style={s.btnCol}>
                  {!!data.phone && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: '#10b981' }]} onPress={() => Linking.openURL(`tel:${data.phone}`)}>
                      <Text style={s.btnTxt}>{isRestaurant ? P.bookTable : P.call} · {data.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {!!data.website && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: Colors.PRIMARY }]} onPress={() => Linking.openURL(data.website!)}>
                      <Text style={s.btnTxt}>{P.site}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {showHotelPrices && (
                <View style={[s.btnRow, { marginTop: 10 }]}>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#FF6B00' }]} onPress={() => openInAppBrowser(hotellookSearch(title))}>
                    <Text style={s.btnTxt}>{P.priceAvail}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#003580' }]} onPress={() => openInAppBrowser(bookingSearch(title))}>
                    <Text style={s.btnTxt}>Booking</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showAttractionTickets && (() => {
                const config: Record<string, { color: string; label: string; clickable: boolean }> = {
                  online: { color: '#f97316', label: P.buyTicket, clickable: true },
                  onsite: { color: '#64748b', label: P.payAtEntry, clickable: false },
                  free: { color: '#10b981', label: P.free, clickable: false },
                  appointment: { color: '#3DA5C4', label: P.byAppt, clickable: false },
                };
                const c = ticketType ? config[ticketType] : null;
                if (!c || ticketType === 'skip') return null;
                return (
                  <View style={[s.btnCol, { marginTop: 10 }]}>
                    {c.clickable && ticketUrl ? (
                      <TouchableOpacity style={[s.btn, { backgroundColor: c.color }]} onPress={() => openInAppBrowser(ticketUrl)}>
                        <Text style={s.btnTxt}>{c.label}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[s.btn, { backgroundColor: c.color }]}>
                        <Text style={s.btnTxt}>{c.label}</Text>
                      </View>
                    )}
                    {c.clickable && ticketUrlAlt && (
                      <TouchableOpacity onPress={() => openInAppBrowser(ticketUrlAlt)} style={{ marginTop: 6, alignSelf: 'center' }}>
                        <Text style={{ color: '#1A6B8A', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>{P.seeAlso}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 20 },
  close: { position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  closeX: { fontSize: 16, color: '#64748b', fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14, marginLeft: 32 },
  rowCenter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  star: { fontSize: 22 },
  rating: { fontSize: 28, fontWeight: '900', color: '#f59e0b' },
  reviews: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  infoIcon: { fontSize: 16 },
  infoTxt: { flex: 1, fontSize: 14, color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', lineHeight: 20 },
  hoursBlock: { marginBottom: 14, padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  hoursTitle: { fontSize: 14, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  hoursLine: { fontSize: 13, color: '#475569', writingDirection: 'rtl', textAlign: 'right', lineHeight: 20, fontWeight: '600' },
  btnCol: { gap: 8 },
  btnRow: { flexDirection: 'row-reverse', gap: 8 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15, writingDirection: 'rtl' },
  notFound: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 30, writingDirection: 'rtl' },
});
