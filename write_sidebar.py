import pathlib

content = '''import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MessageSquare, FileText, Settings,
  PanelLeftClose, PanelLeftOpen, Upload, Trash2,
  Loader2, ChevronRight, Sparkles,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useDocuments } from "../hooks/useDocuments";
import { cn } from "../../utils/helpers";

interface SidebarProps {
  onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  const navigate = useNavigate();
  const {
    sidebarOpen, toggleSidebar, selectedDocument, setSelectedDocument,
    sessions, activeSessionId, setActiveSessionId,
    setUploadModalOpen, setSettingsOpen,
  } = useAppStore();

  const { data: documents, loading: docsLoading, actions } = useDocuments();
  const [expandedDocs, setExpandedDocs] = useState(true);

  const handleNewChat = useCallback(() => {
    setSelectedDocument(null);
    setActiveSessionId(null);
    onItemClick?.();
    navigate("/chat");
  }, [setSelectedDocument, setActiveSessionId, onItemClick, navigate]);

  const handleSelectDocument = useCallback((doc: any) => {
    setSelectedDocument(doc);
    setActiveSessionId(null);
    onItemClick?.();
    navigate("/chat");
  }, [setSelectedDocument, setActiveSessionId, onItemClick, navigate]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    onItemClick?.();
    navigate("/chat");
  }, [setActiveSessionId, onItemClick, navigate]);

  const handleDeleteDoc = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document?")) return;
    await actions.deleteDocument(id);
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  }, [actions, selectedDocument, setSelectedDocument]);

  return (
    <div className="flex flex-col h-full">
      {/* Top: Logo + Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-text-primary tracking-tight">ARAS</span>
        </button>
        <button onClick={toggleSidebar} className="bb-btn-icon hidden md:flex"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/15 hover:bg-accent/25 text-accent-light font-medium rounded-xl transition-all duration-200 border border-accent/20">
          <Plus size={16} />
          <span className="text-sm">New Chat</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {/* Sessions */}
        {sessions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider px-2 mb-1.5">Recent Chats</p>
            <div className="space-y-0.5">
              {sessions.slice(0, 8).map((session) => (
                <button key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={cn("bb-sidebar-item w-full text-left", activeSessionId === session.id && "bb-sidebar-item-active")}>
                  <MessageSquare size={14} />
                  <span className="truncate flex-1">{session.title}</span>
                </button>
              ))}
            </div>
        )}

        {/* Documents */}
        <div>
          <button onClick={() => setExpandedDocs((v) => !v)}
            className="flex items-center gap-1.5 px-2 mb-1.5 w-full">
            <ChevronRight size={12} className={cn("text-text-dim transition-transform", expandedDocs && "rotate-90")} />
            <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Documents</span>
            <span className="text-[10px] text-text-muted ml-auto">{documents.length}</span>
          </button>

          {expandedDocs && (
            <div className="space-y-0.5">
              {docsLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : documents.length === 0 ? (
                <p className="px-3 py-2 text-xs text-text-muted italic">No documents yet</p>
              ) : (
                documents.slice(0, 20).map((doc) => (
                  <button key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={cn("bb-sidebar-item w-full text-left group", selectedDocument?.id === doc.id && "bb-sidebar-item-active")}>
                    <FileText size={13} className="shrink-0" />
                    <span className="truncate flex-1 text-xs">{doc.title || "Untitled"}</span>
                    <button onClick={(e) => handleDeleteDoc(e, doc.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all">
                      <Trash2 size={11} />
                    </button>
                ))
              )}
            </div>
          )}
        </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border space-y-1">
        <button onClick={() => { setUploadModalOpen(true); onItemClick?.(); }}
          className="bb-sidebar-item w-full text-left">
          <Upload size={14} />
          <span className="text-xs">Upload Document</span>
        </button>
        <button onClick={() => { setSettingsOpen(true); onItemClick?.(); }}
          className="bb-sidebar-item w-full text-left">
          <Settings size={14} />
          <span className="text-xs">Settings</span>
        </button>
      </div>
  );
}
'''

path = pathlib.Path("frontend/src/shared/components/Sidebar.tsx")
path.write_text(content, encoding="utf-8")
print("Sidebar.tsx written successfully")
