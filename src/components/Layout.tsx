import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) {
        setSidebarCollapsed(true);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div
      className="min-h-[100dvh]"
      style={{ backgroundColor: 'var(--bg-void)' }}
    >
      {/* Navbar */}
      <Navbar
        onMenuToggle={() => {
          if (isDesktop) {
            setSidebarCollapsed(!sidebarCollapsed);
          } else {
            setMobileSidebarOpen(!mobileSidebarOpen);
          }
        }}
      />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main
        className="transition-all duration-300 pb-20 lg:pb-10"
        style={{
          marginLeft: isDesktop ? sidebarWidth : 0,
          paddingTop: 56,
        }}
      >
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
