import { motion } from 'framer-motion';

export interface SearchItem {
  label: string;
  icon: string;
  type: string;
  sym: string;
  dec: number;
  kw: string[];
}

interface RelatedInstrumentsProps {
  currentItem: SearchItem;
  allItems: SearchItem[];
  onSelect: (item: SearchItem) => void;
}

export default function RelatedInstruments({ currentItem, allItems, onSelect }: RelatedInstrumentsProps) {
  // Find related: same type, excluding current
  const related = allItems
    .filter((i) => i.type === currentItem.type && i.sym !== currentItem.sym)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Related Instruments
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {related.map((item, i) => (
          <motion.button
            key={item.sym}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => onSelect(item)}
            className="shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all hover:-translate-y-1"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              minWidth: 180,
            }}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="text-left">
              <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                {item.label}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.sym}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
