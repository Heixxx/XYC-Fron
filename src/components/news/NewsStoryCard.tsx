import { motion } from 'framer-motion';
import type { NewsArticle } from '@/lib/api';

interface NewsStoryCardProps {
  article: NewsArticle;
  index: number;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Macro: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  Technical: { bg: 'rgba(139,92,246,0.12)', text: '#8B5CF6' },
  Fundamental: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  Geopolitical: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
};

const impactConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'var(--accent-red)', label: 'High Impact' },
  medium: { color: 'var(--accent-orange)', label: 'Medium Impact' },
  low: { color: 'var(--text-muted)', label: 'Low Impact' },
};

export default function NewsStoryCard({ article, index }: NewsStoryCardProps) {
  const catStyle = categoryColors[article.category] || categoryColors.Macro;
  const impStyle = impactConfig[article.impact] || impactConfig.medium;
  const sentimentColor =
    article.sentiment === 'positive'
      ? 'var(--accent-green)'
      : article.sentiment === 'negative'
      ? 'var(--accent-red)'
      : 'var(--text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="rounded-lg overflow-hidden group cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Category-colored top bar */}
      <div className="h-1" style={{ backgroundColor: catStyle.text }} />

      <div className="p-4">
        {/* Category + Impact badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
          >
            {article.category}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${impStyle.color}15`, color: impStyle.color }}
          >
            {impStyle.label}
          </span>
          <span
            className="w-2 h-2 rounded-full ml-auto"
            style={{ backgroundColor: sentimentColor }}
          />
        </div>

        {/* Headline */}
        <h3
          className="text-base font-semibold leading-snug mb-2 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {article.headline}
        </h3>

        {/* Summary */}
        <p
          className="text-sm leading-relaxed line-clamp-3 mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          {article.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {article.source}
          </span>
          <span className="text-xs data-font" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date(article.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'UTC',
            })}{' '}
            UTC
          </span>
        </div>
      </div>
    </motion.div>
  );
}
