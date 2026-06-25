import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { TagInput, LoadingState, Spinner } from '../components/ui';
import { errorMessage, getAbout, updateAbout } from '../services/api';
import { useToast } from '../store/toast';
import type { About, TimelineItem, SkillItem } from '../types';

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
