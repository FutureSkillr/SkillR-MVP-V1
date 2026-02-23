import React from 'react';
import type { CoachPersona } from '../../types/intro';

interface CoachAvatarProps {
  coach: CoachPersona;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { outer: 'w-24 h-24', inner: 'w-[88px] h-[88px]', ring: 4 },
  md: { outer: 'w-32 h-32', inner: 'w-[120px] h-[120px]', ring: 5 },
  lg: { outer: 'w-40 h-40', inner: 'w-[152px] h-[152px]', ring: 6 },
};

/** Susi — young woman, short curly hair with paint streaks, big warm smile */
const FaceSusi: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hair */}
    <ellipse cx="60" cy="38" rx="32" ry="28" fill={color} opacity="0.25" />
    <path d="M30 45c-2-15 8-30 30-32s32 15 30 30" stroke={color} strokeWidth="3" fill="none" opacity="0.4" />
    {/* Curly hair strands */}
    <circle cx="35" cy="35" r="6" fill={color} opacity="0.3" />
    <circle cx="42" cy="26" r="7" fill={color} opacity="0.25" />
    <circle cx="55" cy="22" r="6" fill={color} opacity="0.3" />
    <circle cx="68" cy="24" r="7" fill={color} opacity="0.25" />
    <circle cx="78" cy="30" r="6" fill={color} opacity="0.3" />
    <circle cx="83" cy="40" r="5" fill={color} opacity="0.25" />
    {/* Face */}
    <ellipse cx="60" cy="58" rx="24" ry="27" fill="#fcd9b8" />
    {/* Eyes — happy, slightly closed */}
    <path d="M48 54c0-2.5 2-4.5 4.5-4.5S57 51.5 57 54" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M63 54c0-2.5 2-4.5 4.5-4.5S72 51.5 72 54" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Blush */}
    <circle cx="45" cy="60" r="4" fill="#f9a8c9" opacity="0.4" />
    <circle cx="75" cy="60" r="4" fill="#f9a8c9" opacity="0.4" />
    {/* Big smile */}
    <path d="M49 64c3 6 10 8 17 5.5" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Paint streak on cheek */}
    <path d="M76 52l5-3" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M78 56l4 1" stroke="#eab308" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    {/* Neck */}
    <rect x="53" y="82" width="14" height="10" rx="5" fill="#fcd9b8" />
    {/* Shoulders */}
    <path d="M35 100c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="3" fill={color} opacity="0.2" />
  </svg>
);

/** Karlshains — young guy, short hair, round glasses, friendly grin */
const FaceKarlshains: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hair — short, neat */}
    <path d="M36 42c0-16 10-26 24-26s24 10 24 26" fill={color} opacity="0.25" />
    <path d="M34 44c0-18 11-30 26-30s26 12 26 30" stroke={color} strokeWidth="2.5" fill="none" opacity="0.35" />
    {/* Face */}
    <ellipse cx="60" cy="58" rx="24" ry="27" fill="#f5d0a9" />
    {/* Glasses — round */}
    <circle cx="50" cy="53" r="8" stroke="#6b5b4f" strokeWidth="2" fill="none" />
    <circle cx="70" cy="53" r="8" stroke="#6b5b4f" strokeWidth="2" fill="none" />
    <line x1="58" y1="53" x2="62" y2="53" stroke="#6b5b4f" strokeWidth="2" />
    <line x1="42" y1="51" x2="36" y2="48" stroke="#6b5b4f" strokeWidth="1.5" />
    <line x1="78" y1="51" x2="84" y2="48" stroke="#6b5b4f" strokeWidth="1.5" />
    {/* Eyes behind glasses */}
    <circle cx="50" cy="53" r="2" fill="#4a3728" />
    <circle cx="70" cy="53" r="2" fill="#4a3728" />
    <circle cx="50.8" cy="52.2" r="0.7" fill="white" />
    <circle cx="70.8" cy="52.2" r="0.7" fill="white" />
    {/* Friendly grin */}
    <path d="M50 66c4 4 12 4 16 0" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Eyebrows — slightly raised */}
    <path d="M44 44c2-2 6-2 8 0" stroke="#6b5030" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M64 44c2-2 6-2 8 0" stroke="#6b5030" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Neck */}
    <rect x="53" y="82" width="14" height="10" rx="5" fill="#f5d0a9" />
    {/* Shoulders + work shirt */}
    <path d="M35 100c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="3" fill={color} opacity="0.2" />
  </svg>
);

/** Rene — surfer, wavy longer hair, relaxed half-smile, tan */
const FaceRene: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hair — wavy, longer */}
    <path d="M32 50c-2-20 10-35 28-35s30 15 28 35" fill={color} opacity="0.2" />
    <path d="M30 48c2-8 4-14 10-20s14-10 20-10 14 4 20 10 8 12 10 20" stroke={color} strokeWidth="2.5" fill="none" opacity="0.35" />
    {/* Wavy strands */}
    <path d="M32 48c-3 5-5 12-4 18" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />
    <path d="M88 48c3 5 5 12 4 18" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />
    <path d="M35 38c-4 3-6 8-5 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
    {/* Face — slightly tan */}
    <ellipse cx="60" cy="58" rx="24" ry="27" fill="#e8c49a" />
    {/* Eyes — relaxed, slightly squinting */}
    <path d="M46 53c1.5-1.5 4-2 6 0" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M66 53c1.5-1.5 4-2 6 0" stroke="#4a3728" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Chill half-smile */}
    <path d="M50 65c5 4 13 3 17-1" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Eyebrows — relaxed */}
    <path d="M45 47c3-2 6-1 8 0" stroke="#8b7355" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M65 47c3-2 6-1 8 0" stroke="#8b7355" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Neck */}
    <rect x="53" y="82" width="14" height="10" rx="5" fill="#e8c49a" />
    {/* Shoulders — hoodie/wetsuit */}
    <path d="M35 100c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="3" fill={color} opacity="0.2" />
  </svg>
);

/** Heiko — beanie, wide grin, expressive eyebrows */
const FaceHeiko: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Beanie */}
    <path d="M34 46c0-18 11-28 26-28s26 10 26 28" fill={color} opacity="0.3" />
    <rect x="33" y="40" width="54" height="8" rx="4" fill={color} opacity="0.4" />
    <line x1="45" y1="24" x2="44" y2="40" stroke={color} strokeWidth="1.5" opacity="0.2" />
    <line x1="60" y1="20" x2="60" y2="40" stroke={color} strokeWidth="1.5" opacity="0.2" />
    <line x1="75" y1="24" x2="76" y2="40" stroke={color} strokeWidth="1.5" opacity="0.2" />
    {/* Face */}
    <ellipse cx="60" cy="60" rx="24" ry="26" fill="#fcd9b8" />
    {/* Eyes — open, lively */}
    <ellipse cx="50" cy="55" rx="3" ry="3.5" fill="white" />
    <ellipse cx="70" cy="55" rx="3" ry="3.5" fill="white" />
    <circle cx="50.5" cy="55.5" r="2" fill="#4a3728" />
    <circle cx="70.5" cy="55.5" r="2" fill="#4a3728" />
    <circle cx="51.2" cy="54.5" r="0.7" fill="white" />
    <circle cx="71.2" cy="54.5" r="0.7" fill="white" />
    {/* Wide grin — showing teeth */}
    <path d="M47 66c5 6 16 6 22 0" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M50 66h16v1c0 2-3.5 4-8 4s-8-2-8-4v-1z" fill="white" opacity="0.8" />
    {/* Expressive eyebrows */}
    <path d="M43 47c2-3 7-3 10-1" stroke="#5a4030" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M63 47c2-3 7-3 10-1" stroke="#5a4030" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Neck */}
    <rect x="53" y="83" width="14" height="10" rx="5" fill="#fcd9b8" />
    {/* Shoulders — hoodie */}
    <path d="M35 102c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="3" fill={color} opacity="0.2" />
  </svg>
);

/** Andreas — outdoorsy, stubble hint, warm eyes, maybe a little hat */
const FaceAndreas: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hat brim */}
    <ellipse cx="60" cy="36" rx="34" ry="6" fill={color} opacity="0.3" />
    {/* Hat dome */}
    <path d="M38 36c0-14 9-22 22-22s22 8 22 22" fill={color} opacity="0.25" />
    <path d="M37 36c0-15 10-24 23-24s23 9 23 24" stroke={color} strokeWidth="2" fill="none" opacity="0.35" />
    {/* Face */}
    <ellipse cx="60" cy="60" rx="24" ry="27" fill="#f0c9a0" />
    {/* Eyes — warm, friendly */}
    <ellipse cx="50" cy="55" rx="2.5" ry="3" fill="white" />
    <ellipse cx="70" cy="55" rx="2.5" ry="3" fill="white" />
    <circle cx="50.3" cy="55.5" r="1.8" fill="#5a7a3a" />
    <circle cx="70.3" cy="55.5" r="1.8" fill="#5a7a3a" />
    <circle cx="50.8" cy="54.8" r="0.6" fill="white" />
    <circle cx="70.8" cy="54.8" r="0.6" fill="white" />
    {/* Smile — open, happy */}
    <path d="M49 65c4 5 14 5 18 0" stroke="#5a4030" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Eyebrows — natural */}
    <path d="M44 48c3-2 6-2 9 0" stroke="#7a6040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M64 48c3-2 6-2 9 0" stroke="#7a6040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Light stubble dots */}
    <circle cx="48" cy="72" r="0.5" fill="#c0a080" opacity="0.4" />
    <circle cx="52" cy="74" r="0.5" fill="#c0a080" opacity="0.4" />
    <circle cx="56" cy="73" r="0.5" fill="#c0a080" opacity="0.4" />
    <circle cx="64" cy="73" r="0.5" fill="#c0a080" opacity="0.4" />
    <circle cx="68" cy="74" r="0.5" fill="#c0a080" opacity="0.4" />
    <circle cx="72" cy="72" r="0.5" fill="#c0a080" opacity="0.4" />
    {/* Neck */}
    <rect x="53" y="84" width="14" height="10" rx="5" fill="#f0c9a0" />
    {/* Shoulders — outdoor jacket */}
    <path d="M35 102c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="3" fill={color} opacity="0.2" />
  </svg>
);

/** Cloudia — digital/geometric face, circuit-like lines, glowing eyes */
const FaceCloudia: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Digital hair — geometric lines */}
    <path d="M36 48c-1-18 10-32 24-32s25 14 24 32" fill={color} opacity="0.15" />
    <path d="M38 30l4 16" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M48 22l2 20" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M60 18v24" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M72 22l-2 20" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M82 30l-4 16" stroke={color} strokeWidth="1.5" opacity="0.3" />
    {/* Face — slightly geometric */}
    <path d="M36 58c0-14 10-26 24-26s24 12 24 26c0 15-10 27-24 27S36 73 36 58z" fill="#e0d4f0" />
    {/* Circuit pattern on cheeks */}
    <path d="M40 55h5l2 3h3" stroke={color} strokeWidth="1" opacity="0.2" />
    <path d="M80 55h-5l-2 3h-3" stroke={color} strokeWidth="1" opacity="0.2" />
    {/* Glowing eyes */}
    <rect x="46" y="51" width="8" height="6" rx="2" fill={color} opacity="0.3" />
    <rect x="66" y="51" width="8" height="6" rx="2" fill={color} opacity="0.3" />
    <circle cx="50" cy="54" r="2.5" fill={color} opacity="0.7" />
    <circle cx="70" cy="54" r="2.5" fill={color} opacity="0.7" />
    <circle cx="50" cy="54" r="1.2" fill="white" />
    <circle cx="70" cy="54" r="1.2" fill="white" />
    {/* Friendly smile */}
    <path d="M50 66c4 4 12 4 16 0" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
    {/* Data point on forehead */}
    <circle cx="60" cy="42" r="2" fill={color} opacity="0.4" />
    <circle cx="60" cy="42" r="1" fill={color} opacity="0.7" />
    {/* Neck */}
    <rect x="53" y="82" width="14" height="10" rx="5" fill="#e0d4f0" />
    {/* Shoulders — digital */}
    <path d="M35 100c5-8 15-12 25-12s20 4 25 12" stroke={color} strokeWidth="2" fill={color} opacity="0.15" strokeDasharray="4 3" />
  </svg>
);

const FACE_COMPONENTS: Record<string, React.FC<{ color: string }>> = {
  susi: FaceSusi,
  karlshains: FaceKarlshains,
  rene: FaceRene,
  heiko: FaceHeiko,
  andreas: FaceAndreas,
  cloudia: FaceCloudia,
};

export const CoachAvatar: React.FC<CoachAvatarProps> = ({ coach, size = 'md' }) => {
  const s = SIZES[size];
  const FaceComponent = FACE_COMPONENTS[coach.id] || FaceSusi;
  const [photoError, setPhotoError] = React.useState(false);

  const usePhoto = !!coach.photoUrl && !photoError;

  return (
    <div
      className={`${s.outer} rounded-full shrink-0`}
      style={{
        padding: `${s.ring}px`,
        background: `linear-gradient(135deg, ${coach.color}, ${coach.colorEnd})`,
      }}
    >
      <div
        className={`${s.inner} rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden`}
      >
        {usePhoto ? (
          <img
            src={coach.photoUrl}
            alt={coach.name}
            className="w-full h-full object-cover rounded-full"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <FaceComponent color={coach.color} />
        )}
      </div>
    </div>
  );
};
