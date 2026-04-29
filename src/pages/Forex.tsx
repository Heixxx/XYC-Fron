import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useForex, FX_DEF, useSpotlightCharts } from '@/hooks/useForex';
import SpotlightCard from '@/components/forex/SpotlightCard';
import CurrencyPairsTable from '@/components/forex/CurrencyPairsTable';
import ExpandedChartPanel from '@/components/forex/ExpandedChartPanel';
import CurrencyStrengthMeter from '@/components/forex/CurrencyStrengthMeter';
import { useTranslation } from 'react-i18next';

export default function Forex() {
  const { t } = useTranslation();
  const {
    rates,
    loading,
    error,
    source,
    lastUpdate,
    refresh,
    loadChart,
    chartData,
    chartLoading,
  } = useForex();

  const spotlightCharts = useSpotlightCharts();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expandedPair, setExpandedPair] = useState<string | null>(null);
  const [spinRefresh, setSpinRefresh] = useState(false);

  const categories = [t('forex.categories.all'), t('forex.categories.major'), t('forex.categories.cross'), t('forex.categories.exotic')];

  const handleRefresh = useCallback(() => {
    setSpinRefresh(true);
    refresh();
    setTimeout(() => setSpinRefresh(false), 500);
  }, [refresh]);

  const handlePairClick = useCallback(
    (pair: string) => {
      if (expandedPair === pair) {
        setExpandedPair(null);
      } else {
        setExpandedPair(pair);
        loadChart(pair, '1h', '1d');
      }
    },
    [expandedPair, loadChart]
  );

  const handleCloseChart = useCallback(() => {
    setExpandedPair(null);
  }, []);

  // Generate sparklines for each pair from cached data
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Try to get sparkline data from localStorage cache
    const allSparklines: Record<string, number[]> = {};
    for (const def of FX_DEF) {
      try {
        const cached = localStorage.getItem(`fx-spark-${def.pair}`);
        if (cached) {
          allSparklines[def.pair] = JSON.parse(cached);
        } else {
          // Generate a realistic-looking sparkline based on the current rate
          const rate = rates[def.pair]?.rate;
          if (rate) {
            const points: number[] = [];
            let val = rate * (1 - (Math.random() - 0.5) * 0.01);
            for (let i = 0; i < 30; i++) {
              val += (Math.random() - 0.48) * rate * 0.002;
              points.push(val);
            }
            // Make sure last point is close to current rate
            points[points.length - 1] = rate;
            allSparklines[def.pair] = points;
            localStorage.setItem(`fx-spark-${def.pair}`, JSON.stringify(points));
          } else {
            allSparklines[def.pair] = generateMockSparkline();
          }
        }
      } catch {
        allSparklines[def.pair] = generateMockSparkline();
      }
    }
    setSparklines(allSparklines);
  }, [rates]);

  const sourceLabel = useMemo(() => {
    if (source === 'yahoo') return 'Yahoo Finance v8';
    if (source === 'open.er-api') return 'open.er-api.com';
    if (source === 'fawazahmed0') return 'fawazahmed0 CDN';
    if (source === 'frankfurter') return 'Frankfurter ECB';
    if (source === 'cache') return 'Cache';
    return 'Offline';
  }, [source]);

  const isConnected = source !== 'failed' && !error;

  const spotlightPairs = [
    { pair: 'EUR/USD', nickname: 'The Fiber' },
    { pair: 'GBP/USD', nickname: 'The Cable' },
    { pair: 'USD/JPY', nickname: 'The Ninja' },
    { pair: 'XAU/USD', nickname: t('forex.nicknames.XAU/USD') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div
        className="rounded-lg p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl sm:text-[28px] font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'Inter', system-ui, sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {t('forex.title')}
            </motion.h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {FX_DEF.length} {t('forex.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* API Status */}
            <div className="flex items-center gap-2 text-xs">
              {isConnected ? (
                <Wifi size={13} style={{ color: 'var(--accent-green)' }} />
              ) : (
                <WifiOff size={13} style={{ color: 'var(--accent-red)' }} />
              )}
              <span style={{ color: 'var(--text-muted)' }}>
                {isConnected ? sourceLabel : t('common.disconnected')}
              </span>
              <span
                className="w-2 h-2 rounded-full status-dot pulse"
                style={{
                  backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--accent-red)',
                  display: 'inline-block',
                }}
              />
            </div>

            {/* Last update */}
            <span
              className="text-xs data-font tabular-nums"
              style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {lastUpdate || '—'}
            </span>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={spinRefresh ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Spotlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {spotlightPairs.map((sp, index) => (
          <SpotlightCard
            key={sp.pair}
            pair={sp.pair}
            nickname={sp.nickname}
            rate={sp.pair === 'XAU/USD' ? undefined : rates[sp.pair]}
            chartData={spotlightCharts[sp.pair] || sparklines[sp.pair] || generateMockSparkline()}
            index={index}
            onClick={() => sp.pair !== 'XAU/USD' && handlePairClick(sp.pair)}
          />
        ))}
      </div>

      {/* Category Filter + Table */}
      <div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: categoryFilter === cat ? 'var(--accent-gold)' : 'var(--bg-secondary)',
                color: categoryFilter === cat ? '#050508' : 'var(--text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            {FX_DEF.filter((d) => categoryFilter === t('forex.categories.all') || d.type === categoryFilter).length} {t('forex.pairCount')}
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="animate-spin" size={18} style={{ color: 'var(--accent-gold)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('forex.loadingRates')}
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="rounded-lg p-6 text-center"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-red)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--accent-red)' }}>
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-gold)', color: '#050508' }}
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            <CurrencyPairsTable
              rates={rates}
              fxDef={FX_DEF}
              categoryFilter={categoryFilter}
              sparklines={sparklines}
              onPairClick={handlePairClick}
            />

            {/* Expanded Chart Panel */}
            {expandedPair && (
              <div className="mt-2">
                <ExpandedChartPanel
                  pair={expandedPair}
                  rate={rates[expandedPair]}
                  chartData={chartData}
                  loading={chartLoading}
                  onClose={handleCloseChart}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Currency Strength Meter */}
      <CurrencyStrengthMeter rates={rates} />
    </motion.div>
  );
}

function generateMockSparkline(): number[] {
  const points: number[] = [];
  let val = 1.0 + Math.random() * 0.1;
  for (let i = 0; i < 30; i++) {
    val += (Math.random() - 0.48) * 0.002;
    points.push(val);
  }
  return points;
}
