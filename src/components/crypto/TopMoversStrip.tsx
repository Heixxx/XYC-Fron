import { useEffect, useState } from 'react';
import { fetchTickers24h } from '@/lib/crypto-api';
import type { Ticker24h } from '@/lib/crypto-api';
import { DISPLAY_NAME } from '@/lib/crypto-api';

interface TopMoversStripProps {
  onSelectPair: (sym: string) => void;
}

export default function TopMoversStrip({ onSelectPair }: TopMoversStripProps) {
  const [tickers, setTickers] = useState<Ticker24h[]>([]);

  useEffect(() => {
    fetchTickers24h().then((data) => {
      const sorted = [...data].sort((a, b) =>
        Math.abs(parseFloat(b.priceChangePercent)) - Math.abs(parseFloat(a.priceChangePercent))
      );
      setTickers(sorted.slice(0, 6));
    }).catch(() => {});
    const interval = setInterval(() => {
      fetchTickers24h().then((data) => {
        const sorted = [...data].sort((a, b) =>
          Math.abs(parseFloat(b.priceChangePercent)) - Math.abs(parseFloat(a.priceChangePercent))
        );
        setTickers(sorted.slice(0, 6));
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="marquee-container w-full overflow-hidden" style={{ height: 72, backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center h-full px-2 gap-2">
        {tickers.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer-skeleton rounded-lg shrink-0" style={{ width: 140, height: 56 }} />
          ))
        ) : (
          tickers.map((t) => {
            const change = parseFloat(t.priceChangePercent);
            const isUp = change >= 0;
            return (
              <button
                key={t.symbol}
                onClick={() => onSelectPair(t.symbol)}
                className="shrink-0 flex flex-col items-start px-3 py-2 rounded-lg border transition-all hover:scale-105"
                style={{
                  width: 140,
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {DISPLAY_NAME[t.symbol] || t.symbol}
                </span>
                <span className="text-xs mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                  ${parseFloat(t.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}
                >
                  {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
