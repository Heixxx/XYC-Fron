import { fetchTwelveDataCandles } from './twelvedata';
import type { Candle, Timeframe } from './twelvedata';

export type { Candle, Timeframe };

export interface ForexPoint {
  date: string;   // YYYY-MM-DD
  rate: number;
}

/**
 * Fetch daily rates for a pair like "EUR/USD" or "USD/JPY".
 * Backward-compatible adapter: now uses Twelve Data instead of Frankfurter.
 * Returns the last `days` trading days, oldest first.
 */
export async function fetchForexSeries(
  pair: string,
  days: number = 120
): Promise<ForexPoint[]> {
  const candles = await fetchTwelveDataCandles(pair, '1day', days);
  return candles.map((c) => ({
    date: new Date(c.timestamp).toISOString().slice(0, 10),
    rate: c.close,
  }));
}

/**
 * Multi-timeframe fetch for the Strategy Council.
 * Fetches 1h, 4h, 1day candles in parallel with per-TF caching.
 */
export async function fetchForexCandlesMultiTF(
  pair: string,
  timeframes: Timeframe[] = ['1h', '4h', '1day'],
  outputsize: number = 200
): Promise<Record<Timeframe, Candle[]>> {
  const results = await Promise.all(
    timeframes.map((tf) =>
      fetchTwelveDataCandles(pair, tf, outputsize)
        .then((data) => [tf, data] as const)
        .catch((err) => {
          console.warn(`MultiTF fetch failed for ${pair} ${tf}:`, err);
          return [tf, [] as Candle[]] as const;
        })
    )
  );
  return Object.fromEntries(results) as Record<Timeframe, Candle[]>;
}
