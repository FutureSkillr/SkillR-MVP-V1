import type { BrandConfig } from '../../types/brand';
import type { PartnerSummary } from '../../types/partner';

/** Brand config for Space Service International — partner #1. */
export const SSI_BRAND: BrandConfig = {
  slug: 'space-service-intl',
  brandName: 'Space Service International',
  brandNameShort: 'SSI',
  tagline: 'Abenteuer Weltraum erleben',
  universeTitle: 'Das SSI Weltraum-Universum',
  contactEmail: 'info@space-service-intl.com',
  copyrightHolder: 'Space Service International',
  logoUrl: '/icons/app-icon.png',
  appIconUrl: '/icons/app-icon.png',
  pageTitle: 'Space Service International - Abenteuer Weltraum',
  metaDescription:
    'Entdecke die Raumfahrtgeschichte mit Space Service International — Kosmonautentraining, Gagarin und die Zukunft im All.',
  theme: {
    primaryColor: '#1e3a5f',
    accentColor: '#4fc3f7',
  },
  legal: {
    companyName: 'Space Service International',
    companyAddress: 'Rochlitzer Str. 62, 09648 Mittweida',
    companyCountry: 'Deutschland',
    contactEmail: 'info@space-service-intl.com',
    contactPhone: '+49 3727 90811',
    legalRepresentative: 'Tasillo Roemisch',
    registerEntry: '',
    vatId: '',
    contentResponsible: 'Tasillo Roemisch',
  },
  aiCoachBrandName: 'SSI Explorer',
  sponsorLabel: 'Powered by Space Service International',
};

/** Company description for the partner preview page. */
export const SSI_PARTNER_DESCRIPTION =
  'Space Service International in Mittweida (Sachsen) betreibt eines der bedeutendsten privaten Raumfahrtmuseen Europas. ' +
  'Mit 152 Ausstellungen, ueber 100.000 Objekten und mehr als 20 Millionen Besuchern weltweit bewahrt das Museum die Geschichte ' +
  'der Raumfahrt — von den Anfaengen der sowjetischen Kosmonautik bis zur Zukunft bemannter Mars-Missionen. ' +
  '2024 wurde Space Service International mit dem Silbernen Meridian ausgezeichnet.';

/** Key facts displayed on the partner preview page. */
export const SSI_KEY_FACTS = [
  { label: 'Ausstellungen', value: '152' },
  { label: 'Objekte', value: '100.000+' },
  { label: 'Besucher weltweit', value: '20 Mio+' },
  { label: 'Auszeichnung 2024', value: 'Silberner Meridian' },
];

/** Summary for the partners listing on the landing page. */
export const SSI_SUMMARY: PartnerSummary = {
  slug: SSI_BRAND.slug!,
  brandName: SSI_BRAND.brandName,
  brandNameShort: SSI_BRAND.brandNameShort,
  tagline: SSI_BRAND.tagline,
  theme: SSI_BRAND.theme,
  sponsorLabel: SSI_BRAND.sponsorLabel,
  lernreisenCount: 3,
};

/** IDs of Lernreisen sponsored by SSI. */
export const SSI_LERNREISE_IDS = [
  'lr-kosmonautentraining',
  'lr-gagarins-spuren',
  'lr-mission-mars',
];
