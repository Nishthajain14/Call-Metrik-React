import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AudioAnalysisMonthly from './pages/AudioAnalysisMonthly';
import AudioAnalysisList from './pages/AudioAnalysisList';
import AudioDetails from './pages/AudioDetails';
import UploadAudio from './pages/UploadAudio';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<AppLayout title="Dashboard"><Dashboard /></AppLayout>}
        />
        <Route
          path="/audio-analysis"
          element={<AppLayout title="Audio Analysis"><AudioAnalysisMonthly /></AppLayout>}
        />
        <Route
          path="/audio-analysis/:month"
          element={<AppLayout title="Audio Analysis"><AudioAnalysisList /></AppLayout>}
        />
        <Route
          path="/audio-details/:audioId"
          element={<AppLayout title="Audio Details"><AudioDetails /></AppLayout>}
        />
        <Route
          path="/upload"
          element={<AppLayout title="Upload Audio"><UploadAudio /></AppLayout>}
        />
        <Route
          path="/reports"
          element={<AppLayout title="Reports"><Reports /></AppLayout>}
        />
      </Routes>
    </BrowserRouter>
  );
}
