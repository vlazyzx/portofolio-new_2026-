import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';

import MotionLayer from './components/MotionLayer';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Projects from './pages/Projects/Projects';
import Student from './pages/Student/Student';
import Contact from './pages/Contact/Contact';
import Admin from './pages/Admin/Admin';
import type { PageId } from './types/portfolio';

const pages = {
  home: Home,
  about: About,
  projects: Projects,
  student: Student,
  contact: Contact,
  admin: Admin
};

const pageIds = Object.keys(pages) as PageId[];


const getPageFromHash = (): PageId => {
  const hashPage = window.location.hash.replace('#', '') as PageId;
  return pageIds.includes(hashPage) ? hashPage : 'home';
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(() => getPageFromHash());
  const [homeRefreshToken, setHomeRefreshToken] = useState(0);
  const [aboutRefreshToken, setAboutRefreshToken] = useState(0);
  const ActivePage = pages[activePage];
  const isAdminPage = activePage === 'admin';


  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    const hash = page === 'home' ? '' : `#${page}`;
    window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
  };

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  useEffect(() => {
    const handleHomeContentUpdated = () => setHomeRefreshToken(current => current + 1);
    const handleAboutContentUpdated = () => setAboutRefreshToken(current => current + 1);
    window.addEventListener('home-content-updated', handleHomeContentUpdated);
    window.addEventListener('about-content-updated', handleAboutContentUpdated);
    return () => {
      window.removeEventListener('home-content-updated', handleHomeContentUpdated);
      window.removeEventListener('about-content-updated', handleAboutContentUpdated);
    };
  }, []);

  return (
    <>
      {!isAdminPage && (
        <>
          <MotionLayer page={activePage} />
          <Navigation activePage={activePage} onNavigate={handleNavigate} />
        </>
      )}

      <main className={isAdminPage ? 'admin-main' : 'app-main'}>
        {activePage === 'home'
          ? <Home key={activePage} onNavigate={handleNavigate} refreshToken={homeRefreshToken} />
          : activePage === 'about'
            ? <About key={activePage} onNavigate={handleNavigate} refreshToken={aboutRefreshToken} />
            : <ActivePage key={activePage} onNavigate={handleNavigate} />}
      </main>
    </>
  );
}
