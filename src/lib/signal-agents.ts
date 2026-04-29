// src/lib/signal-agents.ts — Strategy Council: 4 agents + Risk + Judge + runForexCouncil helper

import { callDeepSeek, callClaude, callPerplexityCached, parseAgentJSON } from './ai-api';
import type { ChatMessage } from './ai-api';
import type { TFSnapshot } from './signal-indicators';
import type { Signal } from '@/hooks/useSignals';
import { snapshotTimeframe, findSwings } from './signal-indicators';
import type { Timeframe, Candle } from './twelvedata';

// ═══════════════════════════════════════════════════════════════
// PAIR-SPECIFIC CONTEXT — enriches every agent prompt
// ═══════════════════════════════════════════════════════════════

const PAIR_CONTEXT: Record<string, {
  characterTrait: string;
  driverHint: string;
  riskNote: string;
}> = {
  'EUR/USD': {
    characterTrait: 'Most liquid major. Often range-bound during quiet periods, breaks out on US/EU rate divergence. Tight spreads.',
    driverHint: 'Watch DXY index correlation, ECB vs Fed policy gap, Eurozone CPI/PMI vs US NFP/CPI.',
    riskNote: 'Avoid signals during NY lunch (16:30-17:30 PL) — typical chop period.',
  },
  'USD/JPY': {
    characterTrait: 'Carry-trade vehicle. Strongly trends when US-Japan yield gap widens or narrows. Mean-reverts in low-vol regimes.',
    driverHint: 'Watch US 10Y Treasury yields, BoJ policy stance, risk-on (yen weak) / risk-off (yen strong) correlations with S&P 500.',
    riskNote: 'BoJ intervention risk above 158-160. Tokyo session opens 23:00 UTC = early moves.',
  },
  'GBP/USD': {
    characterTrait: 'Most volatile of majors. News-reactive. Sharp moves on UK economic data and BoE communications.',
    driverHint: 'Watch UK CPI, BoE rate decisions, UK GDP, Brexit-related headlines, GBP/EUR cross for relative strength.',
    riskNote: 'Wider spreads than EUR/USD. Avoid signals 30 min before/after UK data releases.',
  },
  'AUD/USD': {
    characterTrait: 'Risk-on/off proxy. Correlates with copper, iron ore, Chinese economic data. Trends in clear risk regimes.',
    driverHint: 'Watch RBA policy, China PMI, copper prices, S&P 500 risk sentiment, AU-US 2Y yield spread.',
    riskNote: 'Asian session most active. Choppy during NY session unless China data dropped.',
  },
};

function getPairContext(pair: string): string {
  const ctx = PAIR_CONTEXT[pair];
  if (!ctx) return '';
  return `\nPAIR CONTEXT for ${pair}:
- Character: ${ctx.characterTrait}
- Key drivers: ${ctx.driverHint}
- Risk note: ${ctx.riskNote}`;
}

export interface AgentContext {
  pair: string;
  direction: 'BUY' | 'SELL';
  currentPrice: number;
  l0Confidence: number;
  triggeredStrategies: string[];
  tf1h: TFSnapshot;
  tf4h: TFSnapshot;
  tfDaily: TFSnapshot;
  swings: { swingHigh: number; swingLow: number; recentHigh: number; recentLow: number };
}

export interface StrategyVerdict {
  verdict: 'CONFIRM' | 'REJECT' | 'SKIP';
  confidence: number;
  reasoning: string;
  htfAligned?: boolean;
  trendStrength?: 'STRONG' | 'MODERATE' | 'WEAK';
  extremeLevel?: 'EXTREME' | 'ELEVATED' | 'NEUTRAL';
  divergenceDetected?: boolean;
  breakoutType?: 'RANGE' | 'SQUEEZE' | 'TREND_CONTINUATION' | 'NONE';
  followThroughLikely?: boolean;
}

export interface MacroVerdict {
  verdict: 'CONFIRM' | 'REJECT' | 'NEUTRAL';
  confidence: number;
  keyEventNext12h: string | null;
  fundamentalBias: 'BULL' | 'BEAR' | 'NEUTRAL';
  newsSummary: string;
}

export interface RiskOutput {
  entryZone: { low: number; high: number };
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  positionSizePct: number;
  riskRewardTp1: number;
  consensusStrength: 'STRONG' | 'MIXED' | 'WEAK';
}

export interface JudgeVerdict {
  decision: 'PUBLISH' | 'HOLD' | 'DROP';
  finalConfidence: number;
  keyThesis: string;
  mainRisk: string;
  expectedHoldMinutes: number;
  managementPlan?: string;
}

// ─── 1) Trend-Following Agent ──────────────────────────────────
export async function runTrendAgent(ctx: AgentContext): Promise<StrategyVerdict | null> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a TREND-FOLLOWING SPECIALIST. You confirm only setups aligned with HTF trend (4h + daily). Counter-trend setups are REJECTED, regardless of how attractive on lower timeframe. Multi-TF alignment is non-negotiable. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: buildTrendPrompt(ctx),
    },
  ];

  const res = await callDeepSeek(messages, 'deepseek-chat', {
    jsonMode: true,
    temperature: 0.3,
    maxTokens: 800,
  }).catch(() => null);
  if (!res) return null;
  return parseAgentJSON<StrategyVerdict>(res.content);
}

function buildTrendPrompt(ctx: AgentContext): string {
  const dir = ctx.direction;
  const dirLabel = dir === 'BUY' ? 'UP' : 'DOWN';
  return `Analyze ${ctx.pair} for ${dir} TREND-FOLLOWING setup.

Multi-TF data:
- 1h: EMA20=${ctx.tf1h.ema20.toFixed(5)}, EMA50=${ctx.tf1h.ema50.toFixed(5)}, EMA200=${ctx.tf1h.ema200.toFixed(5)}, RSI=${ctx.tf1h.rsi.toFixed(1)}, slope20=${ctx.tf1h.slope20Pct.toFixed(3)}%, trend=${ctx.tf1h.trend}, current=${ctx.tf1h.current.toFixed(5)}
- 4h: EMA20=${ctx.tf4h.ema20.toFixed(5)}, EMA50=${ctx.tf4h.ema50.toFixed(5)}, slope20=${ctx.tf4h.slope20Pct.toFixed(3)}%, trend=${ctx.tf4h.trend}
- Daily: EMA20=${ctx.tfDaily.ema20.toFixed(5)}, slope20=${ctx.tfDaily.slope20Pct.toFixed(3)}%, trend=${ctx.tfDaily.trend}
- 1h ATR: ${ctx.tf1h.atr.toFixed(6)}

L0 fired ${ctx.l0Confidence}% from triggers: ${ctx.triggeredStrategies.join(',')}

Rules:
- CONFIRM (70-90) only if 4h.trend === ${dirLabel} AND daily.trend === ${dirLabel} AND 1h slope aligned
- REJECT (0-30) if HTF (4h or daily) opposite to ${dir}
- SKIP (30-50) if EMAs flat (|slope20Pct| < 0.02% on 4h)

  ${getPairContext(ctx.pair)}

Return ONLY JSON:
{ "verdict": "CONFIRM"|"REJECT"|"SKIP", "confidence": <0-100>, "reasoning": "<max 250>", "htfAligned": <bool>, "trendStrength": "STRONG"|"MODERATE"|"WEAK" }`;
}

// ─── 2) Mean-Reversion Agent ───────────────────────────────────
export async function runMeanRevAgent(ctx: AgentContext): Promise<StrategyVerdict | null> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a MEAN-REVERSION SPECIALIST. Hunt extremes ready to revert. Avoid strong trends — mean-reversion FAILS in trending markets. Best setups: oversold/overbought RSI + outer Bollinger Band + non-trending HTF. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: buildMeanRevPrompt(ctx),
    },
  ];

  const res = await callDeepSeek(messages, 'deepseek-chat', {
    jsonMode: true,
    temperature: 0.3,
    maxTokens: 800,
  }).catch(() => null);
  if (!res) return null;
  return parseAgentJSON<StrategyVerdict>(res.content);
}

function buildMeanRevPrompt(ctx: AgentContext): string {
  const dir = ctx.direction;
  const buyRules =
    '- CONFIRM only if 1h RSI < 35 AND price within bbWidth*0.1 of lower BB AND 4h.trend != DOWN AND daily.trend != DOWN\n- REJECT if 4h AND daily both DOWN (catching falling knife)';
  const sellRules =
    '- CONFIRM only if 1h RSI > 65 AND price near upper BB AND 4h.trend != UP AND daily.trend != UP\n- REJECT if 4h AND daily both UP (chasing top)';

  return `Analyze ${ctx.pair} for ${dir} MEAN-REVERSION setup.

Multi-TF data:
- 1h: RSI=${ctx.tf1h.rsi.toFixed(1)}, BB width=${ctx.tf1h.bbWidthPct.toFixed(3)}%, ATR=${ctx.tf1h.atr.toFixed(6)}, trend=${ctx.tf1h.trend}
- 4h: trend=${ctx.tf4h.trend}, slope20=${ctx.tf4h.slope20Pct.toFixed(3)}%
- Daily: trend=${ctx.tfDaily.trend}
- Swing high: ${ctx.swings.swingHigh.toFixed(5)}, Swing low: ${ctx.swings.swingLow.toFixed(5)}

Rules for ${dir}:
${dir === 'BUY' ? buyRules : sellRules}
- SKIP if RSI 40-60 (no extreme)

  ${getPairContext(ctx.pair)}

Return ONLY JSON:
{ "verdict": "CONFIRM"|"REJECT"|"SKIP", "confidence": <0-100>, "reasoning": "<max 250>", "extremeLevel": "EXTREME"|"ELEVATED"|"NEUTRAL", "divergenceDetected": <bool> }`;
}

// ─── 3) Breakout Agent ─────────────────────────────────────────
export async function runBreakoutAgent(ctx: AgentContext): Promise<StrategyVerdict | null> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a BREAKOUT SPECIALIST. Confirm only true range/squeeze breakouts with momentum. Squeeze (low BB width) before breakout = best setup. Already-volatile market = late breakout, often fakeout. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: buildBreakoutPrompt(ctx),
    },
  ];

  const res = await callDeepSeek(messages, 'deepseek-chat', {
    jsonMode: true,
    temperature: 0.3,
    maxTokens: 800,
  }).catch(() => null);
  if (!res) return null;
  return parseAgentJSON<StrategyVerdict>(res.content);
}

function buildBreakoutPrompt(ctx: AgentContext): string {
  const dir = ctx.direction;
  return `Analyze ${ctx.pair} for ${dir} BREAKOUT setup.

Data:
- 1h BB width: ${ctx.tf1h.bbWidthPct.toFixed(3)}%
- 1h ATR: ${ctx.tf1h.atr.toFixed(6)}
- Recent high: ${ctx.swings.recentHigh.toFixed(5)}, Recent low: ${ctx.swings.recentLow.toFixed(5)}
- Current: ${ctx.currentPrice.toFixed(5)}
- 4h trend: ${ctx.tf4h.trend}, Daily trend: ${ctx.tfDaily.trend}

Rules:
- CONFIRM (70-90) when 1h bbWidthPct < 0.4% (squeeze) AND price clearly outside recent range (above recentHigh for BUY / below recentLow for SELL)
- REJECT (0-30) when 1h bbWidthPct > 1.5% (already volatile)
- SKIP otherwise

  ${getPairContext(ctx.pair)}

Return ONLY JSON:
{ "verdict": "CONFIRM"|"REJECT"|"SKIP", "confidence": <0-100>, "reasoning": "<max 250>", "breakoutType": "RANGE"|"SQUEEZE"|"TREND_CONTINUATION"|"NONE", "followThroughLikely": <bool> }`;
}

// ─── 4) Macro Agent (Perplexity + cache 30min) ─────────────────
export async function runMacroAgent(ctx: AgentContext): Promise<MacroVerdict | null> {
  const cacheKey = `macro_${ctx.pair}_${ctx.direction}`;
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a macro/fundamental FX analyst with web search. Find recent news and upcoming events for the currency pair. Respond ONLY with valid JSON. No markdown fences, no preamble.',
    },
    {
      role: 'user',
      content: buildMacroPrompt(ctx),
    },
  ];

  const res = await callPerplexityCached(messages, cacheKey, 30 * 60 * 1000).catch(() => null);
  if (!res) {
    // Fallback: DeepSeek without web search but better JSON reliability
    const fallback = await callDeepSeek(messages, 'deepseek-chat', {
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1000,
    }).catch(() => null);
    if (!fallback) return null;
    return parseAgentJSON<MacroVerdict>(fallback.content);
  }
  return parseAgentJSON<MacroVerdict>(res.content);
}

function buildMacroPrompt(ctx: AgentContext): string {
  const [base, quote] = ctx.pair.split('/');
  return `Analyze macro context for ${ctx.pair}, proposed direction ${ctx.direction}.

Search for:
1. Last 48h economic releases for ${base} and ${quote}
2. High-impact events in next 24h (rate decisions, CPI, NFP, FOMC)
3. Central bank statements affecting these currencies

Decision rules:
- CONFIRM if fundamentals support ${ctx.direction}
- REJECT if major event next 12h could invalidate (e.g. Fed today on USD pair)
- NEUTRAL if no significant news

  ${getPairContext(ctx.pair)}

Return ONLY JSON:
{ "verdict": "CONFIRM"|"REJECT"|"NEUTRAL", "confidence": <0-100>, "keyEventNext12h": <string or null>, "fundamentalBias": "BULL"|"BEAR"|"NEUTRAL", "newsSummary": "<max 350 chars>" }`;
}

// ─── 5) Risk Manager ───────────────────────────────────────────
export async function runRiskAgent(
  ctx: AgentContext,
  council: { trend: StrategyVerdict | null; meanRev: StrategyVerdict | null; breakout: StrategyVerdict | null; macro: MacroVerdict | null }
): Promise<RiskOutput | null> {
  const confirms = [council.trend, council.meanRev, council.breakout].filter(
    (v): v is StrategyVerdict => v?.verdict === 'CONFIRM'
  ).length;
  const rejects = [council.trend, council.meanRev, council.breakout].filter(
    (v): v is StrategyVerdict => v?.verdict === 'REJECT'
  ).length;
  void rejects; // used in template string

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a RISK MANAGER. You DO NOT decide direction. You output concrete trade levels based on volatility and consensus strength. All numbers as actual prices, not formulas. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: buildRiskPrompt(ctx, council, confirms, rejects),
    },
  ];

  const res = await callDeepSeek(messages, 'deepseek-chat', {
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 800,
  }).catch(() => null);
  if (!res) return null;
  return parseAgentJSON<RiskOutput>(res.content);
}

function buildRiskPrompt(
  ctx: AgentContext,
  council: { trend: StrategyVerdict | null; meanRev: StrategyVerdict | null; breakout: StrategyVerdict | null; macro: MacroVerdict | null },
  confirms: number,
  rejects: number
): string {
  const dir = ctx.direction;
  void dir; // dir used in template strings

  // Compute distances for SL
  const distToSwingLow = Math.abs(ctx.currentPrice - ctx.swings.swingLow);
  const distToSwingHigh = Math.abs(ctx.swings.swingHigh - ctx.currentPrice);
  const slDist = Math.max(1.5 * ctx.tf1h.atr, distToSwingLow + 0.1 * ctx.tf1h.atr);
  const slBuy = ctx.currentPrice - slDist;
  const slSell = ctx.currentPrice + Math.max(1.5 * ctx.tf1h.atr, distToSwingHigh + 0.1 * ctx.tf1h.atr);

  return `Calculate risk levels for ${ctx.pair} ${dir} at ${ctx.currentPrice.toFixed(5)}.

Volatility:
- 1h ATR: ${ctx.tf1h.atr.toFixed(6)}
- 4h ATR: ${ctx.tf4h.atr.toFixed(6)} (use this for SL on swing setups)
- Recent swing high: ${ctx.swings.swingHigh.toFixed(5)}
- Recent swing low: ${ctx.swings.swingLow.toFixed(5)}

Council:
- Trend: ${council.trend?.verdict ?? 'N/A'} (${council.trend?.confidence ?? 0}%)
- MeanRev: ${council.meanRev?.verdict ?? 'N/A'} (${council.meanRev?.confidence ?? 0}%)
- Breakout: ${council.breakout?.verdict ?? 'N/A'} (${council.breakout?.confidence ?? 0}%)
- Macro: ${council.macro?.verdict ?? 'N/A'} (${council.macro?.confidence ?? 0}%)
- Strategy CONFIRMs: ${confirms}, REJECTs: ${rejects}

Calculate:
- entryZone: ±${(0.25 * ctx.tf1h.atr).toFixed(6)} around currentPrice
- stopLoss for BUY: ${slBuy.toFixed(5)} (current - max(1.5*ATR, distToSwingLow + 0.1*ATR))
- stopLoss for SELL: ${slSell.toFixed(5)} (current + max(1.5*ATR, distToSwingHigh + 0.1*ATR))
- TP1/2/3 at 1R, 2R, 3R where R = |entry - SL|
- positionSizePct:
   3 strategy CONFIRMs + macro CONFIRM = 2.0
   3 CONFIRMs + macro NEUTRAL = 1.5
   2 CONFIRMs = 1.0
   1 CONFIRM (no REJECTs) = 0.5
   any REJECT = 0
- consensusStrength: STRONG (3 confirms) / MIXED (2) / WEAK (≤1)

Return ONLY JSON:
{ "entryZone": {"low": <num>, "high": <num>}, "stopLoss": <num>, "takeProfit1": <num>, "takeProfit2": <num>, "takeProfit3": <num>, "positionSizePct": <num>, "riskRewardTp1": <num>, "consensusStrength": "STRONG"|"MIXED"|"WEAK" }`;
}

// ─── 6) Judge (Final Arbiter) ───────────────────────────────────
export async function runJudge(
  ctx: AgentContext,
  council: { trend: StrategyVerdict | null; meanRev: StrategyVerdict | null; breakout: StrategyVerdict | null; macro: MacroVerdict | null },
  risk: RiskOutput | null
): Promise<JudgeVerdict | null> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are the FINAL JUDGE of a trading signal council. Aggregate verdicts and risk levels. Conservative bias preferred — false positives cost more than missed signals. Respond ONLY with valid JSON.',
    },
    {
      role: 'user',
      content: buildJudgePrompt(ctx, council, risk),
    },
  ];

  // Try Claude first, fallback to DeepSeek
  const claudeRes = await callClaude(messages, 'claude-3-5-sonnet-20241022').catch(() => null);
  const parsed = claudeRes ? parseAgentJSON<JudgeVerdict>(claudeRes.content) : null;
  if (parsed) return parsed;

  const dsRes = await callDeepSeek(messages, 'deepseek-chat', {
    jsonMode: true,
    temperature: 0.2,
    maxTokens: 1200,
  }).catch(() => null);
  if (!dsRes) return null;
  return parseAgentJSON<JudgeVerdict>(dsRes.content);
}

function buildJudgePrompt(
  ctx: AgentContext,
  council: { trend: StrategyVerdict | null; meanRev: StrategyVerdict | null; breakout: StrategyVerdict | null; macro: MacroVerdict | null },
  risk: RiskOutput | null
): string {
  const confirms = [council.trend, council.meanRev, council.breakout].filter(
    (v): v is StrategyVerdict => v?.verdict === 'CONFIRM'
  ).length;
  const rejects = [council.trend, council.meanRev, council.breakout].filter(
    (v): v is StrategyVerdict => v?.verdict === 'REJECT'
  ).length;
  void rejects; // used in template string

  // Compute final confidence formula
  const confirmConfs = [council.trend, council.meanRev, council.breakout]
    .filter((v): v is StrategyVerdict => v?.verdict === 'CONFIRM')
    .map((v) => v.confidence);
  const avgBase = confirmConfs.length > 0
    ? confirmConfs.reduce((a, b) => a + b, 0) / confirmConfs.length
    : 0;
  let finalConf = avgBase;
  if (confirms === 3) finalConf += 5;
  if (council.macro?.verdict === 'CONFIRM') finalConf += 3;
  if (ctx.tf4h.trend === ctx.tfDaily.trend && ctx.tf4h.trend === (ctx.direction === 'BUY' ? 'UP' : 'DOWN')) finalConf += 5;
  finalConf = Math.min(95, Math.max(0, finalConf));

  const htfAligned = ctx.tf4h.trend === ctx.tfDaily.trend && ctx.tf4h.trend === (ctx.direction === 'BUY' ? 'UP' : 'DOWN');

  return `You are the FINAL JUDGE. Decide PUBLISH, HOLD, or DROP.

Pair: ${ctx.pair}, Direction: ${ctx.direction}, Price: ${ctx.currentPrice.toFixed(5)}
L0 Confidence: ${ctx.l0Confidence}%, HTF aligned: ${htfAligned}

Council verdicts:
- Trend: ${council.trend?.verdict ?? 'N/A'} (${council.trend?.confidence ?? 0}%) — ${council.trend?.reasoning ?? ''}
- MeanRev: ${council.meanRev?.verdict ?? 'N/A'} (${council.meanRev?.confidence ?? 0}%) — ${council.meanRev?.reasoning ?? ''}
- Breakout: ${council.breakout?.verdict ?? 'N/A'} (${council.breakout?.confidence ?? 0}%) — ${council.breakout?.reasoning ?? ''}
- Macro: ${council.macro?.verdict ?? 'N/A'} (${council.macro?.confidence ?? 0}%) — ${council.macro?.newsSummary ?? ''}

Risk:
- Entry zone: ${risk?.entryZone.low.toFixed(5)} - ${risk?.entryZone.high.toFixed(5)}
- SL: ${risk?.stopLoss.toFixed(5) ?? 'N/A'}
- TP1: ${risk?.takeProfit1.toFixed(5) ?? 'N/A'} (RR ${risk?.riskRewardTp1.toFixed(2) ?? 'N/A'}:1)
- Position size: ${risk?.positionSizePct ?? 'N/A'}%
- Consensus: ${risk?.consensusStrength ?? 'N/A'}

Decision rules:
- DROP if macro REJECT, OR rejects >= 2, OR positionSizePct == 0
- HOLD if confirms == 1 AND no rejects
- PUBLISH otherwise (≥ 2 confirms, no critical reject, risk OK)

Final confidence base: ${avgBase.toFixed(1)} (already computed)
${confirms === 3 ? '+5 for 3 CONFIRMs' : ''}
${council.macro?.verdict === 'CONFIRM' ? '+3 for macro CONFIRM' : ''}
${htfAligned ? '+5 for HTF aligned' : ''}
= ${finalConf.toFixed(1)} (capped at 95)

Expected hold: ${risk ? 'swing 4h-1d = 240-1440min, scalp 1h = 60-240min' : 'N/A'}

You MUST also provide a managementPlan — a concrete instruction for the trader on how to handle the position lifecycle. ALWAYS include scaled-out exit plan (1/3 at TP1, 1/3 at TP2, 1/3 at TP3) and SL movement rule. Example: "Open 1.0% size split 33/33/34. Move SL to entry after TP1 hit. Trail remaining 1/3 with 1.5x ATR after TP2."

Return ONLY JSON:
{ "decision": "PUBLISH"|"HOLD"|"DROP", "finalConfidence": <0-100>, "keyThesis": "<max 400>", "mainRisk": "<max 250>", "expectedHoldMinutes": <60-1440>, "managementPlan": "<max 250>" }`;
}

// ═══════════════════════════════════════════════════════════════
// runForexCouncil — orchestrates the full Strategy Council pipeline
// ═══════════════════════════════════════════════════════════════

export async function runForexCouncil(
  signals: Signal[],
  candlesByPair: Record<string, Record<Timeframe, Candle[]>>,
  setPipelineStep: (step: number) => void
): Promise<void> {
  for (let i = 0; i < signals.length; i++) {
    const sig = signals[i];
    const tfs = candlesByPair[sig.instrument];
    if (!tfs?.['1h']?.length) continue;

    const tf1h = snapshotTimeframe(tfs['1h']);
    const tf4h = tfs['4h']?.length >= 50 ? snapshotTimeframe(tfs['4h']) : tf1h;
    const tfDaily = tfs['1day']?.length >= 50 ? snapshotTimeframe(tfs['1day']) : tf4h;
    const swings = findSwings(tfs['1h'], 20);

    const ctx: AgentContext = {
      pair: sig.instrument,
      direction: sig.direction as 'BUY' | 'SELL',
      currentPrice: sig.entry,
      l0Confidence: sig.layerConfidences[0],
      triggeredStrategies: sig.sourceLayers,
      tf1h, tf4h, tfDaily, swings,
    };

    setPipelineStep(2);

    // 4 agents PARALLEL (Promise.all is MANDATORY)
    const [trend, meanRev, breakout, macro] = await Promise.all([
      runTrendAgent(ctx).catch(() => null),
      runMeanRevAgent(ctx).catch(() => null),
      runBreakoutAgent(ctx).catch(() => null),
      runMacroAgent(ctx).catch(() => null),
    ]);

    sig.layers[1] = trend?.verdict === 'CONFIRM';
    sig.layerConfidences[1] = trend?.confidence ?? 0;
    sig.layers[2] = meanRev?.verdict === 'CONFIRM';
    sig.layerConfidences[2] = meanRev?.confidence ?? 0;
    sig.layers[3] = breakout?.verdict === 'CONFIRM';
    sig.layerConfidences[3] = breakout?.confidence ?? 0;
    sig.layers[4] = macro?.verdict === 'CONFIRM';
    sig.layerConfidences[4] = macro?.confidence ?? 0;
    sig.sourceLayers = ['L0',
      ...(trend ? ['L1'] : []),
      ...(meanRev ? ['L2'] : []),
      ...(breakout ? ['L3'] : []),
      ...(macro ? ['L4'] : [])];

    setPipelineStep(3);

    const risk = await runRiskAgent(ctx, { trend, meanRev, breakout, macro })
      .catch(() => null);

    setPipelineStep(4);

    const judge = await runJudge(ctx, { trend, meanRev, breakout, macro }, risk)
      .catch(() => null);

    if (!judge || judge.decision === 'DROP') {
      sig.confidence = 0;
      sig.status = 'expired';
      continue;
    }

    if (risk) {
      sig.entry = (risk.entryZone.low + risk.entryZone.high) / 2;
      sig.target = risk.takeProfit1;
      sig.stop = risk.stopLoss;
      sig.takeProfits = [risk.takeProfit1, risk.takeProfit2, risk.takeProfit3];
      sig.positionSizePct = risk.positionSizePct;
      sig.riskRewardTp1 = risk.riskRewardTp1;
    }

    sig.confidence = judge.decision === 'HOLD'
      ? Math.min(judge.finalConfidence, 60)
      : judge.finalConfidence;
    sig.thesis = judge.keyThesis;
    sig.mainRisk = judge.mainRisk;
    sig.expectedHoldMinutes = judge.expectedHoldMinutes;
    sig.managementPlan = judge.managementPlan;
  }

  setPipelineStep(0);
}
