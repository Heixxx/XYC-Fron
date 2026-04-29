import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showEndDot?: boolean;
}

export default function Sparkline({
  data,
  width = 120,
  height = 32,
  color = 'var(--accent-green)',
  strokeWidth = 1.5,
  showEndDot = true,
}: SparklineProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return data
      .map((value, i) => {
        const x = padding + (i / (data.length - 1)) * innerWidth;
        const y = padding + (1 - (value - min) / range) * innerHeight;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);

  const lastPoint = useMemo(() => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    return {
      x: padding + innerWidth,
      y: padding + (1 - (data[data.length - 1] - min) / range) * innerHeight,
    };
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
}
