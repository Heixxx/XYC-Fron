import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EditionType } from '@/hooks/useNews';
import { getTimeUntilEdition } from '@/hooks/useNews';

interface CountdownTimerProps {
  nextEdition: EditionType;
}

export default function CountdownTimer({ nextEdition }: CountdownTimerProps) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(getTimeUntilEdition(nextEdition));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeUntilEdition(nextEdition));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEdition]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
      <Clock size={13} />
      <span>{t('news.countdown')}</span>
      <span className="data-font font-semibold tabular-nums" style={{ color: 'var(--accent-gold)', fontFamily: "'JetBrains Mono', monospace" }}>
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
