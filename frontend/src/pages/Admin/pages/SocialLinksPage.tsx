import { useEffect, useState } from 'react';
import { Save, GitBranch, Globe, Music2, MessageCircle, Gamepad2, Share2, FileText } from 'lucide-react';
import { LoadingState, Spinner } from '../components/ui';
import { errorMessage, getSocialLinks, updateSocialLinks } from '../services/api';
import { useToast } from '../store/toast';
import type { SocialLinks } from '../types';

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
