"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, BookOpen, Calendar, Trash2, Loader2, ArrowLeft,
  Moon, Sun, Flame, EyeOff, Palette, Activity,
  Grid3X3, List, FolderOpen, Star, FileText, ChevronDown, X,
  SlidersHorizontal, Edit2, Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStudy } from "@/context/StudyContext";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";
import UploadDocumentModal from "@/components/documents/UploadDocumentModal";
import ShareModal from "@/components/documents/ShareModal";
import { Background, BackgroundStyle } from "@/components/flashcards/Background";

// Category tag colors matching the mockup
const TAG_COLORS: Record<string, string> = {
  "Hóa học": "#6366f1",
  "Tiếng Anh": "#22c55e",
  "Ngoại ngữ": "#22c55e",
  "Lịch sử": "#f59e0b",
  "Toán học": "#ef4444",
  "Vật lý": "#06b6d4",
  "Kinh tế": "#ec4899",
  "Sinh học": "#84cc16",
  "Trí tuệ nhân tạo": "#6366f1",
  "Khác": "#6b7280"
};

const getCategoryColor = (cat: string) => {
  return TAG_COLORS[cat] || "#6b7280";
};

// Helper to check doc type from URL or title
const getDocType = (doc: any): "pdf" | "docx" | "txt" | "pptx" => {
  const url = (doc.doc_url || "").toLowerCase();
  const title = (doc.title || "").toLowerCase();
  if (url.endsWith(".pdf") || title.endsWith(".pdf")) return "pdf";
  if (url.endsWith(".docx") || title.endsWith(".docx") || url.endsWith(".doc") || title.endsWith(".doc")) return "docx";
  if (url.endsWith(".pptx") || title.endsWith(".pptx") || url.endsWith(".ppt") || title.endsWith(".ppt")) return "pptx";
  if (url.endsWith(".txt") || title.endsWith(".txt")) return "txt";
  return "pdf";
};

// Helper for deterministic size
const getDocSize = (doc: any): string => {
  const sizes = ["2.3 MB", "1.1 MB", "856 KB", "3.2 MB", "1.8 MB", "124 KB", "4.7 MB", "512 KB"];
  return sizes[(doc.id - 1) % sizes.length] || "1.2 MB";
};

// Helper for deterministic page count
const getDocPages = (doc: any): number | undefined => {
  const pages = [42, 28, 19, 64, 33, undefined, 38, 12];
  return pages[(doc.id - 1) % pages.length];
};

// Helper for formatted date
const getDocDate = (doc: any): string => {
  if (!doc.created_at) return "10 thg 6, 2026";
  const d = new Date(doc.created_at);
  return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FileIcon({ type }: { type: "pdf" | "docx" | "txt" | "pptx" }) {
  const config = {
    pdf: { color: "#ef4444", label: "PDF" },
    docx: { color: "#3b82f6", label: "DOC" },
    txt: { color: "#6b7280", label: "TXT" },
    pptx: { color: "#f97316", label: "PPT" },
  }[type] || { color: "#6b7280", label: "FILE" };

  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
      background: config.color + "18", border: `1.5px solid ${config.color}33`,
    }}>
      <FileText size={18} color={config.color} />
    </div>
  );
}

function DocCard({
  doc,
  dark,
  starred,
  onStar,
  onDelete,
  onEdit,
  onShare,
  onSelect,
  onDragStart,
  onDragEnd
}: {
  doc: any;
  dark: boolean;
  starred: boolean;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (doc: any) => void;
  onShare: (doc: any) => void;
  onSelect: () => void;
  onDragStart?: (e: React.DragEvent, doc: any) => void;
  onDragEnd?: () => void;
}) {
  const type = getDocType(doc);
  const size = getDocSize(doc);
  const pages = getDocPages(doc);
  const date = getDocDate(doc);

  const tagColor = getCategoryColor(doc.category || "Khác");
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#6b7280" : "#6b7280";
  const cardBg = dark ? "#1e1e1e" : "#ffffff";
  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.22)";

  return (
    <motion.div
      draggable={!!onDragStart}
      onDragStart={(e: any) => onDragStart && onDragStart(e, doc)}
      onDragEnd={(e: any) => onDragEnd && onDragEnd()}
      whileHover={{ y: -3, transition: { duration: 0.16 } }}
      onClick={onSelect}
      style={{
        background: cardBg, border: `2px solid ${border}`,
        borderRadius: 16, padding: "16px", cursor: "pointer",
        boxShadow: dark ? "4px 4px 0 rgba(255,255,255,0.03)" : "4px 4px 0 rgba(26,46,28,0.1)",
        fontFamily: "'Outfit', sans-serif", display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <FileIcon type={type} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onStar(doc.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <Star size={15} color={starred ? "#f59e0b" : textSub} fill={starred ? "#f59e0b" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(doc); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
            title="Sửa tên tài liệu"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShare(doc); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            className="text-gray-400 hover:text-emerald-500 transition-colors"
            title="Chia sẻ tài liệu"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            className="text-gray-400 hover:text-rose-500 transition-colors"
            title="Xóa tài liệu"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: textMain, fontSize: 13, lineHeight: 1.4, marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>
          {doc.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: tagColor, background: tagColor + "18", border: `1px solid ${tagColor}33`, padding: "2px 8px", borderRadius: 6, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
            {doc.category || "Khác"}
          </span>
          {pages && (
            <span style={{ fontSize: 11, color: textSub, fontFamily: "'Outfit', sans-serif" }}>
              {pages} trang
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${border}`, paddingTop: 10 }}>
        <span style={{ fontSize: 11, color: textSub, fontFamily: "'Outfit', sans-serif" }}>{size}</span>
        <span style={{ fontSize: 11, color: textSub, fontFamily: "'Outfit', sans-serif" }}>{date}</span>
      </div>
    </motion.div>
  );
}

function DocRow({
  doc,
  dark,
  starred,
  onStar,
  onDelete,
  onEdit,
  onShare,
  onSelect,
  onDragStart,
  onDragEnd
}: {
  doc: any;
  dark: boolean;
  starred: boolean;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (doc: any) => void;
  onShare: (doc: any) => void;
  onSelect: () => void;
  onDragStart?: (e: React.DragEvent, doc: any) => void;
  onDragEnd?: () => void;
}) {
  const type = getDocType(doc);
  const size = getDocSize(doc);
  const date = getDocDate(doc);

  const tagColor = getCategoryColor(doc.category || "Khác");
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#6b7280" : "#6b7280";
  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.14)";

  return (
    <motion.div
      draggable={!!onDragStart}
      onDragStart={(e: any) => onDragStart && onDragStart(e, doc)}
      onDragEnd={(e: any) => onDragEnd && onDragEnd()}
      whileHover={{ x: 3, transition: { duration: 0.14 } }}
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
        borderBottom: `1px solid ${border}`, cursor: "pointer",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <FileIcon type={type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: textMain, fontSize: 13, fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {doc.title}
        </div>
        <div style={{ fontSize: 11, color: textSub, marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>{date}</div>
      </div>
      
      <span style={{ fontSize: 11, color: tagColor, background: tagColor + "18", border: `1px solid ${tagColor}33`, padding: "2px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
        {doc.category || "Khác"}
      </span>
      <span style={{ fontSize: 11, color: textSub, width: 60, textAlign: "right", flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>{size}</span>
      
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(doc.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
        >
          <Star size={14} color={starred ? "#f59e0b" : textSub} fill={starred ? "#f59e0b" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(doc); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          className="text-gray-400 hover:text-indigo-500 transition-colors"
          title="Sửa tên tài liệu"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onShare(doc); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          className="text-gray-400 hover:text-emerald-500 transition-colors"
          title="Chia sẻ tài liệu"
        >
          <Share2 size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          className="text-gray-400 hover:text-rose-500 transition-colors"
          title="Xóa tài liệu"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function FolderCard({
  category,
  count,
  dark,
  isDragOver,
  isDragActive,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
  onRename
}: {
  category: string;
  count: number;
  dark: boolean;
  isDragOver: boolean;
  isDragActive: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onRename?: (e: React.MouseEvent) => void;
}) {
  const folderColor = getCategoryColor(category);
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const cardBg = dark ? "#1e1e1e" : "#ffffff";
  const border = dark ? "#2a2a2a" : "rgba(26,46,28,0.18)";

  return (
    <motion.div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={{ scale: 1.02, y: -2 }}
      animate={{
        scale: isDragOver ? 1.05 : 1,
        borderColor: isDragOver ? folderColor : border,
        boxShadow: isDragOver 
          ? `0 0 15px ${folderColor}40, 4px 4px 0 ${folderColor}20` 
          : dark 
            ? "4px 4px 0 rgba(255,255,255,0.03)" 
            : "4px 4px 0 rgba(26,46,28,0.08)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        background: cardBg,
        border: "2px solid",
        borderColor: isDragOver ? folderColor : border,
        borderRadius: 20,
        padding: "20px 16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 120,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          width: 50,
          height: 6,
          backgroundColor: folderColor,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          pointerEvents: "none"
        }}
      />

      {/* Rename Folder button */}
      {onRename && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(e);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 34,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dark ? "#4b5563" : "#9ca3af",
            transition: "all 0.15s",
            zIndex: 10,
            pointerEvents: isDragActive ? "none" : "auto"
          }}
          className="hover:text-emerald-500 hover:bg-emerald-500/10"
          title="Đổi tên thư mục"
        >
          <Edit2 size={13} />
        </button>
      )}

      {/* Delete Folder button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dark ? "#4b5563" : "#9ca3af",
            transition: "all 0.15s",
            zIndex: 10,
            pointerEvents: isDragActive ? "none" : "auto"
          }}
          className="hover:text-rose-500 hover:bg-rose-500/10"
          title="Xóa thư mục"
        >
          <Trash2 size={13} />
        </button>
      )}

      <div style={{ pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14, background: folderColor + "15" }}>
        <FolderOpen size={24} color={folderColor} strokeWidth={2.25} />
      </div>

      <div style={{ pointerEvents: "none", textAlign: "center", marginTop: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: textMain, fontFamily: "'Outfit', sans-serif" }}>
          {category}
        </div>
        <div style={{ fontSize: 11, color: dark ? "#777" : "#888", fontWeight: 600, marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>
          {count} tài liệu
        </div>
      </div>

      {isDragOver && (
        <div 
          style={{
            position: "absolute",
            inset: 0,
            background: folderColor + "08",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: folderColor,
            textTransform: "uppercase",
            letterSpacing: "1px",
            pointerEvents: "none"
          }}
        >
          Thả vào thư mục
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LibraryPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    activeUser,
    showLoginModal,
    setShowLoginModal,
    globalMessage,
    triggerMessage,
    documents,
    fetchDocuments,
    handleDeleteDocument,
    handleEditDocument,
    handleOpenWorkspace
  } = useStudy();

  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả danh mục");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("default");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [starredIds, setStarredIds] = useState<number[]>([]);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState<any | null>(null);

  // Drag and Drop States & Handlers
  const [draggedDoc, setDraggedDoc] = useState<any | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [deletedFolders, setDeletedFolders] = useState<string[]>([]);
  const [folderModalConfig, setFolderModalConfig] = useState<{
    isOpen: boolean;
    type: "delete" | "rename";
    category: string;
    message?: string;
    inputValue?: string;
    onConfirm: (val?: string) => void;
  } | null>(null);

  useEffect(() => {
    if (draggedDoc) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [draggedDoc]);

  const handleDragStart = (e: React.DragEvent, doc: any) => {
    setDraggedDoc(doc);
    e.dataTransfer.setData("text/plain", doc.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedDoc(null);
    setDragOverFolder(null);
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderCategory: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    if (!draggedDoc) return;
    
    const success = await handleEditDocument(
      draggedDoc.id,
      draggedDoc.title,
      folderCategory,
      draggedDoc.description
    );
    
    if (success) {
      // If we move a file to a previously deleted category folder, undelete it
      if (deletedFolders.includes(folderCategory)) {
        const nextDeleted = deletedFolders.filter(x => x !== folderCategory);
        setDeletedFolders(nextDeleted);
        localStorage.setItem(`deleted-folders-${activeUser?.id || 'guest'}`, JSON.stringify(nextDeleted));
      }
      triggerMessage("Đã chuyển tài liệu vào thư mục " + folderCategory, "success");
    }
    setDraggedDoc(null);
  };

  const completeDeleteFolder = (category: string) => {
    const newDeleted = [...deletedFolders, category];
    setDeletedFolders(newDeleted);
    localStorage.setItem(`deleted-folders-${activeUser?.id || 'guest'}`, JSON.stringify(newDeleted));
    
    if (selectedFolder === category) {
      setSelectedFolder(null);
    }
    setFolderModalConfig(null);
  };

  const handleDeleteFolder = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const docsInFolder = documents.filter((d: any) => d.category === category);
    
    if (docsInFolder.length > 0) {
      setFolderModalConfig({
        isOpen: true,
        type: "delete",
        category,
        message: `Thư mục "${category}" đang chứa ${docsInFolder.length} tài liệu. Bạn có chắc chắn muốn xóa thư mục này? Các tài liệu bên trong sẽ được chuyển về mục Chưa phân loại.`,
        onConfirm: async () => {
          let hasError = false;
          for (const doc of docsInFolder) {
            const success = await handleEditDocument(doc.id, doc.title, "Khác", doc.description);
            if (!success) hasError = true;
          }
          
          if (hasError) {
            triggerMessage("Đã xảy ra lỗi khi di chuyển một số tài liệu.", "error");
            return;
          }
          
          triggerMessage(`Đã xóa thư mục "${category}" và chuyển các tài liệu ra ngoài.`, "success");
          completeDeleteFolder(category);
        }
      });
    } else {
      triggerMessage(`Đã xóa thư mục trống "${category}".`, "success");
      completeDeleteFolder(category);
    }
  };

  const handleRenameFolder = (oldCategory: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setFolderModalConfig({
      isOpen: true,
      type: "rename",
      category: oldCategory,
      inputValue: oldCategory,
      onConfirm: async (newName) => {
        if (!newName || !newName.trim() || newName.trim() === oldCategory) return;
        const trimmedNewName = newName.trim();
        
        const docsInFolder = documents.filter((d: any) => d.category === oldCategory);
        
        if (docsInFolder.length > 0) {
          let hasError = false;
          for (const doc of docsInFolder) {
            const success = await handleEditDocument(doc.id, doc.title, trimmedNewName, doc.description);
            if (!success) hasError = true;
          }
          
          if (hasError) {
            triggerMessage("Đã xảy ra lỗi khi đổi tên danh mục cho một số tài liệu.", "error");
            return;
          }
        }
        
        // Add old category to deletedFolders list so it doesn't show up empty if it was a default category
        const newDeleted = [...deletedFolders, oldCategory];
        setDeletedFolders(newDeleted);
        localStorage.setItem(`deleted-folders-${activeUser?.id || 'guest'}`, JSON.stringify(newDeleted));
        
        // If the new category was in deletedFolders, remove it
        if (deletedFolders.includes(trimmedNewName)) {
          const nextDeleted = deletedFolders.filter(x => x !== trimmedNewName);
          setDeletedFolders(nextDeleted);
          localStorage.setItem(`deleted-folders-${activeUser?.id || 'guest'}`, JSON.stringify(nextDeleted));
        }
        
        triggerMessage(`Đã đổi tên thư mục từ "${oldCategory}" thành "${trimmedNewName}".`, "success");
        
        if (selectedFolder === oldCategory) {
          setSelectedFolder(trimmedNewName);
        }
        
        setFolderModalConfig(null);
      }
    });
  };

  const handleStartEdit = (doc: any) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || "");
    setEditCategory(doc.category || "");
  };

  const handleShareClick = (doc: any) => {
    setShareDoc(doc);
    setIsShareModalOpen(true);
  };

  // Load configuration and starred lists on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    setDark(savedTheme === "dark");

    const savedBg = (localStorage.getItem("library-bg") as BackgroundStyle) || "default";
    setBgStyle(savedBg);

    if (isAuthenticated) {
      fetchDocuments();
      const userKey = `starred-docs-${activeUser?.id || 'guest'}`;
      const deletedKey = `deleted-folders-${activeUser?.id || 'guest'}`;
      try {
        const savedStars = localStorage.getItem(userKey);
        if (savedStars) {
          setStarredIds(JSON.parse(savedStars));
        }
      } catch (e) {
        console.error(e);
      }
      try {
        const savedDeleted = localStorage.getItem(deletedKey);
        if (savedDeleted) {
          setDeletedFolders(JSON.parse(savedDeleted));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAuthenticated, activeUser]);

  const handleToggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    localStorage.setItem("app-theme", nextDark ? "dark" : "light");
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleCycleBg = () => {
    const bgStyles: BackgroundStyle[] = ["default", "nebula", "geometry"];
    const nextIdx = (bgStyles.indexOf(bgStyle) + 1) % bgStyles.length;
    const nextBg = bgStyles[nextIdx];
    setBgStyle(nextBg);
    localStorage.setItem("library-bg", nextBg);
  };

  const handleToggleStar = (id: number) => {
    const userKey = `starred-docs-${activeUser?.id || 'guest'}`;
    const nextStars = starredIds.includes(id)
      ? starredIds.filter(x => x !== id)
      : [...starredIds, id];
    setStarredIds(nextStars);
    localStorage.setItem(userKey, JSON.stringify(nextStars));
  };

  const handleDocSelect = (doc: any) => {
    handleOpenWorkspace(doc);
    router.push(`/viewer/${doc.id}`);
  };

  // Get dynamic categories list from real documents
  const allCategories = [
    "Tất cả danh mục",
    ...Array.from(new Set(documents.map((d: any) => d.category).filter(Boolean)))
  ];

  // Get dynamic categories list from real documents (excluding empty/Khác for actual folders)
  const folderCategories = Array.from(
    new Set([
      "Toán học",
      "Vật lý",
      "Hóa học",
      "Sinh học",
      "Tiếng Anh",
      "Lịch sử",
      "Trí tuệ nhân tạo",
      ...documents.map((d: any) => d.category).filter(Boolean)
    ])
  ).filter(cat => cat !== "Khác" && cat !== "Tất cả danh mục" && cat !== "" && !deletedFolders.includes(cat));

  // Client side filtered list
  const filteredDocs = documents.filter((doc: any) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "Tất cả danh mục" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate displayed documents based on folder selection
  const displayedDocs = selectedFolder
    ? filteredDocs.filter((doc: any) => doc.category === selectedFolder)
    : filteredDocs.filter((doc: any) => !doc.category || doc.category === "Khác" || !folderCategories.includes(doc.category));

  const pageBg = dark ? "#121212" : "#ebe8e0";
  const textMain = dark ? "#f0f0f0" : "#1a2e1c";
  const textSub = dark ? "#6b7280" : "#6b7280";
  const primaryColor = dark ? "#10b981" : "#1a2e1c";
  const cardBorder = dark ? "#2a2a2a" : "rgba(26,46,28,0.2)";
  const sidebarBorder = dark ? "#2a2a2a" : "rgba(26,46,28,0.15)";

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 pb-12 relative overflow-x-hidden"
      style={{
        background: bgStyle === "default" ? pageBg : "transparent",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      <Background styleType={bgStyle} dark={dark} />

      {/* Floating Global Navbar */}
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      {/* Toolbar Sub-navbar */}
      <div className="pt-20">
        <div
          className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center border-b"
          style={{ borderColor: dark ? "#222" : "rgba(26,46,28,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ArrowLeft size={14} /> Trang chủ
            </Link>
          </div>

          <div className="flex items-center gap-4 z-10">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 font-sans">
              <Flame size={16} color="#f97316" className="animate-pulse" strokeWidth={2.75} />
              <span
                style={{
                  fontWeight: 700,
                  color: dark ? "#d1d5db" : "#374151",
                  fontSize: 13
                }}
              >
                {activeUser?.streak || 0} ngày Streak
              </span>
            </div>

            {/* Background Style Switcher */}
            <button
              onClick={handleCycleBg}
              className="px-3 h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:opacity-80 text-xs font-bold font-sans"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
                color: dark ? "#f0f0f0" : "#1a2e1c"
              }}
              title="Đổi kiểu hình nền"
            >
              {bgStyle === "default" && (
                <>
                  <EyeOff size={14} strokeWidth={2.75} /> Tối giản
                </>
              )}
              {bgStyle === "nebula" && (
                <>
                  <Palette size={14} className="text-emerald-500" strokeWidth={2.75} /> Tinh vân
                </>
              )}
              {bgStyle === "geometry" && (
                <>
                  <Activity size={14} className="text-blue-500" strokeWidth={2.75} /> Hình học
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={handleToggleDark}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: dark ? "#2a2a2a" : "#f3f3f0",
                border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.18)"}`,
              }}
            >
              {dark ? (
                <Sun size={15} color="#10b981" strokeWidth={2.75} />
              ) : (
                <Moon size={15} color="#1a2e1c" strokeWidth={2.75} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 mt-6 flex-1 flex flex-col overflow-x-hidden relative z-10">
        <div className="flex-1 flex flex-col space-y-6 w-full">
          
          {/* Page Heading Section */}
          <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
            <div>
              <h1
                style={{
                  fontWeight: 800,
                  color: textMain,
                  fontSize: 22,
                  letterSpacing: "-0.5px",
                  marginBottom: 4,
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                Thư viện của tôi
              </h1>
              <p style={{ color: textSub, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                Quản lý và ôn tập các tài liệu cá nhân của bạn
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setIsUploadOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  borderRadius: 12, border: "none",
                  background: primaryColor, color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  boxShadow: dark ? "3px 3px 0 rgba(255,255,255,0.03)" : "3px 3px 0 rgba(26,46,28,0.12)",
                }}
              >
                <Plus size={15} />
                Tải tài liệu lên
              </button>
            )}
          </div>

          {/* Search + Filter controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
              <Search
                size={14}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                color={textSub}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tài liệu..."
                style={{
                  width: "100%", padding: "9px 12px 9px 36px", borderRadius: 12,
                  border: `2px solid ${sidebarBorder}`,
                  background: dark ? "#1e1e1e" : "#ffffff",
                  color: textMain, fontSize: 13, fontFamily: "'Outfit', sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={13} color={textSub} />
                </button>
              )}
            </div>

            {/* Tag/Category Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                  borderRadius: 12, border: `2px solid ${sidebarBorder}`,
                  background: dark ? "#1e1e1e" : "#ffffff",
                  color: textMain, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                  boxShadow: dark ? "3px 3px 0 rgba(255,255,255,0.02)" : "3px 3px 0 rgba(26,46,28,0.08)",
                }}
              >
                <SlidersHorizontal size={13} color={textSub} />
                {categoryFilter}
                <ChevronDown size={13} color={textSub} />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                        background: dark ? "#1e1e1e" : "#ffffff",
                        border: `2px solid ${sidebarBorder}`,
                        borderRadius: 12, overflow: "hidden", minWidth: 180,
                        boxShadow: dark ? "4px 4px 0 rgba(0,0,0,0.4)" : "4px 4px 0 rgba(26,46,28,0.12)",
                      }}
                    >
                      {allCategories.map((cat: string) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setCategoryFilter(cat);
                            setShowFilterDropdown(false);
                          }}
                          style={{
                            display: "block", width: "100%", padding: "9px 14px",
                            textAlign: "left", border: "none", cursor: "pointer",
                            background: categoryFilter === cat ? (dark ? "rgba(16,185,129,0.12)" : "rgba(26,46,28,0.07)") : "transparent",
                            color: categoryFilter === cat ? primaryColor : textMain,
                            fontWeight: categoryFilter === cat ? 700 : 400,
                            fontSize: 13, fontFamily: "'Outfit', sans-serif",
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* View Grid/List toggles */}
            <div
              style={{
                display: "flex", borderRadius: 10, overflow: "hidden",
                border: `2px solid ${sidebarBorder}`,
                background: dark ? "#1e1e1e" : "#ffffff",
              }}
            >
              {(["grid", "list"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "7px 12px", border: "none", cursor: "pointer",
                    background: viewMode === mode ? (dark ? "rgba(16,185,129,0.15)" : "rgba(26,46,28,0.08)") : "transparent",
                    color: viewMode === mode ? primaryColor : textSub,
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "grid" ? <Grid3X3 size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>

            <span style={{ marginLeft: "auto", fontSize: 12, color: textSub, fontFamily: "'Outfit', sans-serif" }}>
              {filteredDocs.length} tài liệu
            </span>
          </div>

          {/* Folders Grid */}
          {!selectedFolder && (
            <div className="space-y-4">
              <h2 style={{ fontSize: 14, fontWeight: 800, color: textMain, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                <FolderOpen size={16} /> Thư mục tài liệu (Thể loại)
              </h2>
              <div 
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 16,
                  padding: "6px 4px",
                  marginBottom: 32
                }}
              >
                {folderCategories.map((cat) => (
                  <FolderCard
                    key={cat}
                    category={cat}
                    count={documents.filter((d: any) => d.category === cat).length}
                    dark={dark}
                    isDragOver={dragOverFolder === cat}
                    isDragActive={!!draggedDoc}
                    onClick={() => setSelectedFolder(cat)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = "move";
                      }
                      if (dragOverFolder !== cat) setDragOverFolder(cat);
                    }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => handleDropOnFolder(e, cat)}
                    onDelete={(e) => handleDeleteFolder(cat, e)}
                    onRename={(e) => handleRenameFolder(cat, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Folder Path / Trail Header */}
          {selectedFolder && (
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 10, 
                marginBottom: 20,
                padding: "8px 12.5px",
                borderRadius: 12,
                background: dark ? "rgba(255,255,255,0.02)" : "rgba(26,46,28,0.03)",
                border: `1.5px solid ${sidebarBorder}`
              }}
            >
              <button
                onClick={() => setSelectedFolder(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move";
                  }
                  if (dragOverFolder !== "Khác") setDragOverFolder("Khác");
                }}
                onDragLeave={() => setDragOverFolder(null)}
                onDrop={(e) => {
                  handleDropOnFolder(e, "Khác");
                  setSelectedFolder(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: `2px dashed ${dragOverFolder === "Khác" ? getCategoryColor("Khác") : sidebarBorder}`,
                  background: dragOverFolder === "Khác" ? getCategoryColor("Khác") + "15" : (dark ? "#1e1e1e" : "#ffffff"),
                  color: dragOverFolder === "Khác" ? getCategoryColor("Khác") : textMain,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title="Thả tài liệu vào đây để đưa ra ngoài thư mục"
              >
                <span style={{ pointerEvents: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <ArrowLeft size={13} /> Quay lại & Đưa ra ngoài
                </span>
              </button>
              <span className="text-gray-400 font-bold">/</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: textMain, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                Thư mục: <span style={{ color: getCategoryColor(selectedFolder) }}>{selectedFolder}</span>
              </span>
            </div>
          )}

          {/* Section title for documents list */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: textMain, fontFamily: "'Outfit', sans-serif" }}>
              {selectedFolder ? `Tài liệu trong thư mục` : `Tài liệu ở ngoài thư mục`}
            </h2>
            <span style={{ fontSize: 12, color: textSub, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              {displayedDocs.length} tài liệu
            </span>
          </div>

          {/* List/Grid of Documents */}
          {displayedDocs.length === 0 ? (
            <div
              className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6"
              style={{ borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.15)" }}
            >
              <FolderOpen size={48} className="text-gray-300 dark:text-zinc-700 mb-4" />
              <h3 className="font-bold text-sm" style={{ color: textMain }}>
                Không tìm thấy tài liệu nào ở đây
              </h3>
              <p className="text-xs mt-1 mb-5" style={{ color: textSub }}>
                {selectedFolder
                  ? "Kéo thả tài liệu từ bên ngoài vào thư mục này để phân loại."
                  : "Mọi tài liệu đã được phân loại vào các thư mục thể loại ở trên."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              layout
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
                padding: "6px 4px",
              }}
            >
              {displayedDocs.map((doc: any, i: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.045 }}
                >
                  <DocCard
                    doc={doc}
                    dark={dark}
                    starred={starredIds.includes(doc.id)}
                    onStar={handleToggleStar}
                    onDelete={handleDeleteDocument}
                    onEdit={handleStartEdit}
                    onShare={handleShareClick}
                    onSelect={() => handleDocSelect(doc)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                border: `2px solid ${cardBorder}`,
                borderRadius: 16, overflow: "hidden",
                boxShadow: dark ? "4px 4px 0 rgba(255,255,255,0.02)" : "4px 4px 0 rgba(26,46,28,0.08)",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
                  borderBottom: `1px solid ${cardBorder}`,
                  background: dark ? "rgba(255,255,255,0.02)" : "rgba(26,46,28,0.03)",
                }}
              >
                <div style={{ width: 40 }} />
                <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: textSub, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tên tài liệu</div>
                <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: textSub, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Danh mục</div>
                <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: textSub, fontFamily: "'Outfit', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Kích thước</div>
                <div style={{ width: 40 }} />
              </div>

              {displayedDocs.map((doc: any, i: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <DocRow
                    doc={doc}
                    dark={dark}
                    starred={starredIds.includes(doc.id)}
                    onStar={handleToggleStar}
                    onDelete={handleDeleteDocument}
                    onEdit={handleStartEdit}
                    onShare={handleShareClick}
                    onSelect={() => handleDocSelect(doc)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal Component */}
      <AnimatePresence>
        {isUploadOpen && (
          <UploadDocumentModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onSuccess={fetchDocuments}
            defaultCategory={selectedFolder || ""}
            existingCategories={folderCategories}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal Component */}
      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            triggerMessage={triggerMessage}
          />
        )}
      </AnimatePresence>

      {/* Edit/Rename Modal Component */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDoc(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md border-2 rounded-2xl shadow-xl p-6 overflow-hidden z-10"
              style={{
                background: dark ? "#1e1e1e" : "#ffffff",
                borderColor: dark ? "#3a3a3a" : "rgba(26,46,28,0.22)",
                color: textMain,
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              <h3 className="text-base font-bold mb-4" style={{ color: textMain }}>
                Chỉnh sửa tài liệu
              </h3>
              
              <div className="space-y-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: textSub }}>
                    Tên tài liệu
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-xl outline-none text-sm font-medium"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                      background: dark ? "#2d2d2d" : "#fbfbfa",
                      color: textMain,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: textSub }}>
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-xl outline-none text-sm font-medium"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                      background: dark ? "#2d2d2d" : "#fbfbfa",
                      color: textMain,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    placeholder="Ví dụ: Tiếng Anh, Toán học..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `2px solid ${dark ? "#3a3a3a" : "rgba(26,46,28,0.15)"}`,
                    background: dark ? "#2a2a2a" : "#f3f3f0",
                    color: textSub,
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!editTitle.trim()) return;
                    const success = await handleEditDocument(editingDoc.id, editTitle, editCategory);
                    if (success) {
                      setEditingDoc(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: "none",
                    background: primaryColor,
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Folder Action Modal */}
      <AnimatePresence>
        {folderModalConfig && folderModalConfig.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFolderModalConfig(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm border-2 rounded-2xl shadow-xl p-5 overflow-hidden z-10 font-sans"
              style={{
                background: dark ? "#1a1a1a" : "#ffffff",
                borderColor: dark ? "#2a2a2a" : "rgba(26,46,28,0.18)",
                color: textMain,
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: textMain }}>
                {folderModalConfig.type === "delete" ? "Xóa thư mục" : "Đổi tên thư mục"}
              </h3>
              
              {folderModalConfig.type === "delete" ? (
                <p style={{ fontSize: 12, lineHeight: 1.6, color: dark ? "#a0a0a0" : "#4a5568", marginBottom: 20 }}>
                  {folderModalConfig.message}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: dark ? "#888" : "#666" }}>
                    Tên thư mục mới
                  </label>
                  <input
                    type="text"
                    value={folderModalConfig.inputValue || ""}
                    onChange={(e) => setFolderModalConfig({
                      ...folderModalConfig,
                      inputValue: e.target.value
                    })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        folderModalConfig.onConfirm(folderModalConfig.inputValue);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `2px solid ${dark ? "#2d2d2d" : "rgba(26,46,28,0.12)"}`,
                      background: dark ? "#262626" : "#fcfcfc",
                      color: textMain,
                      fontSize: 13,
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                    autoFocus
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => setFolderModalConfig(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: `2px solid ${dark ? "#2a2a2a" : "rgba(26,46,28,0.1)"}`,
                    background: dark ? "#242424" : "#f4f4f2",
                    color: dark ? "#aaa" : "#555",
                    fontWeight: 700,
                    fontSize: 11
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => folderModalConfig.onConfirm(folderModalConfig.inputValue)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: "none",
                    background: folderModalConfig.type === "delete" ? "#ef4444" : primaryColor,
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 11
                  }}
                >
                  {folderModalConfig.type === "delete" ? "Xóa thư mục" : "Lưu thay đổi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        resourceId={shareDoc?.id} 
        resourceType="document" 
        triggerMessage={triggerMessage} 
      />
    </div>
  );
}
