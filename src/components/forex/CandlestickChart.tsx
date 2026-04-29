import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from 'recharts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: { prices: number[]; timestamps: number[] } | null;
  showMa20?: boolean;
  showMa50?: boolean;
  chartType?: 'candlestick' | 'line' | 'area';
  height?: number;
}

export default function CandlestickChart({
  data,
  showMa20 = false,
  showMa50 = false,
  chartType = 'candlestick',
  height = 320,
}: CandlestickChartProps) {
  const candles = useMemo<CandleData[]>(() => {
    if (!data || data.prices.length < 2) return [];
    const { prices, timestamps } = data;
    const result: CandleData[] = [];
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1];
      const curr = prices[i];
      const open = prev;
      const close = curr;
      const high = Math.max(open, close) + Math.abs(curr - prev) * 0.1;
      const low = Math.min(open, close) - Math.abs(curr - prev) * 0.1;
      const date = new Date((timestamps[i] || Date.now() / 1000 - (prices.length - i) * 3600) * 1000);
      result.push({
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        open,
        high,
        low,
        close,
        volume: Math.abs(close - open) * 10000,
      });
    }
    return result;
  }, [data]);

  const sma = (period: number) => {
    return candles.map((_, i) => {
      if (i < period - 1) return null;
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      return { index: i, value: sum / period };
    }).filter((v): v is { index: number; value: number } => v !== null);
  };

  const ma20 = useMemo(() => (showMa20 ? sma(20) : []), [candles, showMa20]);
  const ma50 = useMemo(() => (showMa50 ? sma(50) : []), []);

  if (candles.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{ color: 'var(--text-muted)', height }}
      >
        No chart data available
      </div>
    );
  }

  const isUp = candles[candles.length - 1].close >= candles[candles.length - 1].open;
  const lineColor = isUp ? 'var(--chart-bullish)' : 'var(--chart-bearish)';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={candles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="2 4"
          stroke="var(--chart-grid)"
          vertical={true}
          horizontal={true}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'var(--border-subtle)' }}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(v: number) => v.toFixed(5)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fontSize: '11px',
          }}
          labelStyle={{ color: 'var(--text-muted)', fontSize: '10px' }}
          itemStyle={{ color: 'var(--text-primary)', fontSize: '11px' }}
          formatter={(value: number, name: string) => {
            if (name === 'volume') return [value.toFixed(0), 'Volume'];
            return [typeof value === 'number' ? value.toFixed(5) : value, name];
          }}
        />
        {chartType === 'candlestick' && (
          <>
            <Bar
              dataKey="high"
              fill="transparent"
              stroke="var(--chart-wick)"
              strokeWidth={1}
              barSize={8}
            />
            <Bar
              dataKey={(entry: CandleData) => [entry.low, entry.high]}
              fill="transparent"
              stroke="var(--chart-wick)"
              strokeWidth={1}
            />
          </>
        )}
        {chartType === 'area' && (
          <Area
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            fill={lineColor}
            fillOpacity={0.1}
          />
        )}
        {chartType !== 'area' && (
          <Line
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: 'var(--bg-tertiary)', strokeWidth: 2 }}
          />
        )}
        {showMa20 && ma20.length > 0 && (
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--chart-ma-20)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 2"
          />
        )}
        {showMa50 && ma50.length > 0 && (
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--chart-ma-50)"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 2"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
