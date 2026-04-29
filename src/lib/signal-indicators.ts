// src/lib/signal-indicators.ts — pure technical indicator functions

import type { Candle } from './twelvedata';

export function computeEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function computeRSI(values: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
      } else {
        rsi.push(50); // placeholder until enough data
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
  }
  return rsi;
}

export function computeATR(candles: Candle[], period: number = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      tr.push(c.high - c.low);
    } else {
      const prev = candles[i - 1];
      const r1 = c.high - c.low;
      const r2 = Math.abs(c.high - prev.close);
      const r3 = Math.abs(c.low - prev.close);
      tr.push(Math.max(r1, r2, r3));
    }
  }

  const atr: number[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    sum += tr[i];
    if (i < period - 1) {
      atr.push(sum / (i + 1));
    } else if (i === period - 1) {
      sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    } else {
      sum = (sum - tr[i - period]) + tr[i]; // simplified smoothing
      atr.push(sum / period);
    }
  }
  return atr;
}

export function computeBollingerBands(
  values: number[],
  period: number = 20,
  stddev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      const slice = values.slice(0, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + (b - sma) ** 2, 0) / slice.length;
      const std = Math.sqrt(variance);
      upper.push(sma + stddev * std);
      middle.push(sma);
      lower.push(sma - stddev * std);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + (b - sma) ** 2, 0) / period;
      const std = Math.sqrt(variance);
      upper.push(sma + stddev * std);
      middle.push(sma);
      lower.push(sma - stddev * std);
    }
  }
  return { upper, middle, lower };
}

export function computeDonchian(
  candles: Candle[],
  period: number = 20
): { upper: number[]; lower: number[] } {
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = candles.slice(start, i + 1);
    upper.push(Math.max(...slice.map((c) => c.high)));
    lower.push(Math.min(...slice.map((c) => c.low)));
  }
  return { upper, lower };
}

export function findSwings(
  candles: Candle[],
  lookback: number = 20
): { swingHigh: number; swingLow: number; recentHigh: number; recentLow: number } {
  const recent = candles.slice(-lookback);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const recentHigh = recent[recent.length - 1]?.high ?? 0;
  const recentLow = recent[recent.length - 1]?.low ?? 0;
  return { swingHigh, swingLow, recentHigh, recentLow };
}

export interface TFSnapshot {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  atr: number;
  bbWidthPct: number;
  slope20Pct: number;
  trend: 'UP' | 'DOWN' | 'RANGE';
  current: number;
  candlesCount: number;
}

export function snapshotTimeframe(candles: Candle[]): TFSnapshot {
  const closes = candles.map((c) => c.close);
  const ema20 = computeEMA(closes, 20);
  const ema50 = computeEMA(closes, 50);
  const ema200 = computeEMA(closes, 200);
  const rsi = computeRSI(closes, 14);
  const atr = computeATR(candles, 14);
  const bb = computeBollingerBands(closes, 20, 2);

  const last = closes.length - 1;
  const ema20Last = ema20[last] ?? closes[last];
  const ema50Last = ema50[last] ?? closes[last];
  const ema200Last = ema200[last] ?? closes[last];
  const rsiLast = rsi[last] ?? 50;
  const atrLast = atr[last] ?? 0;
  const bbU = bb.upper[last] ?? 0;
  const bbL = bb.lower[last] ?? 0;
  const bbWidthPct = bbL > 0 ? ((bbU - bbL) / closes[last]) * 100 : 0;

  const ema20Prev = ema20[Math.max(0, last - 5)] ?? ema20Last;
  const slope20Pct = ema20Prev > 0 ? ((ema20Last - ema20Prev) / ema20Prev) * 100 : 0;

  let trend: 'UP' | 'DOWN' | 'RANGE' = 'RANGE';
  if (ema20Last > ema50Last && ema50Last > ema200Last && slope20Pct > 0.05) trend = 'UP';
  else if (ema20Last < ema50Last && ema50Last < ema200Last && slope20Pct < -0.05) trend = 'DOWN';

  return {
    ema20: ema20Last,
    ema50: ema50Last,
    ema200: ema200Last,
    rsi: rsiLast,
    atr: atrLast,
    bbWidthPct,
    slope20Pct,
    trend,
    current: closes[last],
    candlesCount: candles.length,
  };
}
