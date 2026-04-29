import { useState, useEffect, useCallback } from 'react';
import { callAIWithFallback, callDeepSeek, callPerplexity } from '@/lib/ai-api';
import { fetchKlines } from '@/lib/crypto-api';
import { fetchForexCandlesMultiTF } from '@/lib/forex-api';
import { runForexCouncil } from '@/lib/signal-agents';
import type { ChatMessage } from '@/lib/ai-api';
import type { Timeframe } from '@/lib/forex-api';

/**
 * Returns true when the given category is in its automatic trading window.
 * Uses BROWSER LOCAL TIME (so "07:00" means 07:00 in the user's timezone).
 *
 * - FOREX: Mon–Fri, 07:00–16:00 local
 * - CRYPTO: every day, 07:00–16:00 local
 *
 * Window is half-open: [07:00, 16:00) — 16:00 exact is OUT.
 *
 * Manual refresh from the UI must bypass this check.
 */
export function isWithinTradingHours(
  category: SignalCategory,
  now: Date = new Date()
): boolean {
  const hour = now.getHours();
  const day = now.getDay(); // 0 Sun ... 6 Sat
  const inHourWindow = hour >= 7 && hour < 16;
  if (!inHourWindow) return false;
  if (category === 'FOREX') {
    return day >= 1 && day <= 5; // Mon–Fri
  }
  return true; // CRYPTO any day
}

export type SignalDirection = 'BUY' | 'SELL' | 'HOLD';
export type SignalCategory = 'FOREX' | 'CRYPTO';
export type SignalStatus = 'fresh' | 'aging' | 'expiring' | 'expired';

export interface Signal {
  id: string;
  instrument: string;
  category: SignalCategory;
  direction: SignalDirection;
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  vitality: number;
  timestamp: number;
  layers: boolean[]; // 5 layers consensus
  layerConfidences: number[];
  status: SignalStatus;
  spread: number;
  sourceLayers: string[];
  // ─── NEW: Strategy Council fields (Etape 1) ─────────────────
  tier: 'STANDARD' | 'PRO';
  thesis?: string;
  mainRisk?: string;
  positionSizePct?: number;
  riskRewardTp1?: number;
  expectedHoldMinutes?: number;
  managementPlan?: string;
  takeProfits?: [number, number, number];
}

export type FilterDirection = 'ALL' | SignalDirection;

// ─── PRO Council candidate extraction ──────────────────────────

export interface Candidate {
  pair: string;
  direction: 'BUY' | 'SELL';
  l0Confidence: number;
  triggeredStrategies: string[];
  currentPrice: number;
}

export function extractCandidates(signals: Signal[]): Candidate[] {
  return signals
    .filter(
      (s) =>
        s.category === 'FOREX' &&
        s.layers[0] === true &&
        s.confidence >= 60 &&
        s.direction !== 'HOLD' &&
        s.status !== 'expired'
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((s) => ({
      pair: s.instrument,
      direction: s.direction as 'BUY' | 'SELL',
      l0Confidence: s.layerConfidences[0],
      triggeredStrategies: s.sourceLayers,
      currentPrice: s.entry,
    }));
}

// ─── Deterministic Strategies (Layer 0) ────────────────────────
export type FilterTimeframe = 'TODAY' | 'WEEK' | 'MONTH';
export type SortBy = 'NEWEST' | 'CONFIDENCE' | 'INSTRUMENT';

// ─── Deterministic Strategies (Layer 0) ────────────────────────

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function emaPullbackSignal(prices: number[]): { signal: SignalDirection; confidence: number } {
  const e20 = ema(prices, 20);
  const e50 = ema(prices, 50);
  const last = prices.length - 1;
  if (e20[last] > e50[last] && prices[last] > e20[last] && prices[last] < e20[last] * 1.005) {
    return { signal: 'BUY', confidence: 72 };
  }
  if (e20[last] < e50[last] && prices[last] < e20[last] && prices[last] > e20[last] * 0.995) {
    return { signal: 'SELL', confidence: 70 };
  }
  return { signal: 'HOLD', confidence: 50 };
}

function macdCrossSignal(prices: number[]): { signal: SignalDirection; confidence: number } {
  const e12 = ema(prices, 12);
  const e26 = ema(prices, 26);
  const macd = e12.map((v, i) => v - e26[i]);
  const signalLine = ema(macd, 9);
  const last = macd.length - 1;
  if (macd[last] > signalLine[last] && macd[last - 1] <= signalLine[last - 1]) {
    return { signal: 'BUY', confidence: 78 };
  }
  if (macd[last] < signalLine[last] && macd[last - 1] >= signalLine[last - 1]) {
    return { signal: 'SELL', confidence: 76 };
  }
  return { signal: 'HOLD', confidence: 45 };
}

function rsiDivergenceSignal(prices: number[]): { signal: SignalDirection; confidence: number } {
  const period = 14;
  const rsi: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i + 1);
    let gains = 0, losses = 0;
    for (let j = 1; j < slice.length; j++) {
      const diff = slice[j] - slice[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  const last = rsi.length - 1;
  if (rsi[last] < 30) return { signal: 'BUY', confidence: 68 };
  if (rsi[last] > 70) return { signal: 'SELL', confidence: 68 };
  // Check divergence: price higher, rsi lower
  if (last >= 5) {
    if (prices[prices.length - 1] > prices[prices.length - 5] && rsi[last] < rsi[last - 4]) {
      return { signal: 'SELL', confidence: 65 };
    }
    if (prices[prices.length - 1] < prices[prices.length - 5] && rsi[last] > rsi[last - 4]) {
      return { signal: 'BUY', confidence: 65 };
    }
  }
  return { signal: 'HOLD', confidence: 40 };
}

function bbReversalSignal(prices: number[]): { signal: SignalDirection; confidence: number } {
  const period = 20;
  const last = prices.length - 1;
  const slice = prices.slice(last - period + 1, last + 1);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - sma) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const upper = sma + 2 * std;
  const lower = sma - 2 * std;
  if (prices[last] <= lower * 1.001) return { signal: 'BUY', confidence: 70 };
  if (prices[last] >= upper * 0.999) return { signal: 'SELL', confidence: 70 };
  return { signal: 'HOLD', confidence: 40 };
}

function donchianBreakout(prices: number[]): { signal: SignalDirection; confidence: number } {
  const period = 20;
  const last = prices.length - 1;
  const slice = prices.slice(last - period, last);
  const upper = Math.max(...slice);
  const lower = Math.min(...slice);
  if (prices[last] > upper) return { signal: 'BUY', confidence: 75 };
  if (prices[last] < lower) return { signal: 'SELL', confidence: 75 };
  return { signal: 'HOLD', confidence: 35 };
}

function squeezeDetection(prices: number[]): { signal: SignalDirection; confidence: number } {
  const period = 20;
  const last = prices.length - 1;
  const slice = prices.slice(last - period + 1, last + 1);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - sma) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const bbWidth = (sma + 2 * std - (sma - 2 * std)) / sma;
  if (bbWidth < 0.005) {
    // Volatility squeeze - expect breakout
    if (prices[last] > sma) return { signal: 'BUY', confidence: 60 };
    return { signal: 'SELL', confidence: 60 };
  }
  return { signal: 'HOLD', confidence: 30 };
}

function pyramidSetup(prices: number[]): { signal: SignalDirection; confidence: number } {
  const e20 = ema(prices, 20);
  const e50 = ema(prices, 50);
  const last = prices.length - 1;
  // Pyramid: price pulling back to EMA in trending market
  if (e20[last] > e50[last] && prices[last] < e20[last] && prices[last] > e50[last]) {
    return { signal: 'BUY', confidence: 74 };
  }
  if (e20[last] < e50[last] && prices[last] > e20[last] && prices[last] < e50[last]) {
    return { signal: 'SELL', confidence: 74 };
  }
  return { signal: 'HOLD', confidence: 35 };
}

// Run all Layer 0 strategies and combine
export function runLayer0(prices: number[]): { signal: SignalDirection; confidence: number } {
  const strategies = [
    emaPullbackSignal,
    macdCrossSignal,
    rsiDivergenceSignal,
    bbReversalSignal,
    donchianBreakout,
    squeezeDetection,
    pyramidSetup,
  ];
  let buyVotes = 0, sellVotes = 0, totalConf = 0;
  strategies.forEach((fn) => {
    const r = fn(prices);
    if (r.signal === 'BUY') { buyVotes++; totalConf += r.confidence; }
    if (r.signal === 'SELL') { sellVotes++; totalConf += r.confidence; }
  });
  if (buyVotes >= 3) return { signal: 'BUY', confidence: Math.round(totalConf / buyVotes) };
  if (sellVotes >= 3) return { signal: 'SELL', confidence: Math.round(totalConf / sellVotes) };
  if (buyVotes > 0) return { signal: 'BUY', confidence: 55 };
  if (sellVotes > 0) return { signal: 'SELL', confidence: 55 };
  return { signal: 'HOLD', confidence: 40 };
}

// ─── Main hook ─────────────────────────────────────────────────

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [ensembleEnabled, setEnsembleEnabled] = useState(true);
  const [category, setCategory] = useState<SignalCategory>('FOREX');
  const [filterDirection, setFilterDirection] = useState<FilterDirection>('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState<FilterTimeframe>('TODAY');
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');
  const [minConfidence, setMinConfidence] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [countdown, setCountdown] = useState(300);
  const [pipelineStep, setPipelineStep] = useState(0); // 0-4
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() =>
    isWithinTradingHours('FOREX')
  );
  const forexPairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'AUD/USD'];
  const cryptoPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'DOT/USDT'];

  // Auto-generation gate based on trading hours for current category
  useEffect(() => {
    const check = () => setAutoEnabled(isWithinTradingHours(category));
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [category]);

  // Generate signals (Layer 0 + optional ensemble)
  const generateSignals = useCallback(async (manual: boolean = false) => {
    // Outside trading hours, automatic calls are silently skipped.
    // Manual calls (button) always proceed.
    if (!manual && !isWithinTradingHours(category)) {
      return;
    }
    setIsRefreshing(true);
    setPipelineStep(0);
    const cat = category; // capture current category at call time
    const instruments = cat === 'FOREX' ? forexPairs : cryptoPairs;
    const newSignals: Signal[] = [];
    // Multi-TF candles cache for FOREX council
    const candlesByPair: Record<string, Record<Timeframe, import('@/lib/forex-api').Candle[]>> = {};

    for (const inst of instruments) {
      let prices: number[];
      try {
        if (cat === 'CRYPTO') {
          // 'BTC/USDT' -> 'BTCUSDT'; 100 hourly candles ~ last ~4 days
          const symbol = inst.replace('/', '');
          const klines = await fetchKlines(symbol, '1h', 100);
          if (klines.length < 50) continue; // need >=50 for EMA50
          prices = klines.map((k) => k.close);
        } else {
          // FOREX — multi-TF from Twelve Data for Strategy Council
          const multiTF = await fetchForexCandlesMultiTF(inst, ['1h', '4h', '1day'], 200);
          if (!multiTF['1h'] || multiTF['1h'].length < 50) continue;
          prices = multiTF['1h'].map((c) => c.close); // L0 uses 1h closes
          candlesByPair[inst] = multiTF; // store for council
        }
      } catch (e) {
        console.warn(`[Signals] price fetch failed for ${inst}:`, e);
        continue;
      }

      const l0 = runLayer0(prices);
      if (l0.signal === 'HOLD' || l0.confidence < 55) continue;

      const entry = prices[prices.length - 1];
      const sig: Signal = {
        id: `SIG-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        instrument: inst,
        category: cat,
        direction: l0.signal,
        entry,
        target: l0.signal === 'BUY' ? entry * 1.015 : entry * 0.985,
        stop: l0.signal === 'BUY' ? entry * 0.992 : entry * 1.008,
        confidence: l0.confidence,
        vitality: 100,
        timestamp: Date.now(),
        layers: [true, false, false, false, false],
        layerConfidences: [l0.confidence, 0, 0, 0, 0],
        status: 'fresh',
        spread: Math.random() * (cat === 'FOREX' ? 0.0003 : 0.5),
        sourceLayers: ['L0'],
        tier: 'STANDARD',
      };
      newSignals.push(sig);
    }

    setPipelineStep(1);

    // ─── ENSEMBLE / COUNCIL ─────────────────────────────────────
    if (ensembleEnabled && newSignals.length > 0) {
      if (cat === 'FOREX') {
        // FOREX: Strategy Council (4 parallel agents + Risk + Judge)
        await runForexCouncil(newSignals, candlesByPair, setPipelineStep);
      } else {
        // CRYPTO: legacy sequential ensemble (unchanged)
        for (let i = 0; i < newSignals.length; i++) {
          const sig = newSignals[i];
          try {
            // Layer 1: Perplexity macro
            setPipelineStep(1);
            const pMessages: ChatMessage[] = [
              { role: 'system', content: 'You are a macro analyst. Respond with ONLY "BULLISH", "BEARISH", or "NEUTRAL" and a confidence 0-100.' },
              { role: 'user', content: `Analyze macro outlook for ${sig.instrument}. Current price: ${sig.entry.toFixed(4)}.` },
            ];
            const pRes = await callPerplexity(pMessages).catch(() => null);
            const pBull = pRes?.content.toLowerCase().includes('bull') ?? false;
            const pBear = pRes?.content.toLowerCase().includes('bear') ?? false;
            const pConf = parseInt(pRes?.content.match(/\d+/)?.[0] || '50', 10);
            sig.layers[1] = (pBull && sig.direction === 'BUY') || (pBear && sig.direction === 'SELL');
            sig.layerConfidences[1] = pConf || 50;
            sig.sourceLayers.push('L1');
          } catch { /* ignore */ }

          setPipelineStep(2);
          try {
            // Layer 2: DeepSeek technical
            const dMessages: ChatMessage[] = [
              { role: 'system', content: 'You are a technical analyst. Respond with ONLY "BULLISH", "BEARISH", or "NEUTRAL" and confidence 0-100.' },
              { role: 'user', content: `Technical analysis for ${sig.instrument} at ${sig.entry.toFixed(4)}. Signal: ${sig.direction}.` },
            ];
            const dRes = await callDeepSeek(dMessages).catch(() => null);
            const dBull = dRes?.content.toLowerCase().includes('bull') ?? false;
            const dBear = dRes?.content.toLowerCase().includes('bear') ?? false;
            const dConf = parseInt(dRes?.content.match(/\d+/)?.[0] || '50', 10);
            sig.layers[2] = (dBull && sig.direction === 'BUY') || (dBear && sig.direction === 'SELL');
            sig.layerConfidences[2] = dConf || 50;
            sig.sourceLayers.push('L2');
          } catch { /* ignore */ }

          setPipelineStep(3);
          try {
            // Layer 3: Kimi synthesis (fallback to DeepSeek)
            const kMessages: ChatMessage[] = [
              { role: 'system', content: 'You are a sentiment analyst. Respond with ONLY "BULLISH", "BEARISH", or "NEUTRAL" and confidence 0-100.' },
              { role: 'user', content: `Synthesize market sentiment for ${sig.instrument} at ${sig.entry.toFixed(4)}.` },
            ];
            const kRes = await callAIWithFallback('kimi', kMessages, ['deepseek']).catch(() => null);
            const kBull = kRes?.content.toLowerCase().includes('bull') ?? false;
            const kBear = kRes?.content.toLowerCase().includes('bear') ?? false;
            const kConf = parseInt(kRes?.content.match(/\d+/)?.[0] || '50', 10);
            sig.layers[3] = (kBull && sig.direction === 'BUY') || (kBear && sig.direction === 'SELL');
            sig.layerConfidences[3] = kConf || 50;
            sig.sourceLayers.push('L3');
          } catch { /* ignore */ }

          setPipelineStep(4);
          try {
            // Layer 4: Claude verdict (fallback to DeepSeek)
            const cMessages: ChatMessage[] = [
              { role: 'system', content: 'You are a senior trading judge. Respond with ONLY "CONFIRM", "REJECT", or "NEUTRAL" and final confidence 0-100.' },
              { role: 'user', content: `Verdict: ${sig.instrument} ${sig.direction} at ${sig.entry.toFixed(4)}. L0=${sig.layerConfidences[0]}, L1=${sig.layerConfidences[1]}, L2=${sig.layerConfidences[2]}, L3=${sig.layerConfidences[3]}.` },
            ];
            const cRes = await callAIWithFallback('claude', cMessages, ['deepseek']).catch(() => null);
            const confirm = cRes?.content.toLowerCase().includes('confirm') ?? false;
            const cConf = parseInt(cRes?.content.match(/\d+/)?.[0] || '50', 10);
            sig.layers[4] = confirm;
            sig.layerConfidences[4] = cConf || 50;
            sig.sourceLayers.push('L4');
            // Recalculate overall confidence from ensemble
            const avgConf = sig.layerConfidences.reduce((a, b) => a + b, 0) / sig.layerConfidences.filter((c) => c > 0).length;
            sig.confidence = Math.round(avgConf);
          } catch { /* ignore */ }
        }
      }
    }

    // Filter out DROP'd signals (confidence === 0 after council)
    const validSignals = newSignals.filter((s) => s.confidence > 0);

    setSignals((prev) => {
      const merged = [...validSignals, ...prev];
      // Deduplicate by instrument
      const seen = new Set<string>();
      return merged.filter((s) => {
        if (seen.has(s.instrument)) return false;
        seen.add(s.instrument);
        return true;
      });
    });
    setPipelineStep(0);
    setIsRefreshing(false);
    setLastRefresh(Date.now());
    setCountdown(300);
  }, [category, ensembleEnabled]);

  // Countdown timer — placed after generateSignals so the closure is valid
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateSignals(false); // no-op if outside hours
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [generateSignals]);

  // Initial generation
  useEffect(() => {
    generateSignals(false); // will skip if outside hours
  }, [generateSignals]);

  // Vitality decay
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals((prev) =>
        prev.map((s) => {
          const age = (Date.now() - s.timestamp) / 1000 / 60 / 60; // hours
          let vitality = 100 - age * 4;
          let status: SignalStatus = 'fresh';
          if (age > 6) { vitality = Math.max(0, 20 - (age - 6) * 5); status = 'expiring'; }
          else if (age > 1) { vitality = Math.max(20, 100 - (age - 1) * 16); status = 'aging'; }
          if (vitality <= 0) status = 'expired';
          return { ...s, vitality: Math.max(0, vitality), status };
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Filtering and sorting
  const filteredSignals = signals
    .filter((s) => {
      if (s.category !== category) return false;
      if (filterDirection !== 'ALL' && s.direction !== filterDirection) return false;
      if (s.confidence < minConfidence) return false;
      if (filterTimeframe === 'TODAY') {
        const dayAgo = Date.now() - 86400000;
        if (s.timestamp < dayAgo) return false;
      } else if (filterTimeframe === 'WEEK') {
        const weekAgo = Date.now() - 604800000;
        if (s.timestamp < weekAgo) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return b.timestamp - a.timestamp;
      if (sortBy === 'CONFIDENCE') return b.confidence - a.confidence;
      return a.instrument.localeCompare(b.instrument);
    });

  return {
    signals: filteredSignals,
    allSignals: signals,
    ensembleEnabled,
    setEnsembleEnabled,
    category,
    setCategory,
    filterDirection,
    setFilterDirection,
    filterTimeframe,
    setFilterTimeframe,
    sortBy,
    setSortBy,
    minConfidence,
    setMinConfidence,
    isRefreshing,
    lastRefresh,
    countdown,
    pipelineStep,
    autoEnabled,
    refresh: () => generateSignals(true), // button always forces a manual run
  };
}
