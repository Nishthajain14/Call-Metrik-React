import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import './index.css';

function AppLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />
      <Navbar title={title} />
      {/* content container offset by fixed sidebar (md) and navbar */}
      <div className="pt-16 md:ml-64">
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6 space-y-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  function RequireAuth({ children, title }){
    const { isLoading, session } = useAuth();
    if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-600 border-t-white" />
      </div>
    );
    if (!session) return <Navigate to="/login" replace />;
    return <AppLayout title={title}>{children}</AppLayout>;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
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
    </AuthProvider>
  );
}
