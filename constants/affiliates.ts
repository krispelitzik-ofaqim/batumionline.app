import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export const GYG_PARTNER_ID = 'PE2GLSE3MAO4YDEIXLNOYXMC67BCZ32C';

export async function openInAppBrowser(url: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(url, '_blank');
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: 'close',
      readerMode: false,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    });
  } catch {}
}

export function gygSearch(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.getyourguide.com/s/?q=${q}&partner_id=${GYG_PARTNER_ID}`;
}

export function gygBatumi(): string {
  return `https://www.getyourguide.com/batumi-l2213/?partner_id=${GYG_PARTNER_ID}`;
}
