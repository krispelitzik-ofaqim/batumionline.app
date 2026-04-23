import React from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapEmbed({ src, style }: { src: string; style?: StyleProp<ViewStyle> }) {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {React.createElement('iframe', {
          src,
          title: 'map',
          style: { width: '100%', height: '100%', border: 0 } as any,
        })}
      </View>
    );
  }

  return (
    <View style={style}>
      <WebView
        source={{ uri: src }}
        style={{ flex: 1 }}
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}
