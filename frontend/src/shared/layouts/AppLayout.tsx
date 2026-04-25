import { Outlet } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import Sidebar from "../components/Sidebar";
import DashboardNavbar from "../components/DashboardNavbar";
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
          hidden md:flex flex-col border-r border-white/5 bg-bg-surface/40 backdrop-blur-2xl
          transition-all duration-500 ease-in-out h-full shrink-0 z-40
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
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <DashboardNavbar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Global Modals */}
      <UploadModal />
      <SettingsModal />
    </div>
  );
}
