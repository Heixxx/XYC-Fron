import { Building2 } from 'lucide-react';

interface BlackRockPanelProps {
  compact?: boolean;
}

const BLACKROCK_QUOTES = [
  {
    quote: "We see selective opportunities in fixed income as yields remain elevated. The Fed's higher-for-longer stance supports the dollar but creates divergence trades.",
    bullets: [
      "Overweight USD vs G10 on yield advantage",
      "EM FX remains vulnerable to Fed policy",
      "Credit quality differentiation is key",
      "Duration risk should be managed actively",
    ],
  },
  {
    quote: "Geopolitical risk premiums are underpriced. We advocate for defensive positioning in safe-haven currencies while maintaining tactical risk exposure.",
    bullets: [
      "CHF and JPY offer downside protection",
      "EUR vulnerable to energy shocks",
      "Commodity-linked FX supported",
      "Portfolio hedging remains cost-effective",
    ],
  },
];

export default function BlackRockPanel({ compact }: BlackRockPanelProps) {
  const data = BLACKROCK_QUOTES[0];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '2px solid var(--accent-gold)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} style={{ color: 'var(--accent-gold)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            BlackRock Institutional View
          </h3>
        </div>

        <blockquote
          className="text-sm italic leading-relaxed mb-3 pl-3 border-l-2"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--accent-gold)' }}
        >
          "{data.quote}"
        </blockquote>

        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          — BlackRock Investment Institute
        </p>

        {!compact && (
          <ul className="space-y-2">
            {data.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="mt-1 w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
