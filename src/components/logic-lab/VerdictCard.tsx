import { Scale, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VerdictCardProps {
  verdict: string;
  probability: number;
  showRaw: boolean;
  setShowRaw: (v: boolean) => void;
}

export default function VerdictCard({ verdict, probability, showRaw, setShowRaw }: VerdictCardProps) {
  const { t } = useTranslation();
  if (!verdict) return null;

  // Extract verdict direction
  const lower = verdict.toLowerCase();
  let direction = 'Neutral';
  let dirColor = 'var(--text-muted)';
  if (lower.includes('bullish') || lower.includes('confirm') || lower.includes('buy')) {
    direction = t('common.bullish');
    dirColor = 'var(--accent-green)';
  } else if (lower.includes('bearish') || lower.includes('reject') || lower.includes('sell')) {
    direction = t('common.bearish');
    dirColor = 'var(--accent-red)';
  }

  // Extract probability from text if available
  const probMatch = verdict.match(/(\d+)%/);
  const prob = probability || (probMatch ? parseInt(probMatch[1], 10) : 50);

  // Short summary (first sentence)
  const summary = verdict.split('.')[0] + '.';

  return (
    <div
      className="rounded-[10px] p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-gold)',
        boxShadow: '0 0 20px rgba(240,185,11,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Scale size={20} style={{ color: 'var(--accent-gold)' }} />
        <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
          Final Verdict
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <span
          className="px-4 py-1.5 rounded-full text-sm font-bold"
          style={{
            backgroundColor: `${dirColor}20`,
            color: dirColor,
          }}
        >
          {direction}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Confidence</span>
            <span className="text-xs font-bold data-font" style={{ color: 'var(--accent-gold)' }}>{prob}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${prob}%`,
                backgroundColor: prob > 60 ? 'var(--accent-green)' : prob > 40 ? 'var(--accent-gold)' : 'var(--accent-red)',
                transition: 'width 0.6s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {summary}
      </p>

      <button
        onClick={() => setShowRaw(!showRaw)}
        className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
      >
        <FileText size={12} />
        {showRaw ? t('logicLab.verdict.hideReasoning') : t('logicLab.verdict.viewReasoning')}
      </button>

      {showRaw && (
        <pre
          className="mt-2 text-xs p-3 rounded-lg overflow-auto max-h-[200px]"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {verdict}
        </pre>
      )}
    </div>
  );
}
