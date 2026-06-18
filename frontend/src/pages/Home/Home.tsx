import { Suspense, useEffect, useState, type CSSProperties } from 'react';
import Footer from '../../components/Footer';
import Lanyard from '../../components/Lanyard/Lanyard';
import { api } from '../../services/api';
import type { HomeContent, PageId } from '../../types/portfolio';
import './Home.css';

interface HomeProps {
  onNavigate: (page: PageId) => void;
  refreshToken?: number;
}

export default function Home({ onNavigate, refreshToken = 0 }: HomeProps) {
  const [home, setHome] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHome = () => {
      setLoading(true);
      Promise.all([api.getHome(), api.getProjects()])
        .then(([homeData, projects]) => {
          const projectCount = Array.isArray(projects) ? projects.length : 0;
          setHome({
            ...homeData,
            stats: {
              ...homeData.stats,
              completedProjects: {
                ...homeData.stats.completedProjects,
                value: String(projectCount),
                progress: Math.min(projectCount, 100),
              },
            },
          });
        })
        .catch(() => setHome(null))
        .finally(() => setLoading(false));
    };

    loadHome();
    window.addEventListener('home-content-updated', loadHome);
    window.addEventListener('projects-updated', loadHome);

    return () => {
      window.removeEventListener('home-content-updated', loadHome);
      window.removeEventListener('projects-updated', loadHome);
    };
  }, [refreshToken]);

  if (loading) return <div className="page home-page"><section className="wrap sec"><div className="mono">Memuat data...</div></section></div>;
  if (!home) return <div className="page home-page"><section className="wrap sec"><div className="mono">Data home belum tersedia.</div></section></div>;

  const stats = [home.stats.completedProjects, home.stats.mainStack, home.stats.learningYears, home.stats.gpa];
  const statScale: Record<typeof stats[number]['id'], number> = {
    completedProjects: 100,
    mainStack: 18,
    learningYears: 30,
    gpa: 98,
  };
  const lanyardImage = home.lanyardImage || '/images/muhammad-ikhsan-lanyard-card.jpg';

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-txt">
            <div className="h-ey">
              <div className="h-ey-line" />
              <span className="mono accent-text">{home.eyebrow}</span>
            </div>
            <div className="h-name" aria-label={`${home.name} Pengembang Kreatif`}>
              <span className="l1">{home.name.split(' ')[0] || ''}</span>
              <span className="l2">{home.name.split(' ').slice(1).join(' ') || (home.name.includes(' ') ? '' : 'Ikhsan')}</span>
              <span className="l3">Pengembang Kreatif.</span>
            </div>
            <p className="h-desc">{home.heroDescription}</p>
            <div className="h-btns">
              <button className="bp" type="button" onClick={() => onNavigate('projects')}>Lihat Karya</button>
              <button className="bg" type="button" onClick={() => onNavigate('about')}>Tentang Saya</button>
            </div>
            <div className="scroll-row">
              <div className="s-track" />
              <span className="mono">Gulir untuk jelajahi</span>
            </div>
          </div>

          <div className="hero-photo">
            <div className="profile-lanyard" aria-label="Lanyard profil interaktif">
              <Suspense fallback={<div className="lanyard-fallback mono">Memuat lanyard</div>}>
                <Lanyard
                  position={[0, 0, 19]}
                  gravity={[0, -42, 0]}
                  fov={22}
                  frontImage={lanyardImage}
                  backImage={lanyardImage}
                  imageFit="cover"
                  lanyardWidth={1.15}
                />
              </Suspense>
            </div>
            <div className="badge">
              <div className="pdot" />
              <div className="badge-copy">
                <div className="b-name">{home.name}</div>
                <div className="b-sub">{home.badgeSubtitle}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Statistik portofolio">
        <div className="stats-inner">
          {stats.map((stat, index) => (
            <div className="sc" key={stat.id} style={{ '--stat-progress': stat.progress / statScale[stat.id], '--delay': `${index * 90}ms` } as CSSProperties}>
              <div className="sn">{stat.value}</div>
              <div className="sl2">{stat.label}</div>
              <div className="sb"><div className="sf" /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap sec nav-section">
        <div className="ey">Navigasi</div>
        <div className="nc-grid edge-panel">
          {home.cards.length ? home.cards.map((card, index) => (
            <button className="nc" key={card.id || card.page} type="button" onClick={() => onNavigate(card.page)} style={{ '--delay': `${index * 100}ms` } as CSSProperties}>
              <span className="tag">{card.tag}</span>
              <span className="nc-body">
                <span className="nc-title">{card.title}</span>
                <span className="nc-desc">{card.desc}</span>
              </span>
              <span className="nc-foot"><span className="mono">{card.meta}</span><span className="nc-arrow">-&gt;</span></span>
            </button>
          )) : <div className="mono">Kartu navigasi belum tersedia.</div>}
        </div>
      </section>
      <Footer />
    </div>
  );
}
