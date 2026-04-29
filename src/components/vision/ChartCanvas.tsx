import { forwardRef } from 'react';
import { Plus, Minus, Maximize, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface ChartCanvasProps {
  imageUrl: string | null;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  showOverlays: { supports: boolean; trendlines: boolean; zones: boolean; labels: boolean };
  setShowOverlays: (o: { supports: boolean; trendlines: boolean; zones: boolean; labels: boolean }) => void;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canvasRef: React.Ref<HTMLCanvasElement>;
  containerRef: React.Ref<HTMLDivElement>;
}

const ChartCanvas = forwardRef<HTMLDivElement, ChartCanvasProps>(function ChartCanvas(
  {
    imageUrl, zoom, pan, isPanning,
    showOverlays, setShowOverlays,
    onWheel, onMouseDown, onMouseMove, onMouseUp,
    onTouchStart, onTouchMove,
    onZoomIn, onZoomOut, onReset,
    canvasRef, containerRef,
  },
  _ref
) {
  const toggleOverlay = (key: keyof typeof showOverlays) => {
    setShowOverlays({ ...showOverlays, [key]: !showOverlays[key] });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-1">
          <button onClick={onZoomIn} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Zoom In">
            <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={onZoomOut} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Zoom Out">
            <Minus size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span
            className="text-xs px-2 py-0.5 rounded data-font mx-1"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)' }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={onReset} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Reset View (0)">
            <RotateCcw size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {[
            { key: 'supports' as const, label: 'S/R' },
            { key: 'trendlines' as const, label: 'Trend' },
            { key: 'zones' as const, label: 'Zones' },
            { key: 'labels' as const, label: 'Labels' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => toggleOverlay(item.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
              style={{
                backgroundColor: showOverlays[item.key] ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: showOverlays[item.key] ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: `1px solid ${showOverlays[item.key] ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
              }}
            >
              {showOverlays[item.key] ? <Eye size={12} /> : <EyeOff size={12} />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-primary)',
          cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Chart"
              className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 100ms ease-out',
              }}
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 100ms ease-out',
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Maximize size={48} style={{ color: 'var(--text-disabled)', opacity: 0.3 }} />
          </div>
        )}
      </div>
    </div>
  );
});

export default ChartCanvas;
