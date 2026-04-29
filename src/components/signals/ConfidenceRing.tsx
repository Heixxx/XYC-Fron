import { useEffect, useState } from 'react';

interface ConfidenceRingProps {
  value: number;
  size?: number;
}

export default function ConfidenceRing({ value, size = 60 }: ConfidenceRingProps) {
  const [animated, setAnimated] = useState(0);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const color = value >= 75 ? '#00E396' : value >= 55 ? '#F0B90B' : '#FF4560';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}%
        </span>
      </div>
    </div>
  );
}
