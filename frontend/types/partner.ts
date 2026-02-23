import type { BrandConfig, BrandTheme } from './brand';
import type { LernreiseDefinition } from './journey';

export interface ContentPackMeta {
  id: string;
  name: string;
  description: string;
  sponsor: string;
}

export interface PartnerData {
  brand: BrandConfig;
  packs: ContentPackMeta[];
  lernreisen: LernreiseDefinition[];
}

export interface PartnerSummary {
  slug: string;
  brandName: string;
  brandNameShort: string;
  tagline: string;
  theme: BrandTheme;
  sponsorLabel: string | null;
  lernreisenCount: number;
}
