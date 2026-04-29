import { TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Agent } from '@/hooks/useLogicLab';

interface AgentPodProps {
  agent: Agent;
}

const iconMap = {
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  Minus: Minus,
  Scale: Scale,
};

export default function AgentPod({ agent }: AgentPodProps) {
  const { t } = useTranslation();
  const Icon = iconMap[agent.icon as keyof typeof iconMap] || Minus;
  const isSpeaking = agent.status === 'speaking';
  const isThinking = agent.status === 'thinking';

  return (
    <div
      className="relative flex flex-col items-center p-3 rounded-lg transition-all"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-card)',
        borderTop: `3px solid ${agent.color}`,
        opacity: agent.status === 'idle' ? 0.7 : 1,
        minWidth: '140px',
        transform: isSpeaking ? 'translateZ(15px)' : 'translateZ(0)',
      }}
    >
      {/* Avatar */}
      <div
        className="relative flex items-center justify-center w-12 h-12 rounded-full mb-2"
        style={{
          backgroundColor: `${agent.color}20`,
          boxShadow: isSpeaking ? `0 0 20px ${agent.color}40` : 'none',
          transition: 'box-shadow 300ms',
        }}
      >
        <Icon size={22} style={{ color: agent.color }} />
        {isThinking && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-dot"
            style={{ border: `2px solid ${agent.color}`, opacity: 0.5 }}
          />
        )}
      </div>

      {/* Name & Role */}
      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {agent.name}
      </span>
      <span className="text-xs mt-0.5" style={{ color: agent.color }}>
        {agent.role === 'bull' ? t('logicLab.agents.bull') : agent.role === 'bear' ? t('logicLab.agents.bear') : agent.role === 'neutral' ? t('logicLab.agents.neutral') : t('logicLab.agents.arbitrator')}
      </span>

      {/* Status */}
      <div className="flex items-center gap-1.5 mt-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: isThinking ? agent.color : isSpeaking ? agent.color : 'var(--text-disabled)',
            animation: isThinking ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }}
        />
        <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
          {isThinking ? t('logicLab.status.thinking') : isSpeaking ? t('logicLab.status.speaking') : t('logicLab.status.idle')}
        </span>
      </div>

      {/* Soundwave bars when speaking */}
      {isSpeaking && (
        <div className="flex items-end gap-0.5 mt-2 h-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                backgroundColor: agent.color,
                height: '100%',
                animation: `pulse-dot ${0.8 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
