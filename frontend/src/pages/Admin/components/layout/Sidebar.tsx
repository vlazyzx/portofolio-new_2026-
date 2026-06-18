import React from 'react';
import {
  LayoutDashboard, FolderKanban, User, BookOpen,
  Link2, MessageSquare, GitBranch, X, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../store/auth';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',   label: 'Ringkasan',       icon: <LayoutDashboard size={16} /> },
  { id: 'projects',   label: 'Project',         icon: <FolderKanban size={16} /> },
  { id: 'home',       label: 'Home',            icon: <LayoutDashboard size={16} /> },
  { id: 'profile',    label: 'Profil',          icon: <User size={16} /> },
  { id: 'about',      label: 'Tentang',         icon: <BookOpen size={16} /> },
  { id: 'student',    label: 'Student',         icon: <BookOpen size={16} /> },
  { id: 'social',     label: 'Link Sosial',     icon: <Link2 size={16} /> },
  { id: 'messages',   label: 'Pesan',           icon: <MessageSquare size={16} /> },
  { id: 'github', label: 'GitHub', icon: <GitBranch size={16} /> },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  unreadMessages?: number;
}

export function Sidebar({ active, onNavigate, mobileOpen, onMobileClose, unreadMessages = 0 }: SidebarProps) {
  const { user, logout } = useAuth();

  const items = NAV_ITEMS.map(item =>
    item.id === 'messages' ? { ...item, badge: unreadMessages } : item
  );

  function handleNav(id: string) {
    onNavigate(id);
    onMobileClose();
  }

  const sidebarContent = (
    <aside className="admin-sidebar h-full flex flex-col bg-surface border-r border-white/10 w-[240px]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center shadow-[0_12px_30px_rgba(255,122,53,0.3)]">
            <span className="font-syne font-black text-[15px] text-void">I</span>
          </div>
          <span className="font-syne font-bold text-[16px] tracking-tight">
            IKH<span className="text-accent">.</span>admin
          </span>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sub hover:text-tx"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {items.map(item => {
            const isActive = active === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNav(item.id)}
                 className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                             transition-colors duration-150 group relative border
                             ${isActive
                               ? 'bg-accent/12 text-accent border-accent/30 shadow-[0_10px_28px_rgba(255,122,53,0.12)]'
                               : 'text-sub hover:bg-white/5 hover:text-tx border-transparent hover:border-white/10'
                             }`}
              >
                <span className={`flex-shrink-0 transition-transform duration-100
                                  ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-accent text-void text-[10px]
                                   font-bold flex items-center justify-center flex-shrink-0">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight size={12} className="text-accent flex-shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User & Logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center
                          text-accent font-bold text-[12px] flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-tx truncate">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-sub truncate">{user?.email || ''}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sub
                     hover:bg-danger/10 hover:text-danger transition-colors duration-150 text-[13px]"
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-void/80 overlay-enter"
            onClick={onMobileClose}
          />
          <div className="absolute left-0 top-0 bottom-0 anim-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
