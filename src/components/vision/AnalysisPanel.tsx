import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { AnalysisResult } from '@/hooks/useVision';

interface AnalysisPanelProps {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string;
  showRaw: boolean;
  setShowRaw: (v: boolean) => void;
}

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({ title, children, defaultOpen = true }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 px-1 hover:opacity-80 transition-opacity"
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && (
        <div className="pb-3 px-1" style={{ animation: 'slide-up 0.2s ease-out' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function AnalysisPanel({ isAnalyzing, result, error, showRaw, setShowRaw }: AnalysisPanelProps) {
  const { t } = useTranslation();
  const getSentimentColor = (s: string) => {
    if (s === 'Bullish') return 'var(--accent-green)';
    if (s === 'Bearish') return 'var(--accent-red)';
    return 'var(--text-muted)';
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader size={32} className="animate-spin mb-3" style={{ color: 'var(--accent-blue)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('vision.analyzing')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('vision.analyzingHint')}</p>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <X size={32} className="mb-3" style={{ color: 'var(--accent-red)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('vision.analysisFailed')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <FileText size={32} className="mb-3" style={{ color: 'var(--text-disabled)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('vision.uploadPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <Check size={16} style={{ color: 'var(--accent-green)' }} />
        <span className="text-sm" style={{ color: 'var(--accent-green)' }}>{t('vision.analysisComplete')}</span>
      </div>

      {/* Overall Assessment */}
      <AccordionSection title="Overall Assessment">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: `${getSentimentColor(result.sentiment)}20`,
              color: getSentimentColor(result.sentiment),
            }}
          >
            {result.sentiment}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.confidence')}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{result.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-600"
                style={{
                  width: `${result.confidence}%`,
                  backgroundColor: getSentimentColor(result.sentiment),
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {result.summary}
        </p>
      </AccordionSection>

      {/* Key Levels */}
      <AccordionSection title={t("vision.keyLevels")}>
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-green)' }}>{t('vision.supports')}</p>
          {result.supports.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className="text-xs data-font" style={{ color: 'var(--text-primary)' }}>{s.level}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.strength}</span>
            </div>
          ))}
          {result.supports.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.noSupports')}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-red)' }}>{t('vision.resistances')}</p>
          {result.resistances.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className="text-xs data-font" style={{ color: 'var(--text-primary)' }}>{r.level}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.strength}</span>
            </div>
          ))}
          {result.resistances.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.noResistances')}</p>
          )}
        </div>
      </AccordionSection>

      {/* Patterns */}
      <AccordionSection title={t("vision.patternRecognition")}>
        {result.patterns.map((p, i) => (
          <div key={i} className="mb-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.reliability}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
          </div>
        ))}
        {result.patterns.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.noPatterns')}</p>
        )}
      </AccordionSection>

      {/* Trend Analysis */}
      <AccordionSection title={t("vision.trendAnalysis")}>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.primary')}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{result.trend.primary}</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.secondary')}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{result.trend.secondary}</span>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('vision.trendStrength')}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{result.trend.strength}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${result.trend.strength}%`,
                backgroundColor: 'var(--accent-purple)',
              }}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Recommendation */}
      <AccordionSection title={t("vision.recommendation")}>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent-gold)' }}>
            {result.recommendation.action}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('signals.entry'), value: result.recommendation.entry, color: 'var(--text-primary)' },
              { label: t('signals.target'), value: result.recommendation.target, color: 'var(--accent-green)' },
              { label: t('vision.stopLoss'), value: result.recommendation.stop, color: 'var(--accent-red)' },
              { label: t('vision.riskReward'), value: result.recommendation.riskReward, color: 'var(--accent-cyan)' },
            ].map((item) => (
              <div key={item.label}>
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className="text-xs data-font font-medium" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* Raw Analysis Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-2 text-xs mb-2 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <FileText size={14} />
          {showRaw ? t('vision.hideRaw') : t('vision.showRaw')}
        </button>
        {showRaw && (
          <pre
            className="text-xs p-3 rounded-lg overflow-auto max-h-[300px]"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {result.raw}
          </pre>
        )}
      </div>
    </div>
  );
}

