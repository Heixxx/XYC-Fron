import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, Skull, Zap, Flame, Landmark, Play } from 'lucide-react';
import { STRESS_SCENARIOS } from '@/hooks/useLogicLab';

interface StressTestPanelProps {
  open: boolean;
  onToggle: () => void;
  onRun: (scenarioId: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Skull: Skull,
  Zap: Zap,
  Flame: Flame,
  Landmark: Landmark,
};

export default function StressTestPanel({ open, onToggle, onRun }: StressTestPanelProps) {
  const [expanded, setExpanded] = useState(open);

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <button
        onClick={() => { setExpanded(!expanded); onToggle(); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={18} style={{ color: 'var(--accent-purple)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Stress Test Scenarios
          </span>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Test AI reasoning under extreme scenarios
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STRESS_SCENARIOS.map((scenario) => {
              const Icon = iconMap[scenario.icon] || Zap;
              return (
                <div
                  key={scenario.id}
                  className="flex flex-col p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderLeft: '3px solid var(--accent-purple)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} style={{ color: 'var(--accent-purple)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {scenario.name}
                    </span>
                  </div>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {scenario.description}
                  </p>
                  <button
                    onClick={() => onRun(scenario.id)}
                    className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                    style={{
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Play size={12} />
                    Run
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
