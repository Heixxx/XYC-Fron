interface KeyLevelRow {
  pair: string;
  support: string;
  resistance: string;
  pivot: string;
}

interface KeyLevelsTableProps {
  levels: KeyLevelRow[];
}

export default function KeyLevelsTable({ levels }: KeyLevelsTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Today&apos;s Key Levels
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                Pair
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                Support
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                Resistance
              </th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                Pivot
              </th>
            </tr>
          </thead>
          <tbody>
            {levels.map((row, index) => (
              <tr
                key={row.pair}
                className="transition-colors"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                <td
                  className="px-3 py-2 text-xs font-semibold data-font"
                  style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {row.pair}
                </td>
                <td
                  className="px-3 py-2 text-xs text-right data-font"
                  style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {row.support}
                </td>
                <td
                  className="px-3 py-2 text-xs text-right data-font"
                  style={{ color: 'var(--accent-red)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {row.resistance}
                </td>
                <td
                  className="px-3 py-2 text-xs text-right data-font"
                  style={{ color: 'var(--accent-gold)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {row.pivot}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
