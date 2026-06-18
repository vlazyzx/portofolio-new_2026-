export type PageId = 'home' | 'about' | 'projects' | 'student' | 'contact' | 'admin';
export type ProjectCategory = 'all' | 'web' | 'game' | 'server' | 'other';

export interface NavItem {
  id: Exclude<PageId, 'admin'>;
  label: string;
}

export interface ProjectGalleryItem {
  title: string;
  caption: string;
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
  page: Exclude<PageId, 'home' | 'admin'>;
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

export interface AboutContent {
  bioParagraphs: string[];
  timeline: TimelineItem[];
  skills: SkillItem[];
  values: string[];
  stack: string[];
  tools: string[];
}

export interface ProfileContent {
  name: string;
  role: string;
  location: string;
  workStatus: 'open' | 'busy' | 'closed';
  bio: string;
  avatar: string;
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

export interface SocialLinkItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface SocialLinksContent {
  github: string;
  instagram: string;
  tiktok: string;
  discord: string;
  roblox: string;
  linkedin: string;
  resume: string;
}

export interface Project {

  title: string;
  description: string;
  detail: string;
  category: Exclude<ProjectCategory, 'all'>;
  stack: string[];
  tone: string;
  mark: string;
  liveUrl: string;
  sourceUrl: string;
  gallery: ProjectGalleryItem[];
  highlights: string[];
}
