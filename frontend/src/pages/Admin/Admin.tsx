import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './store/auth';
import { ToastProvider } from './store/toast';
import { ToastContainer } from './components/ui';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { StudentPage } from './pages/StudentPage';
import { SocialLinksPage } from './pages/SocialLinksPage';
import { MessagesPage } from './pages/MessagesPage';
import { GithubPage } from './pages/GithubPage';
import { getContactMessages } from './services/api';
import { useToast } from './store/toast';
import './Admin.css';

type PageId = 'overview' | 'projects' | 'home' | 'profile' | 'about' | 'student' | 'social' | 'messages' | 'github';

function Dashboard() {
  const { toast } = useToast();
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getContactMessages()
      .then(msgs => setUnread(msgs.filter(m => !m.read).length))
      .catch(error => toast(error instanceof Error ? error.message : 'Gagal memuat pesan.', 'error'));
  }, [toast]);

  const pages: Record<PageId, React.ReactNode> = {
    overview: <OverviewPage />,
    projects: <ProjectsPage />,
    home:     <HomePage />,
    profile:  <ProfilePage />,
    about:    <AboutPage />,
    student:  <StudentPage />,
    social:   <SocialLinksPage />,
    messages: <MessagesPage />,
    github:   <GithubPage />,
  };

  return (
    <DashboardLayout activePage={activePage} onNavigate={id => setActivePage(id as PageId)} unreadMessages={unread}>
      <div key={activePage}>{pages[activePage]}</div>
    </DashboardLayout>
  );
}

function AppInner() {
  const { user } = useAuth();
  const token = localStorage.getItem('admin_token');
  const authed = !!token && !!user;

  if (!authed) return <LoginPage onSuccess={() => {}} />;
  return <Dashboard />;
}

export default function Admin() {
  return (
    <div className="admin-page">
      <ToastProvider>
        <AuthProvider>
          <AppInner />
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}
