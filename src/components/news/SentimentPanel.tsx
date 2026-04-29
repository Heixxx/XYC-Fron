import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface SentimentPanelProps {
  score: number;
  label: string;
  pairScores: Record<string, number>;
}

export default function SentimentPanel({ score, label, pairScores }: SentimentPanelProps) {
  const sentimentColor = score > 55 ? 'var(--accent-green)' : score < 45 ? 'var(--accent-red)' : 'var(--text-muted)';
  const pairs = Object.entries(pairScores).length > 0
    ? Object.entries(pairScores)
    : [['EUR/USD', 45], ['GBP/USD', 48], ['USD/JPY', 52], ['AUD/USD', 42], ['USD/CHF', 55]];

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-gold)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} style={{ color: 'var(--accent-purple)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Sentiment Analysis
        </h3>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto uppercase"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}
        >
          AI
        </span>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="text-4xl font-bold data-font"
          style={{ color: sentimentColor, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {score}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
            Overall Score
          </div>
          <div className="text-sm font-medium capitalize" style={{ color: sentimentColor }}>
            {label}
          </div>
        </div>
      </div>

      {/* Pair Sentiment Bars */}
      <div className="space-y-3">
        {pairs.map(([pair, s], index) => {
          const val = typeof s === 'number' ? s : 50;
          const color = val > 55 ? 'var(--accent-green)' : val < 45 ? 'var(--accent-red)' : 'var(--text-muted)';
          return (
            <div key={pair}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {pair}
                </span>
                <span
                  className="text-xs data-font"
                  style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {val}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
