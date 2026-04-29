import { useRef, useEffect } from 'react';
// motion removed - unused
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  focused: boolean;
}

export default function SearchBar({ value, onChange, onFocus, onBlur, focused }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative w-full" style={{ maxWidth: focused ? 660 : 640 }}>
      <div
        className="flex items-center gap-3 px-4 transition-all duration-200"
        style={{
          height: 52,
          backgroundColor: 'var(--bg-input)',
          border: focused ? '1px solid var(--accent-blue)' : '1px solid var(--border-default)',
          borderRadius: 9999,
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        }}
      >
        <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur, 200)}
          placeholder="Search EUR/USD, BTC, Gold, Oil..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-gold)' }}
        />
        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={14} />
          </button>
        )}
        {!value && (
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            ⌘K
          </span>
        )}
      </div>
    </div>
  );
}
