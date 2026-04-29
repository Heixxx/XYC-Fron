// src/lib/twelvedata.ts — Twelve Data REST client with in-memory cache

const TD_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY || '';
const TD_BASE = 'https://api.twelvedata.com';

export type Timeframe = '15min' | '1h' | '4h' | '1day';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CacheEntry {
  ts: number;
  data: Candle[];
}

const CACHE = new Map<string, CacheEntry>();
const TTL_MS: Record<Timeframe, number> = {
  '15min': 5 * 60_000,
  '1h': 15 * 60_000,
  '4h': 60 * 60_000,
  '1day': 6 * 60 * 60_000,
};

export async function fetchTwelveDataCandles(
  pair: string,
  timeframe: Timeframe,
  outputsize: number = 200
): Promise<Candle[]> {
  if (!TD_KEY) {
    console.warn('[TwelveData] No API key configured');
    throw new Error('TwelveData API key not configured');
  }

  const cacheKey = `${pair}:${timeframe}:${outputsize}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS[timeframe]) {
    return cached.data;
  }

  const url = new URL(`${TD_BASE}/time_series`);
  url.searchParams.set('symbol', pair);
  url.searchParams.set('interval', timeframe);
  url.searchParams.set('outputsize', String(outputsize));
  url.searchParams.set('apikey', TD_KEY);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('order', 'ASC');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === 'error' || !data.values) {
    throw new Error(`TwelveData API: ${data.message || 'no data'}`);
  }

  const candles: Candle[] = data.values.map((v: {
    datetime: string; open: string; high: string; low: string;
    close: string; volume?: string;
  }) => ({
    timestamp: new Date(v.datetime + 'Z').getTime(),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume ? parseFloat(v.volume) : 0,
  }));

  CACHE.set(cacheKey, { ts: Date.now(), data: candles });
  return candles;
}

export async function fetchTwelveDataQuote(pair: string): Promise<number> {
  if (!TD_KEY) {
    throw new Error('TwelveData API key not configured');
  }
  const url = new URL(`${TD_BASE}/quote`);
  url.searchParams.set('symbol', pair);
  url.searchParams.set('apikey', TD_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TwelveData quote HTTP ${res.status}`);
  const data = await res.json();
  return parseFloat(data.close ?? data.price ?? '0');
}
