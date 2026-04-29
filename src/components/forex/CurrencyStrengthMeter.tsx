import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface CurrencyStrengthMeterProps {
  rates: Record<string, { changePct: number }>;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

export default function CurrencyStrengthMeter({ rates }: CurrencyStrengthMeterProps) {
  const strength = calculateStrength(rates);

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Currency Strength
        </h3>
      </div>

      <div className="space-y-3">
        {CURRENCIES.map((currency, index) => {
          const val = strength[currency] ?? 50;
          const isStrong = val >= 50;
          const color = isStrong ? 'var(--accent-green)' : 'var(--accent-red)';
          const barWidth = Math.abs(val - 50) * 2; // 0-100 scale

          return (
            <motion.div
              key={currency}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className="flex items-center gap-3"
            >
              <span
                className="text-xs font-bold data-font w-8 text-right shrink-0"
                style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {currency}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: '50%', backgroundColor: 'var(--border-subtle)' }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: color,
                    marginLeft: isStrong ? '50%' : undefined,
                    marginRight: isStrong ? undefined : undefined,
                    float: isStrong ? 'left' : 'right',
                    position: 'absolute',
                    left: isStrong ? '50%' : undefined,
                    right: isStrong ? undefined : '50%',
                  }}
                />
              </div>
              <span
                className="text-[10px] data-font w-8 tabular-nums"
                style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {val.toFixed(0)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        Calculated from rate changes across all pairs
      </p>
    </div>
  );
}

function calculateStrength(rates: Record<string, { changePct: number }>): Record<string, number> {
  const strength: Record<string, number> = {};
  const fxPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'AUD/JPY',
  ];

  for (const pair of fxPairs) {
    const rate = rates[pair];
    if (!rate) continue;
    const [base, quote] = pair.split('/');
    if (!strength[base]) strength[base] = 50;
    if (!strength[quote]) strength[quote] = 50;
    if (base === 'USD') {
      strength[quote] = 50 - rate.changePct * 5;
    } else if (quote === 'USD') {
      strength[base] = 50 + rate.changePct * 5;
    }
  }

  // Normalize to 0-100
  for (const curr of Object.keys(strength)) {
    strength[curr] = Math.max(0, Math.min(100, strength[curr] ?? 50));
  }

  // Ensure all currencies have a value
  for (const c of CURRENCIES) {
    if (strength[c] === undefined) strength[c] = 50;
  }

  return strength;
}
