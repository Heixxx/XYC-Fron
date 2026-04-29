import { useState } from 'react';
import { X, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CandlestickChart from './CandlestickChart';
import type { FxRate } from '@/lib/api';

interface ExpandedChartPanelProps {
  pair: string | null;
  rate: FxRate | undefined;
  chartData: { prices: number[]; timestamps: number[] } | null;
  loading: boolean;
  onClose: () => void;
}

type ChartType = 'candlestick' | 'line' | 'area';
type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

const TIMEFRAMES: { label: Timeframe; yf: string; range: string }[] = [
  { label: '1m', yf: '1m', range: '1d' },
  { label: '5m', yf: '5m', range: '1d' },
  { label: '15m', yf: '15m', range: '5d' },
  { label: '1H', yf: '1h', range: '1mo' },
  { label: '4H', yf: '4h', range: '3mo' },
  { label: '1D', yf: '1d', range: '1y' },
  { label: '1W', yf: '1wk', range: '5y' },
];

export default function ExpandedChartPanel({
  pair,
  rate,
  chartData,
  loading,
  onClose,
}: ExpandedChartPanelProps) {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const [showMa20, setShowMa20] = useState(false);
  const [showMa50, setShowMa50] = useState(false);

  const isUp = (rate?.changePct ?? 0) >= 0;
  const changeColor = isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)';

  return (
    <AnimatePresence>
      {pair && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] as [number, number, number, number] }}
          className="overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-default)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-lg font-bold data-font"
                  style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {pair}
                </span>
                <span className="text-xs data-font" style={{ color: changeColor }}>
                  {rate ? rate.rate.toFixed(5) : '—'}
                </span>
                <span className="text-xs data-font" style={{ color: changeColor }}>
                  {isUp ? '+' : ''}
                  {(rate?.changePct ?? 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Chart type toggle */}
                <div className="flex items-center rounded-md p-0.5" style={{ backgroundColor: 'var(--bg-input)' }}>
                  {([
                    { key: 'candlestick' as ChartType, icon: BarChart3 },
                    { key: 'line' as ChartType, icon: TrendingUp },
                    { key: 'area' as ChartType, icon: Activity },
                  ]).map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setChartType(key)}
                      className="flex items-center justify-center w-7 h-7 rounded transition-colors"
                      style={{
                        backgroundColor: chartType === key ? 'var(--bg-surface)' : 'transparent',
                        color: chartType === key ? 'var(--accent-gold)' : 'var(--text-muted)',
                      }}
                      title={key}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>

                {/* Timeframe selector */}
                <div className="flex items-center gap-0.5">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.label}
                      onClick={() => setTimeframe(tf.label)}
                      className="text-[10px] font-bold px-2 py-1 rounded transition-colors uppercase"
                      style={{
                        backgroundColor: timeframe === tf.label ? 'var(--accent-gold)' : 'var(--bg-input)',
                        color: timeframe === tf.label ? '#050508' : 'var(--text-muted)',
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* MA toggles */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowMa20(!showMa20)}
                    className="text-[10px] font-semibold px-2 py-1 rounded border transition-colors"
                    style={{
                      borderColor: showMa20 ? 'var(--chart-ma-20)' : 'var(--border-subtle)',
                      color: showMa20 ? 'var(--chart-ma-20)' : 'var(--text-muted)',
                      backgroundColor: showMa20 ? 'rgba(251,191,36,0.1)' : 'transparent',
                    }}
                  >
                    MA20
                  </button>
                  <button
                    onClick={() => setShowMa50(!showMa50)}
                    className="text-[10px] font-semibold px-2 py-1 rounded border transition-colors"
                    style={{
                      borderColor: showMa50 ? 'var(--chart-ma-50)' : 'var(--border-subtle)',
                      color: showMa50 ? 'var(--chart-ma-50)' : 'var(--text-muted)',
                      backgroundColor: showMa50 ? 'rgba(59,130,246,0.1)' : 'transparent',
                    }}
                  >
                    MA50
                  </button>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chart */}
            {loading ? (
              <div
                className="flex items-center justify-center text-sm"
                style={{ color: 'var(--text-muted)', height: 300 }}
              >
                Loading chart...
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <CandlestickChart
                  data={chartData}
                  chartType={chartType}
                  showMa20={showMa20}
                  showMa50={showMa50}
                  height={300}
                />
              </div>
            )}

            {/* OHLC bar */}
            {rate && (
              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <OhlcItem label="Open" value={rate.rate - rate.change} />
                <OhlcItem label="High" value={rate.high} />
                <OhlcItem label="Low" value={rate.low} />
                <OhlcItem label="Close" value={rate.rate} />
                <div className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Spread: {((rate.ask - rate.bid) * 10000).toFixed(1)} pips
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OhlcItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span
        className="text-[11px] data-font font-semibold tabular-nums"
        style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value.toFixed(5)}
      </span>
    </div>
  );
}
