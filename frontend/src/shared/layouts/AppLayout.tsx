import { Outlet } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../utils/helpers";
import DashboardNavbar from "../components/DashboardNavbar";
import MobileDrawer from "../components/MobileDrawer";
import UploadModal from "../components/UploadModal";
import SettingsModal from "../components/SettingsModal";

export default function AppLayout() {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useAppStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary text-text-secondary overflow-hidden">
      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Top Navbar */}
      <DashboardNavbar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Global Modals */}
      <UploadModal />
      <SettingsModal />
    </div>
  );
}
