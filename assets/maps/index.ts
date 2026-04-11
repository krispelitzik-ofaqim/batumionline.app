export type MapPin = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  lat: number;
  lng: number;
};

export type MapDef = {
  key: string;
  label: string;
  description?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  pins: MapPin[];
};

export const MAPS: MapDef[] = [
];
