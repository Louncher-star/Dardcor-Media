'use client';

import { useState } from 'react';
import { FileText, Download, Play, Eye, X } from 'lucide-react';
import { Message } from '@/types';
import { formatFileSize } from '@/lib/utils';

interface MediaMessageProps {
  message: Message;
}

export function MediaMessage({ message }: MediaMessageProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!message.media_url) return null;

  // 1. Gambar (Photo)
  if (message.message_type === 'image') {
    return (
      <div className="rounded-lg overflow-hidden my-1 max-w-sm">
        <div
          onClick={() => setIsPreviewOpen(true)}
          className="cursor-pointer relative group overflow-hidden rounded-lg bg-black/5"
        >
          <img
            src={message.media_url}
            alt={message.media_name || 'Foto'}
            className="w-full max-h-72 object-cover rounded-lg group-hover:opacity-95 transition"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
            <Eye size={24} />
          </div>
        </div>

        {/* Lightbox Preview Modal */}
        {isPreviewOpen && (
          <div
            onClick={() => setIsPreviewOpen(false)}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={24} />
            </button>
            <img
              src={message.media_url}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {message.content && (
              <p className="mt-4 text-white text-sm text-center max-w-lg select-text">
                {message.content}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. Video
  if (message.message_type === 'video') {
    return (
      <div className="rounded-lg overflow-hidden my-1 max-w-sm">
        <video
          src={message.media_url}
          controls
          className="w-full max-h-72 rounded-lg bg-black object-contain"
        />
      </div>
    );
  }

  // 3. Dokumen (PDF, Word, zip, dsb)
  if (message.message_type === 'document') {
    return (
      <div className="my-1 p-3 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-between gap-4 border border-[var(--wa-border)]/40 max-w-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--wa-text-primary)] truncate">
              {message.media_name || 'Dokumen'}
            </p>
            <p className="text-[11px] text-[var(--wa-text-secondary)]">
              {message.media_size ? formatFileSize(message.media_size) : 'File'}
            </p>
          </div>
        </div>

        <a
          href={message.media_url}
          download={message.media_name || 'dokumen'}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-[var(--wa-text-secondary)] hover:text-[#00a884] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
        >
          <Download size={18} />
        </a>
      </div>
    );
  }

  return null;
}
