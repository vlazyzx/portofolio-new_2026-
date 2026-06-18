import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Spinner } from '../components/ui';
import { useAuth } from '../store/auth';

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      onSuccess();
    } catch {
      // Error message is stored in auth context.
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,122,53,0.3), transparent 70%)' }}
        />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(100,120,255,0.4), transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-[400px] anim-scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-[0_16px_40px_rgba(255,122,53,0.35)]">
              <span className="font-syne font-black text-[20px] text-void">I</span>
            </div>
            <span className="font-syne font-extrabold text-[28px] tracking-tight">
              IKH<span className="text-accent">.</span>
            </span>
          </div>
          <p className="text-[14px] text-sub">Masuk ke admin dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
          {/* Header accent line */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent rounded-full" />

          <h2 className="font-syne font-bold text-[18px] mb-1">Masuk Admin</h2>
          <p className="text-[13px] text-sub mb-6">Masukkan credential untuk mengakses dashboard</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-danger/10 border border-danger/20 rounded-xl p-3.5 mb-5 text-[13px] text-danger anim-fade-up">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-email" className="font-mono text-[11px] text-sub uppercase tracking-[0.08em]">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  autoFocus
                  className="input-field pl-10 min-h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="font-mono text-[11px] text-sub uppercase tracking-[0.08em]">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="input-field pl-10 pr-11 min-h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-tx p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="btn-primary w-full min-h-12 mt-2"
            >
              {isLoading ? <><Spinner size={15} /> Masuk...</> : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-muted font-mono">
            Panel Admin Portfolio &mdash; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
