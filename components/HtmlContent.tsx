import React from 'react';
import { Platform, useWindowDimensions, View, Text, StyleProp, ViewStyle } from 'react-native';
import RenderHtml from 'react-native-render-html';

type Props = {
  html: string;
  style?: StyleProp<ViewStyle>;
  baseStyle?: Record<string, any>;
};

function stripGoogleDocsCss(h: string): string {
  return h
    .replace(/style="[^"]*width:[^;"]*[;"][^"]*"/g, 'style=""')
    .replace(/class="[^"]*"/g, '')
    .replace(/<span[^>]*>/g, '<span>');
}

export default function HtmlContent({ html, style, baseStyle }: Props) {
  const { width } = useWindowDimensions();

  if (!html) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {React.createElement('div', {
          dangerouslySetInnerHTML: { __html: html },
          style: { direction: 'rtl', textAlign: 'right', ...(baseStyle as any) },
        })}
      </View>
    );
  }

  const cleanHtml = stripGoogleDocsCss(html);

  return (
    <View style={style}>
      <RenderHtml
        contentWidth={width - 40}
        source={{ html: cleanHtml }}
        baseStyle={{
          direction: 'rtl',
          textAlign: 'right',
          writingDirection: 'rtl',
          fontSize: 15,
          lineHeight: 22,
          color: '#1C2B35',
          ...(baseStyle || {}),
        }}
        enableExperimentalMarginCollapsing
        tagsStyles={{
          div: { textAlign: 'right', writingDirection: 'rtl' },
          p: { marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
          h1: { fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
          h2: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
          h3: { fontSize: 16, fontWeight: '800', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
          ul: { marginBottom: 10, textAlign: 'right' },
          li: { marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' },
          a: { color: '#1A6B8A', textDecorationLine: 'underline' },
          strong: { fontWeight: '800' },
          b: { fontWeight: '800' },
        }}
      />
    </View>
  );
}
