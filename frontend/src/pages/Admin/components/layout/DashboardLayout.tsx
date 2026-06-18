import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  activePage: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  unreadMessages?: number;
}

export function DashboardLayout({ activePage, onNavigate, children, unreadMessages }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-void">
      <Sidebar
        active={activePage}
        onNavigate={onNavigate}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        unreadMessages={unreadMessages}
      />
      <div className="admin-content flex-1 flex flex-col min-w-0">
        <Topbar
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen(true)}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
          <div className="page-enter max-w-[1240px] mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
