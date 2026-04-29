import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
}

export default function MiniChart({ data, color, height = 100 }: MiniChartProps) {
  const chartData = useMemo(() => {
    return data.map((val, index) => ({ index, value: val }));
  }, [data]);

  if (data.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs"
        style={{ color: 'var(--text-muted)', height }}
      >
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace('#', '')})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
