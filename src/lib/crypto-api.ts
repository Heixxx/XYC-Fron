import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

export const CRYPTO_SYMS = [
  "BTCUSDT","ETHUSDT","PAXGUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT",
  "AVAXUSDT","DOGEUSDT","LINKUSDT","DOTUSDT","LTCUSDT","UNIUSDT","ATOMUSDT",
  "NEARUSDT","ARBUSDT","OPUSDT","MATICUSDT","INJUSDT","SEIUSDT",
];

export const CRYPTO_TAG: Record<string, string> = {
  PAXGUSDT:"GOLD",BTCUSDT:"BTC",ETHUSDT:"ETH",BNBUSDT:"BNB",SOLUSDT:"L1",
  XRPUSDT:"L1",ADAUSDT:"L1",AVAXUSDT:"L1",DOGEUSDT:"MEME",LINKUSDT:"DeFi",
  DOTUSDT:"L0",LTCUSDT:"PoW",UNIUSDT:"DeFi",ATOMUSDT:"L1",NEARUSDT:"L1",
  ARBUSDT:"L2",OPUSDT:"L2",MATICUSDT:"L2",INJUSDT:"L1",SEIUSDT:"L1",
};

export const DISPLAY_NAME: Record<string, string> = {
  BTCUSDT:"BTC/USDT",ETHUSDT:"ETH/USDT",PAXGUSDT:"PAXG/USDT",BNBUSDT:"BNB/USDT",
  SOLUSDT:"SOL/USDT",XRPUSDT:"XRP/USDT",ADAUSDT:"ADA/USDT",AVAXUSDT:"AVAX/USDT",
  DOGEUSDT:"DOGE/USDT",LINKUSDT:"LINK/USDT",DOTUSDT:"DOT/USDT",LTCUSDT:"LTC/USDT",
  UNIUSDT:"UNI/USDT",ATOMUSDT:"ATOM/USDT",NEARUSDT:"NEAR/USDT",ARBUSDT:"ARB/USDT",
  OPUSDT:"OP/USDT",MATICUSDT:"MATIC/USDT",INJUSDT:"INJ/USDT",SEIUSDT:"SEI/USDT",
};

export const COIN_ICON: Record<string, string> = {
  BTCUSDT:"₿",ETHUSDT:"Ξ",PAXGUSDT:"🥇",BNBUSDT:"🔶",SOLUSDT:"◎",
  XRPUSDT:"✦",ADAUSDT:"₳",AVAXUSDT:"🔺",DOGEUSDT:"Ð",LINKUSDT:"⬡",
  DOTUSDT:"●",LTCUSDT:"Ł",UNIUSDT:"🦄",ATOMUSDT:"⚛",NEARUSDT:"⦿",
  ARBUSDT:"🅰",OPUSDT:"🟢",MATICUSDT:"Ⓜ️",INJUSDT:"◈",SEIUSDT:"🌊",
};

const BINANCE_REST = "https://api.binance.com/api/v3";

export interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface MiniTicker {
  s: string; // symbol
  c: string; // close price
  o: string; // open price
  h: string; // high
  l: string; // low
  v: string; // volume
  q: string; // quote volume
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── REST API ────────────────────────────────────────────────────────────────

export async function fetchTickers24h(): Promise<Ticker24h[]> {
  const url = `${BINANCE_REST}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(CRYPTO_SYMS))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Binance 24h fetch failed");
  return res.json();
}

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<KlineData[]> {
  const url = `${BINANCE_REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Binance klines fetch failed");
  const data: [number, string, string, string, string, string, number, string, number, string, string, string][] = await res.json();
  return data.map((k) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

export async function fetchGlobalData(): Promise<{
  marketCap: number;
  volume24h: number;
  btcDominance: number;
}> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global");
    if (!res.ok) throw new Error("CoinGecko failed");
    const json = await res.json();
    const d = json.data;
    return {
      marketCap: d.total_market_cap?.usd ?? 0,
      volume24h: d.total_volume?.usd ?? 0,
      btcDominance: d.market_cap_percentage?.btc ?? 0,
    };
  } catch {
    return { marketCap: 0, volume24h: 0, btcDominance: 0 };
  }
}

export async function fetchDepth(symbol: string): Promise<{
  bids: [string, string][];
  asks: [string, string][];
}> {
  const url = `${BINANCE_REST}/depth?symbol=${symbol}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Binance depth fetch failed");
  const data = await res.json();
  return { bids: data.bids ?? [], asks: data.asks ?? [] };
}

// ─── WebSocket Hook ──────────────────────────────────────────────────────────

const WS_URL = `wss://stream.binance.com:9443/stream?streams=${CRYPTO_SYMS.map((s) => `${s.toLowerCase()}@miniTicker`).join("/")}`;

export function useBinanceWebSocket(enabled: boolean = true) {
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, MiniTicker>>({});
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const tick: MiniTicker = parsed.data;
        if (tick?.s) {
          setPrices((prev) => ({ ...prev, [tick.s]: tick }));
        }
      } catch {
        // ignore
      }
    };
  }, [enabled]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, prices, connect, disconnect };
}
