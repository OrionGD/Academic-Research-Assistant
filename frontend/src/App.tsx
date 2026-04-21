import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Toaster } from 'sonner';
import { Loader } from './components/LoadingStates';
import StartupLoader from './components/StartupLoader';

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
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'));
const AdminChatPage = lazy(() => import('./pages/AdminChatPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const ApiReferencePage = lazy(() => import('./pages/ApiReferencePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
// SaaS pages
const PricingPage = lazy(() => import('./pages/PricingPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));

export default function App() {
  const [loaderDone, setLoaderDone] = useState(false);

  return (
    <>
      {!loaderDone && (
        <StartupLoader onComplete={() => setLoaderDone(true)} />
      )}
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-bg-main">
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
              {/* Pricing is public so visitors can see plans */}
              <Route path="/pricing" element={<PricingPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><AppLayout><UploadPage /></AppLayout></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><AppLayout><LibraryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/insights/:paperId" element={<ProtectedRoute><AppLayout><InsightsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/comparison" element={<ProtectedRoute><AppLayout><ComparisonPage /></AppLayout></ProtectedRoute>} />
              {/* Billing — protected, inside AppLayout */}
              <Route path="/billing" element={<ProtectedRoute><AppLayout><BillingPage /></AppLayout></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AppLayout><AdminPage /></AppLayout></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AppLayout><AdminNotificationsPage /></AppLayout></AdminRoute>} />
              <Route path="/admin/chat/:userId" element={<AdminRoute><AppLayout><AdminChatPage /></AppLayout></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </>
  );
}
