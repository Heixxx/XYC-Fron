import { useState, useEffect } from 'react';
import { Menu, Search, Bell, Wifi, WifiOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface NavbarProps {
  onMenuToggle: () => void;
}

const routeKeys: Record<string, string> = {
  '/': 'nav.overview',
  '/news': 'nav.marketNews',
  '/forex': 'nav.forexMarkets',
  '/crypto': 'nav.cryptoMarkets',
  '/search': 'nav.marketSearch',
  '/whales': 'nav.whaleTracking',
  '/signals': 'nav.signals',
  '/vision': 'nav.chartVision',
  '/logic-lab': 'nav.logicLab',
};

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { t } = useTranslation();
  const [time, setTime] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isConnected] = useState(true);
  const location = useLocation();

  const pageTitle = t(routeKeys[location.pathname] || 'nav.overview');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 border-b gap-4"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: Menu toggle + Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:flex hidden items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1
          className="font-semibold text-base truncate hidden sm:block"
          style={{ color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <div
          className="relative flex items-center transition-all duration-200"
          style={{ width: searchFocused ? '100%' : '200px' }}
        >
          <Search
            size={16}
            className="absolute left-3 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              if (!searchFocused) e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          />
        </div>
      </div>

      {/* Right: Language + Notifications + Connection + Time */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <LanguageSwitcher />
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--accent-red)' }}
          />
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          {isConnected ? (
            <Wifi size={14} style={{ color: 'var(--accent-green)' }} />
          ) : (
            <WifiOff size={14} style={{ color: 'var(--accent-red)' }} />
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isConnected ? t('common.live') : t('common.offline')}
          </span>
        </div>

        <div
          className="hidden md:flex items-center px-2.5 py-1 rounded-md text-sm font-semibold"
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            color: 'var(--accent-gold)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {time}
        </div>
      </div>
    </header>
  );
}
