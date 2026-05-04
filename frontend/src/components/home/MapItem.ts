import type { GeoJsonObject } from "geojson";

export type MapItemType = "track" | "hut" | "campsite" | "weather_station";

export type MapItem = {
  id: number;
  name: string;
  introduction?: string;
  type: MapItemType;
  region?: string;
  bookable?: string;
  lat: number;
  lng: number;
  facilities?: string;
  difficulty?: string;
  completion_time?: string;
  thumbnail_url?: string;
  source_page_url?: string;
  geom_geojson?: GeoJsonObject;
  /** NIWA / embed page URL; same role as `source_page_url` for weather stations. */
  weather_url?: string;
};
