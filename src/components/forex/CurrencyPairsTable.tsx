import { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { FxRate } from '@/lib/api';
import Sparkline from './Sparkline';

interface CurrencyPairsTableProps {
  rates: Record<string, FxRate>;
  fxDef: Array<{ pair: string; yf: string; dec: number; type: string }>;
  categoryFilter: string;
  sparklines: Record<string, number[]>;
  onPairClick: (pair: string) => void;
}

const FlashRow = memo(function FlashRow({
  pair,
  rate,
  dec,
  type,
  sparkline,
  index,
  onClick,
}: {
  pair: string;
  rate: FxRate | undefined;
  dec: number;
  type: string;
  sparkline: number[];
  index: number;
  onClick: () => void;
}) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRate = useRef(rate?.rate ?? 0);

  useEffect(() => {
    if (!rate || prevRate.current === 0) {
      prevRate.current = rate?.rate ?? 0;
      return;
    }
    const diff = rate.rate - prevRate.current;
    if (Math.abs(diff) > 0.000001) {
      setFlash(diff > 0 ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(timer);
    }
    prevRate.current = rate.rate;
  }, [rate?.rate]);

  const isUp = (rate?.changePct ?? 0) >= 0;
  const changeColor = isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)';
  const flashBg =
    flash === 'up'
      ? 'rgba(0,227,150,0.15)'
      : flash === 'down'
      ? 'rgba(255,69,96,0.15)'
      : 'transparent';

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.6),
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      onClick={onClick}
      className="cursor-pointer transition-colors"
      style={{
        backgroundColor: flash ? flashBg : index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
        transition: 'background-color 0.4s ease',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        if (!flash) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
      }}
      onMouseLeave={(e) => {
        if (!flash) e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)';
      }}
    >
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
            style={{
              backgroundColor:
                type === 'Major'
                  ? 'rgba(59,130,246,0.12)'
                  : type === 'Cross'
                  ? 'rgba(139,92,246,0.12)'
                  : 'rgba(245,158,11,0.12)',
              color:
                type === 'Major'
                  ? 'var(--accent-blue)'
                  : type === 'Cross'
                  ? 'var(--accent-purple)'
                  : 'var(--accent-orange)',
            }}
          >
            {type[0]}
          </span>
          <span
            className="text-xs font-semibold data-font"
            style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {pair}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <span
          className="text-xs data-font font-semibold tabular-nums"
          style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rate ? rate.rate.toFixed(dec) : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {rate ? (
          <span className="flex items-center justify-end gap-0.5 text-xs data-font" style={{ color: changeColor }}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isUp ? '+' : ''}
            {rate.change.toFixed(dec)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        {rate ? (
          <span
            className="text-xs data-font font-semibold tabular-nums"
            style={{ color: changeColor, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {isUp ? '+' : ''}
            {rate.changePct.toFixed(2)}%
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right hidden lg:table-cell">
        <span
          className="text-xs data-font tabular-nums"
          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rate ? rate.high.toFixed(dec) : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right hidden lg:table-cell">
        <span
          className="text-xs data-font tabular-nums"
          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rate ? rate.low.toFixed(dec) : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-center">
          <Sparkline
            data={sparkline.length > 0 ? sparkline : [1, 1, 1, 1, 1]}
            color={changeColor}
            width={100}
            height={28}
          />
        </div>
      </td>
      <td className="px-3 py-2.5 text-center hidden md:table-cell">
        {rate ? (
          isUp ? (
            <TrendingUp size={14} className="mx-auto" style={{ color: 'var(--chart-bullish)' }} />
          ) : (
            <TrendingDown size={14} className="mx-auto" style={{ color: 'var(--chart-bearish)' }} />
          )
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </motion.tr>
  );
});

export default function CurrencyPairsTable({
  rates,
  fxDef,
  categoryFilter,
  sparklines,
  onPairClick,
}: CurrencyPairsTableProps) {
  const filtered = fxDef.filter((d) => {
    if (categoryFilter === 'All') return true;
    return d.type === categoryFilter;
  });

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                Pair
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                Rate
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                Change
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                Change %
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                High
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                Low
              </th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                24h Chart
              </th>
              <th className="text-center text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((def, index) => (
              <FlashRow
                key={def.pair}
                pair={def.pair}
                rate={rates[def.pair]}
                dec={def.dec}
                type={def.type}
                sparkline={sparklines[def.pair] || []}
                index={index}
                onClick={() => onPairClick(def.pair)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
