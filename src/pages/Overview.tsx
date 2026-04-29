import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Newspaper,
  TrendingUp,
  Bitcoin,
  Search,
  Fish,
  Zap,
  Eye,
  Brain,
  ChevronRight,
  Globe,
  BrainCircuit,
} from 'lucide-react';
import ParticleCanvas from '@/components/ParticleCanvas';
import LiveTicker from '@/components/LiveTicker';
import Sparkline from '@/components/Sparkline';
import { useTranslation } from 'react-i18next';

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const cardEntrance = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// --- Data Constants ---
const quickTiles = [
  { label: 'News', description: 'Daily Market News', detail: '3 editions with AI analysis', icon: Newspaper, color: '#3B82F6', path: '/news' },
  { label: 'Forex', description: 'Currency Markets', detail: '24+ pairs, live rates', icon: TrendingUp, color: '#10B981', path: '/forex' },
  { label: 'Crypto', description: 'Crypto Markets', detail: '20 pairs, real-time', icon: Bitcoin, color: '#F59E0B', path: '/crypto' },
  { label: 'Search', description: 'Market Search', detail: 'Any instrument, any chart', icon: Search, color: '#8B5CF6', path: '/search' },
  { label: 'Whales', description: 'Whale Flows', detail: 'Institutional movements', icon: Fish, color: '#06B6D4', path: '/whales' },
  { label: 'Signals', description: 'AI Signals', detail: '5-Layer ensemble analysis', icon: Zap, color: '#F0B90B', path: '/signals' },
  { label: 'Vision', description: 'Chart Vision', detail: 'Upload & AI analyze', icon: Eye, color: '#EC4899', path: '/vision' },
  { label: 'Logic Lab', description: 'AI Debate', detail: 'Multi-agent reasoning', icon: Brain, color: '#6366F1', path: '/logic-lab' },
];

const forexPairs = [
  { pair: 'EUR/USD', rate: 1.0845, change: 0.12, sparkline: [1.0820, 1.0825, 1.0830, 1.0828, 1.0835, 1.0840, 1.0838, 1.0845] },
  { pair: 'GBP/USD', rate: 1.2732, change: -0.08, sparkline: [1.2740, 1.2738, 1.2735, 1.2730, 1.2733, 1.2731, 1.2732, 1.2732] },
  { pair: 'USD/JPY', rate: 151.42, change: 0.34, sparkline: [150.90, 151.05, 151.15, 151.25, 151.20, 151.30, 151.38, 151.42] },
  { pair: 'AUD/USD', rate: 0.6543, change: -0.21, sparkline: [0.6560, 0.6555, 0.6550, 0.6548, 0.6545, 0.6544, 0.6543, 0.6543] },
  { pair: 'USD/CHF', rate: 0.9123, change: 0.05, sparkline: [0.9118, 0.9120, 0.9119, 0.9121, 0.9122, 0.9122, 0.9123, 0.9123] },
];

const cryptoPairs = [
  { pair: 'BTC/USDT', price: '67,432.15', change: 2.34, sparkline: [65800, 66200, 66500, 66300, 66800, 67000, 67200, 67432] },
  { pair: 'ETH/USDT', price: '3,521.78', change: 1.87, sparkline: [3450, 3470, 3460, 3490, 3500, 3510, 3515, 3521] },
  { pair: 'BNB/USDT', price: '612.45', change: -0.54, sparkline: [615, 614, 613.5, 613, 612.8, 612.6, 612.5, 612.45] },
  { pair: 'SOL/USDT', price: '178.92', change: 5.21, sparkline: [170, 172, 171, 174, 176, 177, 178, 178.92] },
  { pair: 'XRP/USDT', price: '0.6234', change: -1.23, sparkline: [0.631, 0.629, 0.627, 0.626, 0.625, 0.624, 0.6235, 0.6234] },
];

const signals = [
  { instrument: 'EUR/USD', direction: 'BUY' as const, confidence: 87, timeAgo: '5 min ago' },
  { instrument: 'BTC/USDT', direction: 'BUY' as const, confidence: 92, timeAgo: '12 min ago' },
  { instrument: 'GBP/JPY', direction: 'SELL' as const, confidence: 73, timeAgo: '28 min ago' },
];

const newsItems = [
  { category: 'Macro', headline: 'Fed signals potential rate cuts in Q3 as inflation cools below 3%', timeAgo: '2h ago', sentiment: 'positive' as const },
  { category: 'Technical', headline: 'Bitcoin breaks key resistance at $67K, eyes $70K target', timeAgo: '4h ago', sentiment: 'positive' as const },
  { category: 'Fundamental', headline: 'ECB maintains hawkish stance on eurozone monetary policy', timeAgo: '6h ago', sentiment: 'neutral' as const },
];

const aiLayers = [
  { name: 'Layer 0', status: 'Active', color: 'var(--accent-green)' },
  { name: 'Perplexity', status: 'Active', color: 'var(--accent-green)' },
  { name: 'DeepSeek', status: 'Active', color: 'var(--accent-green)' },
  { name: 'Kimi', status: 'Fallback', color: 'var(--accent-orange)' },
  { name: 'Claude', status: 'Active', color: 'var(--accent-green)' },
];

// --- Helper: 3D Tilt Handler ---
function use3DTilt() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
    el.style.setProperty('--rotate-x', `${-y * 8}deg`);
    el.style.setProperty('--rotate-y', `${x * 8}deg`);
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  };
  return { handleMouseMove, handleMouseLeave };
}

// --- Greeting ---
function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t('overview.greeting.morning');
  if (hour < 18) return t('overview.greeting.afternoon');
  return t('overview.greeting.evening');
}

function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  // Forex open Sun 22:00 UTC to Fri 22:00 UTC
  if (day === 6) return false;
  if (day === 0 && hour < 22) return false;
  if (day === 5 && hour >= 22) return false;
  return true;
}

// --- Hero Section ---
function HeroSection() {
  const { t } = useTranslation();
  const [time, setTime] = useState('');
  const marketOpen = isMarketOpen();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const quickStats = [
    { label: 'DXY', value: '104.23' },
    { label: 'VIX', value: '13.45' },
    { label: 'GOLD', value: '2,341.80' },
    { label: 'BTC', value: '67,432' },
  ];

  return (
    <section className="relative w-full h-[220px] sm:h-[260px] lg:h-[320px] rounded-xl overflow-hidden">
      <ParticleCanvas />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--grad-dark)', opacity: 0.7, zIndex: 1 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-[640px]">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-sm sm:text-base mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {getGreeting(t)},
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-[36px] sm:text-[48px] lg:text-[64px] font-bold leading-tight"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
            }}
          >
            FOREXAI Terminal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-sm sm:text-base mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Real-time market intelligence powered by AI
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex items-center gap-3 mt-3"
          >
            <span
              className="text-sm sm:text-base font-bold hidden sm:inline"
              style={{
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                color: 'var(--accent-gold)',
              }}
            >
              {time}
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: marketOpen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: marketOpen ? 'var(--accent-green)' : 'var(--accent-red)',
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'animate-pulse-dot' : ''}`} style={{ backgroundColor: 'currentColor' }} />
              {t('overview.marketStatus')}: {marketOpen ? t('common.open') : t('common.closed')}
            </span>
          </motion.div>
        </div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center gap-2 flex-wrap self-end"
        >
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
              <span
                className="font-semibold"
                style={{
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  color: 'var(--text-primary)',
                }}
              >
                {stat.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// --- Quick Access Tiles ---
function QuickAccessTiles() {
  const navigate = useNavigate();
  const tilt = use3DTilt();

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {quickTiles.map((tile, i) => {
        const Icon = tile.icon;
        return (
          <motion.div
            key={tile.label}
            variants={cardEntrance}
            custom={i}
            onClick={() => navigate(tile.path)}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="relative flex flex-col justify-between p-4 sm:p-5 rounded-[10px] cursor-pointer min-h-[100px] sm:min-h-[120px] transition-all duration-150 group"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              transformStyle: 'preserve-3d',
            }}
            whileHover={{ borderColor: `${tile.color}4D` }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-start justify-between">
              <Icon size={28} style={{ color: tile.color }} />
              <ChevronRight
                size={16}
                className="transition-transform duration-150 group-hover:translate-x-1"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {tile.description}
              </h3>
              <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {tile.detail}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.section>
  );
}

// --- Market Summary Cards ---
function MarketSummaryCards() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {/* Forex Summary */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Globe size={16} style={{ color: 'var(--accent-green)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Forex {t('overview.marketStatus')}</h3>
          </div>
          <button
            onClick={() => navigate('/forex')}
            className="text-xs flex items-center gap-0.5 transition-colors hover:underline"
            style={{ color: 'var(--accent-gold)' }}
          >
            {t('overview.viewAll')} <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-2">
          {forexPairs.map((pair, i) => {
            const isPositive = pair.change >= 0;
            return (
              <motion.div
                key={pair.pair}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
              >
                <span className="text-sm w-20" style={{ color: 'var(--text-primary)' }}>{pair.pair}</span>
                <span
                  className="text-sm font-semibold w-16 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-primary)',
                  }}
                >
                  {pair.rate.toFixed(4)}
                </span>
                <span
                  className="text-xs w-14 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
                  }}
                >
                  {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                </span>
                <div className="w-[60px] sm:w-[80px] flex justify-end">
                  <Sparkline
                    data={pair.sparkline}
                    width={80}
                    height={28}
                    color={isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)'}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t text-[11px]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          {t('overview.lastUpdated')}: {new Date().toISOString().slice(11, 16)} UTC
        </div>
      </motion.div>

      {/* Crypto Summary */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Bitcoin size={16} style={{ color: 'var(--accent-orange)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Crypto {t('overview.marketStatus')}</h3>
          </div>
          <button
            onClick={() => navigate('/crypto')}
            className="text-xs flex items-center gap-0.5 transition-colors hover:underline"
            style={{ color: 'var(--accent-gold)' }}
          >
            {t('overview.viewAll')} <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-2">
          {cryptoPairs.map((pair, i) => {
            const isPositive = pair.change >= 0;
            return (
              <motion.div
                key={pair.pair}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
              >
                <span className="text-sm w-24" style={{ color: 'var(--text-primary)' }}>{pair.pair}</span>
                <span
                  className="text-sm font-semibold w-20 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-primary)',
                  }}
                >
                  {pair.price}
                </span>
                <span
                  className="text-xs w-14 text-right"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)',
                  }}
                >
                  {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                </span>
                <div className="w-[60px] sm:w-[80px] flex justify-end">
                  <Sparkline
                    data={pair.sparkline}
                    width={80}
                    height={28}
                    color={isPositive ? 'var(--chart-bullish)' : 'var(--chart-bearish)'}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="status-dot online pulse" />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('overview.wsConnected')}</span>
        </div>
      </motion.div>

      {/* AI Signal Summary */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: 'var(--accent-gold)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Latest {t('overview.aiSignals')}</h3>
          </div>
          <button
            onClick={() => navigate('/signals')}
            className="text-xs flex items-center gap-0.5 transition-colors hover:underline"
            style={{ color: 'var(--accent-gold)' }}
          >
            {t('overview.viewAll')} <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-3 space-y-3">
          {signals.map((signal, i) => (
            <motion.div
              key={`${signal.instrument}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{signal.instrument}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: signal.direction === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: signal.direction === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}
                  >
                    {signal.direction}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${signal.confidence}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold shrink-0"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    {signal.confidence}%
                  </span>
                </div>
              </div>
              <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{signal.timeAgo}</span>
            </motion.div>
          ))}
        </div>
        <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="status-dot pulse" style={{ backgroundColor: 'var(--accent-purple)', boxShadow: '0 0 6px rgba(139,92,246,0.5)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('overview.ensembleActive')}</span>
        </div>
      </motion.div>
    </motion.section>
  );
}

// --- News Preview Strip ---
function NewsPreviewStrip() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const editionTime = '08:00 UTC';

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'positive': return 'var(--accent-green)';
      case 'negative': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('overview.latestNews')}</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Morning Edition • {editionTime}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {newsItems.map((news, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            onClick={() => navigate('/news')}
            className="shrink-0 w-[260px] sm:w-[280px] p-4 rounded-[10px] cursor-pointer transition-transform duration-200 hover:-translate-y-1 snap-start"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                }}
              >
                {news.category}
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSentimentColor(news.sentiment) }}
              />
            </div>
            <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {news.headline}
            </p>
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{news.timeAgo}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// --- AI Status Panel ---
function AIStatusPanel() {
  const { t } = useTranslation();
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="mt-6 rounded-[10px] p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(59,130,246,0.2)',
        backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 50%)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <BrainCircuit size={18} style={{ color: 'var(--accent-purple)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('overview.aiEngineStatus')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {aiLayers.map((layer) => (
            <div
              key={layer.name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${layer.status === 'Active' ? 'animate-pulse-dot' : ''}`}
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {layer.name}: {layer.status}
              </span>
            </div>
          ))}
        </div>
        <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
          {t('overview.lastAnalysis')}: 4 min
        </span>
      </div>
    </motion.section>
  );
}

// --- Main Overview Page ---
export default function Overview() {
  return (
    <div>
      <HeroSection />
      <QuickAccessTiles />
      <div className="mt-6 -mx-3 sm:-mx-4 lg:-mx-6">
        <LiveTicker items={[]} />
      </div>
      <MarketSummaryCards />
      <NewsPreviewStrip />
      <AIStatusPanel />
    </div>
  );
}
