import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchKlines } from '@/lib/crypto-api';
import type { KlineData } from '@/lib/crypto-api';

interface CryptoChartProps {
  symbol: string;
  interval?: string;
  height?: number;
}

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

export default function CryptoChart({ symbol, interval = '1h', height = 500 }: CryptoChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterval, setActiveInterval] = useState(interval);
  const [hoverCandle, setHoverCandle] = useState<KlineData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Fetch klines
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchKlines(symbol, activeInterval, 120)
      .then((data) => {
        if (!cancelled) {
          setKlines(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [symbol, activeInterval]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || klines.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);

    if (klines.length === 0) return;

    const prices = klines;
    const minPrice = Math.min(...prices.map((p) => p.low));
    const maxPrice = Math.max(...prices.map((p) => p.high));
    const priceRange = maxPrice - minPrice || 1;

    const candleW = Math.max(1, (chartW / prices.length) * 0.7);
    const spacing = chartW / prices.length;

    const priceToY = (p: number) => pad.top + chartH - ((p - minPrice) / priceRange) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    const gridSteps = 6;
    for (let i = 0; i <= gridSteps; i++) {
      const y = pad.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();

      const priceLabel = (maxPrice - (priceRange / gridSteps) * i).toFixed(
        minPrice < 1 ? 4 : minPrice < 100 ? 2 : 0
      );
      ctx.fillStyle = '#64748B';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceLabel, pad.left + chartW + 6, y + 3);
    }

    // Volume
    const maxVol = Math.max(...prices.map((p) => p.volume));
    const volH = chartH * 0.15;

    // Candles
    prices.forEach((k, i) => {
      const x = pad.left + i * spacing + spacing / 2;
      const isBull = k.close >= k.open;

      // Wick
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(k.high));
      ctx.lineTo(x, priceToY(k.low));
      ctx.stroke();

      // Body
      const bodyTop = priceToY(Math.max(k.open, k.close));
      const bodyBottom = priceToY(Math.min(k.open, k.close));
      const bodyH = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = isBull ? '#00E396' : '#FF4560';
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

      // Volume bar
      const volBarH = (k.volume / maxVol) * volH;
      ctx.fillStyle = isBull ? 'rgba(0,227,150,0.15)' : 'rgba(255,69,96,0.15)';
      ctx.fillRect(x - candleW / 2, pad.top + chartH - volBarH, candleW, volBarH);
    });

    // Crosshair
    if (hoverCandle && mousePos.x > 0) {
      const idx = prices.indexOf(hoverCandle);
      if (idx >= 0) {
        const x = pad.left + idx * spacing + spacing / 2;
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + chartH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad.left, mousePos.y);
        ctx.lineTo(pad.left + chartW, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Time labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.ceil(prices.length / 8);
    prices.forEach((k, i) => {
      if (i % timeStep === 0) {
        const x = pad.left + i * spacing + spacing / 2;
        const date = new Date(k.time);
        const label = activeInterval.includes('d')
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        ctx.fillText(label, x, h - 8);
      }
    });
  }, [klines, hoverCandle, mousePos, activeInterval]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || klines.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pad = { top: 10, right: 70, bottom: 30, left: 10 };
    const chartW = rect.width - pad.left - pad.right;
    const spacing = chartW / klines.length;
    const idx = Math.floor((x - pad.left) / spacing);
    if (idx >= 0 && idx < klines.length) {
      setHoverCandle(klines[idx]);
      setMousePos({ x, y });
    }
  }, [klines]);

  const handleMouseLeave = useCallback(() => {
    setHoverCandle(null);
    setMousePos({ x: 0, y: 0 });
  }, []);

  return (
    <div className="flex flex-col" style={{ height }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setActiveInterval(iv.value)}
              className="px-2 py-0.5 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: activeInterval === iv.value ? 'var(--bg-surface)' : 'transparent',
                border: activeInterval === iv.value ? '1px solid var(--accent-gold)' : '1px solid transparent',
                color: activeInterval === iv.value ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* OHLCV Tooltip */}
        {hoverCandle && (
          <div
            className="absolute top-2 left-2 px-3 py-2 rounded-md text-xs z-20"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div className="flex gap-3">
              <span style={{ color: 'var(--text-muted)' }}>O:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.open.toFixed(2)}</span>
              <span style={{ color: 'var(--text-muted)' }}>H:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.high.toFixed(2)}</span>
              <span style={{ color: 'var(--text-muted)' }}>L:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.low.toFixed(2)}</span>
              <span style={{ color: 'var(--text-muted)' }}>C:</span>
              <span style={{ color: hoverCandle.close >= hoverCandle.open ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}>
                {hoverCandle.close.toFixed(2)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>V:</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {(hoverCandle.volume / 1e6).toFixed(2)}M
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
