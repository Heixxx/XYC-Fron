import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Bell } from 'lucide-react';
import type { SearchItem } from './SearchDropdown';

interface InstrumentProfileProps {
  item: SearchItem;
}

interface PriceData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
}

export default function InstrumentProfile({ item }: InstrumentProfileProps) {
  const [data, setData] = useState<PriceData | null>(null);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (item.type === 'binance') {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${item.sym}`);
          if (!res.ok) return;
          const json = await res.json();
          setData({
            price: parseFloat(json.lastPrice),
            change: parseFloat(json.priceChange),
            changePct: parseFloat(json.priceChangePercent),
            high: parseFloat(json.highPrice),
            low: parseFloat(json.lowPrice),
          });
        } else {
          const res = await fetch(`/api/yahoo-chart?symbol=${encodeURIComponent(item.sym)}&interval=1d&range=2d`);
          if (!res.ok) return;
          const json = await res.json();
          const result = json.chart?.result?.[0];
          if (result) {
            const meta = result.meta;
            const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose || 0;
            const price = meta.regularMarketPrice || prevClose;
            const change = price - prevClose;
            const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
            setData({
              price,
              change,
              changePct,
              high: meta.regularMarketDayHigh || price,
              low: meta.regularMarketDayLow || price,
            });
          }
        }
      } catch {
        // ignore
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 15000);
    return () => clearInterval(interval);
  }, [item]);

  const isUp = (data?.changePct ?? 0) >= 0;
  const rangePct = data && data.high > data.low
    ? ((data.price - data.low) / (data.high - data.low)) * 100
    : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border px-5 py-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Left: Name */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{item.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xl font-semibold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}
            >
              {item.label}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: item.type === 'binance' ? 'rgba(240,185,11,0.12)' : 'rgba(59,130,246,0.12)',
                color: item.type === 'binance' ? 'var(--accent-gold)' : 'var(--accent-blue)',
              }}
            >
              {item.type === 'binance' ? 'Crypto' : item.label.includes('Gold') || item.label.includes('Silver') || item.label.includes('Oil') ? 'Commodity' : 'Forex'}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sym}</span>
        </div>
      </div>

      {/* Center: Price */}
      <div className="flex flex-col items-start sm:items-center">
        {data ? (
          <>
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}
            >
              {data.price < 100 ? data.price.toFixed(item.dec) : data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
              }}
            >
              {isUp ? '+' : ''}{data.change.toFixed(item.dec)} ({isUp ? '+' : ''}{data.changePct.toFixed(2)}%)
            </span>
          </>
        ) : (
          <div className="shimmer-skeleton rounded h-8 w-32" />
        )}
      </div>

      {/* Right: Range bar + actions */}
      <div className="flex items-center gap-4">
        {data && (
          <div className="flex flex-col gap-1 w-40">
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              <span>L: {data.low.toFixed(item.dec)}</span>
              <span>H: {data.high.toFixed(item.dec)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rangePct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFavorited(!favorited)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Star size={18} style={{ color: favorited ? 'var(--accent-gold)' : 'var(--text-muted)' }} fill={favorited ? 'var(--accent-gold)' : 'none'} />
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Bell size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
