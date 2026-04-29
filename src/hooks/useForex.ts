import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchForexRates, fetchPairHistory, fetchYahooChart } from '@/lib/api';
import type { FxRate } from '@/lib/api';

export interface ForexState {
  rates: Record<string, FxRate>;
  loading: boolean;
  error: string | null;
  source: string;
  lastUpdate: string;
}

const FX_DEF = [
  { pair: "EUR/USD", yf: "EURUSD=X", dec: 5, type: "Major" },
  { pair: "GBP/USD", yf: "GBPUSD=X", dec: 5, type: "Major" },
  { pair: "USD/JPY", yf: "JPY=X", dec: 3, type: "Major" },
  { pair: "USD/CHF", yf: "CHF=X", dec: 5, type: "Major" },
  { pair: "AUD/USD", yf: "AUDUSD=X", dec: 5, type: "Major" },
  { pair: "NZD/USD", yf: "NZDUSD=X", dec: 5, type: "Major" },
  { pair: "USD/CAD", yf: "CAD=X", dec: 5, type: "Major" },
  { pair: "EUR/GBP", yf: "EURGBP=X", dec: 5, type: "Cross" },
  { pair: "EUR/JPY", yf: "EURJPY=X", dec: 3, type: "Cross" },
  { pair: "GBP/JPY", yf: "GBPJPY=X", dec: 3, type: "Cross" },
  { pair: "EUR/CHF", yf: "EURCHF=X", dec: 5, type: "Cross" },
  { pair: "AUD/JPY", yf: "AUDJPY=X", dec: 3, type: "Cross" },
  { pair: "EUR/AUD", yf: "EURAUD=X", dec: 5, type: "Cross" },
  { pair: "EUR/CAD", yf: "EURCAD=X", dec: 5, type: "Cross" },
  { pair: "GBP/CHF", yf: "GBPCHF=X", dec: 5, type: "Cross" },
  { pair: "GBP/AUD", yf: "GBPAUD=X", dec: 5, type: "Cross" },
  { pair: "USD/SGD", yf: "SGD=X", dec: 5, type: "Exotic" },
  { pair: "USD/HKD", yf: "HKD=X", dec: 5, type: "Exotic" },
  { pair: "USD/MXN", yf: "MXN=X", dec: 4, type: "Exotic" },
  { pair: "USD/ZAR", yf: "ZAR=X", dec: 4, type: "Exotic" },
  { pair: "USD/TRY", yf: "TRY=X", dec: 4, type: "Exotic" },
  { pair: "USD/PLN", yf: "PLN=X", dec: 5, type: "Exotic" },
  { pair: "USD/NOK", yf: "NOK=X", dec: 4, type: "Exotic" },
  { pair: "USD/SEK", yf: "SEK=X", dec: 4, type: "Exotic" },
];

export { FX_DEF };

export function useForex() {
  const [state, setState] = useState<ForexState>({
    rates: {},
    loading: true,
    error: null,
    source: '',
    lastUpdate: '',
  });
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ prices: number[]; timestamps: number[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { rates, source } = await fetchForexRates();
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const sec = String(now.getUTCSeconds()).padStart(2, '0');
      setState({
        rates,
        loading: false,
        error: null,
        source,
        lastUpdate: `${h}:${m}:${sec} UTC`,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load rates',
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Auto refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(load, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  // Simulate ticks for visual breathing
  useEffect(() => {
    const tick = setInterval(() => {
      setState((s) => {
        if (Object.keys(s.rates).length === 0) return s;
        const newRates = { ...s.rates };
        for (const pair of Object.keys(newRates)) {
          const jitter = (Math.random() - 0.5) * 0.0002 * newRates[pair].rate;
          newRates[pair] = {
            ...newRates[pair],
            rate: newRates[pair].rate + jitter,
            bid: newRates[pair].bid + jitter,
            ask: newRates[pair].ask + jitter,
          };
        }
        return { ...s, rates: newRates };
      });
    }, 2000);
    return () => clearInterval(tick);
  }, []);

  const loadChart = useCallback(async (pair: string, interval?: string, range?: string) => {
    setChartLoading(true);
    setSelectedPair(pair);
    const data = await fetchPairHistory(pair, interval, range);
    setChartData(data);
    setChartLoading(false);
  }, []);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return {
    ...state,
    FX_DEF,
    refresh,
    selectedPair,
    loadChart,
    chartData,
    chartLoading,
  };
}

export function useSpotlightCharts() {
  const [charts, setCharts] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const spotlightPairs = ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD"];
    let cancelled = false;

    async function load() {
      const result: Record<string, number[]> = {};
      for (const pair of spotlightPairs) {
        if (pair === "XAU/USD") {
          const data = await fetchYahooChart("GC=F", "1h", "1d");
          result[pair] = data?.prices || generateMockSparkline();
        } else {
          const def = FX_DEF.find((d) => d.pair === pair);
          if (def) {
            const data = await fetchYahooChart(def.yf, "1h", "1d");
            result[pair] = data?.prices || generateMockSparkline();
          }
        }
        if (cancelled) return;
      }
      if (!cancelled) setCharts(result);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return charts;
}

function generateMockSparkline(): number[] {
  const points: number[] = [];
  let val = 1.0 + Math.random() * 0.1;
  for (let i = 0; i < 30; i++) {
    val += (Math.random() - 0.48) * 0.002;
    points.push(val);
  }
  return points;
}
