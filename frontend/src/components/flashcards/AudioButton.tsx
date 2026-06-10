import React from 'react';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioButtonProps {
  isPlaying: boolean;
  onClick: (e?: React.MouseEvent) => void;
  dark?: boolean;
}

export default function AudioButton({ isPlaying, onClick, dark = false }: AudioButtonProps) {
  // Bỏ focus sau khi click để tránh lỗi nhấn phím Space bị lặp lại nút này
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.blur();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        dark 
          ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300' 
          : 'bg-[#f0f0ec] hover:bg-[#e2e2dd] text-[#10b981]'
      } ${isPlaying ? 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}`}
      title="Phát âm (Phím tắt: V)"
    >
      {isPlaying ? (
        <div className="flex items-end justify-center gap-[3px] h-4 w-4">
          <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-[3px] bg-[#10b981] rounded-full" />
          <motion.div animate={{ height: ["70%", "30%", "70%"] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-[3px] bg-[#10b981] rounded-full" />
          <motion.div animate={{ height: ["100%", "50%", "100%"] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-[3px] bg-[#10b981] rounded-full" />
        </div>
      ) : (
        <Volume2 size={18} />
      )}
    </button>
  );
}
