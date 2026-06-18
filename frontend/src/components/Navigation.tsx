import { useState } from 'react';
import { navItems } from '../data/portfolio';
import type { PageId } from '../types/portfolio';
import './Navigation.css';

interface NavigationProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Navigation({ activePage, onNavigate }: NavigationProps) {
  const [open, setOpen] = useState(false);

  const go = (page: PageId) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <header className="site-nav">
      <button className="logo" type="button" onClick={() => go('home')} aria-label="Ke beranda">
        IKH<span>.</span>
      </button>

      <div className="nav-r">
        {navItems.map(item => (
          <button
            className={`nl ${activePage === item.id ? 'on' : ''}`}
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button className="nbtn" type="button" onClick={() => go('contact')}>Hubungi Saya</button>
        <button
          className={`ham ${open ? 'open' : ''}`}
          type="button"
          aria-label="Buka tutup menu"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`mob-menu ${open ? 'open' : ''}`}>
        {navItems.map(item => (
          <button
            className={`mnl ${activePage === item.id ? 'on' : ''}`}
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button className="mnbtn" type="button" onClick={() => go('contact')}>Hubungi Saya</button>
      </div>
    </header>
  );
}