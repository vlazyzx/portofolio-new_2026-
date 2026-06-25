import { useEffect, useState } from 'react';
import { GitBranch, Info } from 'lucide-react';
import ContributionGraph from '../../../components/ContributionGraph';
import { LoadingState } from '../components/ui';
import { errorMessage, getGithubContributions } from '../services/api';
import { useToast } from '../store/toast';

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
