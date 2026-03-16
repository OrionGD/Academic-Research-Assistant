import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users to their intended destination (or /dashboard).
  // This also handles the return leg of signInWithRedirect: when Google redirects
  // the browser back to /login, onAuthStateChanged fires and sets `user`, then
  // this effect navigates to the dashboard without any additional popup.
  useEffect(() => {
    if (!loading && user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <Logo
            size="xl"
            showText={false}
            className="justify-center mb-6"
            imgClassName="drop-shadow-[0_0_18px_rgba(34,197,94,0.45)]"
          />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to continue your research</p>
        </div>

        <div className="bg-surface-dark p-8 rounded-3xl shadow-2xl border border-surface-light">
          {error && (
            <div className="mb-6 p-4 bg-red-900/10 border border-red-900/20 text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/40" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary placeholder:text-text-secondary/20"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/40" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary placeholder:text-text-secondary/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm font-bold text-accent-primary hover:text-accent-highlight transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-primary text-bg-dark py-4 rounded-2xl font-bold text-lg hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-light"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-dark text-text-secondary/40 font-bold uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-surface-medium border border-surface-light text-text-primary py-4 rounded-2xl font-bold hover:bg-surface-light transition-all flex items-center justify-center gap-3 shadow-inner"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google Account
          </button>
        </div>

        <p className="text-center mt-8 text-text-secondary font-medium">
          Don't have an account? <Link to="/signup" className="text-accent-primary hover:text-accent-highlight font-bold transition-colors">Sign up for free</Link>
        </p>
      </motion.div>
    </div>
  );
}
