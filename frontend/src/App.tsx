import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { AdminRoute } from './shared/components/AdminRoute';
import AppLayout from './shared/layouts/AppLayout';
import StartupLoader from './shared/components/StartupLoader';
import { Toaster } from 'sonner';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ChatPage } from './pages/ChatPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// --- Lazy Loads ---
// Landing & Auth
const HomePage = lazy(() => import('./landingpage/HomePage'));
const PricingPage = lazy(() => import('./landingpage/PricingPage'));
const GuestUploadPage = lazy(() => import('./landingpage/GuestUploadPage'));
const LoginPage = lazy(() => import('./landingpage/LoginPage'));
const SignupPage = lazy(() => import('./landingpage/SignupPage'));
const FreeGuestPage = lazy(() => import('./free/FreeGuestPage'));
const AnalysisView = lazy(() => import('./free/AnalysisView'));

// Basic Plan
const BasicDashboard = lazy(() => import('./basic/Dashboard'));
const BasicChat = lazy(() => import('./basic/Chat'));
const BasicUpload = lazy(() => import('./basic/Upload'));

// Standard Plan
const StandardDashboard = lazy(() => import('./standard/Dashboard'));
const StandardChat = lazy(() => import('./standard/Chat'));
const StandardUpload = lazy(() => import('./standard/Upload'));
const StandardComparison = lazy(() => import('./standard/Comparison'));

// Pro Plan
const ProDashboard = lazy(() => import('./pro/Dashboard'));
const ProChat = lazy(() => import('./pro/Chat'));
const ProUpload = lazy(() => import('./pro/Upload'));
const ProComparison = lazy(() => import('./pro/Comparison'));
const ProAdvancedInsights = lazy(() => import('./pro/AdvancedInsights'));

// Admin
const AdminUserManagement = lazy(() => import('./admin/UserManagement'));
const AdminBillingManagement = lazy(() => import('./admin/BillingManagement'));
const AdminAnalytics = lazy(() => import('./admin/Analytics'));

// Billing
const BillingPlans = lazy(() => import('./billing/Plans'));
const BillingUpgrade = lazy(() => import('./billing/Upgrade'));
const BillingHistory = lazy(() => import('./billing/PaymentHistory'));

// Shared / Global
const LibraryPage = lazy(() => import('./shared/pages/Library'));
const SearchPage = lazy(() => import('./shared/pages/Search'));
const SettingsPage = lazy(() => import('./shared/pages/Settings'));
const DocumentationPage = lazy(() => import('./shared/pages/Documentation'));
const ApiReferencePage = lazy(() => import('./shared/pages/ApiReference'));
const SupportPage = lazy(() => import('./shared/pages/Support'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<StartupLoader onComplete={() => {}} />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/guest-upload" element={<GuestUploadPage />} />
            <Route path="/free" element={<FreeGuestPage />} />
            <Route path="/free/analysis/:id" element={<AnalysisView />} />

            {/* Basic Plan Routes */}
            <Route path="/basic" element={<ProtectedRoute planTier="BASIC"><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BasicDashboard />} />
              <Route path="chat" element={<BasicChat />} />
              <Route path="upload" element={<BasicUpload />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Standard Plan Routes */}
            <Route path="/standard" element={<ProtectedRoute planTier="STANDARD"><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StandardDashboard />} />
              <Route path="chat" element={<StandardChat />} />
              <Route path="upload" element={<StandardUpload />} />
              <Route path="comparison" element={<StandardComparison />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Pro Plan Routes */}
            <Route path="/pro" element={<ProtectedRoute planTier="PRO"><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ProDashboard />} />
              <Route path="chat" element={<ProChat />} />
              <Route path="upload" element={<ProUpload />} />
              <Route path="comparison" element={<ProComparison />} />
              <Route path="insights" element={<ProAdvancedInsights />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AppLayout /></AdminRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="billing" element={<AdminBillingManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            {/* Billing Management Routes */}
            <Route path="/billing" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="plans" element={<BillingPlans />} />
              <Route path="upgrade" element={<BillingUpgrade />} />
              <Route path="history" element={<BillingHistory />} />
            </Route>

            {/* Documentation & Support */}
            <Route path="/docs" element={<DocumentationPage />} />
            <Route path="/api" element={<ApiReferencePage />} />
            <Route path="/support" element={<SupportPage />} />

            {/* ARAS Platform Routes */}
            <Route path="/aras/dashboard" element={<DashboardPage />} />
            <Route path="/aras/upload" element={<UploadPage />} />
            <Route path="/aras/chat/:documentId" element={<ChatPage />} />
            <Route path="/aras/analytics/:documentId" element={<AnalyticsPage />} />

            {/* Generic Fallback */}
            <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/basic/dashboard" replace /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
