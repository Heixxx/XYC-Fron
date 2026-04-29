import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTickers24h } from '@/lib/crypto-api';
import type { Ticker24h, MiniTicker } from '@/lib/crypto-api';
import { DISPLAY_NAME, COIN_ICON, CRYPTO_SYMS } from '@/lib/crypto-api';

interface CryptoPairsTableProps {
  wsPrices: Record<string, MiniTicker>;
  onSelectPair: (sym: string) => void;
  selectedPair: string;
}

export default function CryptoPairsTable({ wsPrices, onSelectPair, selectedPair }: CryptoPairsTableProps) {
  const [tickers, setTickers] = useState<Ticker24h[]>([]);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  // Initial fetch via REST
  useEffect(() => {
    fetchTickers24h().then((data) => {
      const ordered = CRYPTO_SYMS.map((sym) =>
        data.find((t) => t.symbol === sym)
      ).filter(Boolean) as Ticker24h[];
      setTickers(ordered);
    }).catch(() => {});
    const interval = setInterval(() => {
      fetchTickers24h().then((data) => {
        const ordered = CRYPTO_SYMS.map((sym) =>
          data.find((t) => t.symbol === sym)
        ).filter(Boolean) as Ticker24h[];
        setTickers((prev) => {
          const newFlash: Record<string, 'up' | 'down'> = {};
          ordered.forEach((t) => {
            const old = prev.find((p) => p.symbol === t.symbol);
            if (old) {
              const oldPrice = parseFloat(old.lastPrice);
              const newPrice = parseFloat(t.lastPrice);
              if (newPrice > oldPrice) newFlash[t.symbol] = 'up';
              else if (newPrice < oldPrice) newFlash[t.symbol] = 'down';
            }
          });
          if (Object.keys(newFlash).length > 0) {
            setFlashMap(newFlash);
            setTimeout(() => setFlashMap({}), 400);
          }
          return ordered;
        });
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Merge WS prices
  const merged = tickers.map((t) => {
    const ws = wsPrices[t.symbol];
    if (ws) {
      return { ...t, lastPrice: ws.c };
    }
    return t;
  });

  const formatPrice = (sym: string, price: string) => {
    const p = parseFloat(price);
    if (sym === 'PAXGUSDT') return `$${p.toFixed(2)}`;
    if (sym === 'DOGEUSDT') return `$${p.toFixed(5)}`;
    if (sym === 'XRPUSDT') return `$${p.toFixed(4)}`;
    if (p >= 10000) return `$${p.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (p >= 100) return `$${p.toFixed(1)}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  const formatVol = (vol: string) => {
    const v = parseFloat(vol);
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(0);
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Table Header */}
      <div
        className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase border-b"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
      >
        <span>#</span>
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h Change</span>
        <span className="text-right hidden md:block">24h High</span>
        <span className="text-right hidden md:block">24h Low</span>
        <span className="text-right">24h Volume</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
        {merged.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="shimmer-skeleton rounded h-4" />
              <div className="shimmer-skeleton rounded h-4" />
              <div className="shimmer-skeleton rounded h-4" />
              <div className="shimmer-skeleton rounded h-4" />
              <div className="shimmer-skeleton rounded h-4 hidden md:block" />
              <div className="shimmer-skeleton rounded h-4 hidden md:block" />
              <div className="shimmer-skeleton rounded h-4" />
            </div>
          ))
        ) : (
          merged.map((t, i) => {
            const change = parseFloat(t.priceChangePercent);
            const isUp = change >= 0;
            const isPAXG = t.symbol === 'PAXGUSDT';
            const isSelected = t.symbol === selectedPair;
            const flash = flashMap[t.symbol];

            return (
              <motion.div
                key={t.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                onClick={() => onSelectPair(t.symbol)}
                className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b cursor-pointer transition-all items-center"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: isSelected
                    ? 'var(--bg-surface)'
                    : isPAXG
                    ? 'rgba(240,185,11,0.05)'
                    : flash === 'up'
                    ? 'rgba(0,227,150,0.08)'
                    : flash === 'down'
                    ? 'rgba(255,69,96,0.08)'
                    : 'transparent',
                  borderLeft: isPAXG ? '3px solid var(--accent-gold)' : isSelected ? '3px solid var(--accent-gold)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = isPAXG ? 'rgba(240,185,11,0.05)' : 'transparent';
                  }
                }}
              >
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{COIN_ICON[t.symbol] || '◆'}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {DISPLAY_NAME[t.symbol] || t.symbol}
                    </span>
                    {isPAXG && (
                      <span
                        className="text-[9px] px-1 rounded-full w-fit"
                        style={{ backgroundColor: 'rgba(240,185,11,0.15)', color: 'var(--accent-gold)' }}
                      >
                        Gold-backed
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-right text-xs font-medium"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-primary)',
                  }}
                >
                  {formatPrice(t.symbol, t.lastPrice)}
                </span>
                <span
                  className="text-right text-xs font-semibold"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
                  }}
                >
                  {isUp ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                </span>
                <span className="text-right text-xs hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                  {formatPrice(t.symbol, t.highPrice)}
                </span>
                <span className="text-right text-xs hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                  {formatPrice(t.symbol, t.lowPrice)}
                </span>
                <span className="text-right text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
                  {formatVol(t.quoteVolume)} USDT
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
