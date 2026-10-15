'use client';

import { useState } from 'react';
import {
  FileText,
  FileCode,
  Archive,
  Music,
  Download,
  Eye,
  Maximize2,
  FileQuestion,
  Smartphone,
} from 'lucide-react';
import { Message } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { useChatStore } from '@/lib/store/useChatStore';

interface MediaMessageProps {
  message: Message;
}

export function MediaMessage({ message }: MediaMessageProps) {
  const { setLightboxMessage } = useChatStore();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!message.media_url) return null;

  // 1. Gambar (Photo) ala WhatsApp Web
  if (message.message_type === 'image') {
    return (
      <div className="rounded-lg overflow-hidden my-1 max-w-sm">
        <div
          onClick={() => setLightboxMessage(message)}
          className="cursor-pointer relative group overflow-hidden rounded-lg bg-black/5"
          title="Klik untuk membuka pratinjau foto penuh"
        >
          <img
            src={message.media_url}
            alt={message.media_name || 'Foto'}
            className="w-full max-h-72 object-cover rounded-lg group-hover:opacity-95 transition"
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white gap-2">
            <span className="p-2.5 rounded-full bg-black/60 backdrop-blur-sm shadow-xl scale-95 group-hover:scale-105 transition-transform">
              <Eye size={22} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Video ala WhatsApp Web
  if (message.message_type === 'video') {
    return (
      <div className="rounded-lg overflow-hidden my-1 max-w-sm group relative">
        <div className="relative">
          <video
            src={message.media_url}
            controls
            playsInline
            className="w-full max-h-72 rounded-lg bg-black object-contain shadow-md"
          />
          <button
            onClick={() => setLightboxMessage(message)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition backdrop-blur-sm opacity-0 group-hover:opacity-100 shadow"
            title="Buka Video di Lightbox Penuh"
          >
            <Maximize2 size={16} />
          </button>
        </div>
        {message.media_name && (
          <div className="flex items-center justify-between text-[11px] text-[var(--wa-text-secondary)] mt-1 px-1">
            <span className="truncate max-w-[200px]">{message.media_name}</span>
            {message.media_size && <span>{formatFileSize(message.media_size)}</span>}
          </div>
        )}
      </div>
    );
  }

  // 3. Audio / Musik (Non-Voice Note)
  const isAudioFile =
    message.message_type === 'audio' ||
    (message.media_name &&
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(message.media_name));

  if (isAudioFile) {
    return (
      <div className="my-1 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--wa-border)]/40 max-w-sm w-full space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
              <Music size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--wa-text-primary)] truncate">
                {message.media_name || 'Berkas Audio'}
              </p>
              <p className="text-[11px] text-[var(--wa-text-secondary)]">
                {message.media_size ? formatFileSize(message.media_size) : 'Audio'} • MP3/Audio
              </p>
            </div>
          </div>

          <a
            href={message.media_url}
            download={message.media_name || 'audio.mp3'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[var(--wa-text-secondary)] hover:text-[#00a884] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
            title="Unduh Audio"
          >
            <Download size={18} />
          </a>
        </div>

        {/* Native Audio Controls */}
        <audio
          src={message.media_url}
          controls
          className="w-full h-8"
          onPlay={() => setIsPlayingAudio(true)}
          onPause={() => setIsPlayingAudio(false)}
        />
      </div>
    );
  }

  // 4. Dokumen & File Apapun (PDF, Word, Excel, ZIP, APK, Code, dll ala WhatsApp Real)
  const fileName = message.media_name || 'Dokumen';
  const fileExt = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE';
  const lowerExt = fileExt.toLowerCase();

  const getDocStyle = () => {
    if (['pdf'].includes(lowerExt)) {
      return {
        bg: 'bg-red-500/15 text-red-500 border-red-500/20',
        icon: <FileText size={22} />,
        badgeBg: 'bg-red-500 text-white',
        label: 'PDF',
      };
    }
    if (['doc', 'docx'].includes(lowerExt)) {
      return {
        bg: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
        icon: <FileText size={22} />,
        badgeBg: 'bg-blue-500 text-white',
        label: 'DOC',
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(lowerExt)) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
        icon: <FileText size={22} />,
        badgeBg: 'bg-emerald-500 text-white',
        label: 'XLS',
      };
    }
    if (['ppt', 'pptx'].includes(lowerExt)) {
      return {
        bg: 'bg-orange-500/15 text-orange-500 border-orange-500/20',
        icon: <FileText size={22} />,
        badgeBg: 'bg-orange-500 text-white',
        label: 'PPT',
      };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(lowerExt)) {
      return {
        bg: 'bg-purple-500/15 text-purple-500 border-purple-500/20',
        icon: <Archive size={22} />,
        badgeBg: 'bg-purple-500 text-white',
        label: 'ZIP',
      };
    }
    if (['apk'].includes(lowerExt)) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
        icon: <Smartphone size={22} />,
        badgeBg: 'bg-emerald-600 text-white',
        label: 'APK',
      };
    }
    if (['js', 'ts', 'py', 'html', 'css', 'json', 'sql', 'cpp', 'java', 'php'].includes(lowerExt)) {
      return {
        bg: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20',
        icon: <FileCode size={22} />,
        badgeBg: 'bg-cyan-600 text-white',
        label: fileExt,
      };
    }

    return {
      bg: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
      icon: <FileQuestion size={22} />,
      badgeBg: 'bg-slate-600 text-white',
      label: fileExt,
    };
  };

  const docStyle = getDocStyle();

  return (
    <div className="my-1 p-3 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-between gap-4 border border-[var(--wa-border)]/50 max-w-sm hover:bg-black/10 dark:hover:bg-white/10 transition group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Document Icon & Badge */}
        <div
          className={`w-11 h-11 rounded-xl ${docStyle.bg} border flex items-center justify-center shrink-0 relative shadow-sm`}
        >
          {docStyle.icon}
          <span
            className={`absolute -bottom-1 -right-1 text-[9px] font-black px-1 py-0.2 rounded ${docStyle.badgeBg} shadow-sm uppercase`}
          >
            {docStyle.label.substring(0, 4)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--wa-text-primary)] truncate group-hover:text-[#00a884] transition-colors">
            {fileName}
          </p>
          <p className="text-[11px] text-[var(--wa-text-secondary)] mt-0.5">
            {message.media_size ? formatFileSize(message.media_size) : 'File'} • {fileExt}
          </p>
        </div>
      </div>

      {/* Download Action Button */}
      <a
        href={message.media_url}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--wa-text-secondary)] hover:text-[#00a884] hover:bg-black/10 dark:hover:bg-white/20 transition shrink-0 shadow-sm"
        title={`Unduh ${fileName}`}
      >
        <Download size={18} />
      </a>
    </div>
  );
}
