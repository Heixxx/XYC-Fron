import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Filter } from 'lucide-react';
import { useWhales } from '@/hooks/useWhales';
import FlowVisualization from '@/components/whales/FlowVisualization';
import WhaleTransactionsTable from '@/components/whales/WhaleTransactionsTable';
import AIAnalysisPanel from '@/components/whales/AIAnalysisPanel';
import { useTranslation } from 'react-i18next';

export default function Whales() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const { flows, netFlow, txCount } = useWhales({ enabled: true, intervalMs: 4000 });

  const filterOptions = [
    { value: 'all', label: t('whales.filter.all') },
    { value: 'inflows', label: t('whales.filter.inflows') },
    { value: 'outflows', label: t('whales.filter.outflows') },
    { value: 'large', label: t('whales.filter.large') },
  ];

  const isPositive = netFlow >= 0;

  return (
    <div className="p-4 md:p-6 space-y-4" style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* ─── Page Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-5 py-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          background: `radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 50%), var(--bg-secondary)`,
        }}
      >
        <div>
          <h1
            className="text-2xl md:text-[28px] font-bold"
            style={{ color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}
          >
            {t('whales.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {t('whales.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Transaction counter */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <Radio size={12} className="animate-pulse-dot" style={{ color: 'var(--accent-red)' }} />
            <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
              {txCount.toLocaleString()} {t('whales.trackedToday')}
            </span>
          </div>
          {/* Net flow */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <span className="text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}>
              {t('whales.netFlow')}: {isPositive ? '+' : '-'}${(Math.abs(netFlow) / 1e6).toFixed(0)}M
            </span>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="status-dot online pulse" />
            <span className="text-xs" style={{ color: 'var(--accent-green)' }}>{t('common.live')}</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Flow Visualization ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <FlowVisualization netFlow={netFlow} />
      </motion.div>

      {/* ─── Transactions Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="space-y-3"
      >
        {/* Table Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('whales.filterLabel')}:</span>
          </div>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: filter === opt.value ? 'var(--bg-surface)' : 'transparent',
                border: filter === opt.value ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                color: filter === opt.value ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-[11px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            {t('whales.showingTransactions', { count: flows.length })}
          </span>
        </div>

        <WhaleTransactionsTable flows={flows} filter={filter} />
      </motion.div>

      {/* ─── AI Analysis Panel ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <AIAnalysisPanel />
      </motion.div>
    </div>
  );
}
