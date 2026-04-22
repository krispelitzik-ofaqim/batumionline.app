import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { fetchContent } from '../constants/api';

type Banner = {
  id: string;
  client: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  position: 'top' | 'middle' | 'bottom';
  size: 'small' | 'medium' | 'large';
  targetPage: string;
  clickUrl: string;
  startAt: string;
  endAt: string;
  visible: boolean;
};

const SIZE_PX: Record<Banner['size'], number> = { small: 50, medium: 100, large: 180 };

export default function ClientBannerDisplay({ page, position }: { page: string; position: 'top' | 'middle' | 'bottom' }) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchContent();
        const list: Banner[] = Array.isArray(data?.clientBanners) ? data.clientBanners : [];
        const now = new Date();
        const match = list.find(b => {
          if (!b.visible) return false;
          if (b.position !== position) return false;
          if (b.targetPage !== 'all' && b.targetPage !== page) return false;
          if (b.startAt && new Date(b.startAt) > now) return false;
          if (b.endAt && new Date(b.endAt + 'T23:59:59') < now) return false;
          return true;
        });
        setBanner(match || null);
      } catch {}
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [page, position]);

  if (!banner) return null;

  const height = SIZE_PX[banner.size];
  const onPress = () => {
    if (!banner.clickUrl) return;
    Linking.openURL(banner.clickUrl).catch(() => {});
  };

  return (
    <View style={[s.wrap, { height: height + 16 }]}>
      <TouchableOpacity activeOpacity={banner.clickUrl ? 0.85 : 1} onPress={onPress} style={{ width: '100%', height }}>
        {banner.mediaType === 'video' && Platform.OS === 'web' ? (
          React.createElement('video', {
            src: banner.mediaUrl,
            autoPlay: true, muted: true, loop: true, playsInline: true,
            style: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, background: '#000' },
          })
        ) : (
          <Image source={{ uri: banner.mediaUrl }} style={{ width: '100%', height, borderRadius: 12 }} resizeMode="cover" />
        )}
      </TouchableOpacity>
      <View style={s.adTag}>
        <Text style={s.adTxt}>פרסומי</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'relative', marginVertical: 8, marginHorizontal: 16,
  },
  adTag: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  adTxt: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
