import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import AppLayout from './shared/layouts/AppLayout';
import StartupLoader from './shared/components/StartupLoader';
import { Toaster } from 'sonner';

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

import { useAppStore } from './store/useAppStore';

function App() {
  const darkMode = useAppStore(s => s.darkMode);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <Router>
      <Suspense fallback={<StartupLoader />}>
        <Toaster position="top-right" theme="dark" richColors closeButton />
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
            
            {/* Analysis & Insights (Both paths supported for legacy/new compatibility) */}
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
