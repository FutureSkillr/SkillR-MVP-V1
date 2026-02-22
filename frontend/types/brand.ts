export interface BrandLegal {
  companyName: string;
  companyAddress: string;
  companyCountry: string;
  contactEmail: string;
  contactPhone: string;
  legalRepresentative: string;
  registerEntry: string;
  vatId: string;
  contentResponsible: string;
}

export interface BrandTheme {
  primaryColor: string;
  accentColor: string;
}

export interface BrandConfig {
  slug: string | null;
  brandName: string;
  brandNameShort: string;
  tagline: string;
  universeTitle: string;
  contactEmail: string;
  copyrightHolder: string;
  logoUrl: string;
  appIconUrl: string;
  pageTitle: string;
  metaDescription: string;
  theme: BrandTheme;
  legal: BrandLegal;
  aiCoachBrandName: string;
  sponsorLabel: string | null;
}
