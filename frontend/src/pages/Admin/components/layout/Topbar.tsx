
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../store/auth';

const PAGE_TITLES: Record<string, string> = {
  overview: 'Ringkasan Dashboard',
  projects: 'Manajer Project',
  home:     'Manajer Home',
  profile:  'Manajer Profil',
  about:    'Manajer Tentang',
  student:  'Manajer Student',
  social:   'Link Sosial',
  messages: 'Pesan Kontak',
  github:   'Integrasi GitHub',
};

interface TopbarProps {
  activePage: string;
  onMenuToggle: () => void;
  unreadMessages?: number;
}

export function Topbar({ activePage, onMenuToggle, unreadMessages = 0 }: TopbarProps) {
  const { user } = useAuth();
  const userName = user?.name?.trim() || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="admin-topbar h-16 flex-shrink-0 flex items-center justify-between
                        px-4 lg:px-8 border-b border-white/10 bg-surface
                        relative z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/5
                     text-sub hover:bg-elevated hover:text-tx"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-syne font-bold text-[17px] tracking-tight">
            {PAGE_TITLES[activePage] || 'Dashboard'}
          </h1>
          <p className="text-[11px] text-sub font-mono hidden sm:block">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sub
                     hover:bg-elevated hover:text-tx relative">
          <Bell size={18} />
          {unreadMessages > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-elevated
                        transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center
                          text-accent font-bold text-[10px]">{userInitial}</div>
          <span className="text-[12px] text-sub hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
