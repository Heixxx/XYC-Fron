import { QUICK_PROMPTS } from '@/hooks/useLogicLab';

interface QuickPromptsBarProps {
  onSelect: (prompt: string) => void;
}

export default function QuickPromptsBar({ onSelect }: QuickPromptsBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
      }}
    >
      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>Quick Prompts:</span>
      {QUICK_PROMPTS.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs transition-all hover:opacity-80 active:scale-95"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
