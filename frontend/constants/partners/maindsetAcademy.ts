import type { BrandConfig } from '../../types/brand';
import type { PartnerSummary } from '../../types/partner';

/** Brand config for maindset.ACADEMY — partner #3. */
export const MA_BRAND: BrandConfig = {
  slug: 'maindset-academy',
  brandName: 'maindset.ACADEMY',
  brandNameShort: 'MA',
  tagline: 'Lerne mit Absicht — jeden Tag ein Stueck weiter',
  universeTitle: 'Das maindset.ACADEMY Universum',
  contactEmail: 'hello@maindset.academy',
  copyrightHolder: 'maindset.ACADEMY',
  logoUrl: '/icons/app-icon.png',
  appIconUrl: '/icons/app-icon.png',
  pageTitle: 'maindset.ACADEMY - Lerne mit Absicht',
  metaDescription:
    'Entdecke KI-gestuetztes Lernen mit maindset.ACADEMY — dein interaktiver Lernbegleiter fuer neue Skills und echtes Wissen.',
  theme: {
    primaryColor: '#0f2b1e',
    accentColor: '#34d399',
  },
  legal: {
    companyName: 'maindset.ACADEMY',
    companyAddress: '',
    companyCountry: 'Deutschland',
    contactEmail: 'hello@maindset.academy',
    contactPhone: '',
    legalRepresentative: '',
    registerEntry: '',
    vatId: '',
    contentResponsible: '',
  },
  aiCoachBrandName: 'maindset Coach',
  sponsorLabel: 'Powered by maindset.ACADEMY',
};

/** Company description for the partner preview page. */
export const MA_PARTNER_DESCRIPTION =
  'maindset.ACADEMY ist eine interaktive Lern- und Gedaechtnisplattform, die KI-gestuetzte Agenten mit taeglichen Lernaufgaben verbindet. ' +
  'Basierend auf deinem aktuellen Wissensstand nimmst du Herausforderungen an und baust gezielt neue Faehigkeiten auf. ' +
  'Die Plattform hoert zu, transkribiert, uebersetzt und verbindet dein Wissen — damit Lernen ein natuerlicher Teil deines Alltags wird.';

/** Key facts displayed on the partner preview page. */
export const MA_KEY_FACTS = [
  { label: 'Fokus', value: 'KI-Lernen' },
  { label: 'Methode', value: 'Daily Tasks' },
  { label: 'KI-Features', value: 'Agenten & TTS' },
  { label: 'Ansatz', value: 'Skill-basiert' },
];

/** IDs of Lernreisen sponsored by maindset.ACADEMY. */
export const MA_LERNREISE_IDS = [
  'lr-lernmaschine',
  'lr-wissen-vernetzen',
  'lr-zukunft-lernen',
];

/** Summary for the partners listing on the landing page. */
export const MA_SUMMARY: PartnerSummary = {
  slug: MA_BRAND.slug!,
  brandName: MA_BRAND.brandName,
  brandNameShort: MA_BRAND.brandNameShort,
  tagline: MA_BRAND.tagline,
  theme: MA_BRAND.theme,
  sponsorLabel: MA_BRAND.sponsorLabel,
  lernreisenCount: 3,
};
