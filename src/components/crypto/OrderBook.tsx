import { useEffect, useState } from 'react';
import { fetchDepth } from '@/lib/crypto-api';

interface OrderBookProps {
  symbol: string;
}

interface OrderRow {
  price: number;
  size: number;
  total: number;
}

export default function OrderBook({ symbol }: OrderBookProps) {
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchDepth(symbol);
        if (cancelled) return;

        const parseRows = (rows: [string, string][]): OrderRow[] => {
          let cum = 0;
          return rows.map(([p, s]) => {
            cum += parseFloat(s);
            return { price: parseFloat(p), size: parseFloat(s), total: cum };
          });
        };

        const a = parseRows(data.asks.slice(0, 10));
        const b = parseRows(data.bids.slice(0, 10));
        setAsks(a);
        setBids(b);
        if (data.asks[0] && data.bids[0]) {
          const mid = (parseFloat(data.asks[0][0]) + parseFloat(data.bids[0][0])) / 2;
          setMidPrice(mid);
        }
      } catch {
        // silently fail
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  const maxTotal = Math.max(
    asks.length > 0 ? asks[asks.length - 1].total : 1,
    bids.length > 0 ? bids[bids.length - 1].total : 1,
  );

  const formatPrice = (p: number) => {
    if (p >= 10000) return p.toFixed(0);
    if (p >= 100) return p.toFixed(1);
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Order Book</span>
        {midPrice > 0 && (
          <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold)' }}>
            Spread: {formatPrice(Math.abs(asks[0]?.price - bids[0]?.price || 0))}
          </span>
        )}
      </div>

      {/* Asks (sell) */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 gap-1 px-3 py-1 text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
          <span>Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(50% - 20px)' }}>
          {[...asks].reverse().map((ask, i) => (
            <div
              key={`ask-${i}`}
              className="grid grid-cols-3 gap-1 px-3 py-0.5 text-xs relative"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(to left, rgba(255,69,96,${ask.total / maxTotal}) 0%, transparent 100%)`,
                }}
              />
              <span className="relative" style={{ color: '#FF4560' }}>{formatPrice(ask.price)}</span>
              <span className="relative text-right" style={{ color: 'var(--text-secondary)' }}>{ask.size.toFixed(4)}</span>
              <span className="relative text-right" style={{ color: 'var(--text-muted)' }}>{ask.total.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mid price */}
      <div className="flex items-center justify-center py-2 border-y shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-gold)' }}>
          {midPrice > 0 ? formatPrice(midPrice) : '—'}
        </span>
      </div>

      {/* Bids (buy) */}
      <div className="flex-1 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(50% - 20px)' }}>
          {bids.map((bid, i) => (
            <div
              key={`bid-${i}`}
              className="grid grid-cols-3 gap-1 px-3 py-0.5 text-xs relative"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(to left, rgba(0,227,150,${bid.total / maxTotal}) 0%, transparent 100%)`,
                }}
              />
              <span className="relative" style={{ color: '#00E396' }}>{formatPrice(bid.price)}</span>
              <span className="relative text-right" style={{ color: 'var(--text-secondary)' }}>{bid.size.toFixed(4)}</span>
              <span className="relative text-right" style={{ color: 'var(--text-muted)' }}>{bid.total.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
