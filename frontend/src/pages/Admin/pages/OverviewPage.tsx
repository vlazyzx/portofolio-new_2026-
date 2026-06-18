import { useEffect, useState } from 'react';
import { AlertCircle, Clock, FolderKanban, GitBranch, MessageSquare, TrendingUp } from 'lucide-react';
import { LoadingState, StatCard } from '../components/ui';
import { getDashboardStats, getProfile } from '../services/api';
import type { DashboardStats } from '../types';

export function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profileName, setProfileName] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadStats() {
    setLoading(true);
    setError('');
    Promise.all([
      getDashboardStats(),
      getProfile().catch(() => null),
    ])
      .then(([dashboardStats, profile]) => {
        setStats(dashboardStats);
        setProfileName(profile?.name?.trim() || 'Admin');
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat statistik.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="card border-danger/30 bg-danger/5 max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-danger mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-syne font-bold text-[16px] mb-1">Dashboard belum bisa memuat data</h2>
            <p className="text-[13px] text-sub leading-relaxed mb-4">{error}</p>
            <button type="button" onClick={loadStats} className="btn-primary">Coba Lagi</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="admin-hero">
        <div className="admin-hero-glow" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="tag">Ringkasan</span>
          </div>
          <h2 className="admin-hero-title mb-2">
            Selamat datang kembali, <span className="text-accent">{profileName}</span>
          </h2>
          <p className="admin-hero-desc">
            Kontrol seluruh isi portfolio dari satu tempat. Berikut ringkasan terbaru dari data project, pesan, dan integrasi backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Project"
          value={stats?.totalProjects ?? 0}
          icon={<FolderKanban size={18} />}
          trend="Semua data"
          color="text-accent"
        />
        <StatCard
          label="Total Pesan"
          value={stats?.totalMessages ?? 0}
          icon={<MessageSquare size={18} />}
          trend={stats?.unreadMessages ? `${stats.unreadMessages} belum dibaca` : 'Semua dibaca'}
          color="text-ok"
        />
        <StatCard
          label="GitHub"
          value={stats?.githubStatus === 'connected' ? 'Terhubung' : 'Terputus'}
          icon={<GitBranch size={18} />}
          color={stats?.githubStatus === 'connected' ? 'text-ok' : 'text-sub'}
        />
        <StatCard
          label="Update Terakhir"
          value={stats?.lastUpdated
            ? new Date(stats.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-'}
          icon={<Clock size={18} />}
          color="text-warn"
        />
      </div>

      <section>
        <div className="admin-section-label">
          <span className="admin-section-title">Akses Cepat</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Kelola Project', icon: <FolderKanban size={20} />, desc: 'Tambah, edit, dan atur project terbaru.', color: 'text-accent' },
            { label: 'Pesan Masuk', icon: <MessageSquare size={20} />, desc: `${stats?.unreadMessages ?? 0} pesan baru menunggu diperiksa.`, color: 'text-ok' },
            { label: 'Edit Profil', icon: <TrendingUp size={20} />, desc: 'Perbarui info profil, bio, dan status kerja.', color: 'text-warn' },
            { label: 'Integrasi GitHub', icon: <GitBranch size={20} />, desc: 'Cek koneksi repo dan status token backend.', color: 'text-[#9ca3af]' },
          ].map(item => (
            <div
              key={item.label}
              className="admin-quick-card"
            >
              <div className={`admin-quick-card-icon mb-4 ${item.color}`}>
                {item.icon}
              </div>
              <div className="text-[14px] font-semibold text-tx mb-1.5">{item.label}</div>
              <div className="text-[12px] text-sub leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="admin-section-label">
          <span className="admin-section-title">Status Sistem</span>
        </div>
        <div className="card p-0 overflow-hidden">
          {[
            { label: 'API Backend', status: stats ? 'ok' : 'warn', hint: stats ? 'Endpoint dashboard merespons' : 'Belum terhubung ke backend' },
            { label: 'Database', status: stats ? 'ok' : 'warn', hint: stats ? 'Statistik berhasil dimuat' : 'Belum bisa mengambil data' },
            {
              label: 'GitHub API',
              status: stats?.githubStatus === 'connected' ? 'ok' : 'warn',
              hint: stats?.githubStatus === 'connected' ? 'Token GitHub aktif' : 'Token GitHub belum aktif',
            },
            { label: 'Frontend', status: 'ok', hint: 'Dashboard berjalan normal' },
          ].map((s, i, arr) => (
            <div key={s.label} className={`flex items-center gap-3 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
              <div
                className={`admin-status-dot ${s.status === 'ok' ? 'text-ok bg-ok' : 'text-warn bg-warn'}`}
              />
              <span className="text-[13px] font-semibold text-tx w-32 flex-shrink-0">{s.label}</span>
              <span className="text-[12px] text-sub flex-1">{s.hint}</span>
              <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border
                ${s.status === 'ok'
                  ? 'text-ok bg-ok/10 border-ok/20'
                  : 'text-warn bg-warn/10 border-warn/20'
                }`}>
                {s.status === 'ok' ? 'OK' : 'WARN'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
