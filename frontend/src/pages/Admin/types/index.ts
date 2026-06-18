export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: 'Web' | 'Game' | 'Server' | 'Other';
  stack: string[];
  images: string[];
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type HomeStatKey = 'completedProjects' | 'mainStack' | 'learningYears' | 'gpa';

export interface HomeStatItem {
  id: HomeStatKey;
  value: string;
  label: string;
  progress: number;
}

export interface HomeCardItem {
  id: string;
  page: 'projects' | 'about' | 'student' | 'contact';
  tag: string;
  title: string;
  desc: string;
  meta: string;
}

export interface HomeStats {
  completedProjects: HomeStatItem;
  mainStack: HomeStatItem;
  learningYears: HomeStatItem;
  gpa: HomeStatItem;
}

export interface HomeContent {
  name: string;
  eyebrow: string;
  heroDescription: string;
  badgeSubtitle: string;
  lanyardImage: string;
  stats: HomeStats;
  cards: HomeCardItem[];
}

export interface Profile {
  name: string;
  role: string;
  location: string;
  workStatus: 'open' | 'busy' | 'closed';
  bio: string;
  avatar: string;
}

export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number;
}

export interface About {
  bioParagraphs: string[];
  timeline: TimelineItem[];
  skills: SkillItem[];
  values: string[];
  stack: string[];
  tools: string[];
}

export interface StudentAchievement {
  id: string;
  code: string;
  title: string;
  note: string;
}

export interface StudentCourse {
  id: string;
  name: string;
  grade: string;
  highlight: boolean;
}

export interface StudentContent {
  period: string;
  degree: string;
  school: string;
  description: string;
  gpa: string;
  gpaLabel: string;
  achievements: StudentAchievement[];
  courses: StudentCourse[];
}

export interface SocialLinks {
  github: string;
  instagram: string;
  tiktok: string;
  discord: string;
  roblox: string;
  linkedin: string;
  resume: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalMessages: number;
  unreadMessages: number;
  githubStatus: 'connected' | 'disconnected';
  lastUpdated: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
