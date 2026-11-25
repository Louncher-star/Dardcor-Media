'use client';

import { useState } from 'react';
import { Pin, PinOff, ChevronRight, X } from 'lucide-react';
import { PinnedMessage } from '@/types';
import { unpinMessage } from '@/lib/services/chatService';

interface PinnedMessagesBannerProps {
  pinnedMessages: PinnedMessage[];
  chatId: string;
  onJumpToMessage: (messageId: string) => void;
  onRefresh: () => void;
}

export function PinnedMessagesBanner({
  pinnedMessages,
  chatId,
  onJumpToMessage,
  onRefresh,
}: PinnedMessagesBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const safeIndex = Math.min(currentIndex, pinnedMessages.length - 1);
  const currentPin = pinnedMessages[safeIndex];
  const msg = currentPin?.message;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handleUnpin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPin) return;
    try {
      await unpinMessage(chatId, currentPin.message_id);
      onRefresh();
    } catch (err) {
      console.error('Error unpinning message:', err);
    }
  };

  const getPreviewText = () => {
    if (!msg) return 'Pesan tersemat';
    if (msg.message_type === 'poll') return '📊 Jajak Pendapat';
    if (msg.message_type === 'image') return '📷 Foto';
    if (msg.message_type === 'video') return '🎥 Video';
    if (msg.message_type === 'audio') return '🎵 Pesan Suara';
    if (msg.message_type === 'document') return `📄 ${msg.media_name || 'Dokumen'}`;
    return msg.content || 'Pesan tersemat';
  };

  return (
    <div
      onClick={() => onJumpToMessage(currentPin.message_id)}
      className="h-10 px-3 md:px-4 bg-[var(--wa-header-bg)]/90 backdrop-blur-md border-b border-[var(--wa-border)] flex items-center justify-between text-xs select-none cursor-pointer hover:bg-[var(--wa-hover)] transition z-20 shrink-0 shadow-sm"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0">
          <Pin size={13} className="rotate-45" />
        </div>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="font-semibold text-[var(--wa-text-primary)] shrink-0">
            Pesan Tersemat
            {pinnedMessages.length > 1 && (
              <span className="ml-1 text-[10px] font-normal text-[var(--wa-text-secondary)]">
                ({safeIndex + 1}/{pinnedMessages.length})
              </span>
            )}
            :
          </span>
          <span className="text-[var(--wa-text-secondary)] truncate">
            {getPreviewText()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {pinnedMessages.length > 1 && (
          <button
            onClick={handleNext}
            className="p-1 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
            title="Pesan Tersemat Berikutnya"
          >
            <ChevronRight size={15} />
          </button>
        )}
        <button
          onClick={handleUnpin}
          className="p-1 rounded-full text-[var(--wa-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 transition"
          title="Lepas Sematan"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
