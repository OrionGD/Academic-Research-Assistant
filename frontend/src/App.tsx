import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import AppLayout from './shared/layouts/AppLayout';
import StartupLoader from './shared/components/StartupLoader';
import { Toaster } from 'sonner';
import { useAppStore } from './store/useAppStore';

const HomePage = lazy(() => import('./landingpage/HomePage'));
const SystemPage = lazy(() => import('./landingpage/SystemPage'));
const DocumentationPage = lazy(() => import('./landingpage/DocumentationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SearchPage = lazy(() => import('./shared/pages/Search'));
const LibraryPage = lazy(() => import('./shared/pages/Library'));
const UploadPage = lazy(() => import('./pages/UploadPage').then(m => ({ default: m.UploadPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ComparePage = lazy(() => import('./pages/ComparePage'));

function App() {
  const { darkMode } = useAppStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Router>
      <Suspense fallback={<StartupLoader onComplete={() => {}} />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/system" element={<SystemPage />} />
          <Route path="/support" element={<Navigate to="/system#company" replace />} />
          <Route path="/documentation" element={<Navigate to="/documentation/api-reference" replace />} />
          <Route path="/documentation/:docId" element={<DocumentationPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/analytics/:documentId" element={<AnalyticsPage />} />
            <Route path="/insights/:documentId" element={<AnalyticsPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Route>
          <Route path="/documentation" element={<Navigate to="/system#docs" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </Router>
  );
}

export default App;

