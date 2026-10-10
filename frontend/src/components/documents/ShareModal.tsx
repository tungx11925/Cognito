import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Globe, Lock, Users, Copy, Check, EyeOff, Loader2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceType: 'document' | 'deck';
  triggerMessage: (msg: string, type?: 'success' | 'error') => void;
  onShareUpdated?: () => void;
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  resourceId, 
  resourceType, 
  triggerMessage,
  onShareUpdated 
}: ShareModalProps) {
  const [visibility, setVisibility] = useState<'private' | 'restricted' | 'public'>('private');
  const [accessType, setAccessType] = useState<'viewer' | 'editor' | 'forker'>('viewer');
  const [isCommunityPublished, setIsCommunityPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!isOpen || !resourceId) return;

    let isMounted = true;
    const fetchCurrentStatus = async () => {
      setInitialLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/shares/status/${resourceType}/${resourceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setVisibility(data.visibility || 'private');
            setIsCommunityPublished(Boolean(data.isCommunityPublished));
            if (data.shareUrl) setShareUrl(data.shareUrl);
            if (data.accessType) setAccessType(data.accessType);
          }
        }
      } catch (err) {
        console.warn('Could not load current share status', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchCurrentStatus();
    return () => { isMounted = false; };
  }, [isOpen, resourceId, resourceType, API_BASE_URL]);

  if (!isOpen) return null;

  const handleSaveShareSettings = async (targetVisibility?: 'private' | 'restricted' | 'public') => {
    const selectedVis = targetVisibility || visibility;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { visibility: selectedVis, accessType };
      if (resourceType === 'document') body.documentId = resourceId;
      else body.deckId = resourceId;

      const res = await fetch(`${API_BASE_URL}/shares/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setVisibility(selectedVis);
        setIsCommunityPublished(selectedVis === 'public');
        if (selectedVis === 'private') {
          setShareUrl('');
          triggerMessage("Đã gỡ khỏi cộng đồng và chuyển về chế độ riêng tư thành công.", "success");
        } else {
          setShareUrl(data.shareUrl || '');
          triggerMessage(
            selectedVis === 'public'
              ? "Tài liệu đã được công khai lên Cộng đồng thành công!"
              : "Đã bật chia sẻ bằng liên kết (Không xuất hiện trên Cộng đồng).",
            "success"
          );
        }
        if (onShareUpdated) onShareUpdated();
      } else {
        triggerMessage(data.error || "Lỗi khi cập nhật quyền chia sẻ", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Chia sẻ {resourceType === 'document' ? 'tài liệu' : 'bộ thẻ ghi nhớ'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              1 Nguồn sự thật: Kiểm soát hiển thị trên Cộng đồng & Liên kết
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Đang tải trạng thái chia sẻ...</span>
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Trạng thái hiện tại:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    visibility === 'public' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : visibility === 'restricted'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {visibility === 'public' ? 'Công khai trên Cộng đồng' : visibility === 'restricted' ? 'Chia sẻ bằng link' : 'Riêng tư (Chỉ mình bạn)'}
                  </span>
                </div>

                {/* Nút gỡ nhanh nếu đang công khai */}
                {isCommunityPublished && (
                  <button
                    onClick={() => handleSaveShareSettings('private')}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 hover:underline font-medium"
                  >
                    <EyeOff size={13} />
                    Gỡ khỏi Cộng đồng
                  </button>
                )}
              </div>

              {/* 3 Lựa chọn rõ ràng */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Chọn quyền truy cập
                </h3>
                <div className="space-y-2.5">
                  {/* 1. Riêng tư */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'private' 
                      ? 'border-primary/60 bg-primary/5 shadow-sm' 
                      : 'border-border/70 hover:border-border hover:bg-muted/20'
                  }`}>
                    <input 
                      type="radio" 
                      name="visibility" 
                      className="mt-1 text-primary focus:ring-primary" 
                      checked={visibility === 'private'} 
                      onChange={() => setVisibility('private')} 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                        <Lock size={15} className="text-muted-foreground" /> 
                        Riêng tư (Chỉ chủ sở hữu)
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chỉ mình bạn có quyền xem và thao tác. Ẩn khỏi trang Cộng đồng và Tìm kiếm.
                      </p>
                    </div>
                  </label>

                  {/* 2. Chia sẻ bằng liên kết */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'restricted' 
                      ? 'border-primary/60 bg-primary/5 shadow-sm' 
                      : 'border-border/70 hover:border-border hover:bg-muted/20'
                  }`}>
                    <input 
                      type="radio" 
                      name="visibility" 
                      className="mt-1 text-primary focus:ring-primary" 
                      checked={visibility === 'restricted'} 
                      onChange={() => setVisibility('restricted')} 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                        <Users size={15} className="text-blue-500" /> 
                        Chia sẻ bằng liên kết (Link-only)
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bất kỳ ai có đường link đều có thể xem ở chế độ chỉ đọc. <strong>Không xuất hiện</strong> trên bảng tin Cộng đồng.
                      </p>
                    </div>
                  </label>

                  {/* 3. Công khai lên Cộng đồng */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'public' 
                      ? 'border-primary/60 bg-primary/5 shadow-sm' 
                      : 'border-border/70 hover:border-border hover:bg-muted/20'
                  }`}>
                    <input 
                      type="radio" 
                      name="visibility" 
                      className="mt-1 text-primary focus:ring-primary" 
                      checked={visibility === 'public'} 
                      onChange={() => setVisibility('public')} 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                        <Globe size={15} className="text-emerald-500" /> 
                        Công khai lên Cộng đồng
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Xuất hiện ngay tại <strong>Cộng đồng</strong>, <strong>Tìm kiếm công khai</strong>, và <strong>Hồ sơ của bạn</strong>.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Share URL Box */}
              {shareUrl && visibility !== 'private' && (
                <div className="p-3 bg-muted/50 rounded-xl border border-border/80 space-y-1.5">
                  <div className="text-[11px] font-medium text-muted-foreground">Đường dẫn chia sẻ trực tiếp:</div>
                  <div className="flex items-center justify-between gap-2 bg-background p-2 rounded-lg border border-border">
                    <span className="text-xs text-foreground truncate font-mono select-all">{shareUrl}</span>
                    <button 
                      onClick={handleCopy} 
                      className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      {copied ? <Check size={12} className="text-green-300" /> : <Copy size={12} />}
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button 
            onClick={() => handleSaveShareSettings()} 
            disabled={loading || initialLoading}
            className="px-4 py-2 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Đang lưu...' : (visibility === 'public' ? 'Lưu & Đăng Cộng đồng' : 'Cập nhật')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
