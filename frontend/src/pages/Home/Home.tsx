import { Suspense, useEffect, useState, type CSSProperties } from 'react';
import Footer from '../../components/Footer';
import Lanyard from '../../components/Lanyard/Lanyard';
import SplitText from '../../components/SplitText';
import TextType from '../../components/TextType';
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
  const nameParts = home.name.trim().split(/\s+/).filter(Boolean);
  const firstLineName = nameParts[0] || home.name;
  const secondLineName = nameParts[1] || (home.name.includes(' ') ? '' : 'Ikhsan');
  const thirdLineName = nameParts.slice(2).join(' ') || '';
  const bentoVariants = ['primary', 'wide', 'tall', 'accent'];

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
              <SplitText
                tag="span"
                text={firstLineName}
                className="l1"
                delay={65}
                duration={0.72}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 34 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-80px"
                textAlign="left"
              />
              <SplitText
                tag="span"
                text={secondLineName}
                className="l2"
                delay={55}
                duration={0.68}
                ease="power3.out"
                splitType="words"
                from={{ opacity: 0, y: 28 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-60px"
                textAlign="left"
              />
              {thirdLineName ? (
                <SplitText
                  tag="span"
                  text={thirdLineName}
                  className="l2 l2b"
                  delay={48}
                  duration={0.66}
                  ease="power3.out"
                  splitType="words"
                  from={{ opacity: 0, y: 24 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.15}
                  rootMargin="-50px"
                  textAlign="left"
                />
              ) : null}
              <TextType
                as="span"
                text={["Backend Developer", "DevOps Developer"]}
                className="l3"
                typingSpeed={64}
                deletingSpeed={26}
                pauseDuration={1900}
                initialDelay={650}
                showCursor={false}
                startOnVisible={true}
              />
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
        <div className="nc-grid">
          {home.cards.length ? home.cards.map((card, index) => {
            const variant = bentoVariants[index % bentoVariants.length];
            const isPrimary = index === 0;

            return (
              <button
                className={`nc nc-${variant} ${isPrimary ? 'nc-featured' : ''}`.trim()}
                key={card.id || card.page}
                type="button"
                onClick={() => onNavigate(card.page)}
                style={{ '--delay': `${index * 100}ms` } as CSSProperties}
              >
                <span className="nc-top">
                  <span className="tag">{card.tag}</span>
                  <span className="nc-index mono">{String(index + 1).padStart(2, '0')}</span>
                </span>
                <span className="nc-body">
                  <span className="nc-title">{card.title}</span>
                  <span className="nc-desc">{card.desc}</span>
                </span>
                <span className="nc-foot"><span className="mono">{card.meta}</span><span className="nc-arrow">-&gt;</span></span>
              </button>
            );
          }) : <div className="mono">Kartu navigasi belum tersedia.</div>}
        </div>
      </section>
      <Footer />
    </div>
  );
}
