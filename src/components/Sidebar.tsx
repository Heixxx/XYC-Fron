import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Bitcoin,
  Search,
  Fish,
  Zap,
  Eye,
  Brain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItemDefs = [
  { path: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
  { path: '/news', labelKey: 'nav.news', icon: Newspaper, badge: '3' },
  { path: '/forex', labelKey: 'nav.forex', icon: TrendingUp },
  { path: '/crypto', labelKey: 'nav.crypto', icon: Bitcoin },
  { path: '/search', labelKey: 'nav.search', icon: Search },
  { path: '/whales', labelKey: 'nav.whales', icon: Fish },
  { path: '/signals', labelKey: 'nav.signals', icon: Zap, pulse: true },
  { path: '/vision', labelKey: 'nav.vision', icon: Eye },
  { path: '/logic-lab', labelKey: 'nav.logicLab', icon: Brain },
];

const apiStatuses = [
  { name: 'Yahoo Finance', status: 'online' as const },
  { name: 'Binance', status: 'online' as const },
  { name: 'Perplexity', status: 'online' as const },
  { name: 'DeepSeek', status: 'warning' as const },
  { name: 'Claude', status: 'online' as const },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [hoveredApi, setHoveredApi] = useState<string | null>(null);

  const sidebarWidth = collapsed ? 64 : 240;

  // Translate nav labels
  const navItems = navItemDefs.map((item) => ({ ...item, label: t(item.labelKey) }));

  // Close mobile sidebar on route change
  useEffect(() => {
    onCloseMobile();
  }, [location.pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex items-center h-14 px-4 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: 'var(--grad-gold)' }}
          >
            <span className="text-sm font-bold" style={{ color: '#050508' }}>F</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-sm whitespace-nowrap"
              style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              FOREXAI
            </motion.span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className="relative flex items-center gap-3 h-11 px-3 rounded-lg mb-0.5 transition-all duration-100 group"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="flex items-center gap-3 w-full overflow-hidden"
              >
                <div className="relative shrink-0">
                  <Icon
                    size={20}
                    style={{
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      transition: 'color 100ms',
                    }}
                  />
                  {item.pulse && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse-dot"
                      style={{ backgroundColor: 'var(--accent-gold)' }}
                    />
                  )}
                </div>

                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap flex-1"
                    style={{
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      transition: 'color 100ms',
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}

                {!collapsed && item.badge && (
                  <span
                    className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-blue)',
                      color: '#fff',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* API Status Bar */}
      <div
        className="px-3 py-2 border-t shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {!collapsed && (
          <div className="text-[10px] font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            API Status
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {apiStatuses.map((api) => (
            <div
              key={api.name}
              className="relative"
              onMouseEnter={() => setHoveredApi(api.name)}
              onMouseLeave={() => setHoveredApi(null)}
            >
              <span
                className={`status-dot ${api.status} ${api.status === 'online' ? 'pulse' : ''}`}
                style={{
                  width: collapsed ? 10 : 8,
                  height: collapsed ? 10 : 8,
                  display: 'inline-block',
                }}
              />
              {hoveredApi === api.name && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-xs whitespace-nowrap z-50"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-3d)',
                  }}
                >
                  {api.name}: {api.status}
                </div>
              )}
            </div>
          ))}
          {!collapsed && (
            <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
              {apiStatuses.filter(a => a.status === 'online').length}/{apiStatuses.length}
            </span>
          )}
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center h-10 border-t transition-colors"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 z-40 transition-all duration-300"
        style={{
          width: sidebarWidth,
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className="lg:hidden flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300"
        style={{
          width: 240,
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-subtle)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
