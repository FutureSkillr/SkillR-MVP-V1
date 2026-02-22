import React, { useEffect, useState } from 'react';

interface XPPopupProps {
  amount: number;
  onDone: () => void;
}

export const XPPopup: React.FC<XPPopupProps> = ({ amount, onDone }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (amount === 0) return null;

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg shadow-yellow-500/20 border border-yellow-500/30">
        <span className="text-yellow-400 font-bold text-sm">+{amount} XP</span>
      </div>
    </div>
  );
};
