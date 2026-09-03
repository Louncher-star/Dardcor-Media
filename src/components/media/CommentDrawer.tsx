'use client';

import { useState } from 'react';
import { X, Heart, Send, MessageCircle } from 'lucide-react';
import { Profile } from '@/types';
import { ScrapedComment } from '@/app/api/tiktok/comments/route';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: ScrapedComment[];
  isLoading: boolean;
  currentUser: Profile | null;
  onPostComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
}

export function CommentDrawer({
  isOpen,
  onClose,
  comments,
  isLoading,
  currentUser,
  onPostComment,
  onLikeComment,
}: CommentDrawerProps) {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onPostComment(inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-md h-[78vh] sm:h-[80vh] max-h-[700px] bg-[#1a1a1a] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-white animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#222222]">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-[#FE2C55]" />
            <h3 className="font-bold text-sm text-white">
              Komentar ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/50 text-xs gap-2">
              <div className="w-6 h-6 border-2 border-[#FE2C55] border-t-transparent rounded-full animate-spin" />
              <span>Memuat komentar realtime TikTok...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40 text-xs text-center px-4">
              <MessageCircle size={32} className="opacity-30 mb-2" />
              <p>Belum ada komentar pada video ini.</p>
              <p className="text-[11px] text-white/30 mt-1">Jadilah yang pertama memberikan komentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <img
                  src={comment.user_avatar}
                  alt={comment.user_name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-white/90 truncate">
                      {comment.user_name}
                    </span>
                    <span className="text-[10px] text-white/40">{comment.created_at}</span>
                  </div>
                  <p className="text-xs text-white/85 mt-0.5 leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>

                {/* Like comment button */}
                <button
                  onClick={() => onLikeComment(comment.id)}
                  className="flex flex-col items-center gap-0.5 p-1 text-white/40 hover:text-white transition flex-shrink-0"
                >
                  <Heart
                    size={14}
                    className={comment.liked ? 'text-[#FE2C55] fill-[#FE2C55]' : ''}
                  />
                  <span className="text-[10px]">{comment.likes || ''}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment input footer */}
        <div className="p-3 border-t border-white/10 bg-[#222222]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <img
              src={
                currentUser?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  currentUser?.username || 'user'
                )}`
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
            />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tambahkan komentar..."
              className="flex-1 bg-white/5 border border-white/15 focus:border-[#FE2C55] rounded-full px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-full bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-40 disabled:hover:bg-[#FE2C55] text-white flex items-center justify-center transition flex-shrink-0"
            >
              <Send size={14} className="translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
