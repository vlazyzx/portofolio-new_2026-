import { useEffect, useState, type CSSProperties } from 'react';
import SectionHeader from '../../components/SectionHeader';
import LogoLoop, { type LogoItem } from '../../components/LogoLoop/LogoLoop';
import Footer from '../../components/Footer';
import ContributionGraph from '../../components/ContributionGraph';
import ToolIcon from '../../components/ToolIcon';
import { api, type GithubContributionsResponse } from '../../services/api';
import type { AboutContent, PageId, ProfileContent } from '../../types/portfolio';
import './About.css';


interface AboutProps {
  onNavigate: (page: PageId) => void;
  refreshToken?: number;
}


const toolLogos: LogoItem[] = [

  { title: 'Vercel', alt: 'Logo Vercel', src: 'https://cdn.simpleicons.org/vercel/000000' },
  { title: 'GitHub', alt: 'Logo GitHub', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { title: 'MongoDB', alt: 'Logo MongoDB', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
  { title: 'Docker', alt: 'Logo Docker', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { title: 'n8n', alt: 'Logo n8n', src: 'https://cdn.simpleicons.org/n8n/EA4B71' },
  { title: 'ngrok', alt: 'Logo ngrok', src: 'https://cdn.simpleicons.org/ngrok/1F1E37' }
];

const toTextLogos = (items: string[]): LogoItem[] => items.map(item => ({
  title: item,
  node: <ToolIcon name={item} />
}));

const getLogoTitle = (item: LogoItem) => ('src' in item ? (item.title ?? item.alt ?? 'Logo') : (item.title ?? 'Logo'));


const renderLogoChip = (item: LogoItem) => {
  const title = getLogoTitle(item);
  const brandClass = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <span className={`about-logo-chip brand-${brandClass}`} title={title}>
      <span className="about-logo-tile">
        {'src' in item ? (
          <img className="about-logo-img" src={item.src} alt={item.alt ?? title} loading="lazy" decoding="async" />
        ) : (
          <span className="about-logo-node">{item.node}</span>
        )}
      </span>
      <span className="about-logo-title">{title}</span>
    </span>
  );
};

export default function About({ onNavigate: _onNavigate, refreshToken = 0 }: AboutProps) {
  const [githubData, setGithubData] = useState<GithubContributionsResponse | null>(null);
  const [profile, setProfile] = useState<ProfileContent | null>(null);
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAboutPage = () => {
      setLoading(true);
      Promise.allSettled([api.getProfile(), api.getAbout(), api.getGithubContributions()])
        .then(([profileResult, aboutResult, githubResult]) => {
          setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
          setAbout(aboutResult.status === 'fulfilled' ? aboutResult.value : null);
          setGithubData(githubResult.status === 'fulfilled' ? githubResult.value : null);
        })
        .finally(() => setLoading(false));
    };

    loadAboutPage();
    window.addEventListener('about-content-updated', loadAboutPage);

    return () => window.removeEventListener('about-content-updated', loadAboutPage);
  }, [refreshToken]);

  const stackLogos = toTextLogos(about?.stack ?? []);
  const reverseStackLogos = [...stackLogos].reverse();
  const dynamicToolLogos = about?.tools?.length ? about.tools.map(item => ({ node: <ToolIcon name={item} />, title: item })) : toolLogos;

  if (loading) return <div className="page about-page"><section className="wrap sec"><div className="mono">Memuat data...</div></section></div>;

  return (
    <div className="page about-page">
      <section className="wrap sec">
        <div className="about-hero edge-panel">
          <div className="about-hero-copy">
            <SectionHeader eyebrow="Siapa Saya" title="Pengembang yang berpikir" accent="seperti desainer." />
            <p className="about-hero-text">
              {profile?.bio || 'Saya membangun pengalaman digital yang rapi, cepat, dan terasa hidup di setiap layar.'}
            </p>
          </div>
          <div className="about-hero-meta">
            <span className="about-hero-chip">{profile?.role || 'Creative Developer'}</span>
            <span className="about-hero-chip">{profile?.location || 'Indonesia'}</span>
            <span className="about-hero-chip">{githubData?.connected ? `@${githubData.username}` : 'GitHub Offline'}</span>
          </div>
        </div>

        <div className="about-grid">
          <article className="bio edge-panel about-main-card">
            <div className="about-bio-copy">
              {about?.bioParagraphs && about.bioParagraphs.length > 0 ? about.bioParagraphs.map((paragraph, index) => (
                <p key={index} className="about-bio-paragraph" style={{ '--delay': `${index * 80}ms` } as CSSProperties}>{paragraph}</p>
              )) : <p>Data tentang belum tersedia.</p>}
            </div>

            <div className="tl">
              <div className="ey timeline-title">Linimasa</div>
              {about?.timeline && about.timeline.length > 0 ? about.timeline.map((item, index) => (
                <div className="tl-item" key={item.id || item.year} style={{ '--delay': `${index * 90}ms` } as CSSProperties}>
                  <div className="tl-yr">{item.year}</div>
                  <div className="tl-ln" />
                  <div>
                    <div className="tl-r">{item.title}</div>
                    <div className="tl-o">{item.description}</div>
                  </div>
                </div>
              )) : <p>Timeline belum tersedia.</p>}
            </div>
          </article>

          <aside id="sb-skills" className="about-side">
            <div className="sb2 skills-card edge-panel about-side-card">
              <div className="ey card-ey">Keahlian</div>
              {about?.skills && about.skills.length > 0 ? about.skills.map((skill, index) => (
                <div className="sk-row" key={skill.id || skill.name} style={{ '--skill': skill.level / 100, '--delay': `${index * 70}ms` } as CSSProperties}>
                  <span className="sk-nm">{skill.name}</span>
                  <div className="sk-bar"><div className="sk-fill" /></div>
                  <span className="sk-pct">{Math.round(skill.level)}%</span>
                </div>
              )) : <div className="mono">Skill belum tersedia.</div>}
            </div>

            <div className="sb2 values-card edge-panel about-side-card">
              <div className="ey card-ey">Nilai</div>
              <div className="values-list">
                {about?.values && about.values.length > 0 ? about.values.map((value, index) => (
                  <div className="value-item" key={value} style={{ '--delay': `${index * 70}ms` } as CSSProperties}>
                    <span />
                    {value}
                  </div>
                )) : <div className="mono">Nilai belum tersedia.</div>}
              </div>
            </div>

            <div className="sb2 stack-card logo-card edge-panel about-side-card">
              <div className="card-headline">
                <div className="ey card-ey">Stack</div>
                <span className="card-mini-note">Teknologi utama yang paling sering dipakai</span>
              </div>
              {stackLogos.length > 0 ? (
                <>
                  <div className="logo-loop-shell stack-loop-shell">
                    <LogoLoop
                      logos={stackLogos}
                      speed={62}
                      direction="left"
                      logoHeight={27}
                      gap={12}
                      hoverSpeed={16}
                      scaleOnHover
                      fadeOut
                      fadeOutColor="#111318"
                      renderItem={renderLogoChip}
                      ariaLabel="Logo teknologi stack"
                      className="about-logo-loop"
                    />
                  </div>
                  <div className="logo-loop-shell stack-loop-shell is-secondary">
                    <LogoLoop
                      logos={reverseStackLogos}
                      speed={48}
                      direction="right"
                      logoHeight={25}
                      gap={12}
                      hoverSpeed={12}
                      scaleOnHover
                      fadeOut
                      fadeOutColor="#111318"
                      renderItem={renderLogoChip}
                      ariaLabel="Logo teknologi stack tambahan"
                      className="about-logo-loop"
                    />
                  </div>
                </>
              ) : <div className="about-github-empty">Stack belum tersedia.</div>}
            </div>

            <div className="sb2 tools-card logo-card edge-panel about-side-card">
              <div className="card-headline">
                <div className="ey card-ey">Alat</div>
                <span className="card-mini-note">Workflow harian untuk build dan deploy</span>
              </div>
              {dynamicToolLogos.length > 0 ? (
                <div className="logo-loop-shell tools-loop-shell">
                  <LogoLoop
                    logos={dynamicToolLogos}
                    speed={54}
                    direction="left"
                    logoHeight={28}
                    gap={14}
                    hoverSpeed={10}
                    scaleOnHover
                    fadeOut
                    fadeOutColor="#111318"
                    renderItem={renderLogoChip}
                    ariaLabel="Logo alat kerja"
                    className="about-logo-loop"
                  />
                </div>
              ) : <div className="about-github-empty">Alat belum tersedia.</div>}
            </div>

            <div className="sb2 github-card edge-panel about-side-card">
              <div className="card-headline">
                <div className="ey card-ey">Kontribusi GitHub</div>
                <span className="card-mini-note">Aktivitas repo dari akun yang terhubung</span>
              </div>
              {githubData?.connected && githubData.days.length > 0 ? (
                <ContributionGraph
                  days={githubData.days}
                  totalContributions={githubData.contributions}
                  username={githubData.username}
                  compact
                />
              ) : (
                <div className="about-github-empty">Grafik kontribusi belum tersedia.</div>
              )}
            </div>
          </aside>
        </div>
      </section>
      <Footer compact />
    </div>
  );
}
