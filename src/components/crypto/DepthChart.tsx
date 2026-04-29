import { useEffect, useState, useRef } from 'react';
import { fetchDepth } from '@/lib/crypto-api';

interface DepthChartProps {
  symbol: string;
  height?: number;
}

export default function DepthChart({ symbol, height = 200 }: DepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bids, setBids] = useState<[number, number][]>([]);
  const [asks, setAsks] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchDepth(symbol);
        if (cancelled) return;

        // Aggregate depth data: accumulate sizes
        let bidCum = 0;
        const bidData: [number, number][] = data.bids
          .slice(0, 30)
          .map(([p, s]) => {
            bidCum += parseFloat(s);
            return [parseFloat(p), bidCum];
          });

        let askCum = 0;
        const askData: [number, number][] = data.asks
          .slice(0, 30)
          .map(([p, s]) => {
            askCum += parseFloat(s);
            return [parseFloat(p), askCum];
          });

        setBids(bidData);
        setAsks(askData);
      } catch {
        // ignore
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bids.length === 0 || asks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0D1321';
    ctx.fillRect(0, 0, w, h);

    const minPrice = bids[bids.length - 1]?.[0] ?? 0;
    const maxPrice = asks[asks.length - 1]?.[0] ?? 0;
    const midPrice = (bids[0]?.[0] + asks[0]?.[0]) / 2;
    const maxVol = Math.max(bids[bids.length - 1]?.[1] ?? 1, asks[asks.length - 1]?.[1] ?? 1);

    const priceToX = (p: number) => {
      const range = maxPrice - minPrice;
      return pad.left + ((p - minPrice) / range) * chartW;
    };
    const volToY = (v: number) => pad.top + chartH - (v / maxVol) * chartH;

    // Bids (green) - left side
    if (bids.length > 0) {
      ctx.beginPath();
      ctx.moveTo(priceToX(midPrice), volToY(0));
      for (let i = 0; i < bids.length; i++) {
        ctx.lineTo(priceToX(bids[i][0]), volToY(bids[i][1]));
      }
      ctx.lineTo(priceToX(bids[bids.length - 1][0]), volToY(0));
      ctx.closePath();

      const grad = ctx.createLinearGradient(priceToX(minPrice), 0, priceToX(midPrice), 0);
      grad.addColorStop(0, 'rgba(0,227,150,0.3)');
      grad.addColorStop(1, 'rgba(0,227,150,0.05)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < bids.length; i++) {
        const x = priceToX(bids[i][0]);
        const y = volToY(bids[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00E396';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Asks (red) - right side
    if (asks.length > 0) {
      ctx.beginPath();
      ctx.moveTo(priceToX(midPrice), volToY(0));
      for (let i = 0; i < asks.length; i++) {
        ctx.lineTo(priceToX(asks[i][0]), volToY(asks[i][1]));
      }
      ctx.lineTo(priceToX(asks[asks.length - 1][0]), volToY(0));
      ctx.closePath();

      const grad = ctx.createLinearGradient(priceToX(midPrice), 0, priceToX(maxPrice), 0);
      grad.addColorStop(0, 'rgba(255,69,96,0.05)');
      grad.addColorStop(1, 'rgba(255,69,96,0.3)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < asks.length; i++) {
        const x = priceToX(asks[i][0]);
        const y = volToY(asks[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#FF4560';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Mid price line
    const midX = priceToX(midPrice);
    ctx.strokeStyle = '#F0B90B';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, pad.top);
    ctx.lineTo(midX, h - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    ctx.fillStyle = '#F0B90B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(midPrice.toFixed(2), midX, h - 4);

  }, [bids, asks]);

  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Depth</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full flex-1"
        style={{ display: 'block' }}
      />
    </div>
  );
}
