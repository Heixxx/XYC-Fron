import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FlowVisualizationProps {
  netFlow: number;
}

export default function FlowVisualization({ netFlow }: FlowVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);

    // Draw flow lines
    const sources = ['Coinbase', 'Binance', 'Kraken', 'OKX'];
    const destinations = ['Cold Storage', 'DeFi', 'OTC', 'Exchanges'];

    const srcX = w * 0.15;
    const dstX = w * 0.85;
    const centerY = h * 0.5;

    // Draw source labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    sources.forEach((src, i) => {
      const y = centerY - 45 + i * 30;
      ctx.fillStyle = 'var(--text-muted)';
      ctx.fillText(src, srcX, y + 4);
    });

    // Draw destination labels
    destinations.forEach((dst, i) => {
      const y = centerY - 45 + i * 30;
      ctx.fillStyle = 'var(--text-muted)';
      ctx.fillText(dst, dstX, y + 4);
    });

    // Draw flow lines (SVG-style curved paths)
    const lines = [
      { src: 0, dst: 0, color: '#00E396', width: 2 },
      { src: 1, dst: 2, color: '#FF4560', width: 1.5 },
      { src: 2, dst: 1, color: '#00E396', width: 2.5 },
      { src: 3, dst: 3, color: '#FF4560', width: 1 },
      { src: 0, dst: 2, color: '#00E396', width: 1.5 },
      { src: 1, dst: 0, color: '#F0B90B', width: 2 },
    ];

    lines.forEach((line) => {
      const sy = centerY - 45 + line.src * 30;
      const dy = centerY - 45 + line.dst * 30;
      const midX = (srcX + dstX) / 2;

      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(srcX + 20, sy);
      ctx.bezierCurveTo(midX - 30, sy, midX + 30, dy, dstX - 20, dy);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Animated dash
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(srcX + 20, sy);
      ctx.bezierCurveTo(midX - 30, sy, midX + 30, dy, dstX - 20, dy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Center label
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = '11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Institutional Pools', w / 2, centerY + 4);

  }, []);

  const isPositive = netFlow >= 0;
  const inflow = Math.abs(netFlow) * 1.5;
  const outflow = Math.abs(netFlow) * 0.4;

  return (
    <div
      className="relative rounded-lg border overflow-hidden"
      style={{
        height: 240,
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-primary)',
        background: `radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 60%), var(--bg-primary)`,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />

      {/* Floating stat pills */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--chart-bullish)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Inflow: +${(inflow / 1e6).toFixed(0)}M
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--chart-bearish)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Outflow: -${(outflow / 1e6).toFixed(0)}M
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--accent-gold)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Net: {isPositive ? '+' : '-'}${(Math.abs(netFlow) / 1e6).toFixed(0)}M
      </motion.div>
    </div>
  );
}
