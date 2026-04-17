import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';

type Track = { title?: string; url: string; coords?: { lat: number; lng: number } };
type Props = { tracks: Track[]; title?: string; compact?: boolean; onNavigate?: (coords: { lat: number; lng: number }) => void; tint?: string; onActiveChange?: (idx: number, track: Track) => void; onTimeReached?: { seconds: number; callback: () => void } };

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function darken(hex: string, amount = 0.45): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#555';
  const r = Math.max(0, Math.floor(parseInt(m[1], 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(m[2], 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(m[3], 16) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

export default function AudioPlayer({ tracks: initialTracks, title, compact, onNavigate, tint, onActiveChange, onTimeReached }: Props) {
  const [tracks, setTracks] = useState(initialTracks);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const timeTriggered = useRef(false);
  const soundRef = useRef<any>(null);
  const audioElRef = useRef<any>(null);

  useEffect(() => { setTracks(initialTracks); }, [initialTracks]);

  const moveTrack = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...tracks];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setTracks(arr);
    if (activeIdx === from) setActiveIdx(to);
    else if (from < activeIdx && to >= activeIdx) setActiveIdx(activeIdx - 1);
    else if (from > activeIdx && to <= activeIdx) setActiveIdx(activeIdx + 1);
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync?.();
    };
  }, []);

  const current = tracks[activeIdx];

  const toggle = async () => {
    if (Platform.OS === 'web') {
      if (!audioElRef.current) {
        audioElRef.current = new (window as any).Audio(current.url);
        audioElRef.current.ontimeupdate = () => {
          setPos((audioElRef.current.currentTime || 0) * 1000);
          setDur((audioElRef.current.duration || 0) * 1000);
        };
        audioElRef.current.onended = () => setPlaying(false);
      }
      if (playing) {
        audioElRef.current.pause();
        setPlaying(false);
      } else {
        audioElRef.current.play();
        setPlaying(true);
      }
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: current.url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st: any) => {
        if (!st.isLoaded) return;
        setPos(st.positionMillis || 0);
        setDur(st.durationMillis || 0);
        setPlaying(st.isPlaying);
      });
      setPlaying(true);
    } else {
      const st = await soundRef.current.getStatusAsync();
      if (st.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    }
  };

  const pickTrack = async (i: number) => {
    if (Platform.OS === 'web') {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    } else if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setActiveIdx(i);
    setPlaying(false);
    setPos(0);
    setDur(0);
    onActiveChange?.(i, tracks[i]);
  };

  useEffect(() => {
    if (onTimeReached && !timeTriggered.current && pos >= onTimeReached.seconds * 1000) {
      timeTriggered.current = true;
      onTimeReached.callback();
    }
  }, [pos, onTimeReached]);

  const pct = dur > 0 ? (pos / dur) * 100 : 0;

  if (!tracks || tracks.length === 0) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact, tint && { backgroundColor: tint, borderColor: 'rgba(0,0,0,0.1)' }]}>
      {title && <Text style={styles.header}>{title}</Text>}
      <Text style={[styles.nowTitle, compact && styles.nowTitleCompact]}>{current?.title || `שיר ${activeIdx + 1}`}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.playBtn, compact && styles.playBtnCompact]} onPress={toggle} activeOpacity={0.85}>
          <Text style={[styles.playIcon, compact && styles.playIconCompact]}>{playing ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(pos)}</Text>
            <Text style={styles.time}>{fmt(dur)}</Text>
          </View>
        </View>
      </View>

      {tracks.length > 1 && (
        <View style={styles.list}>
          {tracks.map((t, i) => {
            const inner = (
              <>
                <Text style={styles.dragHandle}>≡</Text>
                <Text style={styles.listIcon}>🎧</Text>
                <Text style={[styles.listTxt, i === activeIdx && styles.listTxtActive]}>
                  {t.title || `שיר ${i + 1}`}
                </Text>
                {t.coords && onNavigate && (
                  <>
                    <View style={styles.navSpacer} />
                    <TouchableOpacity
                      onPress={(e: any) => { e.stopPropagation?.(); onNavigate(t.coords!); }}
                      style={[styles.navBtn, { backgroundColor: tint ? darken(tint, 0.5) : '#555' }]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.navBtnTxt}>נווט{'\n'}למקום</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            );
            if (Platform.OS === 'web') {
              return React.createElement(
                'div',
                {
                  key: i,
                  draggable: true,
                  onDragStart: (e: any) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; },
                  onDragOver: (e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
                  onDrop: (e: any) => { e.preventDefault(); if (dragIdx !== null) moveTrack(dragIdx, i); setDragIdx(null); },
                  onDragEnd: () => setDragIdx(null),
                  onClick: () => pickTrack(i),
                  style: {
                    display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: i === activeIdx ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${i === activeIdx ? 'rgba(0,0,0,0.15)' : 'transparent'}`,
                    cursor: 'grab',
                    opacity: dragIdx === i ? 0.4 : 1,
                  },
                },
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1, pointerEvents: 'none' } as any}>{inner}</View>
              );
            }
            return (
              <TouchableOpacity
                key={i}
                onPress={() => pickTrack(i)}
                style={[styles.listItem, i === activeIdx && styles.listItemActive]}
              >
                {inner}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardCompact: { padding: 10, borderRadius: 14 },
  nowTitleCompact: { fontSize: 14, marginBottom: 6 },
  playBtnCompact: { width: 40, height: 40, borderRadius: 20 },
  playIconCompact: { fontSize: 15 },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.SECONDARY + '25',
  },
  header: { fontSize: 13, color: '#888', fontWeight: '700', writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  nowTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  playBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playIcon: { color: Colors.WHITE, fontSize: 20, fontWeight: '900', marginLeft: 2 },
  progressWrap: { flex: 1 },
  progressBg: { height: 6, backgroundColor: '#E5EEF2', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.SECONDARY, borderRadius: 3 },
  timeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: 11, color: '#888', fontVariant: ['tabular-nums'] },
  list: { marginTop: 16, gap: 6 },
  listItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F7F9FB',
    borderWidth: 1, borderColor: 'transparent',
  },
  listItemActive: { backgroundColor: Colors.SECONDARY + '20', borderColor: Colors.SECONDARY + '60' },
  listIcon: { fontSize: 16 },
  dragHandle: { fontSize: 20, color: '#999', fontWeight: '700', paddingHorizontal: 4 },
  navSpacer: { width: 10 },
  navBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnTxt: { fontSize: 11, color: Colors.WHITE, fontWeight: '800', textAlign: 'center', lineHeight: 13 },
  listTxt: { fontSize: 13, color: Colors.TEXT, fontWeight: '600', writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  listTxtActive: { color: Colors.PRIMARY, fontWeight: '800' },
});

