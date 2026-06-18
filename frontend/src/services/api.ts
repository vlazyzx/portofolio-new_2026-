import type {
  AboutContent,
  HomeContent,
  ProfileContent,
  SocialLinkItem,
  SocialLinksContent,
  StudentContent,
} from '../types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AUTH_TOKEN_KEY = 'ikh_admin_token';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

function unwrapApiData<T>(payload: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (options.auth) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.hint || data?.detail;
    const message = data?.message ?? 'Request backend gagal.';
    throw new Error(detail ? `${message} ${detail}` : message);
  }

  return unwrapApiData(data as T);
}

function parseGithubContributions(raw: unknown): GithubContributionsResponse {
  const payload = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const user = payload.user && typeof payload.user === 'object' ? payload.user as Record<string, unknown> : {};
  const username = String(user.login || payload.login || '');
  const days = Array.isArray(payload.days)
    ? payload.days.map(day => {
      const item = day && typeof day === 'object' ? day as Record<string, unknown> : {};
      return {
        date: String(item.date || ''),
        count: Number(item.count || item.contributionCount || 0),
        color: String(item.color || '#1f2937')
      };
    }).filter(day => day.date)
    : [];

  return {
    username,
    contributions: Number(payload.totalContributions || payload.contributions || 0),
    connected: (payload.status === 'success' || Boolean(payload.fallback) || Boolean(payload.isConnected)) && Boolean(username),
    days
  };
}

function normalizeProfile(raw: unknown): ProfileContent {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const availability = String(item.availability || '').toLowerCase();
  const workStatus = item.workStatus === 'busy' || availability === 'busy'
    ? 'busy'
    : item.workStatus === 'closed' || availability === 'closed'
      ? 'closed'
      : 'open';

  return {
    name: String(item.name || item.fullName || ''),
    role: String(item.role || ''),
    location: String(item.location || ''),
    workStatus,
    bio: String(item.bio || ''),
    avatar: String(item.avatar || item.avatarUrl || '')
  };
}

function normalizeAbout(raw: unknown): AboutContent {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const legacyBio = [item.bioParagraph1, item.bioParagraph2, item.bioParagraph3].filter(Boolean).map(String);

  return {
    bioParagraphs: Array.isArray(item.bioParagraphs) ? item.bioParagraphs.map(String) : legacyBio,
    timeline: Array.isArray(item.timeline)
      ? item.timeline.map((entry, index) => {
        const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
        return {
          id: String(value.id || `timeline-${index}`),
          year: String(value.year || ''),
          title: String(value.title || ''),
          description: String(value.description || value.note || '')
        };
      })
      : [],
    skills: Array.isArray(item.skills)
      ? item.skills.map((entry, index) => {
        const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
        return {
          id: String(value.id || `skill-${index}`),
          name: String(value.name || ''),
          level: Number(value.level || value.value || 0)
        };
      })
      : [],
    values: Array.isArray(item.values) ? item.values.map(String) : [],
    stack: Array.isArray(item.stack) ? item.stack.map(String) : [],
    tools: Array.isArray(item.tools) ? item.tools.map(String) : []
  };
}

function normalizeHome(raw: unknown): HomeContent {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const rawStats = item.stats && typeof item.stats === 'object' ? item.stats as Record<string, unknown> : {};
  const normalizeStat = (
    key: HomeContent['stats'][keyof HomeContent['stats']]['id'],
    fallbackLabel: string
  ): HomeContent['stats'][keyof HomeContent['stats']] => {
    const value = rawStats[key] && typeof rawStats[key] === 'object' ? rawStats[key] as Record<string, unknown> : {};
    return {
      id: key,
      value: String(value.value || ''),
      label: String(value.label || fallbackLabel),
      progress: Number(value.progress || 0)
    };
  };

  return {
    name: String(item.name || ''),
    eyebrow: String(item.eyebrow || ''),
    heroDescription: String(item.heroDescription || ''),
    badgeSubtitle: String(item.badgeSubtitle || ''),
    lanyardImage: String(item.lanyardImage || ''),
    stats: {
      completedProjects: normalizeStat('completedProjects', 'Proyek selesai'),
      mainStack: normalizeStat('mainStack', 'Stack utama'),
      learningYears: normalizeStat('learningYears', 'Tahun belajar'),
      gpa: normalizeStat('gpa', 'IPK saat ini')
    },
    cards: Array.isArray(item.cards)
      ? item.cards.map((entry, index) => {
        const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
        return {
          id: String(value.id || `card-${index}`),
          page: String(value.page || 'projects') as HomeContent['cards'][number]['page'],
          tag: String(value.tag || ''),
          title: String(value.title || ''),
          desc: String(value.desc || ''),
          meta: String(value.meta || '')
        };
      })
      : []
  };
}

function normalizeStudent(raw: unknown): StudentContent {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    period: String(item.period || ''),
    degree: String(item.degree || ''),
    school: String(item.school || item.campus || ''),
    description: String(item.description || ''),
    gpa: String(item.gpa || ''),
    gpaLabel: String(item.gpaLabel || ''),
    achievements: Array.isArray(item.achievements)
      ? item.achievements.map((entry, index) => {
        const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
        return {
          id: String(value.id || `achievement-${index}`),
          code: String(value.code || ''),
          title: String(value.title || ''),
          note: String(value.note || value.description || '')
        };
      })
      : [],
    courses: Array.isArray(item.courses)
      ? item.courses.map((entry, index) => {
        const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
        return {
          id: String(value.id || `course-${index}`),
          name: String(value.name || ''),
          grade: String(value.grade || ''),
          highlight: Boolean(value.highlight)
        };
      })
      : []
  };
}

function normalizeSocialLinks(raw: unknown): SocialLinksContent {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    github: String(item.github || ''),
    instagram: String(item.instagram || ''),
    tiktok: String(item.tiktok || item.twitter || ''),
    discord: String(item.discord || ''),
    roblox: String(item.roblox || ''),
    linkedin: String(item.linkedin || ''),
    resume: String(item.resume || item.personalSite || '')
  };
}

function buildSocialLinks(links: SocialLinksContent): SocialLinkItem[] {
  return [
    { id: 'discord', brand: 'discord', title: 'Discord', subtitle: 'Komunitas dan chat', href: links.discord },
    { id: 'roblox', brand: 'roblox', title: 'Roblox', subtitle: 'Profil dan game', href: links.roblox },
    { id: 'instagram', brand: 'instagram', title: 'Instagram', subtitle: 'Update harian', href: links.instagram },
    { id: 'tiktok', brand: 'tiktok', title: 'TikTok', subtitle: 'Video singkat', href: links.tiktok },
    { id: 'github', brand: 'github', title: 'GitHub', subtitle: 'Kode sumber dan eksperimen', href: links.github },
    { id: 'linkedin', brand: 'work', title: 'LinkedIn', subtitle: 'Profil profesional', href: links.linkedin }
  ].filter(link => link.href);
}

export type ContactMessagePayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export type ProjectPayload = {
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  stack?: string[];
  techStack?: string[];
  images?: string[];
  liveUrl?: string;
  githubUrl?: string;
  repoUrl?: string;
  demoUrl?: string;
  featured?: boolean;
  isFeatured?: boolean;
  status?: 'draft' | 'published';
};

export interface GithubContributionDay {
  date: string;
  count: number;
  color: string;
}

export interface GithubContributionsResponse {
  username: string;
  contributions: number;
  connected: boolean;
  days: GithubContributionDay[];
}

export const authStorage = {
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(AUTH_TOKEN_KEY)
};

export const api = {
  health: () => apiRequest('/api/health'),
  login: (payload: AdminLoginPayload) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: payload
    }),
  me: () => apiRequest('/api/auth/me', { auth: true }),
  getDashboardStats: () => apiRequest('/api/dashboard/stats', { auth: true }),
  getHome: async () => normalizeHome(await apiRequest('/api/home')),
  getProjects: () => apiRequest('/api/projects'),
  getProject: (projectId: string) => apiRequest(`/api/projects/${projectId}`),
  createProject: (payload: ProjectPayload) =>
    apiRequest('/api/projects', {
      method: 'POST',
      body: payload,
      auth: true
    }),
  updateProject: (projectId: string, payload: Partial<ProjectPayload>) =>
    apiRequest(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: payload,
      auth: true
    }),
  deleteProject: (projectId: string) =>
    apiRequest(`/api/projects/${projectId}`, {
      method: 'DELETE',
      auth: true
    }),
  getProfile: async () => normalizeProfile(await apiRequest('/api/profile')),
  updateProfile: (payload: unknown) =>
    apiRequest('/api/profile', {
      method: 'PATCH',
      body: payload,
      auth: true
    }),
  getAbout: async () => normalizeAbout(await apiRequest('/api/about')),
  updateAbout: (payload: unknown) =>
    apiRequest('/api/about', {
      method: 'PATCH',
      body: payload,
      auth: true
    }),
  getStudent: async () => normalizeStudent(await apiRequest('/api/student')),
  getSocialLinks: async () => normalizeSocialLinks(await apiRequest('/api/social-links')),
  updateSocialLinks: (payload: unknown) =>
    apiRequest('/api/social-links', {
      method: 'PATCH',
      body: payload,
      auth: true
    }),
  getContactMessages: () => apiRequest('/api/contact/messages', { auth: true }),
  markContactMessageRead: (messageId: string) =>
    apiRequest(`/api/contact/messages/${messageId}/read`, {
      method: 'PATCH',
      auth: true
    }),
  deleteContactMessage: (messageId: string) =>
    apiRequest(`/api/contact/messages/${messageId}`, {
      method: 'DELETE',
      auth: true
    }),
  getGithubContributions: async () => parseGithubContributions(await apiRequest('/api/github/contributions')),
  getSocialLinkItems: async () => buildSocialLinks(await api.getSocialLinks()),
  sendContactMessage: (payload: ContactMessagePayload) =>
    apiRequest('/api/contact/messages', {
      method: 'POST',
      body: payload
    })
};
