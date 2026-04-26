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

export type AppLanguage = 'English (US)' | 'Spanish' | 'French' | 'German' | 'Hindi';

interface AppState {
  // Sidebar/Navigation
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

  // Theme & Preferences (Unified)
  darkMode: boolean;
  language: AppLanguage;
  compactMode: boolean;
  autoNeuralSync: boolean;
  
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: AppLanguage) => void;
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  setAutoNeuralSync: (sync: boolean) => void;
  toggleAutoNeuralSync: () => void;

  // Modals
  uploadModalOpen: boolean;
  settingsOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
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

      // Theme & Preferences
      darkMode: true,
      language: 'English (US)',
      compactMode: false,
      autoNeuralSync: true,

      setDarkMode: (dark) => set({ darkMode: dark }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setLanguage: (lang) => set({ language: lang }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode })),
      setAutoNeuralSync: (sync) => set({ autoNeuralSync: sync }),
      toggleAutoNeuralSync: () => set((s) => ({ autoNeuralSync: !s.autoNeuralSync })),

      // Modals
      uploadModalOpen: false,
      settingsOpen: false,
      setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
    }),
    {
      name: 'scholarai-v3-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language,
        compactMode: state.compactMode,
        autoNeuralSync: state.autoNeuralSync,
        sessions: state.sessions,
        sidebarOpen: state.sidebarOpen
      }),
    }
  )
);
