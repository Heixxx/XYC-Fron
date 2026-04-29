import { useRef, useEffect } from 'react';
import type { DebateMessage } from '@/hooks/useLogicLab';

interface DebateTranscriptProps {
  messages: DebateMessage[];
  isDebating: boolean;
}

export default function DebateTranscript({ messages, isDebating }: DebateTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getTypeLabel = (type: DebateMessage['type']) => {
    switch (type) {
      case 'opening': return 'Opening';
      case 'rebuttal': return 'Rebuttal';
      case 'evidence': return 'Evidence';
      case 'synthesis': return 'Synthesis';
      case 'verdict': return 'Verdict';
      default: return '';
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      style={{ maxHeight: '400px' }}
    >
      {messages.length === 0 && !isDebating && (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Start a debate to see the transcript here
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className="flex gap-3"
          style={{
            animation: 'slide-up 0.3s ease-out',
            paddingLeft: msg.type === 'rebuttal' ? '16px' : '0',
          }}
        >
          {/* Agent dot */}
          <div className="shrink-0 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: msg.agentColor }}
            />
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold" style={{ color: msg.agentColor }}>
                {msg.agentName}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${msg.agentColor}15`,
                  color: msg.agentColor,
                  fontSize: '10px',
                }}
              >
                {getTypeLabel(msg.type)}
              </span>
            </div>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-primary)' }}
            >
              {msg.content}
            </p>
          </div>
        </div>
      ))}

      {isDebating && messages.length > 0 && messages[messages.length - 1].type !== 'verdict' && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--accent-gold)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Agents are reasoning...</span>
        </div>
      )}
    </div>
  );
}
