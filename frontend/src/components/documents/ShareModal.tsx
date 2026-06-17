import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Link as LinkIcon, Globe, Lock, Users, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceType: 'document' | 'deck';
  triggerMessage: (msg: string, type?: 'success'|'error') => void;
}

export default function ShareModal({ isOpen, onClose, resourceId, resourceType, triggerMessage }: ShareModalProps) {
  const [visibility, setVisibility] = useState<'private' | 'restricted' | 'public'>('private');
  const [accessType, setAccessType] = useState<'viewer' | 'editor' | 'forker'>('viewer');
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { visibility, accessType };
      if (resourceType === 'document') body.documentId = resourceId;
      else body.deckId = resourceId;

      if (visibility === 'public') {
        body.price = price;
      }

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
        if (visibility === 'private') {
          triggerMessage("Đã chuyển tài nguyên về chế độ riêng tư.");
          onClose();
        } else {
          setShareUrl(data.shareUrl);
          triggerMessage("Đã cập nhật quyền chia sẻ thành công.");
        }
      } else {
        triggerMessage(data.error || "Lỗi khi chia sẻ", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
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
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#1a3d28]">Chia sẻ {resourceType === 'document' ? 'tài liệu' : 'bộ thẻ'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quyền truy cập chung */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quyền truy cập chung</h3>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === 'private' ? 'border-[#1a3d28] bg-green-50/50' : 'border-gray-200'}`}>
                <input type="radio" name="visibility" className="mt-1" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-900"><Lock size={16} /> Hạn chế (Riêng tư)</div>
                  <p className="text-sm text-gray-500">Chỉ bạn mới có quyền truy cập tài nguyên này.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === 'restricted' ? 'border-[#1a3d28] bg-green-50/50' : 'border-gray-200'}`}>
                <input type="radio" name="visibility" className="mt-1" checked={visibility === 'restricted'} onChange={() => setVisibility('restricted')} />
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-900"><Users size={16} /> Bất kỳ ai có đường liên kết</div>
                  <p className="text-sm text-gray-500">Bất kỳ ai trên Internet có đường liên kết đều có thể xem.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === 'public' ? 'border-[#1a3d28] bg-green-50/50' : 'border-gray-200'}`}>
                <input type="radio" name="visibility" className="mt-1" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-900"><Globe size={16} /> Công khai trên Chợ Cộng Đồng</div>
                  <p className="text-sm text-gray-500">Chia sẻ trên Marketplace để nhận lại Coins/Points.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Quyền hạn hoặc Giá */}
          {visibility === 'restricted' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vai trò</h3>
              <select 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as any)}
              >
                <option value="viewer">Người xem</option>
                <option value="editor">Người chỉnh sửa</option>
                {resourceType === 'deck' && <option value="forker">Được phép sao chép (Fork)</option>}
              </select>
            </div>
          )}

          {visibility === 'public' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Giá tiền (Xu/Points)</h3>
              <input 
                type="number" 
                min="0"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Nhập 0 để miễn phí"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Nhập 0 nếu bạn muốn đóng góp miễn phí cho cộng đồng.</p>
            </div>
          )}

          {shareUrl && visibility !== 'private' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 whitespace-nowrap">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          )}

        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Đóng</button>
          <button 
            onClick={handleGenerateLink} 
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1a3d28] hover:bg-[#143020] rounded-lg flex items-center gap-2"
          >
            {loading ? 'Đang lưu...' : (shareUrl ? 'Cập nhật' : 'Tạo liên kết')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
