import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { User } from '../types';
import { login as apiLogin, logout as apiLogout, getStoredUser, getCurrentUser } from '../services/api';
import { useToast } from './toast';

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoutReasonRef = useRef<string | null>(null);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await apiLogin(email, password);
      localStorage.setItem('admin_user', JSON.stringify(user));
      localStorage.setItem('admin_last_active_at', String(Date.now()));
      setUser(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(reason?: string) {
    if (reason) logoutReasonRef.current = reason;
    await apiLogout();
    setUser(null);

    if (logoutReasonRef.current) {
      toast(logoutReasonRef.current, 'warning');
      logoutReasonRef.current = null;
    }
  }

  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
    const SESSION_CHECK_MS = 5 * 60 * 1000;

    const markActive = () => {
      localStorage.setItem('admin_last_active_at', String(Date.now()));
    };

    const checkIdle = () => {
      const lastActiveAt = Number(localStorage.getItem('admin_last_active_at') || '0');
      if (!lastActiveAt) return;
      if (Date.now() - lastActiveAt >= IDLE_TIMEOUT_MS) {
        void logout('Sesi admin berakhir karena tidak aktif.');
      }
    };

    const validateSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        localStorage.setItem('admin_user', JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        void logout('Sesi admin berakhir. Silakan login kembali.');
      }
    };

    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(eventName => window.addEventListener(eventName, markActive, { passive: true }));
    document.addEventListener('visibilitychange', markActive);
    markActive();

    const idleInterval = window.setInterval(checkIdle, 30 * 1000);
    const sessionInterval = window.setInterval(() => {
      void validateSession();
    }, SESSION_CHECK_MS);

    return () => {
      events.forEach(eventName => window.removeEventListener(eventName, markActive));
      document.removeEventListener('visibilitychange', markActive);
      window.clearInterval(idleInterval);
      window.clearInterval(sessionInterval);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout: () => { void logout(); } }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
