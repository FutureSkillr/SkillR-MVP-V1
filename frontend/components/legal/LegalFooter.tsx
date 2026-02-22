import React from 'react';
import { useBrand } from '../../contexts/BrandContext';

interface LegalFooterProps {
  onNavigate: (page: 'datenschutz' | 'impressum') => void;
  onOpenCookieSettings: () => void;
  variant?: 'full' | 'compact';
}

export const LegalFooter: React.FC<LegalFooterProps> = ({
  onNavigate,
  onOpenCookieSettings,
  variant = 'full',
}) => {
  const { brand, isPartner } = useBrand();

  const linkClass =
    'hover:text-white transition-colors cursor-pointer';

  const touchLinkClass = `${linkClass} min-h-[44px] inline-flex items-center`;

  const sponsorLine = isPartner && brand.sponsorLabel ? (
    <span className="block text-slate-600 mt-0.5">{brand.sponsorLabel}</span>
  ) : null;

  if (variant === 'compact') {
    return (
      <footer className="glass-light px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            &copy; {new Date().getFullYear()} {brand.copyrightHolder}
            {sponsorLine}
          </span>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate('impressum')} className={touchLinkClass}>
              Impressum
            </button>
            <button onClick={() => onNavigate('datenschutz')} className={touchLinkClass}>
              Datenschutz
            </button>
            <button onClick={onOpenCookieSettings} className={touchLinkClass}>
              Cookie-Einstellungen
            </button>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="glass-light py-6 px-4 sm:px-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-blue rounded-lg flex items-center justify-center font-bold text-xs shadow-lg">
            S
          </div>
          <span>
            &copy; {new Date().getFullYear()} {brand.copyrightHolder}
            {sponsorLine}
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <button onClick={() => onNavigate('impressum')} className={touchLinkClass}>
            Impressum
          </button>
          <button onClick={() => onNavigate('datenschutz')} className={touchLinkClass}>
            Datenschutz
          </button>
          <button onClick={onOpenCookieSettings} className={touchLinkClass}>
            Cookie-Einstellungen
          </button>
        </div>
      </div>
    </footer>
  );
};
