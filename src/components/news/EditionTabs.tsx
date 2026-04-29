import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { EditionType } from '@/hooks/useNews';
import { getEditionTime, isEditionUnlocked } from '@/hooks/useNews';

interface EditionTabsProps {
  active: EditionType;
  onSelect: (ed: EditionType) => void;
}

export default function EditionTabs({ active, onSelect }: EditionTabsProps) {
  const { t } = useTranslation();
  const editions: { key: EditionType; label: string }[] = [
    { key: 'morning', label: t('edition.morning') },
    { key: 'noon', label: t('edition.noon') },
    { key: 'evening', label: t('edition.evening') },
  ];
  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      {editions.map((ed) => {
        const unlocked = isEditionUnlocked(ed.key);
        const isActive = active === ed.key;
        return (
          <button
            key={ed.key}
            onClick={() => unlocked && onSelect(ed.key)}
            disabled={!unlocked}
            className="relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive
                ? 'var(--text-primary)'
                : unlocked
                ? 'var(--text-muted)'
                : 'var(--text-disabled)',
              cursor: unlocked ? 'pointer' : 'not-allowed',
              opacity: unlocked ? 1 : 0.5,
            }}
          >
            {!unlocked && <Lock size={12} />}
            <span>{ed.label} Edition</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({getEditionTime(ed.key)})
            </span>
            {isActive && (
              <motion.div
                layoutId="edition-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--accent-gold)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
