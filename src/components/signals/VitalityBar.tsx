interface VitalityBarProps {
  value: number;
}

export default function VitalityBar({ value }: VitalityBarProps) {
  const color = value > 60 ? '#00E396' : value > 20 ? '#F59E0B' : '#EF4444';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Vitality</span>
        <span className="text-xs font-medium" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            transition: 'width 400ms var(--ease-out)',
          }}
        />
      </div>
    </div>
  );
}
