import React, { createContext, useContext, useEffect, useState } from 'react';
import type { BrandConfig } from '../types/brand';
import { DEFAULT_BRAND } from '../constants/defaultBrand';
import { resolveTenantSlug } from '../services/tenant';

interface BrandContextValue {
  brand: BrandConfig;
  isPartner: boolean;
  loading: boolean;
}

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  isPartner: false,
  loading: true,
});

async function fetchLegalConfig(): Promise<Record<string, string>> {
  try {
    const res = await fetch('/api/config/legal');
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return {};
}

async function fetchBrandConfig(slug: string): Promise<BrandConfig | null> {
  try {
    const res = await fetch(`/api/brand/${encodeURIComponent(slug)}`);
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return null;
}

function applyBrandCSS(brand: BrandConfig) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.theme.primaryColor);
  root.style.setProperty('--brand-accent', brand.theme.accentColor);
}

function applyBrandMeta(brand: BrandConfig) {
  document.title = brand.pageTitle;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', brand.metaDescription);
  }
}

function mergeLegalConfig(brand: BrandConfig, legalConfig: Record<string, string>): BrandConfig {
  return {
    ...brand,
    legal: {
      companyName: legalConfig['company_name'] || brand.legal.companyName,
      companyAddress: legalConfig['company_address'] || brand.legal.companyAddress,
      companyCountry: legalConfig['company_country'] || brand.legal.companyCountry,
      contactEmail: legalConfig['contact_email'] || brand.legal.contactEmail,
      contactPhone: legalConfig['contact_phone'] || brand.legal.contactPhone,
      legalRepresentative: legalConfig['legal_representative'] || brand.legal.legalRepresentative,
      registerEntry: legalConfig['register_entry'] || brand.legal.registerEntry,
      vatId: legalConfig['vat_id'] || brand.legal.vatId,
      contentResponsible: legalConfig['content_responsible'] || brand.legal.contentResponsible,
    },
  };
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [isPartner, setIsPartner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const slug = resolveTenantSlug();

      if (slug) {
        // Partner brand: fetch from API
        const partnerBrand = await fetchBrandConfig(slug);
        if (!cancelled && partnerBrand) {
          setBrand(partnerBrand);
          setIsPartner(true);
          applyBrandCSS(partnerBrand);
          applyBrandMeta(partnerBrand);
          setLoading(false);
          return;
        }
      }

      // Default brand: merge legal config from existing API
      const legalConfig = await fetchLegalConfig();
      if (!cancelled) {
        const merged = mergeLegalConfig(DEFAULT_BRAND, legalConfig);
        setBrand(merged);
        applyBrandCSS(merged);
        applyBrandMeta(merged);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <BrandContext.Provider value={{ brand, isPartner, loading }}>
      {children}
    </BrandContext.Provider>
  );
};

export function useBrand(): BrandContextValue {
  return useContext(BrandContext);
}
