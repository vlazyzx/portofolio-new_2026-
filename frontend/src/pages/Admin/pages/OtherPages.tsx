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
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-px bg-accent" />
          <h3 className="font-syne font-bold text-[15px]">Media Home</h3>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_1fr] gap-5 items-start">
          <InputField label="Nama di Home" value={home.name} onChange={e => set('name', e.target.value)} placeholder="Muhammad Ikhsan" />
          <ImageUploader label="Gambar Lanyard" value={home.lanyardImage} onChange={value => set('lanyardImage', value)} />
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
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-px bg-accent" />
          <h3 className="font-syne font-bold text-[15px]">Informasi Profil</h3>
        </div>
        <div className="flex flex-col gap-4">
          <ImageUploader label="Foto Profil" value={profile.avatar} onChange={v => set('avatar', v)} />
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
          <TextAreaField label="Bio Singkat" value={profile.bio}
            onChange={e => set('bio', e.target.value)} rows={3}
            placeholder="Cerita singkat tentang kamu..." />
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Profil</>}
          </button>
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
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* Bio */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Paragraf Bio</h3>
          </div>
          <button type="button" onClick={addBio} className="btn-link">
            <Plus size={13} /> Tambah
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {about.bioParagraphs.length === 0
            ? <p className="text-[13px] text-sub py-4 text-center">Belum ada paragraf. Klik "Tambah" untuk mulai.</p>
            : about.bioParagraphs.map((p, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={p} onChange={e => setBio(i, e.target.value)}
                  className="input-field resize-none flex-1" rows={3}
                  placeholder={`Paragraf ${i + 1}...`} />
                <button type="button" onClick={() => delBio(i)}
                  className="btn-icon-danger mt-1 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          }
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Timeline</h3>
          </div>
          <button type="button" onClick={addTl} className="btn-link">
            <Plus size={13} /> Tambah
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {about.timeline.map(tl => (
            <div key={tl.id} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-start">
              <input value={tl.year} onChange={e => setTl(tl.id, 'year', e.target.value)}
                className="input-field text-[12px]" placeholder="2024" />
              <div className="flex flex-col gap-1.5">
                <input value={tl.title} onChange={e => setTl(tl.id, 'title', e.target.value)}
                  className="input-field text-[12px]" placeholder="Judul..." />
                <input value={tl.description} onChange={e => setTl(tl.id, 'description', e.target.value)}
                  className="input-field text-[12px]" placeholder="Deskripsi..." />
              </div>
              <button type="button" onClick={() => delTl(tl.id)}
                className="btn-icon-danger mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {about.timeline.length === 0 && <p className="text-[13px] text-sub py-4 text-center">Belum ada timeline.</p>}
        </div>
      </div>

      {/* Skills */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Skill</h3>
          </div>
          <button type="button" onClick={addSkill} className="btn-link">
            <Plus size={13} /> Tambah
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {about.skills.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <input value={s.name} onChange={e => setSkill(s.id, 'name', e.target.value)}
                className="input-field flex-1 text-[12px]" placeholder="Nama skill..." />
              <input type="number" min="0" max="100" value={s.level}
                onChange={e => setSkill(s.id, 'level', +e.target.value)}
                className="input-field w-16 text-[12px] text-center" />
              <button type="button" onClick={() => delSkill(s.id)}
                className="btn-icon-danger">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {about.skills.length === 0 && <p className="text-[13px] text-sub py-4 text-center">Belum ada skill.</p>}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-px bg-accent" />
          <h3 className="font-syne font-bold text-[15px]">Nilai, Stack & Alat</h3>
        </div>
        <div className="flex flex-col gap-4">
          <TagInput label="Nilai" tags={about.values}
            onChange={v => setAbout(a => a ? { ...a, values: v } : a)} />
          <TagInput label="Stack Teknologi" tags={about.stack}
            onChange={v => setAbout(a => a ? { ...a, stack: v } : a)} />
          <TagInput label="Alat" tags={about.tools}
            onChange={v => setAbout(a => a ? { ...a, tools: v } : a)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Tentang</>}
        </button>
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
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-px bg-accent" />
          <h3 className="font-syne font-bold text-[15px]">Profil Student</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Periode" value={student.period} onChange={e => setStudent(s => s ? { ...s, period: e.target.value } : s)} placeholder="2022 - Sekarang" />
          <InputField label="Gelar / Jurusan" value={student.degree} onChange={e => setStudent(s => s ? { ...s, degree: e.target.value } : s)} placeholder="S1 Informatika" />
          <InputField label="Sekolah / Kampus" value={student.school} onChange={e => setStudent(s => s ? { ...s, school: e.target.value } : s)} placeholder="Nama kampus" />
          <InputField label="IPK" value={student.gpa} onChange={e => setStudent(s => s ? { ...s, gpa: e.target.value } : s)} placeholder="3.8" />
          <div className="sm:col-span-2">
            <InputField label="Label IPK" value={student.gpaLabel} onChange={e => setStudent(s => s ? { ...s, gpaLabel: e.target.value } : s)} placeholder="IPK Saat Ini" />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Deskripsi" value={student.description} onChange={e => setStudent(s => s ? { ...s, description: e.target.value } : s)} rows={4} placeholder="Deskripsi student..." />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><div className="w-4 h-px bg-accent" /><h3 className="font-syne font-bold text-[15px]">Pencapaian</h3></div>
          <button type="button" onClick={() => setStudent(s => s ? { ...s, achievements: [...s.achievements, { id: Date.now().toString(), code: '', title: '', note: '' }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
        </div>
        <div className="flex flex-col gap-3">
          {student.achievements.map(item => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-start">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><div className="w-4 h-px bg-accent" /><h3 className="font-syne font-bold text-[15px]">Mata Kuliah</h3></div>
          <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: [...s.courses, { id: Date.now().toString(), name: '', grade: '', highlight: false }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
        </div>
        <div className="flex flex-col gap-3">
          {student.courses.map(item => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-2 items-center">
              <input value={item.name} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, name: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Nama mata kuliah" />
              <input value={item.grade} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, grade: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="A" />
              <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, highlight: !entry.highlight } : entry) } : s)} className="btn-ghost">{item.highlight ? 'Highlight' : 'Normal'}</button>
              <div className="sm:col-span-3">
                <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.filter(entry => entry.id !== item.id) } : s)} className="btn-icon-danger"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Student</>}
        </button>
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
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-px bg-accent" />
          <h3 className="font-syne font-bold text-[15px]">Link Sosial</h3>
        </div>
        <div className="flex flex-col gap-3">
          {SOCIAL_FIELDS.map(f => {
            const val = links[f.key] || '';
            const invalid = val && !isValidUrl(val);
            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] text-sub uppercase tracking-[0.08em]
                                  flex items-center gap-2">
                  <span className="text-accent">{f.icon}</span>{f.label}
                </label>
                <input
                  value={val}
                  onChange={e => setLinks(l => l ? { ...l, [f.key]: e.target.value } : l)}
                  placeholder={f.placeholder}
                  className={`input-field ${invalid ? 'border-danger' : ''}`}
                />
                {invalid && <p className="text-[11px] text-danger">URL tidak valid</p>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Link</>}
          </button>
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
    getGithubContributions()
      .then(result => {
        setData(result);
        setError('');
      })
      .catch(err => {
        const message = errorMessage(err, 'Gagal memuat data GitHub.');
        setError(message);
        toast(message, 'error');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
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

      {/* Status */}
      <div className={`card border ${data?.connected ? 'border-ok/30 bg-ok/5' : 'border-warn/30 bg-warn/5'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                          ${data?.connected ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
            <GitBranch size={20} />
          </div>
          <div>
            <div className="font-syne font-bold text-[15px]">
              {data?.connected ? 'GitHub Terhubung' : 'GitHub Belum Terhubung'}
            </div>
            <div className="text-[12px] text-sub">
              {data?.connected ? `@${data.username}` : 'Sambungkan token di backend'}
            </div>
          </div>
          <div className={`ml-auto w-2.5 h-2.5 rounded-full ${data?.connected ? 'bg-ok' : 'bg-warn'}`} />
        </div>
      </div>

      {/* Security note */}
      <div className="card border-border">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-[13px] mb-1">Keamanan Token GitHub</div>
            <p className="text-[13px] text-sub leading-relaxed">
              <strong className="text-tx">GITHUB_TOKEN tidak pernah disimpan di frontend.</strong>{' '}
              Token hanya disimpan dan digunakan oleh backend. Frontend hanya menerima
              data kontribusi yang sudah diproses oleh backend.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card text-center py-6">
          <div className="font-syne font-extrabold text-[32px] text-accent tracking-tight">
            {data?.contributions ?? '—'}
          </div>
          <div className="font-mono text-[11px] text-sub uppercase tracking-wider mt-1">
            Total Kontribusi
          </div>
        </div>
        <div className="card text-center py-6">
          <div className="font-syne font-extrabold text-[20px] sm:text-[32px] tracking-tight">
            {data?.username ? `@${data.username}` : '—'}
          </div>
          <div className="font-mono text-[11px] text-sub uppercase tracking-wider mt-1">
            Username GitHub
          </div>
        </div>
      </div>

      {/* Contribution graph */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-px bg-accent" />
          <span className="font-mono text-[11px] text-accent uppercase tracking-wider">
            Grafik Kontribusi
          </span>
        </div>
        {data?.connected && data.days.length > 0 ? (
          <>
            <ContributionGraph days={data.days} totalContributions={data.contributions} username={data.username} />
            <p className="text-[11px] text-muted mt-1">Data diambil dari GitHub API melalui backend</p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <GitBranch size={28} className="text-muted mb-3" />
            <p className="text-[13px] text-sub">Belum ada data kontribusi</p>
            <p className="text-[11px] text-muted mt-1">Sambungkan GitHub token di backend untuk menampilkan data</p>
          </div>
        )}
      </div>

      {/* Setup guide */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-px bg-accent" />
          <span className="font-mono text-[11px] text-accent uppercase tracking-wider">Panduan Setup</span>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { step: '01', text: 'Buat GitHub Personal Access Token di GitHub Settings > Developer settings' },
            { step: '02', text: 'Simpan token sebagai GITHUB_TOKEN di environment variable backend (bukan .env frontend)' },
            { step: '03', text: 'Backend menyediakan endpoint GET /api/github/contributions yang aman' },
            { step: '04', text: 'Frontend mengambil data dari endpoint tersebut tanpa menyentuh token' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 py-2">
              <span className="font-mono text-[11px] text-accent flex-shrink-0">{s.step}</span>
              <p className="text-[13px] text-sub leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
