import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CachedAnalysis } from '@/hooks/useVision';

interface RecentAnalysesGalleryProps {
  analyses: CachedAnalysis[];
  onLoad: (a: CachedAnalysis) => void;
  onClear: () => void;
}

export default function RecentAnalysesGallery({ analyses, onLoad, onClear }: RecentAnalysesGalleryProps) {
  if (analyses.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Analyses</h3>
        <button
          onClick={onClear}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          Clear All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => onLoad(a)}
            className="flex-shrink-0 w-[200px] rounded-lg overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="h-[100px] relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              {a.thumbnail && (
                <img
                  src={a.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-1.5 right-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: a.result.sentiment === 'Bullish' ? 'rgba(0,227,150,0.3)' : a.result.sentiment === 'Bearish' ? 'rgba(255,69,96,0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {a.result.sentiment === 'Bullish' ? (
                    <TrendingUp size={12} style={{ color: 'var(--accent-green)' }} />
                  ) : (
                    <TrendingDown size={12} style={{ color: 'var(--accent-red)' }} />
                  )}
                </div>
              </div>
            </div>
            <div className="p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {a.instrument}
                </span>
                <span className="text-xs data-font" style={{ color: 'var(--text-muted)' }}>
                  {a.result.confidence}%
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {new Date(a.timestamp).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
