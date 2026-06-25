import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { InputField, TextAreaField, SelectField, ImageUploader, LoadingState, Spinner } from '../components/ui';
import { errorMessage, getProfile, updateProfile, uploadProfileAvatar } from '../services/api';
import { useToast } from '../store/toast';
import type { Profile } from '../types';

export function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
      let nextProfile = profile;
      if (avatarFile) {
        nextProfile = await uploadProfileAvatar(avatarFile);
      }
      const updated = await updateProfile(nextProfile);
      setProfile(updated);
      setAvatarFile(null);
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
                <ImageUploader label="Foto Profil" value={profile.avatar} onChange={v => set('avatar', Array.isArray(v) ? v[0] || '' : v)} onFilesChange={files => setAvatarFile(files instanceof File ? files : null)} fileOnly />
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
