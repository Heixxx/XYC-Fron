import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TrendingUp,
  Bitcoin,
  Zap,
  MoreHorizontal,
  Newspaper,
  Search,
  Fish,
  Eye,
  Brain,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainItems = [
    { path: '/', label: t('nav.overview'), icon: LayoutDashboard },
    { path: '/forex', label: t('nav.forex'), icon: TrendingUp },
    { path: '/crypto', label: t('nav.crypto'), icon: Bitcoin },
    { path: '/signals', label: t('nav.signals'), icon: Zap },
  ];

  const moreItems = [
    { path: '/news', label: t('nav.news'), icon: Newspaper },
    { path: '/search', label: t('nav.search'), icon: Search },
    { path: '/whales', label: t('nav.whales'), icon: Fish },
    { path: '/vision', label: t('nav.vision'), icon: Eye },
    { path: '/logic-lab', label: 'Logic Lab', icon: Brain },
  ];

  const isMoreActive = moreItems.some((item) => item.path === location.pathname);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t"
        style={{
          backgroundColor: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'var(--border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-gold)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  style={{
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                    transition: 'color 200ms',
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                    transition: 'color 200ms',
                  }}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 relative"
          >
            {isMoreActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-gold)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <MoreHorizontal
              size={22}
              style={{
                color: isMoreActive ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: isMoreActive ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-2xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                maxHeight: '70vh',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>More</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-2 pb-8">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-0.5"
                      style={{
                        backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                      }}
                    >
                      <Icon
                        size={20}
                        style={{
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)' }}
                      >
                        {item.label}
                      </span>
                      {item.path === '/news' && (
                        <span
                          className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}
                        >
                          3
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
