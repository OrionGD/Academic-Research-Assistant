import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { Loader } from './components/LoadingStates';

// Layout
import AppLayout from './components/layout/AppLayout';

// Lazy Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const ApiReferencePage = lazy(() => import('./pages/ApiReferencePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
            <Loader size={48} />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/api-reference" element={<ApiReferencePage />} />
            <Route path="/support" element={<SupportPage />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UploadPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LibraryPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/insights/:paperId" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <InsightsPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SearchPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChatPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/comparison" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ComparisonPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
