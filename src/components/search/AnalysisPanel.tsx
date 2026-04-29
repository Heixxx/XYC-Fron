import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Fish, RefreshCw } from 'lucide-react';
import type { SearchItem } from './SearchDropdown';

interface AnalysisPanelProps {
  item: SearchItem;
}

interface WhaleTx {
  time: string;
  type: 'BUY' | 'SELL';
  size: string;
  price: string;
}

export default function AnalysisPanel({ item }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState('');
  const [trend, setTrend] = useState<'Bullish' | 'Bearish' | 'Neutral'>('Neutral');
  const [confidence, setConfidence] = useState(50);
  const [whales, setWhales] = useState<WhaleTx[]>([]);

  useEffect(() => {
    // Generate mock analysis based on instrument
    const analyses: Record<string, string> = {
      BTC: `Bitcoin is currently showing mixed signals across multiple timeframes. The daily chart reveals a consolidation pattern after the recent breakout, with price holding above the key psychological $60K support level. Volume profile indicates strong accumulation in the $58K-$62K range, suggesting institutional interest remains robust. On-chain metrics show exchange reserves continuing to decline, historically a bullish precursor. However, funding rates are elevated, which may signal overcrowded positioning in the short term. The 4-hour RSI is approaching overbought territory at 68, suggesting a potential pullback before the next leg up. Key resistance lies at $68,000 and $72,000, while support is solid at $58,000 and $52,000. A break above $68K with volume could trigger a rapid move toward all-time highs. Traders should watch for divergence between price and momentum indicators.`,
      ETH: `Ethereum continues to demonstrate strength relative to the broader altcoin market. The ETH/BTC ratio has stabilized above 0.055, providing a foundation for USD-denominated gains. Technical analysis shows a clear ascending channel formation on the 4-hour chart, with the 20 EMA providing dynamic support. The recent Dencun upgrade has reduced L2 transaction costs by over 90%, driving increased network activity and fee burn. Staking inflows remain consistent at ~30K ETH per week, reducing liquid supply. Resistance is expected at $3,800 and $4,000, with support at $3,200 and $2,900. The DeFi ecosystem on Ethereum shows TVL growth of 12% month-over-month, indicating healthy fundamental demand. Watch for a potential golden cross on the daily timeframe.`,
    };

    const sym = item.sym.replace('USDT', '').replace('=X', '').replace('=F', '');
    const text = analyses[sym] || `${item.label} is displaying interesting price action in the current market environment. Technical indicators suggest a ${Math.random() > 0.5 ? 'bullish' : 'bearish'} bias on the higher timeframes, with key support and resistance levels being tested. Volume analysis indicates ${Math.random() > 0.5 ? 'strong' : 'moderate'} participation from institutional players. The ${Math.random() > 0.5 ? '4-hour' : 'daily'} chart shows a ${Math.random() > 0.5 ? 'consolidation pattern' : 'trend continuation setup'} that could resolve in the coming sessions. Traders should monitor the identified key levels for breakout confirmation.`;

    setAnalysis(text);
    setTrend(Math.random() > 0.6 ? 'Bullish' : Math.random() > 0.5 ? 'Bearish' : 'Neutral');
    setConfidence(40 + Math.floor(Math.random() * 50));

    // Generate mock whale transactions
    const txs: WhaleTx[] = [];
    for (let i = 0; i < 6; i++) {
      const hoursAgo = i * 2 + Math.floor(Math.random() * 2);
      const mins = Math.floor(Math.random() * 60);
      txs.push({
        time: `${String(hoursAgo).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
        type: Math.random() > 0.4 ? 'BUY' : 'SELL',
        size: `${(0.5 + Math.random() * 4.5).toFixed(1)}M`,
        price: item.type === 'binance'
          ? (30000 + Math.random() * 40000).toFixed(0)
          : (1.0 + Math.random() * 0.2).toFixed(5),
      });
    }
    setWhales(txs);
  }, [item]);

  const trendColor = trend === 'Bullish' ? 'var(--chart-bullish)' : trend === 'Bearish' ? 'var(--chart-bearish)' : 'var(--accent-gold)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', borderLeft: '3px solid var(--accent-gold)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Market Analysis</span>
          </div>
          <button
            onClick={() => { setAnalysis((p) => p + ' [refreshed]'); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${trendColor}20`, color: trendColor }}
            >
              {trend}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Confidence: {confidence}%
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {analysis}
          </p>
          <div className="text-[10px] pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            Powered by AI Analysis Engine &bull; Simulated for demo
          </div>
        </div>
      </motion.div>

      {/* Right: Whale Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <Fish size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Whale Transactions</span>
        </div>
        <div>
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span>Time</span>
            <span>Type</span>
            <span>Size</span>
            <span className="text-right">Price</span>
          </div>
          {/* Rows */}
          {whales.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              className="grid grid-cols-4 gap-2 px-4 py-2 border-t text-xs"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: 'var(--border-subtle)',
                borderLeft: `3px solid ${tx.type === 'BUY' ? 'var(--chart-bullish)' : 'var(--chart-bearish)'}`,
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{tx.time}</span>
              <span
                className="font-semibold"
                style={{ color: tx.type === 'BUY' ? 'var(--chart-bullish)' : 'var(--chart-bearish)' }}
              >
                {tx.type}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{tx.size}</span>
              <span className="text-right" style={{ color: 'var(--text-secondary)' }}>{tx.price}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
