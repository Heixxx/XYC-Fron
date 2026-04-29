import { useCallback, useEffect, useState } from 'react';
import type { Signal } from './useSignals';
import type { Candidate } from './useSignals';

const ENGINE_URL = (import.meta.env.VITE_FOREXAI_ENGINE_URL as string) || '';
const ENGINE_KEY = (import.meta.env.VITE_INTERNAL_API_KEY as string) || '';

function engineHeaders(extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (ENGINE_KEY) h['Authorization'] = `Bearer ${ENGINE_KEY}`;
  return h;
}

export type ProState = 'idle' | 'loading' | 'success' | 'error' | 'not-configured';

export interface ProDecision {
  pair: string;
  decision: string;
  reason?: string;
}

export interface UseProSignals {
  signals: Signal[];
  state: ProState;
  error: string | null;
  lastDecisions: ProDecision[];
  generate: (candidates: Candidate[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProSignals(category: 'FOREX' | 'CRYPTO'): UseProSignals {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [state, setState] = useState<ProState>(
    ENGINE_URL ? 'idle' : 'not-configured'
  );
  const [error, setError] = useState<string | null>(null);
  const [lastDecisions, setLastDecisions] = useState<ProDecision[]>([]);

  const refresh = useCallback(async () => {
    if (category !== 'FOREX' || !ENGINE_URL) return;
    try {
      const res = await fetch(`${ENGINE_URL}/api/signals?tier=PRO`, {
        headers: engineHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.signals)) {
        setSignals(
          data.signals.map((s: Signal) => ({ ...s, tier: 'PRO' as const }))
        );
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'fetch failed');
    }
  }, [category]);

  const generate = useCallback(async (candidates: Candidate[]) => {
    if (category !== 'FOREX') return;
    if (!ENGINE_URL) {
      setError('PRO Council backend not yet deployed. Coming soon.');
      setState('not-configured');
      return;
    }
    if (candidates.length === 0) {
      setError('No L0 candidates — refresh Standard first');
      setState('error');
      return;
    }
    setState('loading');
    setError(null);
    try {
      const res = await fetch(`${ENGINE_URL}/api/council`, {
        method: 'POST',
        headers: engineHeaders(),
        body: JSON.stringify({ candidates: candidates.slice(0, 5) }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Engine HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (Array.isArray(data.signals)) {
        setSignals(
          data.signals.map((s: Signal) => ({ ...s, tier: 'PRO' as const }))
        );
      }
      if (Array.isArray(data.decisions)) {
        setLastDecisions(data.decisions.filter(Boolean));
      }
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'council failed');
      setState('error');
    }
  }, [category]);

  useEffect(() => {
    if (category !== 'FOREX' || !ENGINE_URL) return;
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [category, refresh]);

  return { signals, state, error, lastDecisions, generate, refresh };
}
