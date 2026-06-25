import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeader from '../../components/SectionHeader';
import Footer from '../../components/Footer';
import { api } from '../../services/api';
import { projectCategories } from '../../data/portfolio';
import type { PageId, Project, ProjectCategory } from '../../types/portfolio';
import './Projects.css';

interface AdminProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  stack: string[];
  images: string[];
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  status: string;
}

interface ProjectDetail extends Project {
  slug: string;
  categoryAdmin: string;
  status: string;
  featured: boolean;
  images: string[];
  longDescription: string;
}

function adaptProject(raw: unknown): ProjectDetail | null {
  const p = raw as AdminProject;
  if (!p?.title) return null;

  const categoryMap: Record<string, Exclude<ProjectCategory, 'all'>> = {
    Web: 'web', Game: 'game', Server: 'server', Other: 'other',
    web: 'web', game: 'game', server: 'server', other: 'other',
  };

  const statusMap: Record<string, string> = {
    published: 'Terbit', draft: 'Draft', archived: 'Arsip',
  };

  const images = Array.isArray(p.images) ? p.images : [];

  return {
    title: p.title,
    description: p.description || '',
    detail: p.longDescription || p.description || '',
    category: categoryMap[p.category] || 'other',
    stack: Array.isArray(p.stack) ? p.stack : [],
    liveUrl: p.liveUrl || '#',
    sourceUrl: p.githubUrl || '#',
    tone: '#ff6b2b',
    mark: p.title.charAt(0).toUpperCase(),
    gallery: images.length > 0
      ? images.map((img, i) => ({ title: p.title, caption: `Screenshot ${i + 1}` }))
      : [{ title: p.title, caption: '' }],
    highlights: [],
    slug: p.slug || '',
    categoryAdmin: p.category || 'Other',
    status: statusMap[p.status] || p.status || 'Draft',
    featured: Boolean(p.featured),
    images,
    longDescription: p.longDescription || '',
  };
}

interface ProjectsProps {
  onNavigate: (page: PageId) => void;
}

export default function Projects({ onNavigate: _onNavigate }: ProjectsProps) {
  const [allProjects, setAllProjects] = useState<ProjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<ProjectCategory>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [activeShot, setActiveShot] = useState(0);

  const loadProjects = () => {
    setLoading(true);
    api.getProjects()
      .then((raw: unknown) => {
        const res = raw as Record<string, unknown>;
        const data = res && typeof res === 'object' && 'data' in res ? res.data : raw;
        const list = Array.isArray(data) ? data : [];
        const adapted = list.map(adaptProject).filter((project): project is ProjectDetail => project !== null);
        setAllProjects(adapted);
        setLoadError(false);
      })
      .catch(() => {
        setAllProjects([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
    window.addEventListener('projects-updated', loadProjects);

    return () => {
      window.removeEventListener('projects-updated', loadProjects);
    };
  }, []);

  const visibleProjects = useMemo(
    () => allProjects.filter(project => filter === 'all' || project.category === filter),
    [allProjects, filter]
  );

  const openProject = (project: ProjectDetail) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      setSelectedProject(project);
      setActiveShot(0);
    });
  };

  const closeProject = () => setSelectedProject(null);
  const hasLiveLink = (url: string) => url !== '#';

  const goToPreviousShot = () => {
    if (!selectedProject) return;
    setActiveShot(current => (current - 1 + selectedProject.gallery.length) % selectedProject.gallery.length);
  };

  const goToNextShot = () => {
    if (!selectedProject) return;
    setActiveShot(current => (current + 1) % selectedProject.gallery.length);
  };

  const handleProjectKey = (event: KeyboardEvent<HTMLElement>, project: ProjectDetail) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProject(project);
    }
  };

  useEffect(() => {
    if (!selectedProject) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeProject();
      if (event.key === 'ArrowLeft') goToPreviousShot();
      if (event.key === 'ArrowRight') goToNextShot();
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedProject]);

  useEffect(() => {
    document.body.classList.add('project-page-lock');
    return () => document.body.classList.remove('project-page-lock');
  }, []);

  useEffect(() => {
    if (!selectedProject) return;

    const refreshedProject = allProjects.find(project => project.slug === selectedProject.slug || project.title === selectedProject.title);
    if (!refreshedProject) {
      setSelectedProject(null);
      return;
    }

    setSelectedProject(refreshedProject);
    setActiveShot(current => Math.min(current, Math.max(refreshedProject.gallery.length - 1, 0)));
  }, [allProjects, selectedProject]);

  const selectedShot = selectedProject?.gallery[activeShot];

  return (
    <div className="page projects-page">
      <section className="wrap sec">
        <SectionHeader eyebrow="Karya Pilihan" title="Project saya yang sudah" accent="Kembangkan" />
        <div className="project-filter edge-panel" aria-label="Kategori proyek">
          {projectCategories.map(category => (
            <button
              className={`pf ${filter === category.id ? 'on' : ''}`}
              key={category.id}
              type="button"
              onClick={() => setFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className={`pj-grid ${visibleProjects.length === 0 && !loading ? 'is-empty' : ''}`}>
          {loading ? (
            <div className="project-empty edge-panel">
              <div className="project-empty-mark">...</div>
              <div>
                <div className="mono project-empty-ey">Memuat data</div>
                <h2>Sedang mengambil data project...</h2>
              </div>
            </div>
          ) : visibleProjects.length > 0 ? (
            <>
              {visibleProjects.map((project, index) => (
                <article
                  className="pj"
                  key={project.title}
                  role="button"
                  tabIndex={0}
                  aria-label={`Buka detail project ${project.title}`}
                  onClick={() => openProject(project)}
                  onKeyDown={event => handleProjectKey(event, project)}
                  style={{ '--tone': project.tone, '--delay': `${index * 70}ms` } as CSSProperties}
                >
                  <div className="pj-thumb">
                    {project.images[0] ? (
                      <img className="pj-thumb-image" src={project.images[0]} alt={project.title} />
                    ) : (
                      <>
                        <div className="pj-bg">{project.mark}</div>
                        <div className="pj-orbit"><span /><span /><span /></div>
                      </>
                    )}
                  </div>
                  <div className="pj-body">
                    <div className="pj-stack">
                      {project.stack.slice(0, 4).map(item => <span className="stag" key={item}>{item}</span>)}
                    </div>
                    <h2 className="pj-title">{project.title}</h2>
                    <p className="pj-desc">{project.description}</p>
                    <div className="pj-links">
                      <button className="pl pl-button" type="button" onClick={event => { event.stopPropagation(); openProject(project); }}>Detail Project -&gt;</button>
                      <a className={`pl ${!hasLiveLink(project.liveUrl) ? 'is-disabled' : ''}`} href={project.liveUrl} target="_blank" rel="noopener" onClick={event => { event.stopPropagation(); if (!hasLiveLink(project.liveUrl)) event.preventDefault(); }} aria-disabled={!hasLiveLink(project.liveUrl)} aria-label={`${project.title} demo langsung`}>Lihat Langsung -&gt;</a>
                    </div>
                  </div>
                </article>
              ))}
            </>
          ) : (
            <div className="project-empty edge-panel">
              <div className="project-empty-mark">API</div>
              <div>
                <div className="mono project-empty-ey">Data backend</div>
                <h2>{loadError ? 'Project belum bisa dimuat.' : 'Data project masih kosong.'}</h2>
                <p>
                  {loadError
                    ? 'Backend sedang tidak merespons atau data gagal diambil. Coba muat ulang halaman.'
                    : 'Tambah project melalui admin dashboard untuk menampilkannya di sini.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedProject && (
        <div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onClick={closeProject}>
          <div className="project-modal-panel" onClick={event => event.stopPropagation()} style={{ '--tone': selectedProject.tone } as CSSProperties}>
            <button className="project-modal-close" type="button" aria-label="Tutup detail project" onClick={closeProject}>x</button>

            <div className="project-modal-media">
              <div className="project-shot">
                <div className="project-shot-top">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="project-shot-screen">
                  {selectedProject.images.length > 0 ? (
                    <>
                      <div
                        className="project-shot-track"
                        style={{ transform: `translateX(-${activeShot * 100}%)` }}
                      >
                        {selectedProject.images.map((image, index) => (
                          <div className="project-shot-slide" key={`${selectedProject.slug || selectedProject.title}-${index}`}>
                            <img className="project-shot-image" src={image} alt={`${selectedProject.title} ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                      {selectedProject.images.length > 1 && (
                        <>
                          <button
                            className="project-shot-arrow project-shot-arrow-left"
                            type="button"
                            onClick={goToPreviousShot}
                            aria-label="Foto sebelumnya"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            className="project-shot-arrow project-shot-arrow-right"
                            type="button"
                            onClick={goToNextShot}
                            aria-label="Foto berikutnya"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="project-shot-mark">{selectedProject.mark}</div>
                      {selectedShot && (
                        <div>
                          <strong>{selectedShot.title}</strong>
                          <p>{selectedShot.caption}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {selectedProject.gallery.length > 1 && (
                <div className="project-shot-controls" aria-label="Navigasi foto project">
                  <button className="project-shot-button" type="button" onClick={goToPreviousShot}>Sebelumnya</button>
                  <span className="project-shot-count">{activeShot + 1} / {selectedProject.gallery.length}</span>
                  <button className="project-shot-button" type="button" onClick={goToNextShot}>Berikutnya</button>
                </div>
              )}
            </div>

            <div className="project-modal-copy">
              <div className="mono project-modal-ey">Detail Project</div>
              <h2 id="project-modal-title">{selectedProject.title}</h2>

              <div className="project-modal-sections">
                <div className="project-modal-section">
                  <div className="project-modal-label">Judul</div>
                  <div className="project-modal-value project-modal-title-text">{selectedProject.title}</div>
                </div>

                <div className="project-modal-section">
                  <div className="project-modal-label">Deskripsi</div>
                  <p className="project-modal-value">{selectedProject.description || '-'}</p>
                </div>

                <div className="project-modal-section">
                  <div className="project-modal-label">Deskripsi Lengkap</div>
                  <p className="project-modal-value">{selectedProject.longDescription || selectedProject.detail || '-'}</p>
                </div>

                <div className="project-modal-section">
                  <div className="project-modal-label">Link Live</div>
                  {hasLiveLink(selectedProject.liveUrl)
                    ? <a className="project-modal-link" href={selectedProject.liveUrl} target="_blank" rel="noopener">{selectedProject.liveUrl}</a>
                    : <div className="project-modal-value">-</div>}
                </div>

                <div className="project-modal-section">
                  <div className="project-modal-label">GitHub URL</div>
                  {hasLiveLink(selectedProject.sourceUrl)
                    ? <a className="project-modal-link" href={selectedProject.sourceUrl} target="_blank" rel="noopener">{selectedProject.sourceUrl}</a>
                    : <div className="project-modal-value">-</div>}
                </div>

                <div className="project-modal-section">
                  <div className="project-modal-label">Stack Teknologi</div>
                  <div className="project-modal-stack">
                    {selectedProject.stack.length > 0
                      ? selectedProject.stack.map(item => <span className="stag" key={item}>{item}</span>)
                      : <div className="project-modal-value">-</div>}
                  </div>
                </div>

                <div className="project-modal-grid">
                  <div className="project-modal-section">
                    <div className="project-modal-label">Kategori</div>
                    <div className="project-modal-badge">{selectedProject.categoryAdmin}</div>
                  </div>
                  <div className="project-modal-section">
                    <div className="project-modal-label">Status</div>
                    <div className="project-modal-badge">{selectedProject.status}</div>
                  </div>
                </div>
              </div>

              <div className="project-modal-actions">
                <a className={`bp modal-action-primary ${!hasLiveLink(selectedProject.liveUrl) ? 'is-disabled' : ''}`} href={selectedProject.liveUrl} target="_blank" rel="noopener" aria-disabled={!hasLiveLink(selectedProject.liveUrl)} onClick={event => { if (!hasLiveLink(selectedProject.liveUrl)) event.preventDefault(); }}>Lihat Langsung</a>
                {hasLiveLink(selectedProject.sourceUrl) && (
                  <a className="bg modal-action-secondary" href={selectedProject.sourceUrl} target="_blank" rel="noopener">Lihat Kode</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer compact />
    </div>
  );
}
