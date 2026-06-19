import type {
  About,
  ContactMessage,
  DashboardStats,
  HomeContent,
  Profile,
  Project,
  SocialLinks,
  StudentContent,
  User,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  detail?: string;
  data?: T;
  token?: string;
  user?: User;
};

type AnyRecord = Record<string, unknown>;

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

function apiMessage(body: unknown, defaultMessage: string): string {
  if (!isRecord(body)) return defaultMessage;
  const message = String(body.message || defaultMessage);
  const hint = body.hint ? String(body.hint) : '';
  return hint ? `${message} ${hint}` : message;
}

async function requestBody<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(body, `Request gagal (${res.status})`));
  }

  return body as T;
}

async function requestData<T>(path: string, options: RequestInit = {}): Promise<T> {
  const body = await requestBody<ApiEnvelope<T> | T>(path, options);
  if (isRecord(body) && 'data' in body) return body.data as T;
  return body as T;
}

function errorMessage(error: unknown, defaultMessage: string): string {
  return error instanceof Error ? error.message : defaultMessage;
}

function normalizeCategory(value: unknown): Project['category'] {
  const category = String(value || '').toLowerCase();
  if (category === 'web') return 'Web';
  if (category === 'game') return 'Game';
  if (category === 'server') return 'Server';
  return 'Other';
}

function normalizeStatus(value: unknown): Project['status'] {
  const status = String(value || '').toLowerCase();
  if (status === 'published' || status === 'draft' || status === 'archived') return status;
  return 'draft';
}

function normalizeProject(raw: unknown): Project {
  const item = isRecord(raw) ? raw : {};
  const stack = Array.isArray(item.stack)
    ? item.stack
    : Array.isArray(item.techStack)
      ? item.techStack
      : [];

  return {
    id: String(item.id || item._id || ''),
    title: String(item.title || ''),
    slug: String(item.slug || ''),
    description: String(item.description || ''),
    longDescription: String(item.longDescription || ''),
    category: normalizeCategory(item.category),
    stack: stack.map(String),
    images: Array.isArray(item.images) ? item.images.map(String) : [],
    liveUrl: String(item.liveUrl || item.demoUrl || ''),
    githubUrl: String(item.githubUrl || item.repoUrl || ''),
    featured: Boolean(item.featured ?? item.isFeatured),
    status: normalizeStatus(item.status),
    createdAt: String(item.createdAt || ''),
    updatedAt: String(item.updatedAt || ''),
  };
}

function normalizeHome(raw: unknown): HomeContent {
  const item = isRecord(raw) ? raw : {};
  const rawStats = isRecord(item.stats) ? item.stats : {};
  const normalizeStat = (
    key: HomeContent['stats'][keyof HomeContent['stats']]['id'],
    fallbackLabel: string,
  ): HomeContent['stats'][keyof HomeContent['stats']] => {
    const value = isRecord(rawStats[key]) ? rawStats[key] : {};
    return {
      id: key,
      value: String(value.value || ''),
      label: String(value.label || fallbackLabel),
      progress: Number(value.progress || 0),
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
      gpa: normalizeStat('gpa', 'IPK saat ini'),
    },
    cards: Array.isArray(item.cards)
      ? item.cards.map((card, index) => {
        const value = isRecord(card) ? card : {};
        return {
          id: String(value.id || `card-${index}`),
          page: String(value.page || 'projects') as HomeContent['cards'][number]['page'],
          tag: String(value.tag || ''),
          title: String(value.title || ''),
          desc: String(value.desc || ''),
          meta: String(value.meta || ''),
        };
      })
      : [],
  };
}

function normalizeProfile(raw: unknown): Profile {
  const item = isRecord(raw) ? raw : {};
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
    avatar: String(item.avatar || item.avatarUrl || ''),
  };
}

function normalizeAbout(raw: unknown): About {
  const item = isRecord(raw) ? raw : {};
  const legacyBio = [item.bioParagraph1, item.bioParagraph2, item.bioParagraph3]
    .filter(Boolean)
    .map(String);

  return {
    bioParagraphs: Array.isArray(item.bioParagraphs) ? item.bioParagraphs.map(String) : legacyBio,
    timeline: Array.isArray(item.timeline) ? item.timeline as About['timeline'] : [],
    skills: Array.isArray(item.skills) ? item.skills as About['skills'] : [],
    values: Array.isArray(item.values)
      ? item.values.map(String)
      : Array.isArray(item.coreValues)
        ? item.coreValues.map(String)
        : [],
    stack: Array.isArray(item.stack)
      ? item.stack.map(String)
      : Array.isArray(item.coreStack)
        ? item.coreStack.map(String)
        : [],
    tools: Array.isArray(item.tools)
      ? item.tools.map(String)
      : String(item.toolsAndSkills || '')
        .split(',')
        .map(tool => tool.trim())
        .filter(Boolean),
  };
}

function normalizeStudent(raw: unknown): StudentContent {
  const item = isRecord(raw) ? raw : {};
  return {
    period: String(item.period || ''),
    degree: String(item.degree || ''),
    school: String(item.school || item.campus || ''),
    description: String(item.description || ''),
    gpa: String(item.gpa || ''),
    gpaLabel: String(item.gpaLabel || ''),
    achievements: Array.isArray(item.achievements)
      ? item.achievements.map((achievement, index) => {
        const value = isRecord(achievement) ? achievement : {};
        return {
          id: String(value.id || `achievement-${index}`),
          code: String(value.code || ''),
          title: String(value.title || ''),
          note: String(value.note || value.description || ''),
        };
      })
      : [],
    courses: Array.isArray(item.courses)
      ? item.courses.map((course, index) => {
        const value = isRecord(course) ? course : {};
        return {
          id: String(value.id || `course-${index}`),
          name: String(value.name || ''),
          grade: String(value.grade || ''),
          highlight: Boolean(value.highlight),
        };
      })
      : [],
  };
}

function normalizeSocialLinks(raw: unknown): SocialLinks {
  const item = isRecord(raw) ? raw : {};
  return {
    github: String(item.github || ''),
    instagram: String(item.instagram || ''),
    tiktok: String(item.tiktok || item.twitter || ''),
    discord: String(item.discord || ''),
    roblox: String(item.roblox || ''),
    linkedin: String(item.linkedin || ''),
    resume: String(item.resume || item.personalSite || ''),
  };
}

function normalizeContactMessage(raw: unknown): ContactMessage {
  const item = isRecord(raw) ? raw : {};
  const hasRead = typeof item.read === 'boolean';
  const hasUnread = typeof item.isUnread === 'boolean';

  return {
    id: String(item.id || item._id || ''),
    name: String(item.name || item.sender || ''),
    email: String(item.email || ''),
    subject: String(item.subject || ''),
    message: String(item.message || item.content || ''),
    read: hasRead ? Boolean(item.read) : hasUnread ? !item.isUnread : false,
    createdAt: String(item.createdAt || item.timestamp || ''),
  };
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const data = await requestBody<ApiEnvelope<never> & { token?: string; user?: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!data.token || !data.user) {
    throw new Error('Response login backend tidak lengkap.');
  }

  localStorage.setItem('admin_token', data.token);
  localStorage.setItem('admin_user', JSON.stringify(data.user));
  localStorage.setItem('admin_last_active_at', String(Date.now()));
  return { token: data.token, user: data.user };
}

export async function logout(): Promise<void> {
  const token = getToken();

  try {
    if (token) {
      await requestBody('/auth/logout', {
        method: 'POST',
      });
    }
  } catch {
    // noop
  } finally {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_last_active_at');
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('admin_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    return null;
  }
}

export async function getCurrentUser(): Promise<User> {
  const data = await requestBody<ApiEnvelope<never> & { user?: User }>('/auth/me');
  if (!data.user) throw new Error('Sesi admin tidak valid.');
  return data.user;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const raw = await requestData<DashboardStats & { githubConnected?: boolean }>('/dashboard/stats');
  return {
    totalProjects: Number(raw.totalProjects || 0),
    totalMessages: Number(raw.totalMessages || 0),
    unreadMessages: Number(raw.unreadMessages || 0),
    githubStatus: raw.githubStatus || (raw.githubConnected ? 'connected' : 'disconnected'),
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
  };
}

export async function getProjects(): Promise<Project[]> {
  const projects = await requestData<unknown[]>('/projects');
  return Array.isArray(projects) ? projects.map(normalizeProject) : [];
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const project = await requestData<unknown>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return normalizeProject(project);
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const project = await requestData<unknown>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return normalizeProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  await requestBody(`/projects/${id}`, { method: 'DELETE' });
}

export async function getHome(): Promise<HomeContent> {
  return normalizeHome(await requestData<unknown>('/home'));
}

export async function updateHome(data: Partial<HomeContent>): Promise<HomeContent> {
  return normalizeHome(await requestData<unknown>('/home', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }));
}

export async function getProfile(): Promise<Profile> {
  return normalizeProfile(await requestData<unknown>('/profile'));
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return normalizeProfile(await requestData<unknown>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }));
}

export async function getAbout(): Promise<About> {
  return normalizeAbout(await requestData<unknown>('/about'));
}

export async function updateAbout(data: Partial<About>): Promise<About> {
  return normalizeAbout(await requestData<unknown>('/about', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }));
}

export async function getStudent(): Promise<StudentContent> {
  return normalizeStudent(await requestData<unknown>('/student'));
}

export async function updateStudent(data: Partial<StudentContent>): Promise<StudentContent> {
  return normalizeStudent(await requestData<unknown>('/student', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }));
}

export async function getSocialLinks(): Promise<SocialLinks> {
  return normalizeSocialLinks(await requestData<unknown>('/social-links'));
}

export async function updateSocialLinks(data: Partial<SocialLinks>): Promise<SocialLinks> {
  return normalizeSocialLinks(await requestData<unknown>('/social-links', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }));
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const messages = await requestData<unknown[]>('/contact/messages');
  return Array.isArray(messages) ? messages.map(normalizeContactMessage) : [];
}

export async function markContactMessageRead(id: string): Promise<void> {
  await requestBody(`/contact/messages/${id}/read`, { method: 'PATCH' });
}

export async function deleteContactMessage(id: string): Promise<void> {
  await requestBody(`/contact/messages/${id}`, { method: 'DELETE' });
}

export interface GithubContributionDay {
  date: string;
  count: number;
  color: string;
}

export async function getGithubContributions(): Promise<{
  username: string;
  contributions: number;
  connected: boolean;
  days: GithubContributionDay[];
}> {
  const raw = await requestBody<AnyRecord>('/github/contributions');
  const user = isRecord(raw.user) ? raw.user : {};
  const username = String(user.login || raw.login || '');
  const days = Array.isArray(raw.days)
    ? raw.days.map(day => {
      const item = isRecord(day) ? day : {};
      return {
        date: String(item.date || ''),
        count: Number(item.count || item.contributionCount || 0),
        color: String(item.color || '#1f2937'),
      };
    }).filter(day => day.date)
    : [];

  return {
    username,
    contributions: Number(raw.totalContributions || raw.contributions || 0),
    connected: raw.status === 'success' && Boolean(username),
    days,
  };
}

export { errorMessage };
