import { ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Bell,
  User,
  BookOpen,
  ShieldCheck,
  Crown,
  Upload,
  Library,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import Logo from '../components/Logo';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
import { CreditBadge } from '../components/CreditBadge';

const getNavItems = (planTier: string) => {
  const prefix = planTier.toLowerCase();
  const allowedPrefixes = ['basic', 'standard', 'pro'];
  const routePrefix = allowedPrefixes.includes(prefix) ? `/${prefix}` : '';

  return [
    { name: 'Dashboard',       icon: GraduationCap, path: `${routePrefix}/dashboard` },
    { name: 'Upload Paper',    icon: Upload,        path: `${routePrefix}/upload` },
    { name: 'Library',         icon: Library,       path: `${routePrefix}/library` },
    { name: 'Semantic Search', icon: Search,        path: `${routePrefix}/search` },
    { name: 'AI Chat',         icon: MessageSquare, path: `${routePrefix}/chat` },
    { name: 'Paper Comparison',icon: BookOpen,      path: `${routePrefix}/comparison`, minTier: 'STANDARD' },
    { name: 'Settings',        icon: Settings,      path: `${routePrefix}/settings` },
  ];
};

const adminNavItems = [
  { name: 'Analytics',         icon: ShieldCheck,   path: '/admin/analytics' },
  { name: 'User Management',   icon: User,          path: '/admin/users' },
  { name: 'Billing Management',icon: BookOpen,      path: '/admin/billing' },
];


export default function AppLayout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = location.pathname.startsWith('/admin') ? adminNavItems : getNavItems(user?.planTier || 'FREE');
  const filteredNavItems = navItems.filter((item: any) => {
    if (!item.minTier) return true;
    const minTier = item.minTier;
    if (minTier === 'STANDARD') return ['STANDARD', 'PRO'].includes(user?.planTier || '');
    if (minTier === 'PRO') return user?.planTier === 'PRO';
    return true;
  });

  const currentPage = filteredNavItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <div className="min-h-screen flex bg-bg-main text-text-secondary">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative bg-white border-r border-red-100/70 transition-all duration-300 flex flex-col z-30",
          "shadow-[1px_0_24px_rgba(220,38,38,0.05)]",
          isSidebarOpen ? "w-64" : "w-[70px]"
        )}
      >
        {/* Top red accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-red-400 to-transparent" />

        {/* Logo area */}
        <div
          className={cn(
            "flex items-center gap-3 border-b border-red-50 overflow-hidden",
            isSidebarOpen ? "px-5 py-4" : "px-0 py-4 justify-center"
          )}
        >
          <Logo
            size={isSidebarOpen ? 'md' : 'sm'}
            showText={isSidebarOpen}
            imgClassName="shrink-0"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isSidebarOpen ? item.name : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden",
                  !isSidebarOpen && "justify-center",
                  isActive
                    ? "bg-red-50 text-red-600 font-semibold"
                    : "text-slate-500 hover:bg-red-50/50 hover:text-red-500"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 top-[6px] bottom-[6px] w-[3px] bg-red-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-red-500" : "text-slate-400 group-hover:text-red-400"
                  )}
                />
                <AnimatePresence initial={false}>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm truncate overflow-hidden whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

        </nav>

        {/* Bottom: user card + logout */}
        <div className="p-3 border-t border-red-50 space-y-1">
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/60 border border-red-100/50 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 shrink-0 overflow-hidden border border-red-200/60 shadow-sm">
                  {user?.photoURL
                    ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    : <User size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {user?.name || user?.displayName || 'Researcher'}
                  </p>
                  <div className="flex items-center gap-1">
                    {user?.plan === 'premium' && <Crown size={9} className="text-red-500" />}
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.plan || 'Free'} Plan</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogout}
            title="Logout"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full text-sm group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={17} className="shrink-0 group-hover:rotate-12 transition-transform duration-200" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white/85 backdrop-blur-xl border-b border-red-50 flex items-center justify-between px-6 z-20 sticky top-0 shadow-[0_2px_16px_rgba(220,38,38,0.05)]">

          {/* Left: toggle + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            {currentPage && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <ChevronRight size={14} className="text-slate-300" />
                <currentPage.icon size={14} className="text-red-400" />
                <span className="font-semibold text-slate-600">{currentPage.name}</span>
              </div>
            )}
          </div>

          {/* Right: bell + user */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-6 w-px bg-red-100 mx-1" />

            <CreditBadge className="hidden md:flex" />

            <div className="h-6 w-px bg-red-100 mx-1" />

            {/* User chip */}
            <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full border border-red-100 bg-red-50/40 hover:bg-red-50 hover:border-red-200 transition-all cursor-default select-none">
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-xs font-semibold text-slate-700">{user?.name || user?.displayName || 'Researcher'}</p>
                <div className="flex items-center gap-1 justify-end">
                  {user?.plan === 'premium' && <Crown size={9} className="text-red-500" />}
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.plan || 'Free'}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 border border-red-200/60 overflow-hidden shadow-sm">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  : <User size={14} />}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 bg-transparent">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
