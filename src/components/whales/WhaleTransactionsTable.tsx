import { motion } from 'framer-motion';
import type { WhaleFlow } from '@/hooks/useWhales';

interface WhaleTransactionsTableProps {
  flows: WhaleFlow[];
  filter: string;
}

export default function WhaleTransactionsTable({ flows, filter }: WhaleTransactionsTableProps) {
  const filtered = flows.filter((f) => {
    if (filter === 'inflows') return f.dir === 'BUY';
    if (filter === 'outflows') return f.dir === 'SELL';
    if (filter === 'large') return f.vol >= 1e9;
    return true;
  });

  const formatVol = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return `${(v / 1e3).toFixed(0)}K`;
  };

  const formatPrice = () => {
    return (30000 + Math.random() * 40000).toFixed(0);
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Header */}
      <div
        className="grid grid-cols-[80px_1fr_70px_1fr_1fr_1fr] gap-2 px-4 py-3 text-[10px] uppercase font-semibold border-b"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
      >
        <span>Time</span>
        <span>Instrument</span>
        <span className="text-center">Type</span>
        <span className="text-right">Size</span>
        <span className="text-right">Price</span>
        <span className="text-right">Value (USD)</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
        {filtered.length === 0 && flows.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="shimmer-skeleton rounded h-3" />
              <div className="shimmer-skeleton rounded h-3" />
              <div className="shimmer-skeleton rounded h-3" />
              <div className="shimmer-skeleton rounded h-3" />
              <div className="shimmer-skeleton rounded h-3" />
              <div className="shimmer-skeleton rounded h-3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No transactions match the selected filter.
          </div>
        ) : (
          filtered.map((f, i) => {
            const isBuy = f.dir === 'BUY';
            return (
              <motion.div
                key={f.id}
                initial={f.isNew ? { opacity: 0, y: -20, backgroundColor: 'rgba(240,185,11,0.1)' } : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, y: 0, x: 0, backgroundColor: 'transparent' }}
                transition={{ duration: 0.3, delay: f.isNew ? 0 : i * 0.01 }}
                className="grid grid-cols-[80px_1fr_70px_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b items-center transition-all"
                style={{
                  borderColor: 'var(--border-subtle)',
                  borderLeft: `3px solid ${isBuy ? 'var(--chart-bullish)' : 'var(--chart-bearish)'}`,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.time}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.sym}</span>
                <span
                  className="text-[10px] font-bold text-center px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isBuy ? 'rgba(0,227,150,0.15)' : 'rgba(255,69,96,0.15)',
                    color: isBuy ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
                  }}
                >
                  {f.dir}
                </span>
                <span className="text-xs text-right" style={{ color: 'var(--text-primary)' }}>
                  {formatVol(f.vol)}
                </span>
                <span className="text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
                  ${formatPrice()}
                </span>
                <span className="text-xs text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ${formatVol(f.vol)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
