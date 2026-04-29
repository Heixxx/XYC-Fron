import { memo } from 'react';
import type { Signal } from '@/hooks/useSignals';

interface SignalStreamBannerProps {
  signals: Signal[];
}

const SignalStreamBanner = memo(function SignalStreamBanner({ signals }: SignalStreamBannerProps) {
  const items = signals.slice(0, 6).map((s) => ({
    text: `${s.instrument} — ${s.direction} SIGNAL — Confidence: ${s.confidence}% — ${s.layers.filter(Boolean).length}/5 Layers Confirmed`,
    color: s.direction === 'BUY' ? '#00E396' : '#FF4560',
  }));

  // Duplicate for seamless marquee
  const allItems = [...items, ...items];

  return (
    <div
      className="w-full h-14 flex items-center overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '2px solid var(--accent-gold)',
      }}
    >
      {/* Live badge */}
      <div className="shrink-0 flex items-center gap-2 px-4 h-full" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--accent-red)' }} />
        <span className="text-xs font-bold" style={{ color: 'var(--accent-red)' }}>LIVE</span>
      </div>

      {/* Marquee */}
      <div className="marquee-container flex-1">
        <div className="marquee-content">
          {allItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 shrink-0">
              <span style={{ color: 'var(--accent-gold)' }}>&#9670;</span>
              <span className="text-sm whitespace-nowrap" style={{ color: item.color }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default SignalStreamBanner;
