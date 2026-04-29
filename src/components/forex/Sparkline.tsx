import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, color, width = 100, height = 28 }: SparklineProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const effectiveW = width - padding * 2;
    const effectiveH = height - padding * 2;
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * effectiveW;
      const y = padding + effectiveH - ((val - min) / range) * effectiveH;
      return `${x},${y}`;
    });
    return `M${points.join('L')}`;
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px]"
        style={{ color: 'var(--text-muted)', width, height }}
      >
        —
      </div>
    );
  }

  const strokeColor = color || 'var(--accent-gold)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      {/* End dot */}
      {data.length > 0 && (() => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const padding = 2;
        const effectiveW = width - padding * 2;
        const effectiveH = height - padding * 2;
        const lastVal = data[data.length - 1];
        const x = padding + effectiveW;
        const y = padding + effectiveH - ((lastVal - min) / range) * effectiveH;
        return <circle cx={x} cy={y} r={2} fill={strokeColor} />;
      })()}
    </svg>
  );
}
