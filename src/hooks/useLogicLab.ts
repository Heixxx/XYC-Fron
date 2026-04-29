import { useState, useCallback, useRef, useEffect } from 'react';
import { callAIWithFallback } from '@/lib/ai-api';
import type { ChatMessage } from '@/lib/ai-api';

export type AgentRole = 'bull' | 'bear' | 'neutral' | 'arbitrator';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  color: string;
  icon: string;
  status: 'idle' | 'thinking' | 'speaking';
  confidence: number;
}

export interface DebateMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  type: 'opening' | 'rebuttal' | 'evidence' | 'synthesis' | 'verdict';
  content: string;
  timestamp: number;
  round: number;
}

export interface Session {
  id: string;
  topic: string;
  agents: string[];
  rounds: number;
  messages: DebateMessage[];
  verdict: string;
  verdictProbability: number;
  timestamp: number;
  duration: number;
}

export const AGENTS: Agent[] = [
  { id: 'claude-a', name: 'Claude-A', role: 'bull', color: '#3B82F6', icon: 'TrendingUp', status: 'idle', confidence: 0 },
  { id: 'claude-b', name: 'Claude-B', role: 'bear', color: '#EF4444', icon: 'TrendingDown', status: 'idle', confidence: 0 },
  { id: 'claude-c', name: 'Claude-C', role: 'neutral', color: '#10B981', icon: 'Minus', status: 'idle', confidence: 0 },
  { id: 'kimi', name: 'Kimi', role: 'arbitrator', color: '#F0B90B', icon: 'Scale', status: 'idle', confidence: 0 },
];

export const QUICK_PROMPTS = [
  'EUR/USD outlook next week?',
  'BTC next move analysis',
  'Fed rate decision impact on forex',
  'Gold safe haven status',
  'What if DXY breaks 105?',
  'Gold vs BTC correlation?',
  'EUR/USD support levels?',
  'Is the bull run over?',
  'Impact of oil on CAD?',
  'VIX spike analysis',
];

export const STRESS_SCENARIOS = [
  { id: 'black-swan', name: 'Black Swan', description: 'A major geopolitical event causes global markets to crash. Stocks drop 15%, VIX spikes to 60. How do forex and crypto markets react?', icon: 'Skull' },
  { id: 'dxy-spike', name: 'DXY Spike', description: 'US Dollar Index surges 5% in 48 hours after surprise Fed hawkish pivot. Impact on EUR/USD, GBP/USD, gold, and emerging markets?', icon: 'Zap' },
  { id: 'flash-crash', name: 'Flash Crash', description: 'BTC drops 30% in 10 minutes due to a major exchange liquidation cascade. How do agents respond to the chaos?', icon: 'Flame' },
  { id: 'bank-failure', name: 'Bank Failure', description: 'A systemically important bank fails. Credit markets freeze. Flight to safety or crypto hedge? Analyze the contagion risk.', icon: 'Landmark' },
];

export function useLogicLab() {
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [agents, setAgents] = useState<Agent[]>(AGENTS.map((a) => ({ ...a })));
  const [isDebating, setIsDebating] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [verdict, setVerdict] = useState('');
  const [verdictProbability, setVerdictProbability] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [rawResponses, setRawResponses] = useState<Record<string, string>>({});
  const [stressPanelOpen, setStressPanelOpen] = useState(false);
  const [transcriptScrollRef, setTranscriptScrollRef] = useState<HTMLDivElement | null>(null);
  const debateStartTime = useRef(0);
  const abortRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (transcriptScrollRef) {
      transcriptScrollRef.scrollTop = transcriptScrollRef.scrollHeight;
    }
  }, [messages, transcriptScrollRef]);

  const updateAgentStatus = useCallback((agentId: string, status: Agent['status']) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status } : a)));
  }, []);

  const addMessage = useCallback((msg: DebateMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Call a single agent
  const callAgent = useCallback(async (
    agent: Agent,
    messagesForAgent: ChatMessage[],
    round: number,
    type: DebateMessage['type']
  ): Promise<string> => {
    updateAgentStatus(agent.id, 'thinking');
    try {
      const res = await callAIWithFallback('claude', messagesForAgent, ['deepseek']);
      const content = res.content || 'No response';
      updateAgentStatus(agent.id, 'speaking');
      setTimeout(() => updateAgentStatus(agent.id, 'idle'), 2000);

      addMessage({
        id: `${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        agentColor: agent.color,
        type,
        content,
        timestamp: Date.now(),
        round,
      });

      setRawResponses((prev) => ({ ...prev, [`${agent.id}-${round}`]: content }));
      return content;
    } catch {
      const fallback = `[${agent.name} analysis for round ${round}]`;
      updateAgentStatus(agent.id, 'idle');
      return fallback;
    }
  }, [updateAgentStatus, addMessage]);

  // Start debate
  const startDebate = useCallback(async () => {
    if (!topic.trim()) return;
    abortRef.current = false;
    setIsDebating(true);
    setMessages([]);
    setVerdict('');
    setVerdictProbability(0);
    setRawResponses({});
    debateStartTime.current = Date.now();

    const bullAgent = agents.find((a) => a.role === 'bull')!;
    const bearAgent = agents.find((a) => a.role === 'bear')!;
    const neutralAgent = agents.find((a) => a.role === 'neutral')!;
    const arbitrator = agents.find((a) => a.role === 'arbitrator')!;

    const allResponses: Record<string, string[]> = { 'claude-a': [], 'claude-b': [], 'claude-c': [] };

    for (let round = 1; round <= totalRounds; round++) {
      if (abortRef.current) break;
      setCurrentRound(round);

      // Round 1: Opening statements
      // Round 2+: Rebuttals
      const roundType: DebateMessage['type'] = round === 1 ? 'opening' : 'rebuttal';

      // Bull advocate
      const bullMessages: ChatMessage[] = [
        { role: 'system', content: `You are ${bullAgent.name}, a BULLISH market advocate. Argue passionately for the upside case. Keep responses concise (2-3 sentences). Current topic: ${topic}` },
        { role: 'user', content: round === 1
          ? `Provide your opening bullish case for: ${topic}`
          : `Respond to the bearish arguments. Previous bear points: ${allResponses['claude-b'].join('; ')}` },
      ];
      allResponses['claude-a'].push(await callAgent(bullAgent, bullMessages, round, roundType));
      if (abortRef.current) break;

      // Bear advocate
      const bearMessages: ChatMessage[] = [
        { role: 'system', content: `You are ${bearAgent.name}, a BEARISH market advocate. Argue passionately for the downside case. Keep responses concise (2-3 sentences). Current topic: ${topic}` },
        { role: 'user', content: round === 1
          ? `Provide your opening bearish case for: ${topic}`
          : `Respond to the bullish arguments. Previous bull points: ${allResponses['claude-a'].join('; ')}` },
      ];
      allResponses['claude-b'].push(await callAgent(bearAgent, bearMessages, round, roundType));
      if (abortRef.current) break;

      // Neutral analyst
      const neutralMessages: ChatMessage[] = [
        { role: 'system', content: `You are ${neutralAgent.name}, a neutral data-driven analyst. Provide factual, balanced analysis with data. Keep responses concise (2-3 sentences). Current topic: ${topic}` },
        { role: 'user', content: round === 1
          ? `Provide your factual analysis for: ${topic}`
          : `Analyze both sides objectively. Bull: ${allResponses['claude-a'].slice(-1)[0]} | Bear: ${allResponses['claude-b'].slice(-1)[0]}` },
      ];
      allResponses['claude-c'].push(await callAgent(neutralAgent, neutralMessages, round, roundType));
      if (abortRef.current) break;
    }

    // Arbitrator synthesis
    if (!abortRef.current) {
      setCurrentRound((r) => r + 1);
      updateAgentStatus(arbitrator.id, 'thinking');
      try {
        const arbMessages: ChatMessage[] = [
          { role: 'system', content: `You are Kimi, the arbitrator. Synthesize all arguments into a final verdict with probability (0-100%). Be decisive and specific.` },
          { role: 'user', content: `Topic: ${topic}\n\nBull case:\n${allResponses['claude-a'].join('\n')}\n\nBear case:\n${allResponses['claude-b'].join('\n')}\n\nNeutral analysis:\n${allResponses['claude-c'].join('\n')}\n\nProvide: 1) Final verdict (Bullish/Bearish/Neutral), 2) Confidence probability (0-100%), 3) Brief reasoning.` },
        ];
        const arbRes = await callAIWithFallback('kimi', arbMessages, ['claude', 'deepseek']);
        const content = arbRes.content;
        updateAgentStatus(arbitrator.id, 'speaking');
        setTimeout(() => updateAgentStatus(arbitrator.id, 'idle'), 2000);

        // Extract probability
        const probMatch = content.match(/(\d+)%/);
        const prob = probMatch ? parseInt(probMatch[1], 10) : 50;

        addMessage({
          id: `kimi-${Date.now()}`,
          agentId: arbitrator.id,
          agentName: arbitrator.name,
          agentColor: arbitrator.color,
          type: 'verdict',
          content,
          timestamp: Date.now(),
          round: totalRounds + 1,
        });

        setVerdict(content);
        setVerdictProbability(prob);
        setRawResponses((prev) => ({ ...prev, [`kimi-verdict`]: content }));
      } catch {
        updateAgentStatus(arbitrator.id, 'idle');
      }
    }

    // Save session
    const session: Session = {
      id: `session-${Date.now()}`,
      topic,
      agents: agents.map((a) => a.name),
      rounds: totalRounds,
      messages,
      verdict: verdict || 'No verdict',
      verdictProbability,
      timestamp: Date.now(),
      duration: Date.now() - debateStartTime.current,
    };
    setSessions((prev) => [session, ...prev].slice(0, 10));
    setIsDebating(false);
    setCurrentRound(0);
  }, [topic, totalRounds, agents, messages, verdict, verdictProbability, callAgent, updateAgentStatus, addMessage]);

  // Quick prompt
  const useQuickPrompt = useCallback((prompt: string) => {
    setTopic(prompt);
  }, []);

  // Stress test
  const runStressTest = useCallback(async (scenarioId: string) => {
    const scenario = STRESS_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setTopic(scenario.name);
    setStressPanelOpen(false);
    // Small delay then start
    setTimeout(() => {
      setTopic(`${scenario.name}: ${scenario.description}`);
    }, 100);
  }, []);

  // Send message (manual user input)
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    const userMsg: DebateMessage = {
      id: `user-${Date.now()}`,
      agentId: 'user',
      agentName: 'You',
      agentColor: '#94A3B8',
      type: 'evidence',
      content,
      timestamp: Date.now(),
      round: currentRound,
    };
    addMessage(userMsg);
    setTopic(content);
  }, [currentRound, addMessage]);

  // Stop debate
  const stopDebate = useCallback(() => {
    abortRef.current = true;
    setIsDebating(false);
    setAgents((prev) => prev.map((a) => ({ ...a, status: 'idle' })));
  }, []);

  return {
    topic,
    setTopic,
    messages,
    agents,
    isDebating,
    currentRound,
    totalRounds,
    setTotalRounds,
    verdict,
    verdictProbability,
    sessions,
    showRaw,
    setShowRaw,
    rawResponses,
    stressPanelOpen,
    setStressPanelOpen,
    transcriptScrollRef,
    setTranscriptScrollRef,
    startDebate,
    useQuickPrompt,
    runStressTest,
    sendMessage,
    stopDebate,
  };
}
