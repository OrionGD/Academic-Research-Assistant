import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import AppLayout from './shared/layouts/AppLayout';
import StartupLoader from './shared/components/StartupLoader';
import { Toaster } from 'sonner';
import { useAppStore } from './store/useAppStore';

// Pages - Lazy Loading for Performance
const HomePage = lazy(() => import('./landingpage/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DocumentsPage = lazy(() => import('./shared/pages/Documents'));
const CollectionsPage = lazy(() => import('./shared/pages/Collections'));
const SearchPage = lazy(() => import('./shared/pages/Search'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./shared/pages/Settings'));
const TagsPage = lazy(() => import('./shared/pages/Tags'));

function App() {
  const { darkMode, compactMode } = useAppStore();

  // Unified Effect for System-wide Styles
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Layout Density
    if (compactMode) root.setAttribute('data-compact', 'true');
    else root.removeAttribute('data-compact');

    // ─── Session Cleanup Logic ───
    const handleUnload = () => {
      const sid = sessionStorage.getItem('scholarai_session_id');
      if (sid && sid !== 'public') {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:2022/api';
        const url = `${baseUrl}/documents/session/clear?sessionId=${sid}`;
        // Use sendBeacon for reliable delivery on window close
        navigator.sendBeacon(url); 
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
    
  }, [darkMode, compactMode]);

  return (
    <Router>
      <Suspense fallback={<StartupLoader />}>
        <Toaster position="top-right" theme={darkMode ? 'dark' : 'light'} richColors closeButton />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<HomePage />} />
          
          {/* Main App Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/analytics/:documentId" element={<AnalyticsPage />} />
            <Route path="/insights/:documentId" element={<AnalyticsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Documentation Redirects */}
          <Route path="/documentation/*" element={<Navigate to="/" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
