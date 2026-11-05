'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileQuestion,
  Film,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { Avatar } from '@/components/ui/Avatar';
import { formatFullMediaDateTime } from '@/lib/utils/dateUtils';
import { formatFileSize } from '@/lib/utils';
import { Message } from '@/types';
import { downloadMediaFile } from '@/lib/utils/mediaUtils';

export function MediaLightboxModal() {
  const { user } = useAuthStore();
  const { activeChatId, messages, lightboxMessage, setLightboxMessage } = useChatStore();

  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kumpulkan semua file foto dan video dalam obrolan aktif untuk navigasi carousel
  const mediaList = useMemo(() => {
    if (!activeChatId) return [];
    const chatMsgs = messages[activeChatId] || [];
    return chatMsgs.filter(
      (m) =>
        !m.is_deleted_for_all &&
        m.media_url &&
        (m.message_type === 'image' || m.message_type === 'video')
    );
  }, [activeChatId, messages]);

  // Tentukan indeks media saat ini
  const currentIndex = useMemo(() => {
    if (!lightboxMessage) return -1;
    return mediaList.findIndex((m) => m.id === lightboxMessage.id);
  }, [lightboxMessage, mediaList]);

  const currentMedia = currentIndex !== -1 ? mediaList[currentIndex] : lightboxMessage;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset transform saat berganti gambar
  useEffect(() => {
    resetTransform();
  }, [lightboxMessage?.id, resetTransform]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < mediaList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setLightboxMessage(mediaList[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, mediaList, setLightboxMessage]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setLightboxMessage(mediaList[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, mediaList, setLightboxMessage]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleZoom = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      resetTransform();
    }
  };

  // Keyboard shortcut ala WhatsApp Web
  useEffect(() => {
    if (!lightboxMessage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxMessage(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key.toLowerCase() === 'r') {
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMessage, handlePrev, handleNext, setLightboxMessage]);

  // Pan dragging handler saat di-zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download helper yang handal ala WhatsApp
  const handleDownload = async () => {
    if (!currentMedia?.media_url) return;
    const fileName =
      currentMedia.media_name ||
      (currentMedia.message_type === 'video' ? 'video.mp4' : 'foto.jpg');

    try {
      await downloadMediaFile(currentMedia.media_url, fileName);
    } catch (err: unknown) {
      console.error('Download error in lightbox:', err);
      alert('Gagal mengunduh media: ' + (err instanceof Error ? err.message : 'Koneksi terputus'));
    }
  };

  if (!mounted || !lightboxMessage || !currentMedia) return null;

  const isMe = user?.id === currentMedia.sender_id;
  const senderName = isMe
    ? 'Anda'
    : currentMedia.sender?.display_name || currentMedia.sender?.username || 'Pengirim';

  const modalContent = (
    <div
      onClick={() => setLightboxMessage(null)}
      className="fixed inset-0 z-[999999] bg-[#0c1317]/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-150 text-white overflow-hidden"
    >
      {/* ================= TOP HEADER BAR ================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0c1317]/80 border-b border-white/10 z-30 shrink-0"
      >
        {/* Left: Sender Information & Date */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={currentMedia.sender?.avatar_url}
            name={senderName}
            size="sm"
            className="ring-1 ring-white/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                {senderName}
              </span>
              {mediaList.length > 1 && currentIndex !== -1 && (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  {currentIndex + 1} dari {mediaList.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50 truncate">
              {formatFullMediaDateTime(currentMedia.created_at)}
            </p>
          </div>
        </div>

        {/* Right: Actions (Zoom, Rotate, Download, Close) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {currentMedia.message_type === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                title="Perkecil (-)"
              >
                <ZoomOut size={19} />
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                title="Perbesar (+)"
              >
                <ZoomIn size={19} />
              </button>

              {zoom !== 1 && (
                <button
                  onClick={resetTransform}
                  className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
                  title="Reset Zoom"
                >
                  <RotateCcw size={17} />
                </button>
              )}

              <button
                onClick={handleRotate}
                className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
                title="Putar 90° (R)"
              >
                <RotateCw size={19} />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Unduh File"
          >
            <Download size={19} />
          </button>

          <button
            onClick={() => setLightboxMessage(null)}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition ml-1"
            title="Tutup (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* ================= MAIN MEDIA CANVAS ================= */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden min-h-0"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Previous Chevron (<) */}
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#00a884] text-white flex items-center justify-center transition shadow-2xl backdrop-blur-sm z-30 hover:scale-105 active:scale-95 border border-white/10"
            title="Media Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Floating Next Chevron (>) */}
        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#00a884] text-white flex items-center justify-center transition shadow-2xl backdrop-blur-sm z-30 hover:scale-105 active:scale-95 border border-white/10"
            title="Media Selanjutnya (Panah Kanan)"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Media Content: Image or Video */}
        {currentMedia.message_type === 'image' ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleToggleZoom}
            onMouseDown={handleMouseDown}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x}px, ${pan.y}px)`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              transition: isDragging ? 'none' : 'transform 0.18s ease-out',
            }}
            className="relative select-none max-h-[72vh] max-w-[88vw] flex items-center justify-center"
          >
            <img
              src={currentMedia.media_url!}
              alt={currentMedia.media_name || 'Foto Pratinjau'}
              draggable={false}
              className="max-h-[72vh] max-w-[88vw] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
            />
          </div>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[72vh] max-w-[88vw] flex items-center justify-center"
          >
            <video
              src={currentMedia.media_url!}
              controls
              autoPlay
              playsInline
              className="max-h-[72vh] max-w-[88vw] rounded-xl shadow-2xl bg-black"
            />
          </div>
        )}
      </div>

      {/* ================= BOTTOM BAR & CAPTION & THUMBNAILS ================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex flex-col items-center bg-[#0c1317]/90 border-t border-white/10 z-30 shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] gap-2.5"
      >
        {/* Caption Container */}
        {currentMedia.content && (
          <div className="max-w-2xl w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-center text-sm text-white/95 shadow-lg backdrop-blur-sm">
            <p className="whitespace-pre-wrap break-words">{currentMedia.content}</p>
          </div>
        )}

        {/* Media Name & Size */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="truncate max-w-xs">{currentMedia.media_name || 'Media'}</span>
          {currentMedia.media_size && (
            <span>• {formatFileSize(currentMedia.media_size)}</span>
          )}
        </div>

        {/* WhatsApp-style Bottom Thumbnail Carousel Strip */}
        {mediaList.length > 1 && (
          <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 no-scrollbar">
            {mediaList.map((item, idx) => {
              const isActive = item.id === currentMedia.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setLightboxMessage(item)}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 relative transition-all border-2 ${
                    isActive
                      ? 'border-[#00a884] scale-105 shadow-md shadow-[#00a884]/30'
                      : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                  }`}
                  title={item.media_name || `Media ${idx + 1}`}
                >
                  {item.message_type === 'video' ? (
                    <div className="w-full h-full bg-[#182229] flex items-center justify-center text-white/80">
                      <Film size={18} />
                    </div>
                  ) : (
                    <img
                      src={item.media_url!}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
