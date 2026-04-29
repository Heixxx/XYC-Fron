import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { fetchGlobalData } from '@/lib/crypto-api';

interface StatsBarProps {
  activePairs: number;
}

export default function StatsBar({ activePairs }: StatsBarProps) {
  const { t } = useTranslation();
  const [globalData, setGlobalData] = useState({
    marketCap: 0,
    volume24h: 0,
    btcDominance: 0,
  });

  useEffect(() => {
    fetchGlobalData().then(setGlobalData).catch(() => {});
    const interval = setInterval(() => {
      fetchGlobalData().then(setGlobalData).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: 'Global Market Cap',
      value: globalData.marketCap > 0 ? `$${(globalData.marketCap / 1e12).toFixed(2)}T` : '—',
      sub: '+2.4%',
    },
    {
      label: '24h Volume',
      value: globalData.volume24h > 0 ? `$${(globalData.volume24h / 1e9).toFixed(1)}B` : '—',
      sub: undefined,
    },
    {
      label: 'BTC Dominance',
      value: globalData.btcDominance > 0 ? `${globalData.btcDominance.toFixed(1)}%` : '—',
      sub: undefined,
      isBar: true,
      barPct: globalData.btcDominance,
    },
    {
      label: 'Fear & Greed',
      value: '65',
      sub: t('crypto.stats.greed'),
    },
    {
      label: 'Active Pairs',
      value: `${activePairs}/20`,
      sub: undefined,
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center justify-around gap-4 px-4 py-3 rounded-lg border"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {s.label}
          </span>
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}
          >
            {s.value}
          </span>
          {s.isBar && (
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.barPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--accent-gold)' }}
              />
            </div>
          )}
          {s.sub && !s.isBar && (
            <span className="text-[10px]" style={{ color: 'var(--chart-bullish)' }}>{s.sub}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
