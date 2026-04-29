import { useRef } from 'react';
import { Eye, Loader, Check, X } from 'lucide-react';
import { useVision } from '@/hooks/useVision';
import UploadZone from '@/components/vision/UploadZone';
import ChartCanvas from '@/components/vision/ChartCanvas';
import AnalysisPanel from '@/components/vision/AnalysisPanel';
import RecentAnalysesGallery from '@/components/vision/RecentAnalysesGallery';
import { useTranslation } from 'react-i18next';
export default function Vision() {
  const { t } = useTranslation();
  const {
    imageUrl, isAnalyzing, result, error, zoom, pan, isPanning,
    showOverlays, setShowOverlays, showRaw, setShowRaw,
    cache, canvasRef, containerRef,
    uploadImage, zoomIn, zoomOut, resetView,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    handleTouchStart, handleTouchMove,
    loadFromCache, clearAll,
  } = useVision();

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* ─── Page Header ─── */}
      <div
        className="relative rounded-[10px] p-4 sm:p-6 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%), var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[40px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {t('vision.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('vision.subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isAnalyzing ? 'var(--accent-blue)' : result ? 'var(--accent-green)' : 'var(--accent-green)',
                  animation: isAnalyzing ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isAnalyzing ? t('vision.claudeAnalyzing') : t('vision.claudeReady')}
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('vision.analysesCached', { count: cache.length })}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Upload Zone (when no image) ─── */}
      {!imageUrl && (
        <UploadZone onUpload={uploadImage} />
      )}

      {/* ─── Analysis Workspace (post-upload) ─── */}
      {imageUrl && (
        <>
          {/* Toolbar above workspace */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <Loader size={14} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
                  <span className="text-xs" style={{ color: 'var(--accent-blue)' }}>{t('vision.analyzing')}</span>
                </div>
              )}
              {error && !result && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                  <X size={14} style={{ color: 'var(--accent-red)' }} />
                  <span className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</span>
                </div>
              )}
              {result && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0,227,150,0.1)' }}>
                  <Check size={14} style={{ color: 'var(--accent-green)' }} />
                  <span className="text-xs" style={{ color: 'var(--accent-green)' }}>{t('vision.analysisComplete')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Eye size={14} />
                {t('vision.newChart')}
              </button>
            </div>
          </div>

          {/* Two-panel layout */}
          <div
            className="flex flex-col lg:flex-row rounded-[10px] overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              minHeight: '500px',
            }}
          >
            {/* Chart Canvas - 65% */}
            <div className="flex-1 lg:w-[65%] min-h-[350px] lg:min-h-0">
              <ChartCanvas
                imageUrl={imageUrl}
                zoom={zoom}
                pan={pan}
                isPanning={isPanning}
                showOverlays={showOverlays}
                setShowOverlays={setShowOverlays}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={resetView}
                canvasRef={canvasRef}
                containerRef={containerRef}
              />
            </div>

            {/* Analysis Panel - 35% */}
            <div
              className="lg:w-[35%] border-t lg:border-t-0 lg:border-l overflow-y-auto"
              style={{
                borderColor: 'var(--border-subtle)',
                maxHeight: '500px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <AnalysisPanel
                isAnalyzing={isAnalyzing}
                result={result}
                error={error}
                showRaw={showRaw}
                setShowRaw={setShowRaw}
              />
            </div>
          </div>

          {/* Recent Analyses Gallery */}
          <RecentAnalysesGallery
            analyses={cache}
            onLoad={loadFromCache}
            onClear={clearAll}
          />
        </>
      )}
    </div>
  );
}
