import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Signal } from '@/hooks/useSignals';
import ConfidenceRing from './ConfidenceRing';
import VitalityBar from './VitalityBar';

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -8;
    const rotateY = (x - 0.5) * 8;
    cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotate-x', '0deg');
    cardRef.current.style.setProperty('--rotate-y', '0deg');
  }, []);

  const borderColor = signal.direction === 'BUY'
    ? 'rgba(0,227,150,0.3)'
    : signal.direction === 'SELL'
      ? 'rgba(255,69,96,0.3)'
      : 'var(--border-subtle)';
  const leftBorderColor = signal.direction === 'BUY'
    ? 'var(--chart-bullish)'
    : signal.direction === 'SELL'
      ? 'var(--chart-bearish)'
      : 'var(--border-subtle)';
  const directionColor = signal.direction === 'BUY'
    ? 'var(--accent-green)'
    : signal.direction === 'SELL'
      ? 'var(--accent-red)'
      : 'var(--text-muted)';
  const targetColor = signal.direction === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)';
  const stopColor = signal.direction === 'BUY' ? 'var(--accent-red)' : 'var(--accent-green)';

  const age = Math.round((Date.now() - signal.timestamp) / 1000 / 60);
  const ageLabel = age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;

  return (
    <div
      ref={cardRef}
      className="card-3d"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="card-3d-inner rounded-[10px] p-4 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-card)',
          border: `1px solid ${borderColor}`,
          borderLeft: `3px solid ${leftBorderColor}`,
          opacity: signal.status === 'expired' ? 0.5 : 1,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div
              className="text-lg font-semibold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {signal.instrument}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {ageLabel}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {signal.tier === 'PRO' && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                ⭐ PRO
              </span>
            )}
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${directionColor}20`,
                color: directionColor,
                border: `1px solid ${directionColor}40`,
              }}
            >
              {signal.direction}
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Entry</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {signal.entry.toFixed(signal.category === 'CRYPTO' && signal.entry < 10 ? 4 : signal.entry < 100 ? 4 : 2)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Target</div>
            <div className="text-sm font-medium" style={{ color: targetColor }}>
              {signal.target.toFixed(signal.category === 'CRYPTO' && signal.target < 10 ? 4 : signal.target < 100 ? 4 : 2)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Stop</div>
            <div className="text-sm font-medium" style={{ color: stopColor }}>
              {signal.stop.toFixed(signal.category === 'CRYPTO' && signal.stop < 10 ? 4 : signal.stop < 100 ? 4 : 2)}
            </div>
          </div>
        </div>

        {/* Confidence + Vitality */}
        <div className="flex items-center gap-3 mb-3">
          <ConfidenceRing value={signal.confidence} />
          <div className="flex-1">
            <VitalityBar value={signal.vitality} />
          </div>
        </div>

        {/* 5-Layer Consensus */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Consensus:</span>
          {['L0', 'L1', 'L2', 'L3', 'L4'].map((layer, i) => (
            <div key={layer} className="relative group">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: signal.layers[i]
                    ? 'rgba(0,227,150,0.2)'
                    : signal.layerConfidences[i] > 0
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${signal.layers[i] ? 'rgba(0,227,150,0.4)' : signal.layerConfidences[i] > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: signal.layers[i]
                      ? '#00E396'
                      : signal.layerConfidences[i] > 0
                        ? '#EF4444'
                        : '#6B7280',
                  }}
                />
              </div>
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {t('signals.' + layer.toLowerCase().replace(' ', ''))}: {signal.layerConfidences[i] > 0 ? `${signal.layerConfidences[i]}%` : t('signals.pending')}
              </div>
            </div>
          ))}
        </div>

        {/* Spread info */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Spread: {signal.spread.toFixed(signal.category === 'FOREX' ? 5 : 2)}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            #{signal.id}
          </span>
        </div>

        {/* Status overlay for expired */}
        {signal.status === 'expired' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[10px]">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-600">
              EXPIRED
            </span>
          </div>
        )}
        {/* Council Insights (forex council-validated only) */}
        {signal.thesis && (
          <details className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              Council Insights
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thesis:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{signal.thesis}</span>
              </div>
              {signal.mainRisk && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Main risk:</span>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>{signal.mainRisk}</span>
                </div>
              )}
              {signal.takeProfits && signal.stop !== undefined && signal.entry !== undefined && (
                <div className="space-y-1 mt-2 pt-2 border-t"
                     style={{ borderColor: 'var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    Scaled-out exit (33% / 33% / 34%):
                  </div>
                  {signal.takeProfits.map((tp, i) => {
                    const r = signal.stop !== undefined && signal.entry !== undefined
                      ? Math.abs((tp - signal.entry) / (signal.entry - signal.stop))
                      : 0;
                    return (
                      <div key={i} className="flex justify-between" style={{
                        color: 'var(--text-primary)'
                      }}>
                        <span>TP{i + 1}: {tp.toFixed(5)}</span>
                        <span style={{ color: 'var(--accent-green)' }}>
                          {r.toFixed(2)}R
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {signal.positionSizePct !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Size:</span>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>
                    {signal.positionSizePct}%
                    {signal.riskRewardTp1 && ` · RR ${signal.riskRewardTp1.toFixed(2)}:1`}
                  </span>
                </div>
              )}
              {signal.expectedHoldMinutes !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Expected hold:</span>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>
                    {signal.expectedHoldMinutes < 60
                      ? `${signal.expectedHoldMinutes}min`
                      : `${Math.floor(signal.expectedHoldMinutes / 60)}h ${signal.expectedHoldMinutes % 60}min`}
                  </span>
                </div>
              )}
              {signal.managementPlan && (
                <div className="mt-2 pt-2 border-t"
                     style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Management plan:</span>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>{signal.managementPlan}</span>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
