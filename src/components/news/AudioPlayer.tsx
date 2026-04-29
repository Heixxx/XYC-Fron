import { Play, Pause, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  isPlaying: boolean;
  onToggle: () => void;
  rate: number;
  onRateChange: (r: number) => void;
}

export default function AudioPlayer({ isPlaying, onToggle, rate, onRateChange }: AudioPlayerProps) {
  const speeds = [1, 1.5, 2];

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Headphones size={16} style={{ color: 'var(--accent-gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Audio Briefing
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-transform duration-150 active:scale-95"
          style={{ background: 'var(--grad-gold)' }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} style={{ color: '#050508' }} />
          ) : (
            <Play size={20} style={{ color: '#050508' }} className="ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isPlaying ? 'Playing briefing...' : 'Listen to briefing'}
            </span>
          </div>

          {/* Simulated waveform */}
          <div className="flex items-center gap-[3px] h-6">
            {Array.from({ length: 32 }).map((_, i) => {
              return (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full"
                  animate={{
                    height: isPlaying ? [4, 16 + Math.random() * 12, 4] : 3,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.03,
                    ease: 'easeInOut',
                  }}
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                />
              );
            })}
          </div>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onRateChange(s)}
              className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
              style={{
                color: rate === s ? '#050508' : 'var(--text-muted)',
                backgroundColor: rate === s ? 'var(--accent-gold)' : 'transparent',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
