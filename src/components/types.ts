export type Language = "en" | "es";

export type AoiRecord = {
  id: string;
  country: string;
  event: string;
  name: Record<Language, string>;
  status: string;
  source: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  downloads: Record<string, string>;
  layers: {
    damage: string;
    beforeImage?: string;
    afterImage?: string;
    vlm?: string;
  };
  imagery?: {
    before: null | {
      url: string;
      sensor?: string;
      acquisitionUtc?: string;
      bytes?: number;
      sha256?: string;
      r2Key?: string;
    };
    after: null | {
      url: string;
      sensor?: string;
      acquisitionUtc?: string;
      bytes?: number;
      sha256?: string;
      r2Key?: string;
    };
    note?: string;
  };
  metrics: Record<string, number>;
};

export type AoiCatalog = {
  updatedAt: string;
  platform: string;
  aois: AoiRecord[];
  watchlist: Array<{
    id: string;
    name: Record<Language, string>;
    status: string;
    expectedUtc: string;
    priority: string;
  }>;
};

export type DamageFeature = {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: Record<string, string | number | boolean | undefined> & { id: string };
};

export type VlmRecord = {
  id: string;
  triplet_chip?: string;
  truth_damage_class?: string;
  vlm?: {
    damage_class?: string;
    damage_percent?: number;
    confidence?: number;
    evidence?: string;
    image_quality?: string;
    action_priority?: string;
  };
};
