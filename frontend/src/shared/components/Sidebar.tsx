import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  Search,
  Library,
  GitCompare,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { useDocuments } from "../hooks/useDocuments";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

interface SidebarProps {
  onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, selectedDocument, setSelectedDocument, setUploadModalOpen, setSettingsOpen } = useAppStore();
  const { data: documents, actions } = useDocuments();
  const { t } = useLanguage();
  const [showDelete, setShowDelete] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if not already loaded to avoid unnecessary calls
    if (documents.length === 0) {
      actions.fetchDocuments(1, 50);
    }
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: t("dashboard"), path: "/dashboard" },
    { icon: Library, label: t("library"), path: "/library" },
    { icon: GitCompare, label: t("compare"), path: "/compare" },
    { icon: Search, label: t("semanticSearch"), path: "/search" },
    { icon: MessageSquare, label: t("aiChat"), path: "/chat" },
  ];

  const handleNewChat = () => {
    setSelectedDocument(null);
    navigate("/chat");
    onItemClick?.();
  };

  const handleSelectDoc = (doc: any) => {
    setSelectedDocument(doc);
    navigate("/chat");
    onItemClick?.();
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await actions.deleteDocument(id);
    if (selectedDocument?.id === id) setSelectedDocument(null);
    setShowDelete(null);
    toast.success("Document deleted");
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <Logo 
          size="sm" 
          showText={sidebarOpen} 
          textClassName="text-sm"
        />
        <button onClick={toggleSidebar} className="bb-btn-icon hover:bg-white/5">
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="p-4">
        <button onClick={handleNewChat} className="w-full bb-btn-primary btn-glow-glitter flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
          <Plus size={16} /> {sidebarOpen && t("newSession") || "New Session"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {/* Navigation */}
        {sidebarOpen && (
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">{t("navigate") || "Navigate"}</p>
            <div className="space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); onItemClick?.(); }}
                  className={cn(
                    "bb-sidebar-item w-full text-left",
                    location.pathname === item.path && "bb-sidebar-item-active"
                  )}
                >
                  <item.icon size={15} className="shrink-0" />
                  <span className="truncate flex-1 text-left text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {sidebarOpen && (
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">{t("researchLibrary")}</p>
            {documents.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <FileText size={24} className="mx-auto text-text-dim mb-2" />
                <p className="text-xs text-text-muted">{t("noPapers")}</p>
                <button onClick={() => setUploadModalOpen(true)} className="mt-2 text-[11px] text-accent-light hover:underline">{t("uploadNew")}</button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {documents.map((doc: any) => (
                  <button key={doc.id} onClick={() => handleSelectDoc(doc)} onMouseEnter={() => setShowDelete(doc.id)} onMouseLeave={() => setShowDelete(null)}
                    className={cn(
                      "bb-sidebar-item w-full text-left relative group",
                      selectedDocument?.id === doc.id && "bb-sidebar-item-active"
                    )}>
                    <BookOpen size={15} className="shrink-0" />
                    <span className="truncate flex-1 text-left text-xs">{doc.title || t("untitled")}</span>
                    {showDelete === doc.id && (
                      <span onClick={(e) => handleDeleteDoc(doc.id, e)} className="absolute right-1 p-1 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 space-y-1.5">
        <button onClick={() => { setUploadModalOpen(true); onItemClick?.(); }} className="bb-sidebar-item w-full hover:bg-white/5">
          <Upload size={15} /> {sidebarOpen && <span className="text-xs">{t("uploadPaper")}</span>}
        </button>
        <button onClick={() => { setSettingsOpen(true); onItemClick?.(); }} className="bb-sidebar-item w-full hover:bg-white/5">
          <Settings size={15} /> {sidebarOpen && <span className="text-xs">{t("settings")}</span>}
        </button>
      </div>
    </div>
  );
}

