import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AudioAnalysisMonthly from './pages/AudioAnalysisMonthly';
import AudioAnalysisList from './pages/AudioAnalysisList';
import AudioDetails from './pages/AudioDetails';
import UploadAudio from './pages/UploadAudio';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingProvider } from './context/LoadingContext';
import { NotificationProvider } from './context/NotificationContext';
import Toasts from './components/Toasts';
import './index.css';
import smallLogo from './assets/small-callmetrik-nobg.png';

function AppLayout({ children, title }) {
  return (
    <div className="min-h-screen text-neutral-900 dark:text-neutral-100">
      <Sidebar />
      <Navbar title={title} />
      {/* content container offset by fixed sidebar (md) and navbar */}
      <div className="pt-16" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6 space-y-6 overflow-y-auto animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    try {
      if (document.title !== 'CallMetrik') document.title = 'CallMetrik';
      const link: HTMLLinkElement = (document.querySelector("link[rel='icon']") as HTMLLinkElement) || document.createElement('link');
      link.rel = 'icon';
      link.href = smallLogo as unknown as string;
      if (!link.parentNode) document.head.appendChild(link);
    } catch {}
  }, []);
  function RequireAuth({ children, title }){
    const { isLoading, session } = useAuth();
    if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600 dark:text-neutral-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-300 border-t-brand-600 dark:border-neutral-600 dark:border-t-brand-500" />
      </div>
    );
    if (!session) return <Navigate to="/login" replace />;
    return <AppLayout title={title}>{children}</AppLayout>;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Toasts />
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RequireAuth title="Dashboard"><Dashboard /></RequireAuth>} />
              <Route path="/audio-analysis" element={<RequireAuth title="Audio Analysis"><AudioAnalysisMonthly /></RequireAuth>} />
              <Route path="/audio-analysis/:month" element={<RequireAuth title="Audio Analysis"><AudioAnalysisList /></RequireAuth>} />
              <Route path="/audio-details/:audioId" element={<RequireAuth title="Audio Details"><AudioDetails /></RequireAuth>} />
              <Route path="/upload" element={<RequireAuth title="Upload Audio"><UploadAudio /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth title="Reports"><Reports /></RequireAuth>} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </LoadingProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}
