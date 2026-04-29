// AI API wrappers for FOREXAI Terminal
// Handles DeepSeek, Claude, Perplexity, and Kimi APIs with fallback logic

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface APIResponse {
  content: string;
  model: string;
  latency: number;
}

// ─── DeepSeek API ──────────────────────────────────────────────
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export interface CallDeepSeekOpts {
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export async function callDeepSeek(
  messages: ChatMessage[],
  model = 'deepseek-chat',
  opts?: CallDeepSeekOpts
): Promise<APIResponse> {
  const start = performance.now();
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 2048,
  };
  if (opts?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    latency: performance.now() - start,
  };
}

// ─── JSON parser with fallback ─────────────────────────────────
export function parseAgentJSON<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

// ─── Claude API ────────────────────────────────────────────────
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

function getClaudeKey(): string | null {
  // 1) Runtime injection (preferred)
  const injected = (window as unknown as Record<string, string>).__CLAUDE_API_KEY__;
  if (injected) return injected;
  // 2) Environment variable
  const envKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (envKey) return envKey;
  return null;
}

export async function callClaude(
  messages: ChatMessage[],
  model = 'claude-3-5-sonnet-20241022'
): Promise<APIResponse> {
  const key = getClaudeKey();
  if (!key) throw new Error('Claude API key not available');
  const start = performance.now();
  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.7,
      system: systemMsg?.content,
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    content: data.content?.[0]?.text || '',
    model: data.model || model,
    latency: performance.now() - start,
  };
}

// ─── Claude Vision API ─────────────────────────────────────────
export interface VisionMessage {
  role: 'user' | 'assistant';
  content: (
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  )[];
}

export async function callClaudeVision(
  messages: VisionMessage[],
  model = 'claude-3-5-sonnet-20241022'
): Promise<APIResponse> {
  const key = getClaudeKey();
  if (!key) throw new Error('Claude API key not available');
  const start = performance.now();
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.5,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude Vision ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    content: data.content?.[0]?.text || '',
    model: data.model || model,
    latency: performance.now() - start,
  };
}

// ─── Perplexity API ────────────────────────────────────────────
const PERPLEXITY_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY ?? '';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export async function callPerplexity(
  messages: ChatMessage[],
  model = 'sonar'
): Promise<APIResponse> {
  const start = performance.now();
  const res = await fetch(PERPLEXITY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    latency: performance.now() - start,
  };
}

export async function callPerplexityCached(
  messages: ChatMessage[],
  cacheKey: string,
  ttlMs = 30 * 60 * 1000
): Promise<APIResponse | null> {
  try {
    const stored = localStorage.getItem(`pplx_${cacheKey}`);
    if (stored) {
      const { ts, data } = JSON.parse(stored);
      if (Date.now() - ts < ttlMs) return data;
    }
  } catch {
    // ignore parse errors
  }
  const result = await callPerplexity(messages).catch(() => null);
  if (result) {
    try {
      localStorage.setItem(
        `pplx_${cacheKey}`,
        JSON.stringify({ ts: Date.now(), data: result })
      );
    } catch {
      // ignore quota errors
    }
  }
  return result;
}
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions';

export async function callKimi(
  messages: ChatMessage[],
  model = 'moonshot-v1-8k'
): Promise<APIResponse> {
  // Kimi key is expired (401), this will typically fall back
  const start = performance.now();
  const res = await fetch(KIMI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No valid key available - will 401
      Authorization: 'Bearer invalid-key',
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`Kimi ${res.status}: Key expired`);
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    latency: performance.now() - start,
  };
}

// ─── Unified caller with fallback ──────────────────────────────
export async function callAIWithFallback(
  primary: 'deepseek' | 'claude' | 'perplexity' | 'kimi',
  messages: ChatMessage[],
  fallbacks: ('deepseek' | 'claude' | 'perplexity' | 'kimi')[] = []
): Promise<APIResponse> {
  const callers: Record<string, (m: ChatMessage[]) => Promise<APIResponse>> = {
    deepseek: callDeepSeek,
    claude: callClaude,
    perplexity: callPerplexity,
    kimi: callKimi,
  };

  const order = [primary, ...fallbacks];
  for (const name of order) {
    try {
      return await callers[name](messages);
    } catch (err) {
      console.warn(`AI API ${name} failed:`, err);
      continue;
    }
  }
  throw new Error('All AI APIs failed');
}

// ─── Image to base64 helper ────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Resize image before sending ───────────────────────────────
export function resizeImageForAI(file: File | Blob, maxSize = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}
