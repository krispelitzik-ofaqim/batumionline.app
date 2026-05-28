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
    .replace(/style="([^"]*)"/g, (_m, body) => {
      const keep = (body as string)
        .split(';')
        .map(s => s.trim())
        .filter(s => /^(direction|writing-direction|color|background|background-color|font-weight|font-style|text-decoration|margin|margin-top|margin-bottom|padding|padding-top|padding-bottom|border-radius|box-shadow|border-right|border-left|border-top|border-bottom|border)\s*:/i.test(s))
        .filter(s => !/text-align\s*:\s*(justify|left|center)/i.test(s))
        .join(';');
      return keep ? `style="${keep}"` : '';
    })
    .replace(/class="[^"]*"/g, '')
    .replace(/<span[^>]*>/g, '<span>')
    .replace(/<font[^>]*>/g, '')
    .replace(/<\/font>/g, '');
}

export default function HtmlContent({ html, style, baseStyle }: Props) {
  const { width } = useWindowDimensions();

  if (!html) return null;

  if (Platform.OS === 'web') {
    const cleaned = stripGoogleDocsCss(html);
    const wrap = `<div class="hc-rtl-content">${cleaned}</div>
<style>
.hc-rtl-content, .hc-rtl-content * { direction: rtl !important; text-align: right !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; box-sizing: border-box !important; }
.hc-rtl-content { font-size: 15px !important; line-height: 1.7 !important; letter-spacing: 0.1px !important; }
.hc-rtl-content p { margin: 0 0 14px 0 !important; line-height: 1.7 !important; padding: 0 !important; text-align: right !important; }
.hc-rtl-content p:last-child { margin-bottom: 0 !important; }
.hc-rtl-content div { line-height: 1.7 !important; margin-top: 0 !important; }
.hc-rtl-content > div + div, .hc-rtl-content > div > div + div { margin-top: 14px !important; }
.hc-rtl-content h1 { font-size: 22px !important; font-weight: 800 !important; margin: 24px 0 12px 0 !important; line-height: 1.3 !important; padding: 0 0 8px 0 !important; border-bottom: 2px solid currentColor !important; display: inline-block !important; }
.hc-rtl-content h1:first-child { margin-top: 0 !important; }
.hc-rtl-content h2 { font-size: 18px !important; font-weight: 800 !important; margin: 20px 0 10px 0 !important; line-height: 1.3 !important; padding: 0 !important; position: relative !important; padding-right: 14px !important; }
.hc-rtl-content h2::before { content: "" !important; position: absolute !important; right: 0 !important; top: 6px !important; bottom: 6px !important; width: 4px !important; background: currentColor !important; border-radius: 2px !important; opacity: 0.5 !important; }
.hc-rtl-content h2:first-child { margin-top: 0 !important; }
.hc-rtl-content h3 { font-size: 16px !important; font-weight: 700 !important; margin: 14px 0 8px 0 !important; line-height: 1.3 !important; padding: 0 !important; }
.hc-rtl-content br { line-height: 1.7 !important; }
.hc-rtl-content span { padding: 0 !important; margin: 0 !important; line-height: inherit !important; }
.hc-rtl-content strong, .hc-rtl-content b { font-weight: 700 !important; }
.hc-rtl-content ul, .hc-rtl-content ol { margin: 8px 0 14px 0 !important; padding-right: 22px !important; padding-left: 0 !important; }
.hc-rtl-content li { margin: 0 0 8px 0 !important; line-height: 1.65 !important; padding-right: 4px !important; }
.hc-rtl-content li::marker { color: #1A6B8A !important; }
.hc-rtl-content hr { border: none !important; border-top: 1px solid #e2e8f0 !important; margin: 18px 0 !important; }
.hc-rtl-content blockquote { border-right: 3px solid #3DA5C4 !important; background: #f0f7fa !important; padding: 10px 14px !important; margin: 12px 0 !important; border-radius: 0 8px 8px 0 !important; font-style: italic !important; color: #475569 !important; }
.hc-rtl-content img { max-width: 100% !important; height: auto !important; border-radius: 12px !important; margin: 10px 0 !important; }
.hc-rtl-content table { width: 100% !important; border-collapse: collapse !important; margin: 12px 0 !important; font-size: 13px !important; }
.hc-rtl-content th, .hc-rtl-content td { border: 1px solid #e2e8f0 !important; padding: 8px !important; text-align: right !important; }
.hc-rtl-content th { background: #f8fafc !important; font-weight: 700 !important; color: #1A6B8A !important; }
.hc-rtl-content a { display: inline-flex !important; align-items: center !important; gap: 5px !important; background: #fff !important; color: #1A6B8A !important; padding: 5px 12px !important; border-radius: 999px !important; border: 1px solid #d1e3eb !important; text-decoration: none !important; font-weight: 600 !important; font-size: 12.5px !important; margin: 3px 4px 3px 0 !important; line-height: 1.4 !important; box-shadow: 0 1px 2px rgba(15,42,56,0.04) !important; transition: all 0.2s !important; vertical-align: middle !important; }
.hc-rtl-content a:hover { background: #1A6B8A !important; color: #fff !important; border-color: #1A6B8A !important; }
.hc-rtl-content a[href^="tel:"]::before { content: "📞" !important; font-size: 11px !important; }
.hc-rtl-content a[href^="mailto:"]::before { content: "✉" !important; font-size: 11px !important; }
.hc-rtl-content a[href^="https://wa.me"], .hc-rtl-content a[href*="whatsapp"] { color: #128C7E !important; border-color: #c8ebe2 !important; }
.hc-rtl-content a[href^="https://wa.me"]:hover, .hc-rtl-content a[href*="whatsapp"]:hover { background: #128C7E !important; color: #fff !important; border-color: #128C7E !important; }
.hc-rtl-content a[href^="https://wa.me"]::before, .hc-rtl-content a[href*="whatsapp"]::before { content: "💬" !important; font-size: 11px !important; }
.hc-rtl-content a[href*="maps.google"], .hc-rtl-content a[href*="goo.gl/maps"] { color: #B91C1C !important; border-color: #fecaca !important; }
.hc-rtl-content a[href*="maps.google"]:hover, .hc-rtl-content a[href*="goo.gl/maps"]:hover { background: #B91C1C !important; color: #fff !important; border-color: #B91C1C !important; }
.hc-rtl-content a[href*="maps.google"]::before, .hc-rtl-content a[href*="goo.gl/maps"]::before { content: "📍" !important; font-size: 11px !important; }
.hc-rtl-content a[href^="http"]:not([href^="https://wa.me"]):not([href*="whatsapp"]):not([href*="maps.google"]):not([href*="goo.gl/maps"])::before { content: "↗" !important; font-size: 11px !important; }
</style>`;
    return (
      <View style={style}>
        {React.createElement('div', {
          dangerouslySetInnerHTML: { __html: wrap },
          style: { direction: 'rtl', textAlign: 'right', ...(baseStyle as any) },
        })}
      </View>
    );
  }

  const cleanHtml = stripGoogleDocsCss(html);

  return (
    <View style={[{ width: '100%', alignSelf: 'stretch' }, style]}>
      <RenderHtml
        contentWidth={width - 40}
        source={{ html: cleanHtml }}
        baseStyle={{
          textAlign: 'right',
          writingDirection: 'rtl',
          fontSize: 15,
          lineHeight: 22,
          color: '#1C2B35',
          ...(baseStyle || {}),
        }}
        defaultTextProps={{ style: { textAlign: 'right', writingDirection: 'rtl' }, allowFontScaling: false }}
        enableExperimentalMarginCollapsing
        tagsStyles={{
          body: { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          div: { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          p: { marginBottom: 10, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          h1: { fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          h2: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          h3: { fontSize: 16, fontWeight: '800', marginBottom: 6, textAlign: 'right', writingDirection: 'rtl', alignSelf: 'stretch', width: '100%' },
          ul: { marginBottom: 10, textAlign: 'right', alignSelf: 'stretch', width: '100%' },
          li: { marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' },
          a: { color: '#1A6B8A', textDecorationLine: 'underline', writingDirection: 'rtl' },
          span: { writingDirection: 'rtl' },
          strong: { fontWeight: '800' },
          b: { fontWeight: '800' },
        }}
      />
    </View>
  );
}
