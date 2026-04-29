import { useState } from 'react';
import { RefreshCw, Zap, Layers } from 'lucide-react';
import { useSignals, extractCandidates } from '@/hooks/useSignals';
import { useProSignals } from '@/hooks/useProSignals';
import SignalCard from '@/components/signals/SignalCard';
import StepIndicator from '@/components/signals/StepIndicator';

export default function Signals() {
  const standardData = useSignals();
  const [tier, setTier] = useState<'STANDARD' | 'PRO'>('STANDARD');
  const proData = useProSignals(standardData.category);

  const {
    signals: allSignals,
    isRefreshing,
    pipelineStep,
    ensembleEnabled,
    setEnsembleEnabled,
    category,
    setCategory,
    minConfidence,
    setMinConfidence,
    countdown,
    autoEnabled,
    lastRefresh,
  } = standardData;

  // Computed stats
  const activeCount = allSignals.length;
  const minsAgo = Math.floor((Date.now() - (lastRefresh || Date.now())) / 60000);

  // Choose active signals based on tier
  const activeSignals =
    tier === 'PRO' && category === 'FOREX'
      ? proData.signals
      : allSignals;

  const handleRefresh = async () => {
    if (tier === 'PRO' && category === 'FOREX') {
      const candidates = extractCandidates(allSignals);
      await proData.generate(candidates);
    } else {
      standardData.refresh();
    }
  };

  // Pipeline display labels
  const layerBadges = [
    { label: 'L0: Strategies', color: '#3B82F6' },
    { label: 'L1: Trend', color: '#00E396' },
    { label: 'L2: Mean-Rev', color: '#8B5CF6' },
    { label: 'L3: Breakout', color: '#F59E0B' },
    { label: 'L4: Macro', color: '#F0B90B' },
  ];

  const isAutoPaused = !autoEnabled;
  const countdownStr = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  return (
    <div className="p-4 md:p-6 space-y-6" style={{ maxWidth: 1400 }}>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AI Signal Center
              </h1>
              {isAutoPaused && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                >
                  MANUAL
                </span>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              5-Layer Ensemble Intelligence
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 5-Layer Badge Strip */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {layerBadges.map((layer, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{
                      backgroundColor: layer.color,
                      opacity: pipelineStep > i ? 1 : 0.2,
                    }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {layer.label}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                backgroundColor: isRefreshing ? 'var(--bg-elevated)' : 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Processing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Zap size={14} style={{ color: 'var(--accent-amber)' }} />
            {activeCount} Active
          </span>
          <span>
            Last run: {minsAgo}m ago
          </span>
          <span className="font-mono">Next: {countdownStr}</span>
        </div>

        {/* Pipeline indicator */}
        {pipelineStep > 0 && <StepIndicator currentStep={pipelineStep} />}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category tabs */}
        <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          {(['FOREX', 'CRYPTO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-2 rounded-md text-sm font-medium transition"
              style={{
                backgroundColor: category === cat ? 'var(--bg-input)' : 'transparent',
                color: category === cat ? 'var(--text-primary)' : 'var(--text-muted)',
                border: category === cat ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ensemble toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnsembleEnabled(!ensembleEnabled)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: ensembleEnabled ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-elevated)',
              color: ensembleEnabled ? '#F59E0B' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Layers size={14} />
            {ensembleEnabled ? 'Ensemble On' : 'Ensemble Off'}
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min:</span>
          <input
            type="range"
            min={50}
            max={95}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-24 accent-amber-500"
          />
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{minConfidence}</span>
        </div>
      </div>

      {/* TIER TOGGLE — FOREX only */}
      {category === 'FOREX' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setTier('STANDARD')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: tier === 'STANDARD' ? '#2563EB' : 'var(--bg-input)',
              color: tier === 'STANDARD' ? '#FFF' : 'var(--text-muted)',
            }}
          >
            Standard
          </button>
          <button
            onClick={() => setTier('PRO')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            style={{
              backgroundColor: tier === 'PRO' ? '#F59E0B' : 'var(--bg-input)',
              color: tier === 'PRO' ? '#000' : 'var(--text-muted)',
            }}
          >
            <span>⭐</span> PRO Council
          </button>

          {tier === 'PRO' && proData.state === 'loading' && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Council deliberating... (15-30s)
            </span>
          )}
          {tier === 'PRO' && proData.state === 'success' && proData.signals.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--accent-green)' }}>
              {proData.signals.length} signal{proData.signals.length === 1 ? '' : 's'} published
            </span>
          )}
          {tier === 'PRO' && proData.state === 'not-configured' && (
            <span className="text-xs" style={{ color: 'var(--accent-amber)' }}>
              ⚙️ Backend coming soon
            </span>
          )}
          {tier === 'PRO' && proData.state === 'error' && (
            <span className="text-xs" style={{ color: 'var(--accent-red)' }}>
              Error: {proData.error}
            </span>
          )}
        </div>
      )}

      {/* Signal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Empty States */}
      {activeSignals.length === 0 && tier === 'PRO' && category === 'FOREX' && (
        <div className="p-6 rounded-lg text-center" style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-muted)',
        }}>
          {proData.state === 'not-configured' && (
            <>
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                PRO Council backend not yet deployed
              </div>
              <div className="text-sm">
                The PRO tier uses a separate Mastra backend with 5 specialized AI agents,
                micro-backtest, economic calendar, and correlation matrix. Coming in next deployment phase.
              </div>
            </>
          )}
          {proData.state === 'idle' && (
            <>
              <div className="text-2xl mb-2">⭐</div>
              <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Ready for PRO Council validation
              </div>
              <div className="text-sm">
                Click Refresh to send L0 candidates to the council.
                5 specialized AI agents will validate setups using multi-TF charts,
                micro-backtest, economic calendar, and correlation matrix.
              </div>
            </>
          )}
          {proData.state === 'loading' && (
            <>
              <div className="text-2xl mb-2 animate-pulse">🏛️</div>
              <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Council deliberating...
              </div>
              <div className="text-sm">
                Each candidate is being validated by Trend, Mean-Reversion, Breakout,
                Macro, and Risk specialists. Usually 15-30 seconds for 5 candidates.
              </div>
            </>
          )}
          {proData.state === 'success' && proData.signals.length === 0 && (
            <>
              <div className="text-2xl mb-2">🛡️</div>
              <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                All candidates rejected
              </div>
              <div className="text-sm mb-3">
                Council reviewed candidates and rejected all. Common reasons:
                backtest win-rate below 45%, high-impact event in next 12h,
                counter-trend setup, or insufficient consensus.
              </div>
              {proData.lastDecisions.length > 0 && (
                <div className="text-left max-w-md mx-auto mt-4">
                  {proData.lastDecisions.map((d, i) => (
                    <div key={i} className="text-xs py-1 border-b" style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}>
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        {d.pair}
                      </span>: {d.decision}
                      {d.reason && ` — ${d.reason}`}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {proData.state === 'error' && (
            <>
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium mb-1" style={{ color: 'var(--accent-red)' }}>
                Council error
              </div>
              <div className="text-sm mb-3">{proData.error}</div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {activeSignals.length === 0 && !(tier === 'PRO' && category === 'FOREX') && (
        <div className="p-8 rounded-lg text-center space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRefreshing ? 'Generating signals...' : 'No signals match current filters'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Generate Now
          </button>
        </div>
      )}
    </div>
  );
}
