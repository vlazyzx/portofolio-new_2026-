// ─────────────────────────────────────────────────────────────
// Profile Manager
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { Save, GitBranch, Globe, Music2, MessageCircle, Gamepad2, Share2, FileText, Plus, Trash2, Info } from 'lucide-react';
import ContributionGraph from '../../../components/ContributionGraph';
import {
  InputField, TextAreaField, SelectField, ImageUploader,
  TagInput, EmptyState, LoadingState, Spinner
} from '../components/ui';
import {
  errorMessage, getHome, updateHome, getProfile, updateProfile, getAbout, updateAbout,
  getStudent, updateStudent, getSocialLinks, updateSocialLinks, getContactMessages,
  markContactMessageRead, deleteContactMessage, getGithubContributions
} from '../services/api';
import { useToast } from '../store/toast';
import type { HomeContent, Profile, About, SocialLinks, ContactMessage, TimelineItem, SkillItem, StudentContent } from '../types';

export function HomePage() {
  const { toast } = useToast();
  const [home, setHome] = useState<HomeContent | null>(null);
  const homeRef = useRef<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHome()
      .then(data => {
        homeRef.current = data;
        setHome(data);
      })
      .catch(err => toast(errorMessage(err, 'Gagal memuat data home.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    homeRef.current = home;
  }, [home]);

  async function handleSave() {
    const currentHome = homeRef.current;
    if (!currentHome) return;
    setSaving(true);
    try {
      const updated = await updateHome(currentHome);
      homeRef.current = updated;
      setHome(updated);
      window.dispatchEvent(new Event('home-content-updated'));
      toast('Data home berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan data home.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!home) return null;

  function set<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setHome(current => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      homeRef.current = next;
      return next;
    });
  }

  const statKeys: (keyof HomeContent['stats'])[] = ['mainStack', 'learningYears', 'gpa'];
  const statScale: Record<keyof HomeContent['stats'], number> = {
    completedProjects: 100,
    mainStack: 18,
    learningYears: 30,
    gpa: 98,
  };

  function setStat<K extends keyof HomeContent['stats'][keyof HomeContent['stats']]>(
    key: keyof HomeContent['stats'],
    field: K,
    value: HomeContent['stats'][keyof HomeContent['stats']][K]
  ) {
    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            [field]: value,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  function formatStatValue(key: keyof HomeContent['stats'], numericValue: number): string {
    const roundedValue = key === 'gpa' ? numericValue.toFixed(0) : Math.round(numericValue).toString();
    return key === 'learningYears' ? `${roundedValue}+` : roundedValue;
  }

  function setStatValue(key: keyof HomeContent['stats'], value: string) {
    const numericValue = Number(value.replace(/[^0-9.]/g, ''));
    const progress = Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 0), statScale[key]) : 0;

    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            value,
            progress,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  function setStatProgress(key: keyof HomeContent['stats'], progress: number) {
    const clampedProgress = Math.min(Math.max(progress, 0), statScale[key]);

    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            value: formatStatValue(key, clampedProgress),
            progress: clampedProgress,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="card p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h2 className="font-syne font-bold text-[18px]">Manajer Home</h2>
          </div>
          <p className="text-[12px] text-sub max-w-2xl">
            Atur media, statistik, dan kartu navigasi yang tampil di halaman home. Statistik proyek selesai otomatis mengikuti data terbaru dari Manajer Project.
          </p>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Media Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Konten ini tampil di hero utama halaman home.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          <div className="flex flex-col gap-4">
            <InputField
              label="Eyebrow"
              value={home.eyebrow}
              onChange={e => set('eyebrow', e.target.value)}
              placeholder="Pengembang Kreatif"
            />
            <InputField
              label="Nama di Home"
              value={home.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Muhammad Ikhsan"
            />
            <TextAreaField
              label="Deskripsi Hero"
              value={home.heroDescription}
              onChange={e => set('heroDescription', e.target.value)}
              rows={4}
              placeholder="Deskripsi singkat yang tampil di bawah nama pada hero home..."
            />
            <InputField
              label="Subtitle Badge"
              value={home.badgeSubtitle}
              onChange={e => set('badgeSubtitle', e.target.value)}
              placeholder="Backend Developer"
            />
          </div>
          <ImageUploader
            label="Gambar Lanyard"
            value={home.lanyardImage}
            onChange={value => set('lanyardImage', Array.isArray(value) ? value[0] || '' : value)}
          />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Statistik Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Value dan tombol volume saling terhubung. Ubah angka atau geser slider, lalu simpan untuk mengirim data ke halaman home.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statKeys.map(statKey => {
            const stat = home.stats[statKey];

            return (
              <div key={stat.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-syne font-bold text-[14px] text-tx">{stat.label || 'Statistik Home'}</div>
                    <div className="mono text-[11px] text-sub">Range 0 - {statScale[statKey]}{statKey === 'learningYears' ? '+' : ''}</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full border border-white/10 bg-elevated mono text-[11px] text-sub">
                    {Math.round(stat.progress)} / {statScale[statKey]}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <InputField label="Value" value={stat.value} onChange={e => setStatValue(statKey, e.target.value)} placeholder="18" />
                  <InputField label="Label" value={stat.label} onChange={e => setStat(statKey, 'label', e.target.value)} placeholder="Stack Utama" />
                </div>
                <div className="rounded-xl border border-white/10 bg-elevated/60 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 mono text-[11px] text-sub">
                    <span>Volume</span>
                    <span>{Math.round((stat.progress / statScale[statKey]) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max={statScale[statKey]} step="1" value={stat.progress} onChange={e => setStatProgress(statKey, Number(e.target.value))} className="w-full accent-accent" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Kartu Navigasi Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Kartu ini tampil di halaman home sebagai pintasan menuju halaman lain.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {home.cards.map((card, index) => (
            <div key={card.id || index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="font-syne font-bold text-[14px] text-tx">Kartu {index + 1}</div>
                  <div className="mono text-[11px] text-sub">Navigasi: {card.page}</div>
                </div>
                <button type="button" onClick={() => set('cards', home.cards.filter((_, i) => i !== index))} className="btn-icon-danger self-start sm:self-auto"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Tag" value={card.tag} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, tag: e.target.value } : item))} placeholder="Project" />
                <SelectField label="Halaman" value={card.page} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, page: e.target.value as HomeContent['cards'][number]['page'] } : item))} options={[{ value: 'projects', label: 'Project' }, { value: 'about', label: 'Tentang' }, { value: 'student', label: 'Pelajar' }, { value: 'contact', label: 'Kontak' }]} />
                <div className="sm:col-span-2">
                  <InputField label="Judul" value={card.title} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Judul" />
                </div>
                <div className="sm:col-span-2">
                  <InputField label="Deskripsi" value={card.desc} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, desc: e.target.value } : item))} placeholder="Deskripsi" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <InputField label="Meta" value={card.meta} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, meta: e.target.value } : item))} placeholder="Meta" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set('cards', [...home.cards, { id: Date.now().toString(), page: 'projects', tag: '', title: '', desc: '', meta: '' }])} className="btn-link self-start w-full sm:w-auto justify-center sm:justify-start"><Plus size={13} /> Tambah Kartu</button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Home</>}
        </button>
      </div>
    </div>
  );
}

// ── Profile Page ─────────────────────────────────────────────

export function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(err => toast(errorMessage(err, 'Gagal memuat profil.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      toast('Profil berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan profil.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!profile) return null;

  function set(k: keyof Profile, v: string) { setProfile(prev => prev ? { ...prev, [k]: v } : prev); }

  return (
    <div className="admin-manager-page">
      <div className="admin-manager-intro card">
        <div>
          <div className="admin-section-label">
            <span className="admin-section-title">Profil Manager</span>
          </div>
          <div className="admin-manager-title">Rapikan identitas utama portofolio.</div>
          <p className="admin-manager-desc mt-3">Kelola foto, nama, role, lokasi, status kerja, dan bio singkat yang tampil di area pengenalan utama.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">Avatar</span>
          <span className="tag">Headline</span>
          <span className="tag">Status Kerja</span>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-manager-main">
          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading">
                <div className="admin-section-line" />
                <h3>Informasi Profil</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[200px_minmax(0,1fr)] gap-5 items-start">
              <div className="admin-preview-shell">
                <ImageUploader label="Foto Profil" value={profile.avatar} onChange={v => set('avatar', Array.isArray(v) ? v[0] || '' : v)} />
              </div>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Nama Lengkap" value={profile.name} onChange={e => set('name', e.target.value)} placeholder="Nama lengkap" />
                  <InputField label="Role / Jabatan" value={profile.role} onChange={e => set('role', e.target.value)} placeholder="Pengembang Frontend" />
                  <InputField label="Lokasi" value={profile.location} onChange={e => set('location', e.target.value)} placeholder="Indonesia" />
                  <SelectField label="Status Kerja" value={profile.workStatus}
                    onChange={e => set('workStatus', e.target.value)}
                    options={[
                      { value: 'open', label: 'Terbuka untuk kerja' },
                      { value: 'busy', label: 'Sedang sibuk' },
                      { value: 'closed', label: 'Tidak tersedia' },
                    ]} />
                </div>
                <TextAreaField label="Bio Singkat" value={profile.bio}
                  onChange={e => set('bio', e.target.value)} rows={5}
                  placeholder="Cerita singkat tentang kamu..." />
              </div>
            </div>
          </div>

          <div className="admin-sticky-actions">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Profil</>}
            </button>
          </div>
        </div>

        <div className="admin-manager-side">
          <div className="card admin-side-card admin-preview-card">
            <div className="admin-section-heading">
              <div className="admin-section-line" />
              <h3>Preview Ringkas</h3>
            </div>
            <div className="admin-preview-shell">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-void/70 flex items-center justify-center text-sub text-[11px]">
                  {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" /> : 'No Image'}
                </div>
                <div className="min-w-0">
                  <div className="font-syne font-bold text-[18px] truncate">{profile.name || 'Nama belum diisi'}</div>
                  <div className="text-[13px] text-sub mt-1">{profile.role || 'Role belum diisi'}</div>
                  <div className="text-[12px] text-accent mt-2">{profile.location || 'Lokasi belum diisi'}</div>
                </div>
              </div>
            </div>
            <div className="admin-stat-grid">
              <div className="admin-stat-tile">
                <div className="admin-stat-value">{profile.bio.trim().split(/\s+/).filter(Boolean).length}</div>
                <div className="admin-stat-label">Kata Bio</div>
              </div>
              <div className="admin-stat-tile">
                <div className="admin-stat-value">{profile.avatar ? '01' : '00'}</div>
                <div className="admin-stat-label">Foto Aktif</div>
              </div>
            </div>
            <div className="admin-info-list">
              <div className="admin-info-row">
                <div className="admin-info-label">Status</div>
                <div className="admin-info-value">{profile.workStatus || '-'}</div>
              </div>
              <div className="admin-info-row">
                <div className="admin-info-label">Bio Preview</div>
                <div className="admin-info-value">{profile.bio || 'Bio belum diisi'}</div>
              </div>
              <div className="admin-info-row">
                <div className="admin-info-label">Siap Tampil</div>
                <div className="admin-info-value">{profile.name && profile.role && profile.bio ? 'Siap' : 'Belum lengkap'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── About Page ────────────────────────────────────────────────

export function AboutPage() {
  const { toast } = useToast();
  const [about, setAbout] = useState<About | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAbout()
      .then(setAbout)
      .catch(err => toast(errorMessage(err, 'Gagal memuat data about.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!about) return;
    setSaving(true);
    try {
      const updated = await updateAbout(about);
      setAbout(updated);
      window.dispatchEvent(new Event('about-content-updated'));
      toast('Data about berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan data about.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!about) return null;

  function addBio() { setAbout(a => a ? { ...a, bioParagraphs: [...a.bioParagraphs, ''] } : a); }
  function setBio(i: number, v: string) { setAbout(a => a ? { ...a, bioParagraphs: a.bioParagraphs.map((p, j) => j === i ? v : p) } : a); }
  function delBio(i: number) { setAbout(a => a ? { ...a, bioParagraphs: a.bioParagraphs.filter((_, j) => j !== i) } : a); }

  function addTl() { setAbout(a => a ? { ...a, timeline: [...a.timeline, { id: Date.now().toString(), year: '', title: '', description: '' }] } : a); }
  function setTl(id: string, k: keyof TimelineItem, v: string) { setAbout(a => a ? { ...a, timeline: a.timeline.map(t => t.id === id ? { ...t, [k]: v } : t) } : a); }
  function delTl(id: string) { setAbout(a => a ? { ...a, timeline: a.timeline.filter(t => t.id !== id) } : a); }

  function addSkill() { setAbout(a => a ? { ...a, skills: [...a.skills, { id: Date.now().toString(), name: '', level: 70 }] } : a); }
  function setSkill(id: string, k: keyof SkillItem, v: string | number) { setAbout(a => a ? { ...a, skills: a.skills.map(s => s.id === id ? { ...s, [k]: v } : s) } : a); }
  function delSkill(id: string) { setAbout(a => a ? { ...a, skills: a.skills.filter(s => s.id !== id) } : a); }

  return (
    <div className="admin-manager-page">
      <div className="admin-manager-intro card">
        <div>
          <div className="admin-section-label">
            <span className="admin-section-title">About Manager</span>
          </div>
          <div className="admin-manager-title">Susun narasi, timeline, dan kekuatan utama.</div>
          <p className="admin-manager-desc mt-3">Halaman ini mengatur cerita personal, perjalanan, skill, serta daftar nilai dan tool yang tampil di halaman tentang.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">Bio</span>
          <span className="tag">Timeline</span>
          <span className="tag">Skill</span>
          <span className="tag">Values</span>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-manager-main">
          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Paragraf Bio</h3></div>
              <button type="button" onClick={addBio} className="btn-link"><Plus size={13} /> Tambah</button>
            </div>
            <div className="admin-collection-list">
              {about.bioParagraphs.length === 0
                ? <p className="text-[13px] text-sub py-4 text-center">Belum ada paragraf. Klik "Tambah" untuk mulai.</p>
                : about.bioParagraphs.map((p, i) => (
                  <div key={i} className="admin-collection-card flex gap-2">
                    <textarea value={p} onChange={e => setBio(i, e.target.value)}
                      className="input-field resize-none flex-1" rows={4}
                      placeholder={`Paragraf ${i + 1}...`} />
                    <button type="button" onClick={() => delBio(i)} className="btn-icon-danger mt-1 flex-shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Timeline</h3></div>
                <button type="button" onClick={addTl} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {about.timeline.map(tl => (
                  <div key={tl.id} className="admin-collection-card grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-start">
                    <input value={tl.year} onChange={e => setTl(tl.id, 'year', e.target.value)} className="input-field text-[12px]" placeholder="2024" />
                    <div className="flex flex-col gap-1.5">
                      <input value={tl.title} onChange={e => setTl(tl.id, 'title', e.target.value)} className="input-field text-[12px]" placeholder="Judul..." />
                      <input value={tl.description} onChange={e => setTl(tl.id, 'description', e.target.value)} className="input-field text-[12px]" placeholder="Deskripsi..." />
                    </div>
                    <button type="button" onClick={() => delTl(tl.id)} className="btn-icon-danger mt-0.5"><Trash2 size={13} /></button>
                  </div>
                ))}
                {about.timeline.length === 0 && <p className="text-[13px] text-sub py-4 text-center">Belum ada timeline.</p>}
              </div>
            </div>

            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Skill</h3></div>
                <button type="button" onClick={addSkill} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {about.skills.map(s => (
                  <div key={s.id} className="admin-collection-card flex items-center gap-2">
                    <input value={s.name} onChange={e => setSkill(s.id, 'name', e.target.value)} className="input-field flex-1 text-[12px]" placeholder="Nama skill..." />
                    <input type="number" min="0" max="100" value={s.level} onChange={e => setSkill(s.id, 'level', +e.target.value)} className="input-field w-16 text-[12px] text-center" />
                    <button type="button" onClick={() => delSkill(s.id)} className="btn-icon-danger"><Trash2 size={13} /></button>
                  </div>
                ))}
                {about.skills.length === 0 && <p className="text-[13px] text-sub py-4 text-center">Belum ada skill.</p>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Nilai, Stack & Alat</h3></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <TagInput label="Nilai" tags={about.values} onChange={v => setAbout(a => a ? { ...a, values: v } : a)} />
              <TagInput label="Stack Teknologi" tags={about.stack} onChange={v => setAbout(a => a ? { ...a, stack: v } : a)} />
              <TagInput label="Alat" tags={about.tools} onChange={v => setAbout(a => a ? { ...a, tools: v } : a)} />
            </div>
          </div>

          <div className="admin-sticky-actions">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Tentang</>}
            </button>
          </div>
        </div>

        <div className="admin-manager-side">
          <div className="card admin-side-card admin-preview-card">
            <div className="admin-section-heading"><div className="admin-section-line" /><h3>Ringkasan Konten</h3></div>
            <div className="admin-stat-grid">
              <div className="admin-stat-tile"><div className="admin-stat-value">{String(about.bioParagraphs.length).padStart(2, '0')}</div><div className="admin-stat-label">Paragraf</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{String(about.timeline.length).padStart(2, '0')}</div><div className="admin-stat-label">Timeline</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{String(about.skills.length).padStart(2, '0')}</div><div className="admin-stat-label">Skills</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{String(about.values.length + about.stack.length + about.tools.length).padStart(2, '0')}</div><div className="admin-stat-label">Tag Total</div></div>
            </div>
            <div className="admin-preview-shell admin-dense-stack">
              <div className="text-[13px] text-sub leading-relaxed">
                Fokuskan bio pada narasi singkat, timeline pada momen penting, dan skills pada kompetensi yang benar-benar ingin ditonjolkan.
              </div>
              <div className="text-[12px] text-muted">Timeline terbaru: {about.timeline[0]?.title || 'Belum ada timeline'}</div>
              <div className="text-[12px] text-muted">Skill utama: {about.skills[0]?.name || 'Belum ada skill'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Page ─────────────────────────────────────────────

export function StudentPage() {
  const { toast } = useToast();
  const [student, setStudent] = useState<StudentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudent()
      .then(setStudent)
      .catch(err => toast(errorMessage(err, 'Gagal memuat data student.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    try {
      await updateStudent(student);
      toast('Data student berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan data student.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!student) return null;

  return (
    <div className="admin-manager-page">
      <div className="admin-manager-intro card">
        <div>
          <div className="admin-section-label"><span className="admin-section-title">Student Manager</span></div>
          <div className="admin-manager-title">Kelola identitas akademik dan pencapaian.</div>
          <p className="admin-manager-desc mt-3">Atur informasi student, deskripsi akademik, daftar pencapaian, dan mata kuliah unggulan agar tampil lebih rapi di halaman student.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">Profil</span>
          <span className="tag">Achievement</span>
          <span className="tag">Course</span>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-manager-main">
          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Profil Student</h3></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Periode" value={student.period} onChange={e => setStudent(s => s ? { ...s, period: e.target.value } : s)} placeholder="2022 - Sekarang" />
              <InputField label="Gelar / Jurusan" value={student.degree} onChange={e => setStudent(s => s ? { ...s, degree: e.target.value } : s)} placeholder="S1 Informatika" />
              <InputField label="Sekolah / Kampus" value={student.school} onChange={e => setStudent(s => s ? { ...s, school: e.target.value } : s)} placeholder="Nama kampus" />
              <InputField label="IPK" value={student.gpa} onChange={e => setStudent(s => s ? { ...s, gpa: e.target.value } : s)} placeholder="3.8" />
              <div className="sm:col-span-2"><InputField label="Label IPK" value={student.gpaLabel} onChange={e => setStudent(s => s ? { ...s, gpaLabel: e.target.value } : s)} placeholder="IPK Saat Ini" /></div>
              <div className="sm:col-span-2"><TextAreaField label="Deskripsi" value={student.description} onChange={e => setStudent(s => s ? { ...s, description: e.target.value } : s)} rows={4} placeholder="Deskripsi student..." /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Pencapaian</h3></div>
                <button type="button" onClick={() => setStudent(s => s ? { ...s, achievements: [...s.achievements, { id: Date.now().toString(), code: '', title: '', note: '' }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {student.achievements.map(item => (
                  <div key={item.id} className="admin-collection-card grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-start">
                    <input value={item.code} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, code: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="TOP" />
                    <div className="flex flex-col gap-1.5">
                      <input value={item.title} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, title: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Judul" />
                      <input value={item.note} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, note: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Catatan" />
                    </div>
                    <button type="button" onClick={() => setStudent(s => s ? { ...s, achievements: s.achievements.filter(entry => entry.id !== item.id) } : s)} className="btn-icon-danger mt-0.5"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Mata Kuliah</h3></div>
                <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: [...s.courses, { id: Date.now().toString(), name: '', grade: '', highlight: false }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {student.courses.map(item => (
                  <div key={item.id} className="admin-collection-card grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-2 items-center">
                    <input value={item.name} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, name: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Nama mata kuliah" />
                    <input value={item.grade} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, grade: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="A" />
                    <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, highlight: !entry.highlight } : entry) } : s)} className="btn-ghost">{item.highlight ? 'Highlight' : 'Normal'}</button>
                    <div className="sm:col-span-3 flex justify-end">
                      <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.filter(entry => entry.id !== item.id) } : s)} className="btn-icon-danger"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-sticky-actions">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Student</>}
            </button>
          </div>
        </div>

        <div className="admin-manager-side">
          <div className="card admin-side-card admin-preview-card">
            <div className="admin-section-heading"><div className="admin-section-line" /><h3>Ringkasan Akademik</h3></div>
            <div className="admin-stat-grid">
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.achievements.length}</div><div className="admin-stat-label">Achievement</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.courses.length}</div><div className="admin-stat-label">Course</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.courses.filter(item => item.highlight).length}</div><div className="admin-stat-label">Highlighted</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.gpa || '—'}</div><div className="admin-stat-label">IPK</div></div>
            </div>
            <div className="admin-info-list">
              <div className="admin-info-row"><div className="admin-info-label">Kampus</div><div className="admin-info-value">{student.school || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Jurusan</div><div className="admin-info-value">{student.degree || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Periode</div><div className="admin-info-value">{student.period || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Preview</div><div className="admin-info-value">{student.description || 'Deskripsi belum diisi'}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Social Links Page ─────────────────────────────────────────

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: 'github', label: 'GitHub', icon: <GitBranch size={16} />, placeholder: 'https://github.com/username' },
  { key: 'instagram', label: 'Instagram', icon: <Globe size={16} />, placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', label: 'TikTok', icon: <Music2 size={16} />, placeholder: 'https://tiktok.com/@username' },
  { key: 'discord', label: 'Discord', icon: <MessageCircle size={16} />, placeholder: 'discord.gg/invite or username#0000' },
  { key: 'roblox', label: 'Roblox', icon: <Gamepad2 size={16} />, placeholder: 'https://roblox.com/users/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: <Share2 size={16} />, placeholder: 'https://linkedin.com/in/username' },
  { key: 'resume', label: 'Resume/CV', icon: <FileText size={16} />, placeholder: 'https://drive.google.com/...' },
];

export function SocialLinksPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<SocialLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSocialLinks()
      .then(setLinks)
      .catch(err => toast(errorMessage(err, 'Gagal memuat social links.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!links) return;
    setSaving(true);
    try {
      await updateSocialLinks(links);
      toast('Social links disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan social links.'), 'error');
    }
    finally { setSaving(false); }
  }

  function isValidUrl(url: string) {
    if (!url) return true;
    try { new URL(url); return true; } catch { return false; }
  }

  if (loading) return <LoadingState />;
  if (!links) return null;

  return (
    <div className="admin-manager-page">
      <div className="admin-manager-intro card">
        <div>
          <div className="admin-section-label"><span className="admin-section-title">Social Links Manager</span></div>
          <div className="admin-manager-title">Kelola seluruh tautan publik dalam satu panel.</div>
          <p className="admin-manager-desc mt-3">Atur link sosial, CV, dan platform penting lain. Setiap input langsung menampilkan status validasi dan preview singkat.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">GitHub</span>
          <span className="tag">LinkedIn</span>
          <span className="tag">Resume</span>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-manager-main">
          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Link Sosial</h3></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {SOCIAL_FIELDS.map(f => {
                const val = links[f.key] || '';
                const invalid = val && !isValidUrl(val);
                return (
                  <div key={f.key} className="admin-collection-card flex flex-col gap-2.5">
                    <label className="font-mono text-[11px] text-sub uppercase tracking-[0.08em] flex items-center gap-2">
                      <span className="text-accent">{f.icon}</span>{f.label}
                    </label>
                    <input
                      value={val}
                      onChange={e => setLinks(l => l ? { ...l, [f.key]: e.target.value } : l)}
                      placeholder={f.placeholder}
                      className={`input-field ${invalid ? 'border-danger' : ''}`}
                    />
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className={invalid ? 'text-danger' : 'text-sub'}>{invalid ? 'URL tidak valid' : (val ? 'Tautan terisi' : 'Belum diisi')}</span>
                      <span className="text-muted truncate">{val ? (() => { try { return new URL(val).hostname; } catch { return 'manual'; } })() : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-sticky-actions">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Link</>}
            </button>
          </div>
        </div>

        <div className="admin-manager-side">
          <div className="card admin-side-card admin-preview-card">
            <div className="admin-section-heading"><div className="admin-section-line" /><h3>Preview & Status</h3></div>
            <div className="admin-stat-grid">
              <div className="admin-stat-tile"><div className="admin-stat-value">{SOCIAL_FIELDS.filter(f => (links[f.key] || '').trim()).length}</div><div className="admin-stat-label">Link Aktif</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{SOCIAL_FIELDS.filter(f => { const val = links[f.key] || ''; return Boolean(val && !isValidUrl(val)); }).length}</div><div className="admin-stat-label">Invalid</div></div>
            </div>
            <div className="admin-info-list">
              {SOCIAL_FIELDS.filter(f => (links[f.key] || '').trim()).slice(0, 5).map(f => (
                <div key={f.key} className="admin-info-row">
                  <div className="admin-info-label">{f.label}</div>
                  <div className="admin-info-value truncate">{links[f.key]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Contact Messages Page ─────────────────────────────────────

export function MessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    getContactMessages()
      .then(setMessages)
      .catch(err => toast(errorMessage(err, 'Gagal memuat pesan.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function markRead(id: string) {
    try {
      await markContactMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
      if (selected?.id === id) setSelected(s => s ? { ...s, read: true } : s);
      toast('Ditandai sebagai dibaca', 'info');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menandai pesan.'), 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContactMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast('Pesan dihapus');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menghapus pesan.'), 'error');
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-180px)]">
      {/* List */}
      <div className="lg:w-80 flex flex-col gap-2 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[11px] text-sub">{messages.length} pesan</span>
          <span className="font-mono text-[11px] text-accent">
            {messages.filter(m => !m.read).length} belum dibaca
          </span>
        </div>
        {messages.length === 0 ? (
          <EmptyState title="Belum ada pesan" description="Pesan dari halaman contact akan muncul di sini" />
        ) : messages.map(m => (
          <button key={m.id}
            type="button"
            onClick={() => { setSelected(m); if (!m.read) markRead(m.id); }}
            className={`text-left p-4 rounded-xl border transition-colors duration-150
                        ${selected?.id === m.id ? 'border-accent bg-accent/5' : 'border-white/10 bg-surface/80 hover:border-accent/40'}
                        ${!m.read ? 'border-l-2 border-l-accent' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-[13px] text-tx truncate">{m.name}</div>
              {!m.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
            </div>
            <div className="text-[12px] text-sub truncate mb-1">{m.subject || '(tanpa subjek)'}</div>
            <div className="font-mono text-[10px] text-muted">
              {new Date(m.createdAt).toLocaleDateString('id-ID')}
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="card h-full flex flex-col">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-syne font-bold text-[16px]">{selected.name}</h3>
                <p className="text-[12px] text-sub">{selected.email}</p>
                <p className="font-mono text-[10px] text-muted mt-1">
                  {new Date(selected.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!selected.read && (
                  <button type="button" onClick={() => markRead(selected.id)}
                    className="btn-link">
                    Tandai Dibaca
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(selected.id)} className="btn-danger py-1">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {selected.subject && (
              <div className="mb-3 pb-3 border-b border-white/10">
                <span className="font-mono text-[11px] text-sub uppercase tracking-wider">Subjek</span>
                <p className="text-[13px] text-tx mt-1">{selected.subject}</p>
              </div>
            )}
            <p className="text-[14px] text-sub leading-relaxed flex-1 whitespace-pre-wrap">
              {selected.message}
            </p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState title="Pilih pesan" description="Klik pesan di kiri untuk membacanya" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── GitHub Integration Page ───────────────────────────────────

export function GithubPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{ username: string; contributions: number; connected: boolean; days: { date: string; count: number; color: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGithub = (showLoader = true, silent = false) => {
      if (showLoader) setLoading(true);
      getGithubContributions()
        .then(result => {
          setData(result);
          setError('');
        })
        .catch(err => {
          const message = errorMessage(err, 'Gagal memuat data GitHub.');
          setError(message);
          if (!silent) toast(message, 'error');
        })
        .finally(() => setLoading(false));
    };

    const handleRefresh = () => loadGithub(false, true);
    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') loadGithub(false, true);
    };
    const refreshInterval = window.setInterval(() => loadGithub(false, true), 60000);

    loadGithub();
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [toast]);

  if (loading) return <LoadingState />;

  return (
    <div className="admin-manager-page admin-github-page">
      <div className="admin-manager-intro card admin-github-hero">
        <div>
          <div className="admin-section-label"><span className="admin-section-title">GitHub Integration</span></div>
          <div className="admin-manager-title">Pantau koneksi, grafik kontribusi, dan setup backend.</div>
          <p className="admin-manager-desc mt-3">Panel ini menampilkan status koneksi GitHub, ringkasan kontribusi, serta panduan setup token yang aman lewat backend.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">Status API</span>
          <span className="tag">Contribution Graph</span>
          <span className="tag">Security</span>
        </div>
      </div>

      {error && (
        <div className="card border-danger/30 bg-danger/5">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-danger mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-syne font-bold text-[15px] mb-1">GitHub belum bisa dimuat penuh</div>
              <p className="text-[13px] text-sub leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-manager-grid admin-github-layout">
        <div className="admin-manager-main admin-github-main">
          <div className={`card admin-github-status border ${data?.connected ? 'border-ok/30 bg-ok/5' : 'border-warn/30 bg-warn/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data?.connected ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}><GitBranch size={20} /></div>
              <div>
                <div className="font-syne font-bold text-[15px]">{data?.connected ? 'GitHub Terhubung' : 'GitHub Belum Terhubung'}</div>
                <div className="text-[12px] text-sub">{data?.connected ? `@${data.username}` : 'Sambungkan token di backend'}</div>
              </div>
              <div className={`ml-auto w-2.5 h-2.5 rounded-full ${data?.connected ? 'bg-ok' : 'bg-warn'}`} />
            </div>
          </div>

          <div className="admin-github-stats">
            <div className="card admin-github-stat-card text-center py-6"><div className="font-syne font-extrabold text-[32px] text-accent tracking-tight">{data?.contributions ?? '—'}</div><div className="font-mono text-[11px] text-sub uppercase tracking-wider mt-1">Total Kontribusi</div></div>
            <div className="card admin-github-stat-card text-center py-6"><div className="font-syne font-extrabold text-[20px] sm:text-[32px] tracking-tight">{data?.username ? `@${data.username}` : '—'}</div><div className="font-mono text-[11px] text-sub uppercase tracking-wider mt-1">Username GitHub</div></div>
          </div>

          <div className="card admin-github-graph-card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Grafik Kontribusi</h3></div>
            </div>
            {data?.connected && data.days.length > 0 ? (
              <>
                <ContributionGraph days={data.days} totalContributions={data.contributions} username={data.username} />
                <p className="text-[11px] text-muted mt-2">Data diambil dari GitHub API melalui backend</p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <GitBranch size={28} className="text-muted mb-3" />
                <p className="text-[13px] text-sub">Belum ada data kontribusi</p>
                <p className="text-[11px] text-muted mt-1">Sambungkan GitHub token di backend untuk menampilkan data</p>
              </div>
            )}
          </div>
        </div>

        <div className="admin-manager-side admin-github-side">
          <div className="card admin-side-card admin-preview-card admin-github-side-card">
            <div className="admin-section-heading"><div className="admin-section-line" /><h3>Keamanan & Setup</h3></div>
            <div className="admin-preview-shell">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-sub leading-relaxed"><strong className="text-tx">GITHUB_TOKEN tidak pernah disimpan di frontend.</strong> Token hanya dipakai backend dan frontend hanya menerima data olahan.</p>
              </div>
            </div>
            <div className="admin-info-list">
              {[
                { step: '01', text: 'Buat GitHub Personal Access Token di GitHub Settings > Developer settings' },
                { step: '02', text: 'Simpan token sebagai GITHUB_TOKEN di environment variable backend' },
                { step: '03', text: 'Backend menyediakan endpoint GET /api/github/contributions yang aman' },
                { step: '04', text: 'Frontend mengambil data dari endpoint tersebut tanpa menyentuh token' },
              ].map(s => (
                <div key={s.step} className="admin-info-row">
                  <div className="admin-info-label">{s.step}</div>
                  <div className="admin-info-value text-left">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
