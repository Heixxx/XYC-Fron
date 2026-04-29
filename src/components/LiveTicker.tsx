import { useMemo } from 'react';

interface TickerItem {
  symbol: string;
  price: string;
  change: number;
}

interface LiveTickerProps {
  items: TickerItem[];
}

const defaultForexPairs: TickerItem[] = [
  { symbol: 'EUR/USD', price: '1.0845', change: 0.12 },
  { symbol: 'GBP/USD', price: '1.2732', change: -0.08 },
  { symbol: 'USD/JPY', price: '151.42', change: 0.34 },
  { symbol: 'AUD/USD', price: '0.6543', change: -0.21 },
  { symbol: 'USD/CHF', price: '0.9123', change: 0.05 },
  { symbol: 'USD/CAD', price: '1.3689', change: -0.15 },
  { symbol: 'EUR/GBP', price: '0.8521', change: 0.18 },
  { symbol: 'EUR/JPY', price: '164.21', change: 0.45 },
  { symbol: 'GBP/JPY', price: '192.73', change: 0.41 },
  { symbol: 'NZD/USD', price: '0.5892', change: -0.33 },
  { symbol: 'EUR/CHF', price: '0.9891', change: 0.07 },
  { symbol: 'AUD/JPY', price: '99.04', change: 0.12 },
];

const defaultCryptoPairs: TickerItem[] = [
  { symbol: 'BTC/USDT', price: '67432.15', change: 2.34 },
  { symbol: 'ETH/USDT', price: '3521.78', change: 1.87 },
  { symbol: 'BNB/USDT', price: '612.45', change: -0.54 },
  { symbol: 'SOL/USDT', price: '178.92', change: 5.21 },
  { symbol: 'XRP/USDT', price: '0.6234', change: -1.23 },
  { symbol: 'ADA/USDT', price: '0.4892', change: 0.76 },
  { symbol: 'DOGE/USDT', price: '0.1823', change: 3.45 },
  { symbol: 'AVAX/USDT', price: '41.23', change: -2.11 },
];

export default function LiveTicker({ items }: LiveTickerProps) {
  const allItems = useMemo(() => {
    return items.length > 0 ? items : [...defaultForexPairs, ...defaultCryptoPairs];
  }, [items]);

  // Duplicate for seamless loop
  const duplicatedItems = useMemo(() => [...allItems, ...allItems], [allItems]);

  const renderItem = (item: TickerItem, index: number) => {
    const isPositive = item.change >= 0;
    return (
      <span
        key={`${item.symbol}-${index}`}
        className="inline-flex items-center gap-1.5 mx-4 shrink-0"
        style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{item.symbol}</span>
        <span style={{ color: 'var(--text-primary)' }}>{item.price}</span>
        <span
          style={{
            color: isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
          }}
        >
          {isPositive ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
      </span>
    );
  };

  return (
    <div
      className="w-full h-12 flex items-center overflow-hidden border-y"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="marquee-container w-full">
        <div className="marquee-content text-sm">
          {duplicatedItems.map((item, i) => renderItem(item, i))}
        </div>
      </div>
    </div>
  );
}
