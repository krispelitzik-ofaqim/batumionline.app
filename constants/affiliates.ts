import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Active TravelPayouts marker (temporarily Dubai's until Batumi gets full approvals).
// When Batumi is approved: replace with 'OwII8uTI' (Batumi's marker).
export const TP_MARKER = 'X5SEJjUA';

export const GYG_PARTNER_ID = 'PE2GLSE3MAO4YDEIXLNOYXMC67BCZ32C';

// Quick links (using current marker)
export const TIQETS_LINK = `https://tp.st/click?utm_source=batumionline&shmarker=${TP_MARKER}&promo_id=4061&campaign_id=120&trs=${TP_MARKER}`;
export const AVIASALES_LINK = `https://www.aviasales.com/?marker=${TP_MARKER}`;

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

// Hotellook search via Travelpayouts
export function hotellookSearch(hotelName: string): string {
  const q = encodeURIComponent(`${hotelName} Batumi`);
  return `https://search.hotellook.com/hotels?destination=${q}&adults=2&marker=${TP_MARKER}`;
}

// Booking.com via Travelpayouts redirect
export function bookingSearch(hotelName: string): string {
  const q = encodeURIComponent(`${hotelName} Batumi`);
  return `https://www.booking.com/searchresults.html?ss=${q}&aid=${TP_MARKER}`;
}

// Agoda search (no Travelpayouts integration yet; kept as direct)
export function agodaSearch(hotelName: string): string {
  const q = encodeURIComponent(`${hotelName} Batumi`);
  return `https://www.agoda.com/search?q=${q}`;
}

// Aviasales flight search to Batumi from any origin
export function aviasalesBatumi(): string {
  return `https://www.aviasales.com/search/TLV01BUS01?marker=${TP_MARKER}`;
}

// Tiqets — attraction tickets in Batumi
export function tiqetsBatumi(query?: string): string {
  if (query) {
    const q = encodeURIComponent(query);
    return `https://www.tiqets.com/en/search?q=${q}&partner=${TP_MARKER}`;
  }
  return `https://www.tiqets.com/en/batumi-c134033/?partner=${TP_MARKER}`;
}
