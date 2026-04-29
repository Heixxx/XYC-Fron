import { motion } from 'framer-motion';

export interface SearchItem {
  label: string;
  icon: string;
  type: string;
  sym: string;
  dec: number;
  kw: string[];
}

interface SearchDropdownProps {
  query: string;
  onSelect: (item: SearchItem) => void;
  searchIndex: SearchItem[];
}

export default function SearchDropdown({ query, onSelect, searchIndex }: SearchDropdownProps) {
  const filtered = query.length >= 1
    ? searchIndex.filter((item) =>
        item.kw.some((k) => k.includes(query.toLowerCase())) ||
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : searchIndex;

  const categories = [
    { label: 'Crypto', items: filtered.filter((i) => i.type === 'binance') },
    { label: 'Forex & Commodities', items: filtered.filter((i) => i.type === 'yahoo') },
  ];

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full left-0 right-0 mt-2 rounded-lg border p-6 text-center z-50"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-default)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No instruments found</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 right-0 mt-2 rounded-lg border overflow-hidden z-50"
      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-3d)' }}
    >
      {categories.map((cat) =>
        cat.items.length === 0 ? null : (
          <div key={cat.label} className="border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {cat.label}
            </div>
            {cat.items.map((item, i) => (
              <motion.button
                key={`${item.sym}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => onSelect(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: item.type === 'binance' ? 'rgba(240,185,11,0.12)' : 'rgba(59,130,246,0.12)',
                        color: item.type === 'binance' ? 'var(--accent-gold)' : 'var(--accent-blue)',
                      }}
                    >
                      {item.type === 'binance' ? 'Crypto' : item.label.includes('Gold') || item.label.includes('Silver') || item.label.includes('Oil') ? 'Commodity' : 'Forex'}
                    </span>
                  </div>
                  <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>{item.sym}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}
