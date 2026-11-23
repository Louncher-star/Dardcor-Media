'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { formatDateDivider } from '@/lib/utils/dateUtils';

interface MessageListProps {
  messages: Message[];
  isGroup?: boolean;
  searchQuery?: string;
  activeMessageId?: string | null;
  onForward?: (message: Message) => void;
}

export function MessageList({
  messages,
  isGroup = false,
  searchQuery = '',
  activeMessageId = null,
  onForward,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  useEffect(() => {
    if (!activeMessageId) return;
    document.getElementById(`msg-${activeMessageId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeMessageId]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  // Kelompokkan pesan berdasarkan tanggal untuk Sticky Date Dividers
  const renderMessagesWithDateDividers = () => {
    let lastDate = '';

    return messages.map((msg, index) => {
      const msgDate = new Date(msg.created_at).toDateString();
      const showDivider = msgDate !== lastDate;
      lastDate = msgDate;

      // WhatsApp hanya menampilkan ekor pada gelembung terakhir dari satu rangkaian
      const next = messages[index + 1];
      const sameRun =
        Boolean(next) &&
        next.sender_id === msg.sender_id &&
        new Date(next.created_at).toDateString() === msgDate &&
        new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() < 5 * 60 * 1000;

      return (
        <div key={msg.id} className="w-full">
          {showDivider && (
            <div className="flex justify-center my-2 select-none">
              <span className="px-3 py-1.5 bg-[var(--wa-bg-sidebar)] rounded-lg text-[11px] font-medium text-[var(--wa-text-secondary)] shadow-sm uppercase tracking-wide">
                {formatDateDivider(msg.created_at)}
              </span>
            </div>
          )}
          <MessageBubble
            message={msg}
            isGroup={isGroup}
            searchQuery={searchQuery}
            onForward={onForward}
            showTail={!sameRun}
          />
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-10 lg:px-[6%] py-2 wa-chat-wallpaper relative flex flex-col"
    >
      {/* Encryption Top Notice */}
      <div className="flex justify-center my-1.5 select-none">
        <div className="max-w-[520px] bg-[#fdf0dd] dark:bg-[#182229] text-[#54656f] dark:text-[#ffd279] rounded-lg px-3 py-1.5 text-[12.5px] leading-[17px] text-center flex items-center justify-center gap-1.5">
          <Lock size={12} className="shrink-0" />
          <span>
            Pesan dan panggilan terenkripsi end-to-end. Hanya peserta obrolan ini yang dapat membuka isinya.
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col justify-end">
        {renderMessagesWithDateDividers()}
      </div>

      <div ref={bottomRef} className="h-2" />

      {/* Floating Scroll-To-Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-20 right-6 md:right-10 p-2.5 rounded-full bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] shadow-lg transition-all z-20 animate-in fade-in"
        >
          <ChevronDown size={20} />
        </button>
      )}
    </div>
  );
}
