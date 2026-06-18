import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, ExternalLink, GitBranch, Star } from 'lucide-react';
import {
  Modal, ConfirmDialog, EmptyState, LoadingState,
  InputField, TextAreaField, SelectField, TagInput, ImageUploader, Spinner
} from '../components/ui';
import { createProject, deleteProject, errorMessage, getProjects, updateProject } from '../services/api';
import { useToast } from '../store/toast';
import type { Project } from '../types';

const CATEGORIES = [
  { value: 'Web', label: 'Web' },
  { value: 'Game', label: 'Game' },
  { value: 'Server', label: 'Server' },
  { value: 'Other', label: 'Lainnya' },
];
const STATUSES = [
  { value: 'published', label: 'Terbit' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Arsip' },
];

const EMPTY_FORM: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '', slug: '', description: '', longDescription: '',
  category: 'Web', stack: [], images: [], liveUrl: '',
  githubUrl: '', featured: false, status: 'draft',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'text-ok bg-ok/10 border-ok/20',
  draft:     'text-warn bg-warn/10 border-warn/20',
  archived:  'text-sub bg-elevated border-border',
};
const STATUS_LABELS: Record<string, string> = {
  published: 'Terbit',
  draft: 'Draft',
  archived: 'Arsip',
};

export function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(err => toast(errorMessage(err, 'Gagal memuat project.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  }), [projects, search, filterCat]);

  function openCreate() {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  }
  function openEdit(p: Project) {
    setEditTarget(p);
    const { id, createdAt, updatedAt, ...rest } = p;
    setFormData(rest);
    setModalOpen(true);
  }
  function set(key: keyof typeof formData, value: unknown) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!formData.title.trim()) { toast('Judul project wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateProject(editTarget.id, formData);
        setProjects(prev => prev.map(p => p.id === editTarget.id ? updated : p));
        toast('Project berhasil diperbarui');
      } else {
        const created = await createProject(formData);
        setProjects(prev => [created, ...prev]);
        toast('Project berhasil ditambahkan');
      }
      window.dispatchEvent(new Event('projects-updated'));
      setModalOpen(false);
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan project.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      window.dispatchEvent(new Event('projects-updated'));
      toast('Project dihapus');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menghapus project.'), 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub" />
            <input
              id="project-search"
              name="projectSearch"
              aria-label="Cari project"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari project..."
              className="input-field pl-11 min-h-12"
            />
          </div>

          {/* Chips */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'Web', 'Game', 'Server', 'Other'].map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`btn-chip flex-shrink-0
                            ${filterCat === cat
                              ? 'bg-accent text-white border-accent shadow-[0_10px_24px_rgba(255,122,53,0.18)]'
                              : 'text-sub border-white/10 bg-white/5 hover:border-accent/30 hover:text-tx hover:bg-elevated'}`}
              >
                {cat === 'all' ? 'Semua' : cat === 'Other' ? 'Lainnya' : cat}
              </button>
            ))}
          </div>

          {/* Button */}
          <button type="button" onClick={openCreate} className="btn-primary w-full min-h-13">
            <Plus size={16} />
            <span>Tambah Project</span>
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-sub">
          {filtered.length} project
          {filterCat !== 'all' && ` - ${filterCat === 'Other' ? 'Lainnya' : filterCat}`}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search || filterCat !== 'all' ? 'Tidak ada project ditemukan' : 'Belum ada project'}
          description={search || filterCat !== 'all'
            ? 'Coba ubah filter atau kata kunci pencarian'
            : 'Tambah project pertama kamu dengan klik tombol di atas'}
          action={<button type="button" onClick={openCreate} className="btn-primary"><Plus size={14} />Tambah Project</button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <div key={p.id}
                 className="rounded-2xl border border-white/10 bg-surface/80 p-4 sm:p-5
                            flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Thumb */}
              <div className="w-full sm:w-24 h-24 sm:h-16 rounded-xl overflow-hidden bg-elevated
                              flex items-center justify-center flex-shrink-0 border border-white/10">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  : <span className="font-syne font-black text-[22px] text-muted">
                      {p.title.charAt(0)}
                    </span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-[14px] text-tx truncate">{p.title}</span>
                  {p.featured && <Star size={12} className="text-warn fill-warn flex-shrink-0" />}
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                  <span className="font-mono text-[10px] text-sub bg-elevated border border-border px-1.5 py-0.5 rounded">
                    {p.category === 'Other' ? 'Lainnya' : p.category}
                  </span>
                </div>
                <p className="text-[12px] text-sub line-clamp-1 mb-2">{p.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {p.stack.slice(0, 4).map(s => <span key={s} className="stag">{s}</span>)}
                  {p.stack.length > 4 && <span className="stag">+{p.stack.length - 4}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-3 border-t border-white/[0.06] sm:border-0 sm:pt-0">
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                  >
                    <GitBranch size={15} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="btn-icon hover:text-accent hover:border-accent/30"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(p)}
                  className="btn-icon-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Project' : 'Tambah Project Baru'}
        size="xl"
      >
        {/* Section: Info Dasar */}
        <div className="mb-5 p-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] text-accent uppercase tracking-wider font-semibold">Info Dasar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Judul *" value={formData.title}
              onChange={e => { set('title', e.target.value); set('slug', e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')); }}
              placeholder="Project keren saya" />
            <InputField label="Slug" value={formData.slug}
              onChange={e => set('slug', e.target.value)} placeholder="my-awesome-project" />
            <div className="sm:col-span-2">
              <TextAreaField label="Deskripsi Singkat" value={formData.description}
                onChange={e => set('description', e.target.value)} rows={2}
                placeholder="Deskripsi singkat project..." />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Deskripsi Lengkap" value={formData.longDescription}
                onChange={e => set('longDescription', e.target.value)} rows={3}
                placeholder="Penjelasan detail tentang project ini..." />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-5" />

        {/* Section: Link & Media */}
        <div className="mb-5 p-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] text-accent uppercase tracking-wider font-semibold">Link & Media</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Link Live" value={formData.liveUrl}
              onChange={e => set('liveUrl', e.target.value)} placeholder="https://..." />
            <InputField label="GitHub URL" value={formData.githubUrl}
              onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." />
            <div className="sm:col-span-2">
              <TagInput label="Stack Teknologi" tags={formData.stack}
                onChange={tags => set('stack', tags)} placeholder="React, TypeScript, ..." />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader label="Gambar Sampul" value={formData.images?.[0] || ''}
                onChange={url => set('images', url ? [url] : [])} maxWidth={1200} quality={0.78} />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-5" />

        {/* Section: Pengaturan */}
        <div className="mb-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] text-accent uppercase tracking-wider font-semibold">Pengaturan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Kategori" value={formData.category}
              onChange={e => set('category', e.target.value as Project['category'])}
              options={CATEGORIES} />
            <SelectField label="Status" value={formData.status}
              onChange={e => set('status', e.target.value as Project['status'])}
              options={STATUSES} />
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <input type="checkbox" id="featured" checked={formData.featured}
                onChange={e => set('featured', e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer" />
              <label htmlFor="featured" className="text-[13px] text-tx cursor-pointer">
                Tandai sebagai project unggulan
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-surface border-t border-white/[0.06] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost w-full sm:w-auto">Batal</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? <><Spinner size={14} /> Menyimpan...</> : (editTarget ? 'Perbarui Project' : 'Tambah Project')}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Project?"
        message={`Project "${deleteTarget?.title}" akan dihapus secara permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        danger
        loading={deleting}
      />
    </div>
  );
}
