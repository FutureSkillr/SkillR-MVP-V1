import React, { useState } from 'react';

interface ShareMenuProps {
  portfolioUrl: string;
  displayName: string;
}

const SHARE_CHANNELS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    getUrl: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '💼',
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'email',
    label: 'E-Mail',
    icon: '📧',
    getUrl: (url: string, text: string) =>
      `mailto:?subject=${encodeURIComponent('Mein SkillR Portfolio')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
] as const;

export const ShareMenu: React.FC<ShareMenuProps> = ({ portfolioUrl, displayName }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `Schau dir mein SkillR Portfolio an: ${displayName}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = portfolioUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="glass px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2"
      >
        Teilen
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl border border-slate-700/50 shadow-xl z-50 py-2">
          {SHARE_CHANNELS.map((channel) => (
            <a
              key={channel.id}
              href={channel.getUrl(portfolioUrl, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <span>{channel.icon}</span>
              <span>{channel.label}</span>
            </a>
          ))}
          <button
            onClick={() => {
              handleCopyLink();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>{copied ? '✅' : '🔗'}</span>
            <span>{copied ? 'Kopiert!' : 'Link kopieren'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
