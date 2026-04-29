import { useState, useCallback, useRef, useEffect } from 'react';
import { callClaudeVision, fileToBase64, resizeImageForAI } from '@/lib/ai-api';
import type { VisionMessage } from '@/lib/ai-api';

export interface OverlayLine {
  type: 'support' | 'resistance' | 'trendline';
  label: string;
  y1: number;
  y2: number;
  x1: number;
  x2: number;
  price?: string;
}

export interface OverlayZone {
  type: 'support' | 'resistance' | 'supply' | 'demand';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlayMarker {
  type: string;
  label: string;
  x: number;
  y: number;
}

export interface AnalysisResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  summary: string;
  supports: { level: string; strength: string }[];
  resistances: { level: string; strength: string }[];
  patterns: { name: string; reliability: string; description: string }[];
  trend: { primary: string; secondary: string; strength: number };
  recommendation: {
    action: string;
    entry: string;
    target: string;
    stop: string;
    riskReward: string;
  };
  lines: OverlayLine[];
  zones: OverlayZone[];
  markers: OverlayMarker[];
  raw: string;
}

export interface CachedAnalysis {
  id: string;
  hash: string;
  thumbnail: string;
  instrument: string;
  timestamp: number;
  result: AnalysisResult;
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function parseAnalysis(raw: string): AnalysisResult {
  const result: AnalysisResult = {
    sentiment: 'Neutral',
    confidence: 50,
    summary: '',
    supports: [],
    resistances: [],
    patterns: [],
    trend: { primary: 'Sideways', secondary: 'N/A', strength: 50 },
    recommendation: { action: 'Wait', entry: 'N/A', target: 'N/A', stop: 'N/A', riskReward: 'N/A' },
    lines: [],
    zones: [],
    markers: [],
    raw,
  };

  // Simple parsing heuristics
  const lower = raw.toLowerCase();
  if (lower.includes('bullish')) result.sentiment = 'Bullish';
  else if (lower.includes('bearish')) result.sentiment = 'Bearish';

  const confMatch = raw.match(/confidence[:\s]*(\d+)%?/i);
  if (confMatch) result.confidence = parseInt(confMatch[1], 10);

  // Extract supports
  const supportMatches = raw.matchAll(/[Ss]upport[:\s]*([\d.]+)[\s\w]*(?:\((\w+)\))?/g);
  for (const m of supportMatches) {
    result.supports.push({ level: m[1], strength: m[2] || 'moderate' });
  }
  if (result.supports.length === 0) {
    const sMatch = raw.match(/supports?[\s:]+([\d.]+)/gi);
    if (sMatch) {
      sMatch.forEach((s) => {
        const num = s.match(/[\d.]+/);
        if (num) result.supports.push({ level: num[0], strength: 'moderate' });
      });
    }
  }

  // Extract resistances
  const resMatches = raw.matchAll(/[Rr]esistance[:\s]*([\d.]+)[\s\w]*(?:\((\w+)\))?/g);
  for (const m of resMatches) {
    result.resistances.push({ level: m[1], strength: m[2] || 'moderate' });
  }
  if (result.resistances.length === 0) {
    const rMatch = raw.match(/resistances?[\s:]+([\d.]+)/gi);
    if (rMatch) {
      rMatch.forEach((s) => {
        const num = s.match(/[\d.]+/);
        if (num) result.resistances.push({ level: num[0], strength: 'moderate' });
      });
    }
  }

  // Extract patterns
  const patterns = ['head and shoulders', 'triangle', 'wedge', 'flag', 'pennant', 'double top', 'double bottom', 'channel'];
  patterns.forEach((p) => {
    if (lower.includes(p)) {
      result.patterns.push({ name: p, reliability: 'moderate', description: `${p} pattern detected` });
    }
  });

  // Trend
  if (lower.includes('uptrend') || lower.includes('up trend')) result.trend.primary = 'Uptrend';
  if (lower.includes('downtrend') || lower.includes('down trend')) result.trend.primary = 'Downtrend';

  // Recommendation
  const recMatch = raw.match(/recommendation[:\s]*([^.]+)/i);
  if (recMatch) result.recommendation.action = recMatch[1].trim();
  const entryMatch = raw.match(/entry[:\s]*([\d.]+)/i);
  if (entryMatch) result.recommendation.entry = entryMatch[1];
  const tpMatch = raw.match(/target[:\s]*([\d.]+)|tp[:\s]*([\d.]+)|take profit[:\s]*([\d.]+)/i);
  if (tpMatch) result.recommendation.target = tpMatch[1] || tpMatch[2] || tpMatch[3];
  const slMatch = raw.match(/stop[:\s]*([\d.]+)|sl[:\s]*([\d.]+)|stop loss[:\s]*([\d.]+)/i);
  if (slMatch) result.recommendation.stop = slMatch[1] || slMatch[2] || slMatch[3];
  const rrMatch = raw.match(/r[:\/]r[:\s]*([\d:.]+)|risk[\/\s]*reward[:\s]*([\d:.]+)/i);
  if (rrMatch) result.recommendation.riskReward = rrMatch[1] || rrMatch[2];

  // Summary
  const firstSentence = raw.split('.')[0];
  if (firstSentence) result.summary = firstSentence.trim();

  // Generate mock overlays from detected levels
  result.supports.forEach((s, i) => {
    const y = 0.3 + i * 0.15;
    result.lines.push({ type: 'support', label: `S${i + 1}: ${s.level}`, y1: y, y2: y, x1: 0, x2: 1, price: s.level });
  });
  result.resistances.forEach((r, i) => {
    const y = 0.2 + i * 0.12;
    result.lines.push({ type: 'resistance', label: `R${i + 1}: ${r.level}`, y1: y, y2: y, x1: 0, x2: 1, price: r.level });
  });

  return result;
}

const CACHE_KEY = 'vision_cache';

function loadCache(): CachedAnalysis[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCache(cache: CachedAnalysis[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache.slice(0, 20))); } catch { /* ignore */ }
}

export function useVision() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showOverlays, setShowOverlays] = useState({
    supports: true,
    trendlines: true,
    zones: true,
    labels: true,
  });
  const [showRaw, setShowRaw] = useState(false);
  const [cache, setCache] = useState<CachedAnalysis[]>(loadCache);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Upload image
  const uploadImage = useCallback(async (file: File) => {
    setError('');
    const resized = await resizeImageForAI(file, 1024);
    const blobUrl = URL.createObjectURL(resized);
    setImageUrl(blobUrl);
    // Create a File-like object from the Blob for base64 conversion
    const resizedFile = new File([resized], 'image.jpg', { type: 'image/jpeg' });
    const base64 = await fileToBase64(resizedFile);
    const hash = simpleHash(base64);
    setImageHash(hash);

    // Check cache
    const cached = loadCache().find((c) => c.hash === hash);
    if (cached) {
      setResult(cached.result);
      return;
    }

    // Analyze
    setIsAnalyzing(true);
    try {
      const messages: VisionMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this financial chart. Identify: 1) Support and resistance levels with specific prices, 2) Trend direction, 3) Any chart patterns, 4) Key zones, 5) Trading recommendation with entry, target, stop loss. Format with clear section headers.',
            },
          ],
        },
      ];
      const res = await callClaudeVision(messages);
      const parsed = parseAnalysis(res.content);
      setResult(parsed);

      // Save to cache
      const newEntry: CachedAnalysis = {
        id: `vis-${Date.now()}`,
        hash,
        thumbnail: blobUrl as unknown as string,
        instrument: 'Unknown',
        timestamp: Date.now(),
        result: parsed,
      };
      const newCache = [newEntry, ...loadCache()].slice(0, 20);
      setCache(newCache);
      saveCache(newCache);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      // Set demo result on error
      setResult({
        sentiment: 'Bullish',
        confidence: 72,
        summary: 'Chart shows bullish momentum with support at key levels.',
        supports: [{ level: '1.0840', strength: 'strong' }, { level: '1.0800', strength: 'moderate' }],
        resistances: [{ level: '1.0920', strength: 'strong' }, { level: '1.0960', strength: 'moderate' }],
        patterns: [{ name: 'Ascending Triangle', reliability: 'moderate', description: 'Bullish continuation pattern' }],
        trend: { primary: 'Uptrend', secondary: 'Short-term consolidation', strength: 65 },
        recommendation: { action: 'Consider long position', entry: '1.0850', target: '1.0920', stop: '1.0810', riskReward: '1.75' },
        lines: [
          { type: 'support', label: 'S1: 1.0840', y1: 0.7, y2: 0.7, x1: 0, x2: 1, price: '1.0840' },
          { type: 'support', label: 'S2: 1.0800', y1: 0.85, y2: 0.85, x1: 0, x2: 1, price: '1.0800' },
          { type: 'resistance', label: 'R1: 1.0920', y1: 0.25, y2: 0.25, x1: 0, x2: 1, price: '1.0920' },
          { type: 'trendline', label: 'Uptrend', y1: 0.8, y2: 0.4, x1: 0, x2: 0.8 },
        ],
        zones: [
          { type: 'demand', label: 'Demand Zone', x: 0.1, y: 0.75, width: 0.3, height: 0.1 },
        ],
        markers: [{ type: 'triangle', label: 'Ascending Triangle', x: 0.6, y: 0.3 }],
        raw: 'Demo analysis (API unavailable). Chart shows bullish momentum.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(3, Math.max(0.5, z + delta)));
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.25)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.25)), []);
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  // Touch handlers for mobile pinch-to-zoom
  const lastTouchDist = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist.current > 0) {
        const scale = dist / lastTouchDist.current;
        setZoom((z) => Math.min(3, Math.max(0.5, z * scale)));
      }
      lastTouchDist.current = dist;
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '0') resetView();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetView, zoomIn, zoomOut]);

  // Draw canvas overlays
  useEffect(() => {
    if (!result || !canvasRef.current || !imageUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    if (!showOverlays.supports && !showOverlays.trendlines && !showOverlays.zones && !showOverlays.labels) return;

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw lines
    result.lines.forEach((line) => {
      if (line.type === 'support' && !showOverlays.supports) return;
      if (line.type === 'resistance' && !showOverlays.supports) return;
      if (line.type === 'trendline' && !showOverlays.trendlines) return;

      ctx.beginPath();
      ctx.moveTo(line.x1 * w, line.y1 * h);
      ctx.lineTo(line.x2 * w, line.y2 * h);
      ctx.strokeStyle = line.type === 'support'
        ? 'rgba(16,185,129,0.6)'
        : line.type === 'resistance'
          ? 'rgba(239,68,68,0.6)'
          : 'rgba(59,130,246,0.7)';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash(line.type === 'trendline' ? [] : [6 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showOverlays.labels) {
        ctx.fillStyle = line.type === 'support'
          ? 'rgba(16,185,129,0.9)'
          : line.type === 'resistance'
            ? 'rgba(239,68,68,0.9)'
            : 'rgba(59,130,246,0.9)';
        ctx.font = `${12 / zoom}px JetBrains Mono, monospace`;
        ctx.fillText(line.label, 4 / zoom, line.y1 * h - 4 / zoom);
      }
    });

    // Draw zones
    if (showOverlays.zones) {
      result.zones.forEach((zone) => {
        ctx.fillStyle = zone.type === 'support'
          ? 'rgba(16,185,129,0.1)'
          : zone.type === 'resistance'
            ? 'rgba(239,68,68,0.1)'
            : zone.type === 'supply'
              ? 'rgba(245,158,11,0.1)'
              : 'rgba(59,130,246,0.1)';
        ctx.fillRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
        ctx.strokeStyle = zone.type === 'support'
          ? 'rgba(16,185,129,0.4)'
          : zone.type === 'resistance'
            ? 'rgba(239,68,68,0.4)'
            : zone.type === 'supply'
              ? 'rgba(245,158,11,0.4)'
              : 'rgba(59,130,246,0.4)';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(zone.x * w, zone.y * h, zone.width * w, zone.height * h);
      });
    }

    // Draw markers
    if (showOverlays.labels) {
      result.markers.forEach((marker) => {
        ctx.beginPath();
        ctx.arc(marker.x * w, marker.y * h, 8 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240,185,11,0.8)';
        ctx.fill();
        ctx.fillStyle = 'rgba(240,185,11,0.9)';
        ctx.font = `${10 / zoom}px Inter, sans-serif`;
        ctx.fillText(marker.label, (marker.x * w) + 12 / zoom, marker.y * h);
      });
    }

    ctx.restore();
  }, [result, zoom, pan, showOverlays, imageUrl]);

  // Load from cache
  const loadFromCache = useCallback((cached: CachedAnalysis) => {
    setImageUrl(cached.thumbnail);
    setImageHash(cached.hash);
    setResult(cached.result);
    setError('');
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setCache([]);
    setResult(null);
    setImageUrl(null);
    setImageHash('');
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }, []);

  return {
    imageUrl,
    imageHash,
    isAnalyzing,
    result,
    error,
    zoom,
    pan,
    isPanning,
    showOverlays,
    setShowOverlays,
    showRaw,
    setShowRaw,
    cache,
    canvasRef,
    containerRef,
    uploadImage,
    zoomIn,
    zoomOut,
    resetView,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    loadFromCache,
    clearAll,
  };
}
