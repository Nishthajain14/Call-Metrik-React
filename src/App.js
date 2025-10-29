import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AudioAnalysisMonthly from './pages/AudioAnalysisMonthly';
import AudioAnalysisList from './pages/AudioAnalysisList';
import AudioDetails from './pages/AudioDetails';
import './index.css';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-6 space-y-6">{children}</main>
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
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/audio-analysis"
          element={
            <AppLayout>
              <AudioAnalysisMonthly />
            </AppLayout>
          }
        />
        <Route
          path="/audio-analysis/:month"
          element={
            <AppLayout>
              <AudioAnalysisList />
            </AppLayout>
          }
        />
        <Route
          path="/audio-details/:audioId"
          element={
            <AppLayout>
              <AudioDetails />
            </AppLayout>
          }
        />
        <Route path="/upload" element={<AppLayout>Upload coming soon</AppLayout>} />
        <Route
          path="/reports"
          element={
            <AppLayout>
              <Reports />
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
