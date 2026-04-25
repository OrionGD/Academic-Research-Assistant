import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Document } from '../types/api';

interface ChatSession {
  id: string;
  title: string;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;

  // Selected Document
  selectedDocument: Document | null;
  setSelectedDocument: (doc: Document | null) => void;

  // Chat Sessions
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  addSession: (session: ChatSession) => void;
  updateSessionTitle: (id: string, title: string) => void;
  deleteSession: (id: string) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Upload Modal
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;

  // Settings Modal
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      mobileDrawerOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // Selected Document
      selectedDocument: null,
      setSelectedDocument: (doc) => set({ selectedDocument: doc }),

      // Chat Sessions
      sessions: [],
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      addSession: (session) =>
        set((s) => ({ sessions: [session, ...s.sessions] })),
      updateSessionTitle: (id, title) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, title, updatedAt: new Date().toISOString() } : sess
          ),
        })),
      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      // Theme
      darkMode: true,
      setDarkMode: (dark) => {
        if (dark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        set({ darkMode: dark });
      },
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          if (next) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: next };
        }),

      // Upload Modal
      uploadModalOpen: false,
      setUploadModalOpen: (open) => set({ uploadModalOpen: open }),

      // Settings Modal
      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),
    }),
    {
      name: 'scholarai-app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
        sessions: state.sessions,
      }),
    }
  )
);

