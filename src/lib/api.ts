// ============================================================
// Shared API Client — FOREXAI Terminal
// ============================================================

// ---- Polyfill: AbortSignal.timeout for older browsers ----
if (typeof AbortSignal !== 'undefined' && !('timeout' in AbortSignal)) {
  (AbortSignal as any).timeout = (ms: number) => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(new DOMException('Timeout', 'TimeoutError')), ms);
    return ctrl.signal;
  };
}

// ---- Forex Rates: Multi-source fallback chain ----

export interface FxRate {
  pair: string;
  rate: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  timestamp: number;
  source: string;
}

const FX_DEF_FOR_FETCH = [
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

// ---- Cache helpers ----
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for forex
const NEWS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for news

function cacheGet<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - parsed.ts > ttl) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore
  }
}

// ---- Yahoo Finance v8 chart (primary) ----
export async function fetchYahooChart(
  symbol: string,
  interval: string = "1h",
  range: string = "1d"
): Promise<{ prices: number[]; timestamps: number[] } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;
    const timestamps: number[] = result.timestamp || [];
    const closes: number[] = result.indicators?.quote?.[0]?.close || [];
    const prices = closes.filter((c: number | null): c is number => c !== null && c !== undefined);
    return { prices, timestamps };
  } catch {
    return null;
  }
}

// ---- Yahoo Finance v7 quote (primary for rates) ----
export async function fetchYahooQuotes(quoteStr: string): Promise<Record<string, FxRate> | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(quoteStr)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const quotes = json.quoteResponse?.result;
    if (!Array.isArray(quotes) || quotes.length === 0) return null;
    const out: Record<string, FxRate> = {};
    for (const q of quotes) {
      const sym = q.symbol;
      const def = FX_DEF_FOR_FETCH.find((d) => d.yf === sym);
      if (!def) continue;
      const rate = q.regularMarketPrice ?? q.bid ?? 0;
      const change = q.regularMarketChange ?? 0;
      const changePct = q.regularMarketChangePercent ?? 0;
      out[def.pair] = {
        pair: def.pair,
        rate,
        bid: q.bid ?? rate * 0.99995,
        ask: q.ask ?? rate * 1.00005,
        change,
        changePct,
        high: q.regularMarketDayHigh ?? rate * 1.002,
        low: q.regularMarketDayLow ?? rate * 0.998,
        timestamp: Date.now(),
        source: "yahoo",
      };
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

// ---- open.er-api.com (fallback 1) ----
export async function fetchOpenErApi(): Promise<Record<string, FxRate> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.result !== "success") return null;
    const rates: Record<string, number> = json.rates || {};
    return buildRatesFromUSDRaw(rates, "open.er-api");
  } catch {
    return null;
  }
}

// ---- fawazahmed0 CDN (fallback 2) ----
export async function fetchFawazahmed0(): Promise<Record<string, FxRate> | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const usdRates: Record<string, number> = json.usd || {};
    const upper: Record<string, number> = {};
    for (const [k, v] of Object.entries(usdRates)) {
      upper[k.toUpperCase()] = v as number;
    }
    return buildRatesFromUSDRaw(upper, "fawazahmed0");
  } catch {
    return null;
  }
}

// ---- Frankfurter ECB (fallback 3) ----
export async function fetchFrankfurter(): Promise<Record<string, FxRate> | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v2/rates?base=USD", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{ date: string; base: string; quote: string; rate: number }>;
    if (!Array.isArray(list) || list.length === 0) return null;
    const rates: Record<string, number> = {};
    for (const item of list) {
      if (item.base === "USD" && item.quote && typeof item.rate === "number") {
        rates[item.quote] = item.rate;
      }
    }
    return buildRatesFromUSDRaw(rates, "frankfurter");
  } catch {
    return null;
  }
}

// Build FxRate map from USD-based raw rates
function buildRatesFromUSDRaw(rates: Record<string, number>, source: string): Record<string, FxRate> | null {
  const out: Record<string, FxRate> = {};
  const now = Date.now();
  for (const def of FX_DEF_FOR_FETCH) {
    const [base, quote] = def.pair.split("/");
    let rate = 0;
    if (base === "USD") {
      rate = rates[quote] || 0;
    } else if (quote === "USD") {
      rate = rates[base] ? 1 / rates[base] : 0;
    } else {
      // Cross rate
      const baseUSD = rates[base];
      const quoteUSD = rates[quote];
      if (baseUSD && quoteUSD) {
        rate = quoteUSD / baseUSD;
      }
    }
    if (rate > 0) {
      out[def.pair] = {
        pair: def.pair,
        rate,
        bid: rate * 0.99995,
        ask: rate * 1.00005,
        change: 0,
        changePct: 0,
        high: rate * 1.005,
        low: rate * 0.995,
        timestamp: now,
        source,
      };
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ---- Main forex fetch with full fallback chain ----
export async function fetchForexRates(): Promise<{
  rates: Record<string, FxRate>;
  source: string;
}> {
  // Try cache first
  const cached = cacheGet<Record<string, FxRate>>("forex-rates", CACHE_TTL_MS);
  if (cached) {
    return { rates: cached, source: "cache" };
  }

  // Primary: Yahoo Finance
  const symbols = FX_DEF_FOR_FETCH.map((d) => d.yf).join(",");
  let rates = await fetchYahooQuotes(symbols);
  let source = "yahoo";

  if (!rates) {
    rates = await fetchOpenErApi();
    source = "open.er-api";
  }
  if (!rates) {
    rates = await fetchFawazahmed0();
    source = "fawazahmed0";
  }
  if (!rates) {
    rates = await fetchFrankfurter();
    source = "frankfurter";
  }
  if (!rates) {
    // Ultimate fallback: return empty with signal
    return { rates: {}, source: "failed" };
  }

  // Enrich each rate with some realistic change values based on stored previous
  for (const pair of Object.keys(rates)) {
    const prev = localStorage.getItem(`fx-prev-${pair}`);
    if (prev) {
      const prevRate = parseFloat(prev);
      if (prevRate > 0) {
        rates[pair].change = rates[pair].rate - prevRate;
        rates[pair].changePct = (rates[pair].change / prevRate) * 100;
      }
    }
    localStorage.setItem(`fx-prev-${pair}`, String(rates[pair].rate));
  }

  cacheSet("forex-rates", rates);
  return { rates, source };
}

// ---- News Generation API ----

const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? '';
const PERPLEXITY_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY ?? '';

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  category: "Macro" | "Technical" | "Fundamental" | "Geopolitical";
  impact: "high" | "medium" | "low";
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  timestamp: string;
}

export interface EditionData {
  edition: "morning" | "noon" | "evening";
  timestamp: string;
  executiveSummary: string;
  articles: NewsArticle[];
  sentiment: { score: number; label: string; pairScores: Record<string, number> };
  keyLevels: Array<{ pair: string; support: string; resistance: string; pivot: string }>;
  deepDive: { macro: string; technical: string; centralBank: string; commodities: string };
}

async function callPerplexity(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function callDeepSeek(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-pro",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// Generate news for an edition
export async function generateNewsEdition(edition: "morning" | "noon" | "evening"): Promise<EditionData> {
  const cacheKey = `news-${edition}`;
  const cached = cacheGet<EditionData>(cacheKey, NEWS_CACHE_TTL_MS);
  if (cached) return cached;

  const hour = edition === "morning" ? "08:00" : edition === "noon" ? "12:00" : "18:00";
  const prompt = `You are a senior FX market analyst at a top-tier bank. Write the ${hour} UTC daily market intelligence briefing for forex traders.

Provide your response in EXACTLY this format (JSON-like sections, no markdown code blocks):

EXECUTIVE_SUMMARY: 3-4 concise sentences on overall market conditions, key themes, and sentiment.

ARTICLES:
1. |Headline|Summary|Category|Impact|Sentiment
2. |Headline|Summary|Category|Impact|Sentiment
3. |Headline|Summary|Category|Impact|Sentiment
4. |Headline|Summary|Category|Impact|Sentiment

Write exactly 4 articles. Categories: Macro, Technical, Fundamental, Geopolitical. Impact: high/medium/low. Sentiment: positive/negative/neutral.

SENTIMENT:
EUR/USD: score (0-100)
GBP/USD: score (0-100)
USD/JPY: score (0-100)
AUD/USD: score (0-100)
USD/CHF: score (0-100)
Overall: score (0-100)

KEY_LEVELS:
EUR/USD: support/resistance/pivot
GBP/USD: support/resistance/pivot
USD/JPY: support/resistance/pivot
AUD/USD: support/resistance/pivot
USD/CHF: support/resistance/pivot
USD/CAD: support/resistance/pivot

DEEP_DIVE_MACRO: 2 paragraphs on macro landscape.
DEEP_DIVE_TECHNICAL: 2 paragraphs on key technical levels across majors.
DEEP_DIVE_CENTRALBANK: 2 paragraphs on Fed/ECB/BOJ policy outlook.
DEEP_DIVE_COMMODITIES: 1 paragraph on gold and oil trends.

Today's date: ${new Date().toISOString().split("T")[0]}.`;

  let raw = await callPerplexity(prompt);
  if (!raw) raw = await callDeepSeek(prompt);
  if (!raw) {
    // Return fallback static data
    return getFallbackEdition(edition);
  }

  // Parse the response
  const data = parseNewsResponse(raw, edition);
  cacheSet(cacheKey, data);
  return data;
}

// Sentiment analysis via Kimi/DeepSeek
export async function analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
  try {
    const prompt = `Analyze the sentiment of this forex market text. Return ONLY a JSON object with "score" (0-100, 50=neutral) and "label" (positive/negative/neutral).\n\nText: ${text}`;
    let raw = await callDeepSeek(prompt);
    if (!raw) return { score: 50, label: "neutral" };
    // Extract JSON
    const jsonMatch = raw.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { score: parsed.score ?? 50, label: parsed.label ?? "neutral" };
    }
    return { score: 50, label: "neutral" };
  } catch {
    return { score: 50, label: "neutral" };
  }
}

// Parse news response
function parseNewsResponse(raw: string, edition: "morning" | "noon" | "evening"): EditionData {
  const now = new Date().toISOString();

  // Executive summary
  const execMatch = raw.match(/EXECUTIVE_SUMMARY:\s*(.+?)(?=\n\n|\nARTICLES|$)/s);
  const executiveSummary = execMatch?.[1]?.trim() || "Market conditions remain mixed with key drivers including central bank policy divergence and geopolitical developments.";

  // Articles
  const articles: NewsArticle[] = [];
  const articleMatches = raw.matchAll(/\d+\.\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/g);
  let idx = 1;
  for (const m of articleMatches) {
    const category = (m[3]?.trim() as NewsArticle["category"]) || "Macro";
    articles.push({
      id: `${edition}-article-${idx}`,
      headline: m[1]?.trim() || `Market Update ${idx}`,
      summary: m[2]?.trim() || "Key market developments continue to shape trading conditions.",
      category: ["Macro", "Technical", "Fundamental", "Geopolitical"].includes(category) ? category : "Macro",
      impact: (m[4]?.trim() as NewsArticle["impact"]) || "medium",
      sentiment: (m[5]?.trim() as NewsArticle["sentiment"]) || "neutral",
      source: "AI Analysis",
      timestamp: now,
    });
    idx++;
  }

  // Fallback articles if parsing failed
  if (articles.length === 0) {
    articles.push(
      { id: `${edition}-a1`, headline: "Fed Policy Outlook Drives Dollar Volatility", summary: "Federal Reserve officials signaled potential shifts in monetary policy, causing significant USD movements across major pairs.", category: "Macro", impact: "high", sentiment: "negative", source: "AI Analysis", timestamp: now },
      { id: `${edition}-a2`, headline: "EUR/USD Tests Key Technical Resistance", summary: "The fiber pair is approaching critical resistance levels as traders assess ECB divergence from Fed policy.", category: "Technical", impact: "medium", sentiment: "neutral", source: "AI Analysis", timestamp: now },
      { id: `${edition}-a3`, headline: "BoJ Intervention Concerns Mount", summary: "Japanese authorities hinted at possible FX intervention as USD/JPY approaches key psychological levels.", category: "Fundamental", impact: "high", sentiment: "negative", source: "AI Analysis", timestamp: now },
      { id: `${edition}-a4`, headline: "Geopolitical Tensions Support Safe Havens", summary: "Ongoing geopolitical developments are boosting demand for safe-haven currencies including CHF and JPY.", category: "Geopolitical", impact: "medium", sentiment: "positive", source: "AI Analysis", timestamp: now }
    );
  }

  // Sentiment scores
  const sentimentScores: Record<string, number> = {};
  const sentMatches = raw.matchAll(/([A-Z]{3}\/[A-Z]{3}):\s*(\d+)/g);
  for (const m of sentMatches) {
    sentimentScores[m[1]] = parseInt(m[2], 10);
  }
  const overallMatch = raw.match(/Overall:\s*(\d+)/);
  const overallScore = parseInt(overallMatch?.[1] || "50", 10);

  // Key levels
  const keyLevels: Array<{ pair: string; support: string; resistance: string; pivot: string }> = [];
  const levelMatches = raw.matchAll(/([A-Z]{3}\/[A-Z]{3}):\s*([\d.]+)\/([\d.]+)\/([\d.]+)/g);
  for (const m of levelMatches) {
    keyLevels.push({ pair: m[1], support: m[2], resistance: m[3], pivot: m[4] });
  }
  if (keyLevels.length === 0) {
    keyLevels.push(
      { pair: "EUR/USD", support: "1.0720", resistance: "1.0950", pivot: "1.0835" },
      { pair: "GBP/USD", support: "1.2450", resistance: "1.2780", pivot: "1.2615" },
      { pair: "USD/JPY", support: "147.50", resistance: "152.00", pivot: "149.75" },
      { pair: "AUD/USD", support: "0.6450", resistance: "0.6620", pivot: "0.6535" },
      { pair: "USD/CHF", support: "0.8720", resistance: "0.8920", pivot: "0.8820" },
      { pair: "USD/CAD", support: "1.3480", resistance: "1.3620", pivot: "1.3550" }
    );
  }

  // Deep dive sections
  const macroMatch = raw.match(/DEEP_DIVE_MACRO:\s*(.+?)(?=\nDEEP_DIVE_TECHNICAL|$)/s);
  const techMatch = raw.match(/DEEP_DIVE_TECHNICAL:\s*(.+?)(?=\nDEEP_DIVE_CENTRALBANK|$)/s);
  const cbMatch = raw.match(/DEEP_DIVE_CENTRALBANK:\s*(.+?)(?=\nDEEP_DIVE_COMMODITIES|$)/s);
  const commMatch = raw.match(/DEEP_DIVE_COMMODITIES:\s*(.+?)(?=\n|$)/s);

  return {
    edition,
    timestamp: now,
    executiveSummary,
    articles,
    sentiment: {
      score: overallScore || 50,
      label: (overallScore || 50) > 55 ? "positive" : (overallScore || 50) < 45 ? "negative" : "neutral",
      pairScores: sentimentScores,
    },
    keyLevels,
    deepDive: {
      macro: macroMatch?.[1]?.trim() || "Global macro conditions remain complex with divergent monetary policies across major central banks.",
      technical: techMatch?.[1]?.trim() || "Key technical levels are being tested across major pairs with significant support and resistance zones in play.",
      centralBank: cbMatch?.[1]?.trim() || "Central bank policy divergence continues to be the primary driver of FX volatility.",
      commodities: commMatch?.[1]?.trim() || "Gold remains supported by safe-haven demand while oil prices react to supply dynamics.",
    },
  };
}

function getFallbackEdition(edition: "morning" | "noon" | "evening"): EditionData {
  const now = new Date().toISOString();
  return {
    edition,
    timestamp: now,
    executiveSummary: "Markets are navigating a complex landscape of central bank policy divergence and evolving geopolitical risks. Dollar strength remains a key theme while euro and yen face divergent pressures.",
    articles: [
      { id: `${edition}-f1`, headline: "Fed Signals Higher-for-Longer Rate Stance", summary: "Federal Reserve officials reinforced expectations that interest rates will remain elevated, providing support for the US dollar across the board.", category: "Macro", impact: "high", sentiment: "positive", source: "Market Analysis", timestamp: now },
      { id: `${edition}-f2`, headline: "ECB Faces Inflation vs Growth Dilemma", summary: "The European Central Bank is weighing sticky inflation against slowing economic growth, creating uncertainty for the euro's trajectory.", category: "Fundamental", impact: "high", sentiment: "negative", source: "Market Analysis", timestamp: now },
      { id: `${edition}-f3`, headline: "USD/JPY Approaches Intervention Zone", summary: "Traders are monitoring Japanese authorities' rhetoric as the yen weakens toward levels that previously triggered official intervention.", category: "Technical", impact: "medium", sentiment: "neutral", source: "Market Analysis", timestamp: now },
      { id: `${edition}-f4`, headline: "Middle East Tensions Boost Safe Haven Demand", summary: "Escalating geopolitical tensions in the Middle East are driving flows into safe-haven currencies and gold.", category: "Geopolitical", impact: "medium", sentiment: "negative", source: "Market Analysis", timestamp: now },
    ],
    sentiment: { score: 48, label: "neutral", pairScores: { "EUR/USD": 45, "GBP/USD": 48, "USD/JPY": 52, "AUD/USD": 42, "USD/CHF": 55 } },
    keyLevels: [
      { pair: "EUR/USD", support: "1.0720", resistance: "1.0950", pivot: "1.0835" },
      { pair: "GBP/USD", support: "1.2450", resistance: "1.2780", pivot: "1.2615" },
      { pair: "USD/JPY", support: "147.50", resistance: "152.00", pivot: "149.75" },
      { pair: "AUD/USD", support: "0.6450", resistance: "0.6620", pivot: "0.6535" },
      { pair: "USD/CHF", support: "0.8720", resistance: "0.8920", pivot: "0.8820" },
      { pair: "USD/CAD", support: "1.3480", resistance: "1.3620", pivot: "1.3550" },
    ],
    deepDive: {
      macro: "Global macroeconomic conditions remain in flux. The US economy continues showing resilience despite aggressive tightening, while European growth stalls. China's economic trajectory is improving but remains uneven. Inflation is moderating but remains above target in most developed economies, keeping central banks cautious about premature easing.",
      technical: "Major pairs are at critical technical junctures. EUR/USD is testing the 1.0850 resistance zone with the 200-day MA providing dynamic resistance. GBP/USD is consolidating above 1.2600 support. USD/JPY's break above 150 has opened the door to further gains but intervention risk caps the upside. AUD/USD remains in a downtrend channel.",
      centralBank: "The Federal Reserve maintains its data-dependent stance with markets pricing in fewer rate cuts for 2024. The ECB faces a particularly challenging environment with the eurozone economy contracting in Q4. The Bank of Japan is moving toward policy normalization but at a glacial pace. The BoE is balancing sticky services inflation against a weak economy.",
      commodities: "Gold (XAU/USD) is trading near $2,050, supported by safe-haven demand and expectations of eventual Fed easing. Oil prices remain volatile with Brent crude rangebound between $78-82 as markets weigh OPEC+ compliance against non-OPEC supply growth.",
    },
  };
}

// ---- Text-to-Speech for audio briefing ----
export function speakBriefing(text: string, rate: number = 1): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.name.includes("Google US English") || v.name.includes("Samantha"));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ---- Historical chart data via Yahoo ----
export async function fetchPairHistory(
  pair: string,
  interval: string = "1h",
  range: string = "1d"
): Promise<{ prices: number[]; timestamps: number[] } | null> {
  const def = FX_DEF_FOR_FETCH.find((d) => d.pair === pair);
  if (!def) return null;
  return fetchYahooChart(def.yf, interval, range);
}
