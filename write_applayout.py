import pathlib

content = '''import { Outlet } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import Sidebar from "../components/Sidebar";
import MobileDrawer from "../components/MobileDrawer";
import UploadModal from "../components/UploadModal";
import SettingsModal from "../components/SettingsModal";

export default function AppLayout() {
  const { sidebarOpen, mobileDrawerOpen, setMobileDrawerOpen } = useAppStore();

  return (
    <div className="h-screen w-screen flex bg-bg-primary text-text-secondary overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col border-r border-border bg-bg-surface/80 backdrop-blur-xl
          transition-all duration-300 ease-in-out h-full shrink-0 z-20
          ${sidebarOpen ? "w-72" : "w-0 opacity-0 overflow-hidden"}
        `}
      >
        <Sidebar />
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Outlet />
      </main>

      {/* Global Modals */}
      <UploadModal />
      <SettingsModal />
    </div>
  );
}
'''

path = pathlib.Path("frontend/src/shared/layouts/AppLayout.tsx")
path.write_text(content, encoding="utf-8")
print("AppLayout.tsx written successfully")
