import React, { useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Real AdMob banner unit ids (created in the AdMob console, app "Batumi Online").
// In development we always use Google's test id to avoid invalid-traffic strikes.
const UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-2780806346630674/8777566307',
      android: 'ca-app-pub-2780806346630674/5958017181',
    })!;

let sdkStarted = false;

export default function AdBanner() {
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!sdkStarted) {
      sdkStarted = true;
      mobileAds().initialize().catch(() => {});
    }
    return () => { mounted.current = false; };
  }, []);

  // Hide the row entirely if the ad fails to load, so we never leave an empty gap.
  if (failed) return null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => { if (mounted.current) setFailed(true); }}
      />
    </View>
  );
}
