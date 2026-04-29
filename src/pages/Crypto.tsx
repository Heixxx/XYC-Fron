import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useBinanceWebSocket } from '@/lib/crypto-api';
import { DISPLAY_NAME } from '@/lib/crypto-api';
import CryptoChart from '@/components/crypto/CryptoChart';
import OrderBook from '@/components/crypto/OrderBook';
import DepthChart from '@/components/crypto/DepthChart';
import TopMoversStrip from '@/components/crypto/TopMoversStrip';
import CryptoPairsTable from '@/components/crypto/CryptoPairsTable';
import StatsBar from '@/components/crypto/StatsBar';
import { useTranslation } from 'react-i18next';

export default function Crypto() {
  const { t } = useTranslation();
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const { connected, prices, connect } = useBinanceWebSocket(true);

  const wsPrice = prices[selectedPair]?.c ?? '';
  const wsOpen = prices[selectedPair]?.o ?? '';
  const wsChange = wsPrice && wsOpen ? ((parseFloat(wsPrice) - parseFloat(wsOpen)) / parseFloat(wsOpen)) * 100 : 0;

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
        }}
      >
        <div>
          <h1
            className="text-2xl md:text-[28px] font-bold"
            style={{ color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}
          >
            {t('crypto.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            20 Binance pairs &bull; {t('crypto.wsRealtime')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* WS Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <span className={`status-dot ${connected ? 'online pulse' : 'offline'}`} />
            {connected ? (
              <Wifi size={12} style={{ color: 'var(--accent-green)' }} />
            ) : (
              <WifiOff size={12} style={{ color: 'var(--accent-red)' }} />
            )}
            <span className="text-xs" style={{ color: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {connected ? t('common.live') : t('common.disconnected')}
            </span>
            {!connected && (
              <button
                onClick={connect}
                className="text-xs ml-1 underline"
                style={{ color: 'var(--accent-blue)' }}
              >
                {t('crypto.reconnect')}
              </button>
            )}
          </div>
          {/* Selected pair price */}
          {wsPrice && (
            <div className="hidden md:flex flex-col items-end">
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}
              >
                {DISPLAY_NAME[selectedPair]} ${parseFloat(wsPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className="text-xs font-semibold"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: wsChange >= 0 ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
                }}
              >
                {wsChange >= 0 ? '↑' : '↓'} {Math.abs(wsChange).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Top Movers ─── */}
      <TopMoversStrip onSelectPair={setSelectedPair} />

      {/* ─── Main Trading Panel (Chart + Order Book) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
        >
          <CryptoChart symbol={selectedPair} height={500} />
        </motion.div>

        {/* Order Book + Depth */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="rounded-lg border overflow-hidden flex flex-col gap-2"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', minHeight: 500 }}
        >
          <div className="flex-1 min-h-0">
            <OrderBook symbol={selectedPair} />
          </div>
          <div className="border-t shrink-0" style={{ borderColor: 'var(--border-subtle)', height: 220 }}>
            <DepthChart symbol={selectedPair} height={220} />
          </div>
        </motion.div>
      </div>

      {/* ─── Pairs Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <CryptoPairsTable
          wsPrices={prices}
          onSelectPair={setSelectedPair}
          selectedPair={selectedPair}
        />
      </motion.div>

      {/* ─── Stats Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <StatsBar activePairs={connected ? 20 : 0} />
      </motion.div>
    </div>
  );
}
