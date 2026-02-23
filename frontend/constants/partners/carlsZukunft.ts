import type { BrandConfig } from '../../types/brand';
import type { PartnerSummary } from '../../types/partner';

/** Brand config for Carls Zukunft — partner #2. */
export const CZ_BRAND: BrandConfig = {
  slug: 'carls-zukunft',
  brandName: 'Carls Zukunft',
  brandNameShort: 'CZ',
  tagline: 'Hier ist der Raum fuer Zukunft',
  universeTitle: 'Das Carls Zukunft Universum',
  contactEmail: 'michael@carls-zukunft.de',
  copyrightHolder: 'Carls Zukunft GmbH',
  logoUrl: '/icons/app-icon.png',
  appIconUrl: '/icons/app-icon.png',
  pageTitle: 'Carls Zukunft - Hier ist der Raum fuer Zukunft',
  metaDescription:
    'Entdecke die Zukunft mit Carls Zukunft — Zukunftsforschung, KI-Kompetenz und nachhaltiges Denken fuer junge Entdecker.',
  theme: {
    primaryColor: '#2d1b14',
    accentColor: '#e4553e',
  },
  legal: {
    companyName: 'Carls Zukunft GmbH',
    companyAddress: 'Diakonissenstrasse 1, 04177 Leipzig',
    companyCountry: 'Deutschland',
    contactEmail: 'michael@carls-zukunft.de',
    contactPhone: '+49 170 41 45 935',
    legalRepresentative: 'Michael Carl',
    registerEntry: 'HRB 39189, Amtsgericht Leipzig',
    vatId: 'DE347682526',
    contentResponsible: 'Michael Carl',
  },
  aiCoachBrandName: 'Carls Coach',
  sponsorLabel: 'Powered by Carls Zukunft',
};

/** Company description for the partner preview page. */
export const CZ_PARTNER_DESCRIPTION =
  'Carls Zukunft in Leipzig ist ein Zukunftsforschungsinstitut, das Unternehmen und junge Menschen mit Workshops, Podcasts und Events ' +
  'auf die Welt von morgen vorbereitet. Gruender Michael Carl begleitet seit ueber zwei Jahrzehnten Transformationsprozesse — ' +
  'vom KI-Wandel bis zur nachhaltigen Wirtschaft. Mit dem Elephant Festival und dem Future Camp bringt Carls Zukunft Visionaere zusammen.';

/** Key facts displayed on the partner preview page. */
export const CZ_KEY_FACTS = [
  { label: 'Standort', value: 'Leipzig' },
  { label: 'Podcasts', value: '3 Serien' },
  { label: 'Erfahrung', value: '20+ Jahre' },
  { label: 'Fokus', value: 'Zukunftsforschung' },
];

/** IDs of Lernreisen sponsored by Carls Zukunft. */
export const CZ_LERNREISE_IDS = [
  'lr-zukunftswerkstatt',
  'lr-ki-navigator',
  'lr-elephant-festival',
];

/** Summary for the partners listing on the landing page. */
export const CZ_SUMMARY: PartnerSummary = {
  slug: CZ_BRAND.slug!,
  brandName: CZ_BRAND.brandName,
  brandNameShort: CZ_BRAND.brandNameShort,
  tagline: CZ_BRAND.tagline,
  theme: CZ_BRAND.theme,
  sponsorLabel: CZ_BRAND.sponsorLabel,
  lernreisenCount: 3,
};
