import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Whale Flow Generator ────────────────────────────────────────────────────

const PLAYERS = ["Hedge Fund","Central Bank","Market Maker","Asset Manager","Sovereign Fund","Quant Fund"];
const NOTES = ["Accumulation","Distribution","Liquidation","Stop Hunt","Breakout","Rebalancing","","",""];

const FX_PAIRS = [
  "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","EUR/JPY","GBP/JPY",
];
const ALL_INST = [...FX_PAIRS, "BTC","ETH","PAXG","SOL","BNB","XRP"];

export interface WhaleFlow {
  id: number;
  isNew: boolean;
  time: string;
  sym: string;
  dir: "BUY" | "SELL";
  vol: number;
  player: string;
  str: number;
  note: string;
}

export function mkFlow(): WhaleFlow {
  return {
    id: Math.random(),
    isNew: true,
    time: new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    sym: ALL_INST[Math.floor(Math.random() * ALL_INST.length)],
    dir: Math.random() > 0.5 ? "BUY" : "SELL",
    vol: Math.round((50 + Math.random() * 2950)) * 1e6,
    player: PLAYERS[Math.floor(Math.random() * PLAYERS.length)],
    str: Math.floor(1 + Math.random() * 5),
    note: NOTES[Math.floor(Math.random() * NOTES.length)],
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWhales({
  enabled = true,
  maxRows = 100,
  intervalMs = 4000,
}: {
  enabled?: boolean;
  maxRows?: number;
  intervalMs?: number;
} = {}) {
  const [flows, setFlows] = useState<WhaleFlow[]>([]);
  const [netFlow, setNetFlow] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addFlow = useCallback(() => {
    setFlows((prev) => {
      const flow = mkFlow();
      const next = [flow, ...prev];
      if (next.length > maxRows) next.pop();
      // Clear isNew flag after a short delay
      setTimeout(() => {
        setFlows((p) => p.map((f) => (f.id === flow.id ? { ...f, isNew: false } : f)));
      }, 1000);
      return next;
    });
    setTxCount((c) => c + 1);
    setNetFlow((n) => {
      const f = mkFlow();
      return n + (f.dir === "BUY" ? f.vol : -f.vol);
    });
  }, [maxRows]);

  useEffect(() => {
    if (!enabled) return;
    // Seed initial data
    for (let i = 0; i < 12; i++) {
      setFlows((prev) => {
        const flow = mkFlow();
        flow.isNew = false;
        return [...prev, flow].slice(0, maxRows);
      });
    }
    setTxCount(12);

    intervalRef.current = setInterval(() => {
      addFlow();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, addFlow, maxRows]);

  return { flows, netFlow, txCount };
}
