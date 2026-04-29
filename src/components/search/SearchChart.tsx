import { useEffect, useRef, useState, useCallback } from 'react';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SearchChartProps {
  symbol: string;
  type: 'binance' | 'yahoo';
  height?: number;
}

const INTERVALS = [
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

export default function SearchChart({ symbol, type, height = 500 }: SearchChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [klines, setKlines] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterval, setActiveInterval] = useState(type === 'yahoo' ? '1d' : '1h');
  const [hoverCandle, setHoverCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (type === 'binance') {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${activeInterval}&limit=150`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (!cancelled) {
            setKlines(data.map((k: [number, string, string, string, string, string]) => ({
              time: k[0],
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            })));
          }
        } else {
          // Yahoo Finance
          const range = activeInterval === '15m' ? '1d' : activeInterval === '1h' ? '5d' : activeInterval === '4h' ? '1mo' : activeInterval === '1d' ? '3mo' : '1y';
          const iv = activeInterval === '15m' ? '15m' : activeInterval === '1h' ? '1h' : activeInterval === '4h' ? '1h' : '1d';
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${iv}&range=${range}`);
          if (!res.ok) throw new Error();
          const json = await res.json();
          const result = json.chart?.result?.[0];
          if (result && !cancelled) {
            const ts = result.timestamp;
            const q = result.indicators?.quote?.[0];
            if (ts && q?.open) {
              const candles: CandleData[] = [];
              for (let i = 0; i < ts.length; i++) {
                if (q.open[i] !== null) {
                  candles.push({
                    time: ts[i] * 1000,
                    open: q.open[i],
                    high: q.high[i] ?? q.open[i],
                    low: q.low[i] ?? q.open[i],
                    close: q.close[i] ?? q.open[i],
                    volume: q.volume[i] ?? 0,
                  });
                }
              }
              setKlines(candles);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [symbol, type, activeInterval]);

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

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);

    const prices = klines;
    const minPrice = Math.min(...prices.map((p) => p.low));
    const maxPrice = Math.max(...prices.map((p) => p.high));
    const priceRange = maxPrice - minPrice || 1;

    const candleW = Math.max(1, (chartW / prices.length) * 0.7);
    const spacing = chartW / prices.length;

    const priceToY = (p: number) => pad.top + chartH - ((p - minPrice) / priceRange) * chartH;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    const gridSteps = 6;
    for (let i = 0; i <= gridSteps; i++) {
      const y = pad.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      const priceLabel = (maxPrice - (priceRange / gridSteps) * i);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceLabel.toFixed(minPrice < 1 ? 4 : minPrice < 100 ? 2 : 0), pad.left + chartW + 6, y + 3);
    }

    // Volume
    const maxVol = Math.max(...prices.map((p) => p.volume), 1);
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

      // Volume
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
        const label = activeInterval.includes('d') || activeInterval.includes('w')
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
    <div className="flex flex-col rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-subtle)', height }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {type === 'binance' ? symbol : symbol.replace('=X', '').replace('=F', '')} — OHLCV
        </span>
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
      <div className="relative flex-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
        {hoverCandle && (
          <div
            className="absolute top-2 left-2 px-3 py-2 rounded-md text-xs z-20"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            <div className="flex gap-3 flex-wrap">
              <span style={{ color: 'var(--text-muted)' }}>O:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.open.toFixed(4)}</span>
              <span style={{ color: 'var(--text-muted)' }}>H:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.high.toFixed(4)}</span>
              <span style={{ color: 'var(--text-muted)' }}>L:</span>
              <span style={{ color: 'var(--text-primary)' }}>{hoverCandle.low.toFixed(4)}</span>
              <span style={{ color: 'var(--text-muted)' }}>C:</span>
              <span style={{ color: hoverCandle.close >= hoverCandle.open ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}>
                {hoverCandle.close.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
