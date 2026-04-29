import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ExecutiveSummaryProps {
  summary: string;
  sentimentScore: number;
  sentimentLabel: string;
}

export default function ExecutiveSummary({ summary, sentimentScore, sentimentLabel }: ExecutiveSummaryProps) {
  const { t } = useTranslation();
  const sentimentColor =
    sentimentScore > 55 ? 'var(--accent-green)' : sentimentScore < 45 ? 'var(--accent-red)' : 'var(--text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="rounded-lg p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '3px solid var(--accent-gold)',
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--accent-gold)' }}
      >
        {t('news.executiveSummary')}
      </span>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: 'var(--text-primary)' }}
      >
        {summary}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sentimentScore}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="h-full rounded-full"
            style={{
              backgroundColor: sentimentColor,
              marginLeft: sentimentScore < 50 ? 'auto' : undefined,
              marginRight: sentimentScore < 50 ? undefined : undefined,
            }}
          />
        </div>
        <span
          className="text-xs font-semibold data-font"
          style={{ color: sentimentColor, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sentimentLabel} ({sentimentScore}%)
        </span>
      </div>
    </motion.div>
  );
}
