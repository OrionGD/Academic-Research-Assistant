import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Library, 
  Search, 
  MessageSquare, 
  Settings, 
  LogOut,
  GraduationCap,
  Menu,
  X,
  Bell,
  User,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Upload Paper', icon: Upload, path: '/upload' },
  { name: 'Library', icon: Library, path: '/library' },
  { name: 'Semantic Search', icon: Search, path: '/search' },
  { name: 'AI Chat', icon: MessageSquare, path: '/chat' },
  { name: 'Paper Comparison', icon: BookOpen, path: '/comparison' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-bg-dark text-text-secondary">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-bg-medium border-r border-surface-light transition-all duration-300 flex flex-col z-30",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center text-bg-dark">
            <GraduationCap size={20} />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-text-primary">ScholarAI</span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive 
                    ? "bg-surface-dark text-accent-primary font-medium shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                    : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-accent-primary" : "text-text-secondary/60 group-hover:text-accent-primary")} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-light">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:bg-surface-light hover:text-accent-highlight transition-all w-full group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} className="group-hover:text-accent-highlight" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-bg-medium/80 backdrop-blur-md border-b border-surface-light flex items-center justify-between px-8 z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-surface-light rounded-lg text-text-secondary"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-surface-light rounded-full text-text-secondary relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-primary rounded-full border-2 border-bg-medium"></span>
            </button>
            <div className="h-8 w-px bg-surface-light mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-text-primary">{user?.displayName || 'Research User'}</p>
                <p className="text-xs text-text-secondary/70">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center text-accent-primary border border-surface-light overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
