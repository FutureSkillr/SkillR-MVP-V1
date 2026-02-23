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

  const euNotice = (
    <div className="flex flex-col items-center gap-1.5 border-t border-white/5 pt-3 mt-2">
      <img
        src="/icons/eu-co-funded-neg.png"
        alt="Kofinanziert von der Europaeischen Union"
        className="h-6 sm:h-8 w-auto"
      />
      <p className="text-[9px] sm:text-[10px] text-slate-500 text-center leading-snug max-w-xl">
        Das Projekt wird im Rahmen des Programms &bdquo;Zukunftsplattform f&uuml;r soziale Innovationen und Modellvorhaben&ldquo; mit einer Zuwendung in H&ouml;he von 95&nbsp;% der zuwendungsf&auml;higen Ausgaben durch die Europ&auml;ische Union kofinanziert.
      </p>
    </div>
  );

  if (variant === 'compact') {
    return (
      <footer className="glass-light px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-2 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
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
          {euNotice}
        </div>
      </footer>
    );
  }

  return (
    <footer className="glass-light py-6 px-4 sm:px-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <img src="/icons/app-icon.png" alt="SkillR" className="w-8 h-8 rounded-lg shadow-lg" />
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
        {euNotice}
      </div>
    </footer>
  );
};
