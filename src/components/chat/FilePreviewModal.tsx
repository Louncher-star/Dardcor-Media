'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  FileText,
  FileCode,
  Archive,
  Music,
  Film,
  Smile,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useChatStore } from '@/lib/store/useChatStore';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: File | null;
  fileType: 'image' | 'video' | 'audio' | 'document';
  isUploading: boolean;
  uploadStatus?: string;
  onClose: () => void;
  onSend: (file: File, type: 'image' | 'video' | 'audio' | 'document', caption: string) => void;
}

export function FilePreviewModal({
  isOpen,
  file,
  fileType,
  isUploading,
  uploadStatus,
  onClose,
  onSend,
}: FilePreviewModalProps) {
  const { theme } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (file && (fileType === 'image' || fileType === 'video' || fileType === 'audio')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file, fileType]);

  useEffect(() => {
    setCaption('');
    setIsEmojiOpen(false);
  }, [file]);

  // Click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted || !isOpen || !file) return null;

  const handleSend = () => {
    if (isUploading) return;
    onSend(file, fileType, caption.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const getFileBadge = () => {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const lowerExt = ext.toLowerCase();

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(lowerExt)) {
      return {
        icon: <Archive size={48} className="text-purple-400" />,
        bg: 'bg-purple-500/10 border-purple-500/20',
        text: 'text-purple-400',
        label: ext,
      };
    }
    if (['js', 'ts', 'py', 'html', 'css', 'json', 'sql', 'cpp', 'java'].includes(lowerExt)) {
      return {
        icon: <FileCode size={48} className="text-cyan-400" />,
        bg: 'bg-cyan-500/10 border-cyan-500/20',
        text: 'text-cyan-400',
        label: ext,
      };
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(lowerExt)) {
      return {
        icon: <Music size={48} className="text-pink-400" />,
        bg: 'bg-pink-500/10 border-pink-500/20',
        text: 'text-pink-400',
        label: ext,
      };
    }
    if (['pdf'].includes(lowerExt)) {
      return {
        icon: <FileText size={48} className="text-red-400" />,
        bg: 'bg-red-500/10 border-red-500/20',
        text: 'text-red-400',
        label: 'PDF',
      };
    }
    if (['doc', 'docx'].includes(lowerExt)) {
      return {
        icon: <FileText size={48} className="text-blue-400" />,
        bg: 'bg-blue-500/10 border-blue-500/20',
        text: 'text-blue-400',
        label: ext,
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(lowerExt)) {
      return {
        icon: <FileText size={48} className="text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400',
        label: ext,
      };
    }

    return {
      icon: <FileQuestion size={48} className="text-slate-300" />,
      bg: 'bg-slate-500/10 border-slate-500/20',
      text: 'text-slate-300',
      label: ext,
    };
  };

  const badge = getFileBadge();

  const modalContent = (
    <div className="fixed inset-0 z-[999998] bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in fade-in duration-150 select-none">
      {/* Top Bar: Close Button & File Name */}
      <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
        <button
          onClick={onClose}
          disabled={isUploading}
          className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition disabled:opacity-50"
          title="Batal"
        >
          <X size={24} />
        </button>

        <div className="text-center min-w-0 px-4">
          <p className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{file.name}</p>
          <p className="text-xs text-white/50">{formatFileSize(file.size)}</p>
        </div>

        <div className="w-10" />
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        {fileType === 'image' && previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        ) : fileType === 'video' && previewUrl ? (
          <video
            src={previewUrl}
            controls
            className="max-h-[62vh] max-w-full rounded-xl bg-black shadow-2xl"
          />
        ) : fileType === 'audio' && previewUrl ? (
          <div className="bg-[#1e293b]/90 border border-white/15 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-md w-full text-white">
            <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
              <Music size={40} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold truncate max-w-[280px]">{file.name}</p>
              <p className="text-xs text-white/50 mt-1">{formatFileSize(file.size)}</p>
            </div>
            <audio src={previewUrl} controls className="w-full mt-2" />
          </div>
        ) : (
          /* Document or Any Generic File Preview */
          <div className="bg-[#18222d] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 max-w-md w-full shadow-2xl text-center">
            <div
              className={`w-28 h-28 rounded-2xl ${badge.bg} border flex flex-col items-center justify-center gap-1 shadow-inner`}
            >
              {badge.icon}
              <span className={`text-xs font-black tracking-wider ${badge.text}`}>
                {badge.label}
              </span>
            </div>

            <div className="min-w-0 w-full">
              <p className="text-base font-bold text-white truncate">{file.name}</p>
              <p className="text-xs text-white/50 mt-1">
                {formatFileSize(file.size)} • File {badge.label}
              </p>
            </div>

            <span className="text-[11px] text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Siap dikirimkan ke obrolan
            </span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Caption Input & Send Button ala WhatsApp */}
      <div className="max-w-2xl w-full mx-auto flex items-center gap-3 relative">
        {/* Emoji Picker Popup */}
        {isEmojiOpen && (
          <div
            ref={emojiRef}
            className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            <EmojiPicker
              theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
              onEmojiClick={(e) => setCaption((prev) => prev + e.emoji)}
              width={340}
              height={380}
            />
          </div>
        )}

        <div className="flex-1 bg-[#2a3942] border border-white/10 rounded-2xl flex items-center px-4 py-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => setIsEmojiOpen(!isEmojiOpen)}
            className="p-1.5 text-white/60 hover:text-white transition rounded-full"
            title="Tambah Emoji"
          >
            <Smile size={22} />
          </button>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isUploading}
            placeholder="Tambah keterangan..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 px-3 py-2 focus:outline-none"
          />
        </div>

        {/* Send Button with Progress Feedback */}
        {isUploading ? (
          <div className="flex items-center gap-2 bg-[#00a884]/20 border border-[#00a884]/40 px-4 py-2.5 rounded-2xl text-xs text-[#00a884] font-medium shrink-0 animate-pulse">
            <Loader2 size={18} className="animate-spin text-[#00a884] shrink-0" />
            <span className="truncate max-w-[200px]">{uploadStatus || 'Mengunggah file...'}</span>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25d366] hover:from-[#00b58e] hover:to-[#22c55e] text-white flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
            title="Kirim File"
          >
            <Send size={20} className="translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
