'use client';

import { useRef } from 'react';
import { Image, FileText, Camera, Headphones, BarChart2 } from 'lucide-react';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document') => void;
}

export function AttachmentMenu({ isOpen, onClose, onSelectMedia }: AttachmentMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type?: 'image' | 'video' | 'audio' | 'document') => {
    const file = e.target.files?.[0];
    if (file) {
      let resolvedType: 'image' | 'video' | 'audio' | 'document' = type || 'document';
      if (!type) {
        if (file.type.startsWith('image/')) resolvedType = 'image';
        else if (file.type.startsWith('video/')) resolvedType = 'video';
        else if (file.type.startsWith('audio/')) resolvedType = 'audio';
        else resolvedType = 'document';
      }
      onSelectMedia(file, resolvedType);
      onClose();
    }
    // Reset value so re-selecting same file works
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden File Inputs */}
      {/* 1. Photos & Videos */}
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
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* 2. Documents (Bisa upload file apapun tanpa batasan ekstensi ala WhatsApp Real) */}
      <input
        type="file"
        ref={docInputRef}
        accept="*/*"
        onChange={(e) => handleFileChange(e, 'document')}
        className="hidden"
      />

      {/* 3. Audio Files */}
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
        className="hidden"
      />

      {/* 4. Camera */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />

      {/* Popover Menu */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-16 left-3 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-[var(--wa-border)] p-2 z-50 flex flex-col gap-1 select-none animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[200px]"
      >
        {/* Documents (File Apapun) */}
        <button
          onClick={() => docInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5f66cd] to-[#7f85e9] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--wa-text-primary)] block">
              Dokumen
            </span>
            <span className="text-[11px] text-[var(--wa-text-secondary)] block">
              File apa saja (PDF, ZIP, APK, dll)
            </span>
          </div>
        </button>

        {/* Photos & Videos */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#bf59cf] to-[#e07eed] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Image size={20} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--wa-text-primary)] block">
              Foto & Video
            </span>
            <span className="text-[11px] text-[var(--wa-text-secondary)] block">
              Galeri gambar & rekaman
            </span>
          </div>
        </button>

        {/* Audio / Music */}
        <button
          onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e542a3] to-[#f468bb] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Headphones size={20} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--wa-text-primary)] block">
              Audio
            </span>
            <span className="text-[11px] text-[var(--wa-text-secondary)] block">
              Musik & berkas suara
            </span>
          </div>
        </button>

        {/* Camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ef4444] to-[#f87171] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Camera size={20} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--wa-text-primary)] block">
              Kamera
            </span>
            <span className="text-[11px] text-[var(--wa-text-secondary)] block">
              Ambil foto instan
            </span>
          </div>
        </button>

        {/* Poll */}
        <button
          onClick={() => {
            alert('Fitur jajak pendapat (polling) segera hadir di pembaruan berikutnya.');
            onClose();
          }}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[var(--wa-hover)] text-left transition group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25d366] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <BarChart2 size={20} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--wa-text-primary)] block">
              Polling
            </span>
            <span className="text-[11px] text-[var(--wa-text-secondary)] block">
              Buat pertanyaan & suara
            </span>
          </div>
        </button>
      </div>
    </>
  );
}
