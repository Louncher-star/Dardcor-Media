'use client';

import { useRef } from 'react';
import { Image, FileText, Camera, User, BarChart2 } from 'lucide-react';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (file: File, type: 'image' | 'video' | 'document') => void;
}

export function AttachmentMenu({ isOpen, onClose, onSelectMedia }: AttachmentMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectMedia(file, type);
      onClose();
    }
  };

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const isVideo = file.type.startsWith('video');
            onSelectMedia(file, isVideo ? 'video' : 'image');
            onClose();
          }
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        onChange={(e) => handleFileChange(e, 'document')}
        className="hidden"
      />

      {/* Popover Menu */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-16 left-3 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-[var(--wa-border)] p-2 z-50 flex flex-col gap-1 select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        {/* Photos & Videos */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#bf59cf] to-[#e07eed] text-white flex items-center justify-center shadow-md">
            <Image size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--wa-text-primary)]">
            Foto & Video
          </span>
        </button>

        {/* Documents */}
        <button
          onClick={() => docInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5f66cd] to-[#7f85e9] text-white flex items-center justify-center shadow-md">
            <FileText size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--wa-text-primary)]">
            Dokumen
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e542a3] to-[#f468bb] text-white flex items-center justify-center shadow-md">
            <Camera size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--wa-text-primary)]">
            Kamera
          </span>
        </button>

        {/* Poll / Placeholder */}
        <button
          onClick={() => {
            alert('Fitur jajak pendapat (polling) segera hadir.');
            onClose();
          }}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25d366] text-white flex items-center justify-center shadow-md">
            <BarChart2 size={20} />
          </div>
          <span className="text-sm font-medium text-[var(--wa-text-primary)]">
            Polling
          </span>
        </button>
      </div>
    </>
  );
}
