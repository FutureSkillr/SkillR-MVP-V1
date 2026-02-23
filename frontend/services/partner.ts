import type { BrandConfig } from '../types/brand';
import type { LernreiseDefinition } from '../types/journey';
import type { ContentPackMeta, PartnerData, PartnerSummary } from '../types/partner';
import { DEFAULT_LERNREISEN } from '../constants/lernreisen';
import {
  SSI_BRAND,
  SSI_LERNREISE_IDS,
  SSI_SUMMARY,
} from '../constants/partners/spaceServiceIntl';
import {
  CZ_BRAND,
  CZ_LERNREISE_IDS,
  CZ_SUMMARY,
} from '../constants/partners/carlsZukunft';
import {
  MA_BRAND,
  MA_LERNREISE_IDS,
  MA_SUMMARY,
} from '../constants/partners/maindsetAcademy';

const HARDCODED_PARTNERS: PartnerSummary[] = [SSI_SUMMARY, CZ_SUMMARY, MA_SUMMARY];

/**
 * Fetch the list of active partners for the landing page.
 * Merges API results with hardcoded partners not yet in the database.
 */
export async function fetchPartnerList(): Promise<PartnerSummary[]> {
  let apiPartners: PartnerSummary[] = [];
  try {
    const res = await fetch('/api/v1/partners');
    if (res.ok) {
      const data: Record<string, unknown>[] = await res.json();
      if (Array.isArray(data)) {
        apiPartners = data.map((p) => ({
          slug: p.slug as string,
          brandName: p.brandName as string,
          brandNameShort: (p.brandNameShort as string) || '',
          tagline: (p.tagline as string) || '',
          theme: (p.theme as PartnerSummary['theme']) || { primaryColor: '#334155', accentColor: '#60a5fa' },
          sponsorLabel: (p.sponsorLabel as string) || null,
          lernreisenCount: (p.lernreisenCount as number) || 0,
        }));
      }
    }
  } catch {
    // API unavailable — use hardcoded only
  }

  // Merge: API partners take precedence, then add hardcoded ones not in API
  const slugs = new Set(apiPartners.map((p) => p.slug));
  const extra = HARDCODED_PARTNERS.filter((p) => !slugs.has(p.slug));
  return [...apiPartners, ...extra];
}

/**
 * Fetch partner data by brand slug.
 * Tries the API first, falls back to hardcoded SSI data for the demo partner.
 */
export async function fetchPartnerData(
  slug: string,
): Promise<PartnerData | null> {
  // Try API first
  try {
    const [brandRes, packRes] = await Promise.all([
      fetch(`/api/brand/${encodeURIComponent(slug)}`),
      fetch(`/api/v1/content-pack/brand/${encodeURIComponent(slug)}`),
    ]);

    if (brandRes.ok && packRes.ok) {
      const brand: BrandConfig = await brandRes.json();
      const packData = await packRes.json();

      const packs: ContentPackMeta[] = (packData.packs || []).map(
        (p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          description: p.description as string,
          sponsor: p.sponsor as string,
        }),
      );

      const lernreisen: LernreiseDefinition[] = (
        packData.lernreisen || []
      ).map((lr: Record<string, unknown>) => ({
        id: lr.id as string,
        title: lr.title as string,
        subtitle: lr.subtitle as string,
        description: lr.description as string,
        icon: lr.icon as string,
        journeyType: lr.journeyType as LernreiseDefinition['journeyType'],
        location: lr.location as string,
        lat: lr.lat as number,
        lng: lr.lng as number,
        setting: lr.setting as string,
        character: lr.characterName
          ? `${lr.characterName} — ${lr.characterDesc}`
          : (lr.character as string) || '',
        dimensions: (lr.dimensions as string[]) || [],
      }));

      return { brand, packs, lernreisen };
    }
  } catch {
    // API unavailable — fall through to fallback
  }

  // Fallback: hardcoded partner data
  const fallbacks: Record<string, { brand: BrandConfig; packId: string; packName: string; packDesc: string; packSponsor: string; ids: string[] }> = {
    'space-service-intl': {
      brand: SSI_BRAND,
      packId: '003',
      packName: 'Abenteuer Weltraum',
      packDesc: 'Drei Lernreisen rund um Raumfahrtgeschichte: DDR-Kosmonautentraining, sowjetische Pioniere und die Zukunft im All.',
      packSponsor: 'Space Service International',
      ids: SSI_LERNREISE_IDS,
    },
    'carls-zukunft': {
      brand: CZ_BRAND,
      packId: '004',
      packName: 'Zukunftsdenken',
      packDesc: 'Drei Lernreisen rund um Zukunftsforschung: Szenarien entwickeln, KI verstehen und Ideen pitchen.',
      packSponsor: 'Carls Zukunft',
      ids: CZ_LERNREISE_IDS,
    },
    'maindset-academy': {
      brand: MA_BRAND,
      packId: '005',
      packName: 'KI-gestuetztes Lernen',
      packDesc: 'Drei Lernreisen rund um die Zukunft des Lernens: KI-Lernbegleiter bauen, Wissen vernetzen und die Schule von morgen entwerfen.',
      packSponsor: 'maindset.ACADEMY',
      ids: MA_LERNREISE_IDS,
    },
  };

  const fb = fallbacks[slug];
  if (fb) {
    const lernreisen = DEFAULT_LERNREISEN.filter((lr) =>
      fb.ids.includes(lr.id),
    );
    return {
      brand: fb.brand,
      packs: [
        {
          id: fb.packId,
          name: fb.packName,
          description: fb.packDesc,
          sponsor: fb.packSponsor,
        },
      ],
      lernreisen,
    };
  }

  return null;
}
