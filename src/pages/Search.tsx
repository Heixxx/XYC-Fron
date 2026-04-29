import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/search/SearchBar';
import SearchDropdown, { type SearchItem } from '@/components/search/SearchDropdown';
import InstrumentProfile from '@/components/search/InstrumentProfile';
import SearchChart from '@/components/search/SearchChart';
import AnalysisPanel from '@/components/search/AnalysisPanel';
import RelatedInstruments from '@/components/search/RelatedInstruments';
const SEARCH_INDEX: SearchItem[] = [
  { kw:["gold","zloto","xau"], label:"Gold (XAU/USD)", icon:"🥇", type:"yahoo", sym:"GC=F", dec:2 },
  { kw:["paxg"], label:"PAX Gold", icon:"🥇", type:"binance", sym:"PAXGUSDT", dec:2 },
  { kw:["bitcoin","btc"], label:"Bitcoin", icon:"₿", type:"binance", sym:"BTCUSDT", dec:2 },
  { kw:["ethereum","eth"], label:"Ethereum", icon:"Ξ", type:"binance", sym:"ETHUSDT", dec:2 },
  { kw:["bnb"], label:"BNB", icon:"🔶", type:"binance", sym:"BNBUSDT", dec:2 },
  { kw:["solana","sol"], label:"Solana", icon:"◎", type:"binance", sym:"SOLUSDT", dec:3 },
  { kw:["xrp"], label:"XRP", icon:"✦", type:"binance", sym:"XRPUSDT", dec:5 },
  { kw:["doge"], label:"Dogecoin", icon:"🐕", type:"binance", sym:"DOGEUSDT", dec:6 },
  { kw:["eur/usd","eurusd"], label:"EUR/USD", icon:"💱", type:"yahoo", sym:"EURUSD=X", dec:5 },
  { kw:["gbp/usd","gbpusd"], label:"GBP/USD", icon:"💱", type:"yahoo", sym:"GBPUSD=X", dec:5 },
  { kw:["usd/jpy","usdjpy"], label:"USD/JPY", icon:"💱", type:"yahoo", sym:"JPY=X", dec:3 },
  { kw:["usd/chf"], label:"USD/CHF", icon:"💱", type:"yahoo", sym:"CHF=X", dec:5 },
  { kw:["aud/usd"], label:"AUD/USD", icon:"💱", type:"yahoo", sym:"AUDUSD=X", dec:5 },
  { kw:["usd/cad"], label:"USD/CAD", icon:"💱", type:"yahoo", sym:"CAD=X", dec:5 },
  { kw:["eur/jpy"], label:"EUR/JPY", icon:"💱", type:"yahoo", sym:"EURJPY=X", dec:3 },
  { kw:["gbp/jpy"], label:"GBP/JPY", icon:"💱", type:"yahoo", sym:"GBPJPY=X", dec:3 },
  { kw:["silver","srebro"], label:"Silver", icon:"🥈", type:"yahoo", sym:"SI=F", dec:3 },
  { kw:["oil","ropa","wti"], label:"Crude Oil (WTI)", icon:"🛢", type:"yahoo", sym:"CL=F", dec:2 },
];

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);

  const handleSelect = (item: SearchItem) => {
    setSelectedItem(item);
    setQuery(item.label);
    setFocused(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* ─── Search Hero ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center rounded-lg border px-6 py-8 md:py-10 gap-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          background: `radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%), var(--bg-secondary)`,
        }}
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-2xl md:text-[28px] font-bold"
          style={{ color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}
        >
          {t('search.title')}
        </motion.h1>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {t('search.subtitle')}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="w-full flex justify-center relative"
          style={{ maxWidth: 660 }}
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            focused={focused}
          />
          <AnimatePresence>
            {(focused || query.length > 0) && (
              <SearchDropdown
                query={query}
                onSelect={handleSelect}
                searchIndex={SEARCH_INDEX}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ─── Selected Instrument Content ─── */}
      <AnimatePresence mode="wait">
        {selectedItem && (
          <motion.div
            key={selectedItem.sym}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="space-y-4"
          >
            {/* Profile Header */}
            <InstrumentProfile item={selectedItem} />

            {/* Chart */}
            <SearchChart
              symbol={selectedItem.sym}
              type={selectedItem.type as 'binance' | 'yahoo'}
              height={500}
            />

            {/* Analysis Panel */}
            <AnalysisPanel item={selectedItem} />

            {/* Related */}
            <RelatedInstruments
              currentItem={selectedItem}
              allItems={SEARCH_INDEX}
              onSelect={handleSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State ─── */}
      {!selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-lg border px-6 py-12 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('search.emptyState')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            {t('search.trySearching')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SEARCH_INDEX.slice(0, 8).map((item) => (
              <button
                key={item.sym}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
