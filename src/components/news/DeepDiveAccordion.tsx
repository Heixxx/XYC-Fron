import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeepDiveSection {
  title: string;
  content: string;
}

interface DeepDiveAccordionProps {
  sections: DeepDiveSection[];
}

export default function DeepDiveAccordion({ sections }: DeepDiveAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
      {sections.map((section, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border-b last:border-b-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
              style={{ backgroundColor: isOpen ? 'var(--bg-surface)' : 'var(--bg-secondary)' }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {section.title}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] as [number, number, number, number] }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 pb-4 pt-1 text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
