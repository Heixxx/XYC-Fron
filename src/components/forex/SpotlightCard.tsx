import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { FxRate } from '@/lib/api';
import MiniChart from './MiniChart';

interface SpotlightCardProps {
  pair: string;
  nickname: string;
  rate: FxRate | undefined;
  chartData: number[];
  index: number;
  onClick: () => void;
}

export default function SpotlightCard({
  pair,
  nickname,
  rate,
  chartData,
  index,
  onClick,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(20px)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('');
  }, []);

  const isUp = (rate?.changePct ?? 0) >= 0;
  const changeColor = isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)';

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -15 }}
      animate={{ opacity: 1, rotateX: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-lg overflow-hidden cursor-pointer transition-shadow duration-150 hover:shadow-xl"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        transform,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div
              className="text-lg font-bold data-font"
              style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {pair}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {nickname}
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${changeColor}15`,
              color: changeColor,
            }}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}
            {(rate?.changePct ?? 0).toFixed(2)}%
          </div>
        </div>

        {/* Price */}
        <div
          className="text-3xl font-bold data-font my-2"
          style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rate ? rate.rate.toFixed(pair === 'USD/JPY' ? 3 : 5) : '—'}
        </div>

        {/* Pip change */}
        <div
          className="text-xs font-medium mb-3"
          style={{ color: changeColor }}
        >
          {isUp ? '+' : ''}
          {((rate?.change ?? 0) * 10000).toFixed(1)} pips
        </div>

        {/* Mini Chart */}
        <div className="h-[100px] w-full">
          <MiniChart data={chartData} color={changeColor} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-[10px] data-font" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            H: {rate?.high.toFixed(pair === 'USD/JPY' ? 3 : 5) ?? '—'}
          </span>
          <span className="text-[10px] data-font" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            L: {rate?.low.toFixed(pair === 'USD/JPY' ? 3 : 5) ?? '—'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
