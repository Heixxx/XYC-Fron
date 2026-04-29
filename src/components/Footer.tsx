import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ApiStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
}

const apiStatuses: ApiStatus[] = [
  { name: 'Yahoo Finance', status: 'online' },
  { name: 'Binance', status: 'online' },
  { name: 'Perplexity', status: 'online' },
  { name: 'DeepSeek', status: 'warning' },
  { name: 'Claude', status: 'online' },
];

export default function Footer() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi size={10} style={{ color: 'var(--accent-green)' }} />;
      case 'warning':
        return <AlertTriangle size={10} style={{ color: 'var(--accent-orange)' }} />;
      case 'offline':
        return <WifiOff size={10} style={{ color: 'var(--accent-red)' }} />;
      default:
        return null;
    }
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-30 h-8 flex items-center px-4 text-xs border-t"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex items-center gap-4 w-full overflow-hidden">
        {/* Left: Version */}
        <span className="shrink-0 hidden sm:inline">FOREXAI Terminal v2.0</span>

        {/* Center: API Status dots */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="hidden sm:inline">APIs:</span>
          <div className="flex items-center gap-2">
            {apiStatuses.map((api) => (
              <div
                key={api.name}
                className="group relative flex items-center gap-1"
              >
                <span className="flex items-center">{getStatusIcon(api.status)}</span>
                <span className="hidden md:inline text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {api.name}
                </span>
                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {api.name}: {api.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Connection */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="status-dot online pulse" />
          <span className="hidden sm:inline">Connected</span>
        </div>
      </div>
    </footer>
  );
}
