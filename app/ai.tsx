import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import { API_BASE } from '../constants/api';

// Optional native speech synthesis — guarded so the demo runs even without the dep.
let Speech: any = null;
try { Speech = require('expo-speech'); } catch {}

// Native speech-to-text (voice input) via expo-speech-recognition — guarded so web still runs.
let NativeSR: any = null;
try { NativeSR = require('expo-speech-recognition'); } catch {}

// Speak text aloud: browser's built-in speechSynthesis on web, expo-speech on native.
function speak(text: string, langCode: string) {
  try {
    const w: any = typeof window !== 'undefined' ? window : null;
    if (Platform.OS === 'web' && w?.speechSynthesis) {
      w.speechSynthesis.cancel();
      const u = new w.SpeechSynthesisUtterance(text);
      u.lang = langCode;
      w.speechSynthesis.speak(u);
      return;
    }
    Speech?.speak?.(text, { language: langCode });
  } catch {}
}
function stopSpeak() {
  try {
    const w: any = typeof window !== 'undefined' ? window : null;
    if (Platform.OS === 'web' && w?.speechSynthesis) w.speechSynthesis.cancel();
    Speech?.stop?.();
  } catch {}
}

type Phase = 'idle' | 'listening' | 'thinking' | 'answered' | 'locked';

// AI assistant is free & unlimited (no paywall). Set to a finite number to re-enable a limit.
const FREE_LIMIT = Infinity;

// Internal promo (AdMob-style slim banner) driving users to the coupons feature.
const PROMO: Record<string, string> = {
  he: 'קבלו הנחה במסעדות בטומי',
  en: 'Get a discount at Batumi restaurants',
  fa: 'در رستوران‌های باتومی تخفیف بگیرید',
  ru: 'Получите скидку в ресторанах Батуми',
};
const USES_KEY = '@ai_uses';
async function getUses(): Promise<number> {
  try {
    if (Platform.OS === 'web') { const w: any = window; return parseInt(w.localStorage.getItem(USES_KEY) || '0', 10) || 0; }
    const AS = require('@react-native-async-storage/async-storage').default;
    return parseInt((await AS.getItem(USES_KEY)) || '0', 10) || 0;
  } catch { return 0; }
}
async function saveUses(n: number) {
  try {
    if (Platform.OS === 'web') { const w: any = window; w.localStorage.setItem(USES_KEY, String(n)); return; }
    const AS = require('@react-native-async-storage/async-storage').default;
    await AS.setItem(USES_KEY, String(n));
  } catch {}
}

const TR: Record<string, {
  title: string; sub: string; tapSpeak: string; listening: string; thinking: string; askMore: string;
  err: string; noMic: string; locked: string; soon: string; remaining: (n: number) => string; back: string; speechLang: string;
}> = {
  he: { title: 'בטומי AI', sub: 'המדריך הקולי שלך בבטומי', tapSpeak: 'לחץ ודבר', listening: 'מקשיב…', thinking: 'חושב…', askMore: 'שאל עוד',
    err: 'שגיאה, נסה שוב.', noMic: 'לא ניתן לגשת למיקרופון בדפדפן זה.', back: 'חזרה', speechLang: 'he-IL', locked: "ניצלת את 5 השאלות החינם.", soon: "מנוי בקרוב 🚀", remaining: (n) => `נותרו ${n} שאלות חינם` },
  en: { title: 'Batumi AI', sub: 'Your voice guide in Batumi', tapSpeak: 'Tap & speak', listening: 'Listening…', thinking: 'Thinking…', askMore: 'Ask again',
    err: 'Something went wrong, try again.', noMic: 'Microphone is not available in this browser.', back: 'Back', speechLang: 'en-US', locked: "You have used your 5 free questions.", soon: "Subscription coming soon 🚀", remaining: (n) => `${n} free questions left` },
  fa: { title: 'باتومی AI', sub: 'راهنمای صوتی شما در باتومی', tapSpeak: 'بزنید و صحبت کنید', listening: 'در حال شنیدن…', thinking: 'در حال فکر کردن…', askMore: 'دوباره بپرسید',
    err: 'خطایی رخ داد، دوباره امتحان کنید.', noMic: 'میکروفون در این مرورگر در دسترس نیست.', back: 'بازگشت', speechLang: 'fa-IR', locked: "شما ۵ سوال رایگان خود را استفاده کردید.", soon: "اشتراک به‌زودی 🚀", remaining: (n) => `${n} سوال رایگان باقی مانده` },
  ru: { title: 'Батуми AI', sub: 'Ваш голосовой гид в Батуми', tapSpeak: 'Нажмите и говорите', listening: 'Слушаю…', thinking: 'Думаю…', askMore: 'Спросить ещё',
    err: 'Что-то пошло не так, попробуйте ещё раз.', noMic: 'Микрофон недоступен в этом браузере.', back: 'Назад', speechLang: 'ru-RU', locked: "Вы использовали 5 бесплатных вопросов.", soon: "Подписка скоро 🚀", remaining: (n) => `Осталось бесплатных вопросов: ${n}` },
};

export default function AIScreen() {
  const { lang, isRTL } = useI18n();
  const T = TR[lang] || TR.en;
  const ta = isRTL ? 'right' : 'left';
  const wd = isRTL ? 'rtl' : 'ltr';
  const [phase, setPhase] = useState<Phase>('idle');
  const [userQ, setUserQ] = useState('');
  const [ans, setAns] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [used, setUsed] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const recRef = useRef<any>(null);

  useEffect(() => { getUses().then(setUsed); return () => { try { const r: any = recRef.current; if (Array.isArray(r)) r.forEach((s: any) => s?.remove?.()); else r?.stop?.(); } catch {} try { NativeSR?.ExpoSpeechRecognitionModule?.stop?.(); } catch {} stopSpeak(); }; }, []);

  useEffect(() => {
    if (phase === 'listening') {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      ]));
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [phase]);

  const ask = async (q: string) => {
    setUserQ(q); setAns(''); setPlaces([]); setPhase('thinking');
    try {
      const r = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, lang }),
      });
      const j = await r.json();
      const a = (j && (j.answer || j.error)) || '…';
      setAns(a); setPlaces(Array.isArray(j?.places) ? j.places : []);
      setPhase('answered');
      speak(a, T.speechLang);
      const n = used + 1; setUsed(n); saveUses(n);
    } catch (e) {
      setAns(T.err); setPhase('answered');
    }
  };

  const run = async () => {
    if (phase === 'listening' || phase === 'thinking') return;
    if (used >= FREE_LIMIT) { stopSpeak(); setPhase('locked'); return; }
    stopSpeak();

    // NATIVE (app): expo-speech-recognition
    if (Platform.OS !== 'web') {
      const M = NativeSR?.ExpoSpeechRecognitionModule;
      if (!M) { setUserQ(''); setAns(T.noMic); setPhase('answered'); return; }
      try {
        const perm = await M.requestPermissionsAsync();
        if (!perm?.granted) { setUserQ(''); setAns(T.noMic); setPhase('answered'); return; }
        try { (recRef.current as any[])?.forEach?.((s: any) => s?.remove?.()); } catch {}
        const subs: any[] = [];
        const cleanup = () => { try { subs.forEach((s) => s?.remove?.()); } catch {} };
        subs.push(M.addListener('result', (e: any) => {
          const q = e?.results?.[0]?.transcript || '';
          if (e?.isFinal) { cleanup(); try { M.stop(); } catch {} if (q) ask(q); else setPhase('idle'); }
        }));
        subs.push(M.addListener('error', () => { cleanup(); setPhase('idle'); }));
        subs.push(M.addListener('end', () => { setPhase((p) => (p === 'listening' ? 'idle' : p)); }));
        recRef.current = subs as any;
        setUserQ(''); setAns(''); setPlaces([]); setPhase('listening');
        M.start({ lang: T.speechLang, interimResults: false, continuous: false });
      } catch { setPhase('idle'); }
      return;
    }

    // WEB (browser): native SpeechRecognition
    const w: any = typeof window !== 'undefined' ? window : null;
    const SR = w && (w.SpeechRecognition || w.webkitSpeechRecognition);
    if (!SR) { setUserQ(''); setAns(T.noMic); setPhase('answered'); return; }
    try {
      const rec = new SR();
      rec.lang = T.speechLang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => { const q = e.results?.[0]?.[0]?.transcript || ''; if (q) ask(q); else setPhase('idle'); };
      rec.onerror = () => setPhase('idle');
      recRef.current = rec;
      setUserQ(''); setAns(''); setPlaces([]); setPhase('listening');
      rec.start();
    } catch { setPhase('idle'); }
  };

  const locked = phase === 'locked' || used >= FREE_LIMIT;
  const btnColor = locked ? '#94a3b8' : phase === 'listening' ? '#E11D48' : phase === 'thinking' ? Colors.ACCENT : Colors.PRIMARY;
  const btnLabel = locked ? T.soon : phase === 'listening' ? T.listening : phase === 'thinking' ? T.thinking : phase === 'answered' ? T.askMore : T.tapSpeak;
  const remaining = Math.max(0, FREE_LIMIT - used);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>🎙️ {T.title}</Text>
          <Text style={[s.hSub, { textAlign: ta, writingDirection: wd }]}>{T.sub}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.convBody, phase !== 'answered' && { flexGrow: 1, justifyContent: 'center' }]} showsVerticalScrollIndicator={false}>
          {phase === 'locked' ? (
            <View style={s.lockWrap}>
              <Text style={s.lockIcon}>🔒</Text>
              <Text style={[s.lockTitle, { writingDirection: wd }]}>{T.locked}</Text>
              <Text style={[s.lockSoon, { writingDirection: wd }]}>{T.soon}</Text>
            </View>
          ) : phase === 'answered' ? (
            <View style={{ width: '100%', gap: 12 }}>
              {!!userQ && (
                <View style={[s.bubbleUser, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[s.bubbleUserTxt, { textAlign: ta, writingDirection: wd }]}>{userQ}</Text>
                </View>
              )}
              <View style={[s.bubbleAI, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
                <Text style={[s.bubbleAITxt, { textAlign: ta, writingDirection: wd }]}>{ans}</Text>
              </View>
              {places.map((p, i) => (
                <TouchableOpacity key={i} style={[s.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} activeOpacity={0.85}
                  onPress={() => router.push(`/category/${p.catId}` as any)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardT, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{p.name || (lang !== 'he' && p.titleEn ? p.titleEn : p.title)}</Text>
                    {lang === 'he' ? <Text style={[s.cardS, { textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{p.category}</Text> : null}
                  </View>
                  <Text style={s.cardArrow}>{isRTL ? '‹' : '›'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[s.hint, { writingDirection: wd }]}>{T.sub}</Text>
          )}
        </ScrollView>

        {/* Mic button — pinned at the bottom so it never moves when the answer appears */}
        <View style={s.micBar}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity activeOpacity={0.9} onPress={run} style={[s.mic, { backgroundColor: btnColor }]}>
              <Text style={s.micIcon}>{locked ? '🔒' : phase === 'thinking' ? '…' : '🎙️'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[s.micLabel, { color: btnColor }]}>{btnLabel}</Text>
          {!locked && Number.isFinite(FREE_LIMIT) && <Text style={s.remain}>{T.remaining(remaining)}</Text>}
        </View>

        {/* Internal promo — restaurant coupons (slim AdMob-style banner, anchored to the bottom) */}
        <TouchableOpacity style={[s.promo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} activeOpacity={0.85} onPress={() => router.push('/coupons' as any)}>
          <Text style={s.promoIcon}>🎫</Text>
          <Text style={[s.promoTxt, { flex: 1, textAlign: ta, writingDirection: wd }]} numberOfLines={1}>{PROMO[lang] || PROMO.en}</Text>
          <Text style={s.promoArrow}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.NAVY || '#16222C' },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '300' },
  hTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  hSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  convBody: { padding: 20, alignItems: 'center' },
  hint: { fontSize: 15, color: '#94a0ab', textAlign: 'center' },
  micBar: { alignItems: 'center', gap: 10, paddingVertical: 22, paddingHorizontal: 20 },
  remain: { fontSize: 12, color: '#94a0ab', fontWeight: '700' },
  promo: { alignItems: 'center', gap: 10, height: 54, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E4DFD8', marginHorizontal: 14, marginBottom: 4, paddingHorizontal: 14 },
  promoIcon: { fontSize: 20 },
  promoTxt: { fontSize: 14, fontWeight: '700', color: Colors.TEXT },
  promoArrow: { fontSize: 22, color: Colors.PRIMARY, fontWeight: '300' },
  lockWrap: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  lockIcon: { fontSize: 48 },
  lockTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, textAlign: 'center' },
  lockSoon: { fontSize: 14, color: Colors.PRIMARY, fontWeight: '800', textAlign: 'center' },
  mic: {
    width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  micIcon: { fontSize: 60 },
  micLabel: { fontSize: 18, fontWeight: '900' },
  bubbleUser: { maxWidth: '85%', backgroundColor: '#E7EEF2', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUserTxt: { fontSize: 14, color: Colors.TEXT, fontWeight: '700' },
  bubbleAI: { maxWidth: '90%', backgroundColor: Colors.PRIMARY, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  bubbleAITxt: { fontSize: 15, color: '#fff', lineHeight: 22, fontWeight: '600' },
  card: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10,
    borderWidth: 1, borderColor: '#e7e0d4', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardT: { fontSize: 16, fontWeight: '900', color: Colors.TEXT },
  cardS: { fontSize: 12, color: '#94a0ab', marginTop: 2 },
  cardArrow: { fontSize: 24, color: Colors.SECONDARY, fontWeight: '700' },
});
