import { useState, useRef, useCallback } from 'react';
import { Pause, Play, RotateCcw, Users, Clock, MessageCircle } from 'lucide-react';
import { useLogicLab } from '@/hooks/useLogicLab';
import AgentPod from '@/components/logic-lab/AgentPod';
import DebateTranscript from '@/components/logic-lab/DebateTranscript';
import StressTestPanel from '@/components/logic-lab/StressTestPanel';
import QuickPromptsBar from '@/components/logic-lab/QuickPromptsBar';
import VerdictCard from '@/components/logic-lab/VerdictCard';
import { useTranslation } from 'react-i18next';

export default function LogicLab() {
  const { t } = useTranslation();
  const {
    setTopic, messages, agents, isDebating, currentRound, totalRounds, setTotalRounds,
    verdict, verdictProbability, sessions,
    showRaw, setShowRaw,
    stressPanelOpen, setStressPanelOpen,
    startDebate, useQuickPrompt, runStressTest, sendMessage, stopDebate,
  } = useLogicLab();

  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    if (isDebating) {
      sendMessage(inputText);
    } else {
      setTopic(inputText);
      setTimeout(() => startDebate(), 50);
    }
    setInputText('');
  }, [inputText, isDebating, sendMessage, setTopic, startDebate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Page Header ─── */}
      <div
        className="relative rounded-[10px] p-4 sm:p-6 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%), var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[40px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Logic Lab
            </h1>
            <p className="text-base mt-1" style={{ color: 'var(--accent-purple)' }}>
              Multi-Agent AI Debate & Reasoning
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              3 AI agents debate market scenarios. Kimi arbitrates.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse-dot"
                style={{ backgroundColor: isDebating ? 'var(--accent-green)' : 'var(--text-muted)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isDebating ? t('logicLab.session.active') : t('logicLab.session.idle')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs data-font" style={{ color: 'var(--text-muted)' }}>
                {agents.filter((a) => a.status !== 'idle').length}/4 Agents Active
              </span>
            </div>
            {isDebating && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Round {Math.min(currentRound, totalRounds)} of {totalRounds}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Agent Status Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{
                backgroundColor: `${agent.color}15`,
                color: agent.color,
                border: `1px solid ${agent.color}30`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: agent.color,
                  animation: agent.status === 'thinking' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                }}
              />
              {agent.name} — {agent.role === 'bull' ? 'Bull' : agent.role === 'bear' ? 'Bear' : agent.role === 'neutral' ? 'Neutral' : 'Arbitrator'}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Debate Arena ─── */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          minHeight: '500px',
        }}
      >
        {/* Agent Pods */}
        <div className="flex flex-wrap justify-center gap-3 p-4 card-3d">
          {agents.map((agent) => (
            <AgentPod key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Debate Transcript */}
        <div
          className="mx-4 mb-4 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'rgba(13,19,33,0.8)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <MessageCircle size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Debate Transcript</span>
            {isDebating && (
              <span className="text-xs ml-auto data-font" style={{ color: 'var(--accent-gold)' }}>
                Round {currentRound}/{totalRounds}
              </span>
            )}
          </div>
          <DebateTranscript messages={messages} isDebating={isDebating} />
        </div>
      </div>

      {/* ─── Verdict Card ─── */}
      {verdict && (
        <VerdictCard
          verdict={verdict}
          probability={verdictProbability}
          showRaw={showRaw}
          setShowRaw={setShowRaw}
        />
      )}

      {/* ─── Topic Control Bar ─── */}
      <div
        className="rounded-[10px] p-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Topic input */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setTopic(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={isDebating ? 'Send a message to the debate...' : 'Enter a market topic to debate...'}
              className="w-full h-20 p-3 rounded-lg text-sm resize-none outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              }}
            />
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={isDebating ? stopDebate : handleSubmit}
              disabled={!inputText.trim() && !isDebating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isDebating ? 'var(--bg-input)' : 'var(--grad-gold)',
                color: isDebating ? 'var(--text-secondary)' : '#050508',
                border: isDebating ? '1px solid var(--border-default)' : 'none',
              }}
            >
              {isDebating ? (
                <><Pause size={16} /> Stop</>
              ) : (
                <><Play size={16} /> Start Debate</>
              )}
            </button>
            {isDebating && (
              <button
                onClick={() => { stopDebate(); startDebate(); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <RotateCcw size={16} /> Next Round
              </button>
            )}
          </div>
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Rounds selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rounds:</span>
            {[3, 5, 7].map((r) => (
              <button
                key={r}
                onClick={() => setTotalRounds(r)}
                className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                style={{
                  backgroundColor: totalRounds === r ? 'var(--accent-gold)' : 'var(--bg-input)',
                  color: totalRounds === r ? '#050508' : 'var(--text-secondary)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stress Test Panel ─── */}
      <StressTestPanel
        open={stressPanelOpen}
        onToggle={() => setStressPanelOpen(!stressPanelOpen)}
        onRun={runStressTest}
      />

      {/* ─── Quick Prompts Bar ─── */}
      <QuickPromptsBar onSelect={useQuickPrompt} />

      {/* ─── Session History ─── */}
      {sessions.length > 0 && (
        <div
          className="rounded-[10px] overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Past Sessions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {[t('logicLab.tableHeaders.topic'), t('logicLab.tableHeaders.agents'), t('logicLab.tableHeaders.rounds'), t('logicLab.tableHeaders.outcome'), t('logicLab.tableHeaders.date')].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:opacity-80 transition-opacity"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{s.topic.slice(0, 40)}...</td>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{s.agents.join(', ')}</td>
                    <td className="px-4 py-2 text-xs data-font" style={{ color: 'var(--text-secondary)' }}>{s.rounds}</td>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--accent-gold)' }}>{s.verdict.slice(0, 30)}...</td>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
