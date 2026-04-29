import { useState } from 'react';
import { Calculator, Globe, TrendingUp, Brain, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const layers = [
  { id: 0, name: 'Layer 0: Deterministic Strategies', icon: Calculator, color: '#3B82F6', desc: 'Technical indicator convergence — RSI, MACD, MA crossovers, Bollinger Bands', status: 'Active', weight: '20%' },
  { id: 1, name: 'Layer 1: Perplexity Macro', icon: Globe, color: '#00E396', desc: 'Real-time macroeconomic data, news sentiment, geopolitical events', status: 'Active', weight: '20%' },
  { id: 2, name: 'Layer 2: DeepSeek Technical', icon: TrendingUp, color: '#8B5CF6', desc: 'Advanced pattern recognition, support/resistance analysis, wave theory', status: 'Active', weight: '20%' },
  { id: 3, name: 'Layer 3: Kimi Synthesis', icon: Brain, color: '#F59E0B', desc: 'Cross-model synthesis, sentiment weighting, contradiction detection', status: 'Fallback to Claude', weight: '20%' },
  { id: 4, name: 'Layer 4: Claude Verdict', icon: Shield, color: '#F0B90B', desc: 'Final adjudication, risk assessment, confidence calibration', status: 'Active', weight: '20%' },
];

export default function EnsembleExplorer() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            5-Layer Ensemble Breakdown
          </span>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Pipeline visualization */}
          <div className="flex items-center gap-1 mb-3 px-2">
            {layers.map((layer, i) => (
              <div key={layer.id} className="flex items-center flex-1">
                <div
                  className="flex-1 h-0.5 rounded-full"
                  style={{
                    backgroundColor: layer.color,
                    opacity: 0.6,
                  }}
                />
                {i < layers.length - 1 && (
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 -ml-0.5"
                    style={{ backgroundColor: layer.color }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Layer cards */}
          <div className="space-y-2">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: `3px solid ${layer.color}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                    style={{ backgroundColor: `${layer.color}15` }}
                  >
                    <Icon size={18} style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {layer.name}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {layer.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: layer.status === 'Active' ? 'rgba(0,227,150,0.15)' : 'rgba(245,158,11,0.15)',
                        color: layer.status === 'Active' ? '#00E396' : '#F59E0B',
                      }}
                    >
                      {layer.status}
                    </span>
                    <span className="text-xs data-font" style={{ color: 'var(--text-muted)' }}>
                      {layer.weight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
