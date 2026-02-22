import React, { useState } from 'react';
import { bookEmailSlot } from '../../services/capacity';

interface EmailBookingFormProps {
  ticketId: string;
}

export const EmailBookingForm: React.FC<EmailBookingFormProps> = ({ ticketId }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;

    setStatus('loading');
    const result = await bookEmailSlot(email, ticketId);
    if (result.booked) {
      setStatus('success');
      if (result.scheduledSlotUtc) {
        const date = new Date(result.scheduledSlotUtc);
        setScheduledTime(date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      }
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center space-y-2">
        <p className="text-emerald-400 font-medium text-sm">Termin gebucht!</p>
        {scheduledTime && (
          <p className="text-xs text-slate-400">
            Wir benachrichtigen dich um {scheduledTime} Uhr, wenn ein Platz frei ist.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-slate-400">
        Oder lass dich benachrichtigen, wenn ein Platz frei wird:
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors min-h-[44px]"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors min-h-[44px]"
        >
          {status === 'loading' ? '...' : 'Erinnern'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400">Etwas ist schiefgelaufen. Versuch es nochmal.</p>
      )}
    </form>
  );
};
