'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Ban,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  Forward,
  Reply,
  Smile,
  Star,
  Trash2,
} from 'lucide-react';
import { Message } from '@/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { formatMessageTime } from '@/lib/utils/dateUtils';
import { MediaMessage } from './MediaMessage';
import { VoiceMessage } from './VoiceMessage';
import { PollMessageBubble } from './PollMessageBubble';
import { MessageReactions, ReactionPickerBar } from './MessageReactions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { setStarredMessage } from '@/lib/services/chatService';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isGroup?: boolean;
  searchQuery?: string;
  onForward?: (message: Message) => void;
  showTail?: boolean;
}

export function MessageBubble({
  message,
  isGroup = false,
  searchQuery = '',
  onForward,
  showTail = true,
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const {
    setReplyingToMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    starredMessageIds,
    toggleStarMessage,
  } = useChatStore();

  const isMe = user?.id === message.sender_id;
  const isDeleted = message.is_deleted_for_all;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number>(0);

  const isStarred = starredMessageIds.includes(message.id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setReactionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReact = async (emoji: string) => {
    if (!user) return;
    const existing = message.reactions?.find((r) => r.user_id === user.id);

    if (existing && existing.emoji === emoji) {
      removeReaction(message.chat_id, message.id, user.id);
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', message.id)
          .eq('user_id', user.id);
      }
    } else {
      const newReaction = {
        id: `rx_${Date.now()}`,
        message_id: message.id,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
      };
      addReaction(message.chat_id, newReaction);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from('message_reactions').upsert({
          message_id: message.id,
          user_id: user.id,
          emoji,
        });
      }
    }
  };

  const handleReply = () => {
    setReplyingToMessage(message);
    setMenuOpen(false);
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setMenuOpen(false);
  };

  const handleStar = async () => {
    toggleStarMessage(message.id);
    if (user) await setStarredMessage(user.id, message.id, !isStarred);
    setMenuOpen(false);
  };

  const handleForward = () => {
    onForward?.(message);
    setMenuOpen(false);
  };

  const handleDelete = async (forAll: boolean) => {
    if (forAll) {
      deleteMessage(message.chat_id, message.id, true);
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from('messages')
          .update({
            is_deleted_for_all: true,
            content: 'Pesan ini telah dihapus.',
          })
          .eq('id', message.id);
      }
    } else {
      deleteMessage(message.chat_id, message.id, false);
      if (isSupabaseConfigured() && user) {
        const supabase = createClient();
        await supabase.from('message_deleted_for_users').insert({
          message_id: message.id,
          user_id: user.id,
        });
      }
    }
    setMenuOpen(false);
  };

  // Status Centang Read Receipts
  const renderTicks = () => {
    if (!isMe) return null;

    const hasRead = message.statuses?.some((s) => s.status === 'read');
    const hasDelivered = message.statuses?.some((s) => s.status === 'delivered');

    if (hasRead) {
      return <CheckCheck size={15} className="text-[var(--wa-ticks-blue)]" />;
    }
    if (hasDelivered) {
      return <CheckCheck size={15} className="text-[var(--wa-ticks-gray)]" />;
    }
    return <Check size={15} className="text-[var(--wa-ticks-gray)]" />;
  };

  return (
    <div
      id={`msg-${message.id}`}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        longPressTimer.current = setTimeout(() => setMenuOpen(true), 500);
      }}
      onTouchEnd={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (swipeOffset > 42) {
          handleReply();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(30);
            } catch {}
          }
        }
        setSwipeOffset(0);
      }}
      onTouchMove={(e) => {
        const deltaX = e.touches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 10 && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        // Swipe ke kanan ala WhatsApp (maks 65px)
        if (deltaX > 0 && deltaX < 75) {
          setSwipeOffset(deltaX);
        } else if (deltaX <= 0) {
          setSwipeOffset(0);
        }
      }}
      className={cn(
        'w-full flex my-[1px] relative group select-text scroll-mt-4 items-center',
        isMe ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Swipe To Reply Indicator (Mobile Gesture) */}
      {swipeOffset > 10 && (
        <div
          className="absolute left-2 z-10 w-7 h-7 rounded-full bg-[var(--wa-header-bg)] border border-[var(--wa-border)] flex items-center justify-center text-[var(--wa-teal)] shadow transition-opacity"
          style={{ opacity: Math.min(1, swipeOffset / 40) }}
        >
          <Reply size={15} />
        </div>
      )}

      <div
        ref={menuRef}
        style={{
          transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : undefined,
        }}
        className={cn(
          'relative max-w-[85%] sm:max-w-[65%] rounded-[7.5px] px-[9px] py-[6px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[14.2px] leading-[19px] transition-colors',
          isMe
            ? cn(
                'bg-[var(--wa-green-outgoing)] text-[var(--wa-text-primary)]',
                showTail && 'rounded-tr-none bubble-tail-out'
              )
            : cn(
                'bg-[var(--wa-bubble-incoming)] text-[var(--wa-text-primary)]',
                showTail && 'rounded-tl-none bubble-tail-in'
              ),
          message.reactions && message.reactions.length > 0 ? 'mb-3' : ''
        )}
      >
        {/* Floating Reaction Picker Bar */}
        <ReactionPickerBar
          isOpen={reactionPickerOpen}
          onSelect={handleReact}
          onClose={() => setReactionPickerOpen(false)}
          isMe={isMe}
        />

        {/* Sender Name in Group Chat */}
        {isGroup && !isMe && message.sender && (
          <div className="text-[13px] font-semibold text-[#7c3aed] dark:text-[#c4b5fd] mb-0.5 select-none">
            {message.sender.display_name || message.sender.username}
          </div>
        )}

        {/* Replying-To Quote Preview */}
        {message.reply_to && (
          <div className="mb-1.5 px-2 py-1.5 bg-black/[0.06] dark:bg-white/[0.06] border-l-4 border-[var(--wa-teal)] rounded-[4px] text-[12.5px] select-none overflow-hidden">
            <span className="font-semibold text-[#7c3aed] dark:text-[#c4b5fd] block truncate">
              {message.reply_to.sender?.display_name || 'Seseorang'}
            </span>
            <span className="text-[var(--wa-text-secondary)] truncate block">
              {message.reply_to.content || 'Media'}
            </span>
          </div>
        )}

        {/* Message Content */}
        {isDeleted ? (
          <div className="italic text-[var(--wa-text-secondary)] flex items-center gap-1.5 py-1">
            <Ban size={14} />
            <span>Pesan ini telah dihapus.</span>
          </div>
        ) : (
          <>
            {/* Media (Image / Video / Document) */}
            {message.media_url && message.message_type !== 'audio' && (
              <MediaMessage message={message} />
            )}

            {/* Audio Voice Note */}
            {message.message_type === 'audio' && (
              <VoiceMessage message={message} isMe={isMe} />
            )}

            {/* WhatsApp Interactive Poll */}
            {message.message_type === 'poll' && (
              <PollMessageBubble message={message} isMe={isMe} />
            )}

            {/* Text Message */}
            {message.content && message.message_type !== 'poll' && (
              <div className="whitespace-pre-wrap break-words leading-[19px] pr-14">
                {searchQuery.trim()
                  ? highlightText(message.content, searchQuery.trim())
                  : message.content}
              </div>
            )}
          </>
        )}

        {/* Time and Status Ticks (Bottom Right of Bubble) */}
        <div className="flex items-center justify-end gap-1 text-[11px] text-[var(--wa-text-secondary)] mt-1 -mb-0.5 select-none ml-auto float-right clear-both whitespace-nowrap">
          {isStarred && <Star size={11} className="text-amber-400 fill-amber-400" />}
          <span>{formatMessageTime(message.created_at)}</span>
          {renderTicks()}
        </div>

        {/* Hover Action Menu Trigger */}
        {!isDeleted && (
          <div
            className={cn(
              'absolute top-1 transition-opacity flex items-center gap-0.5 select-none z-30',
              menuOpen || reactionPickerOpen
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto',
              isMe ? 'sm:left-[-48px] right-2 sm:right-auto' : 'sm:right-[-48px] right-2'
            )}
          >
            {/* React Icon */}
            <button
              onClick={() => setReactionPickerOpen(!reactionPickerOpen)}
              title="Reaksi"
              className="p-1.5 rounded-full bg-[var(--wa-header-bg)] border border-[var(--wa-border)] shadow text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
            >
              <Smile size={14} />
            </button>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                title="Opsi Pesan"
                className="p-1.5 rounded-full bg-[var(--wa-header-bg)] border border-[var(--wa-border)] shadow text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
              >
                <ChevronDown size={14} />
              </button>

              {menuOpen && (
                <div
                  className={cn(
                    'absolute top-8 w-44 bg-white dark:bg-[#233138] rounded-xl shadow-2xl border border-[var(--wa-border)] py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100',
                    isMe ? 'right-0' : 'left-0'
                  )}
                >
                  <button
                    onClick={handleReply}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--wa-hover)] text-left transition"
                  >
                    <Reply size={14} />
                    <span>Balas Pesan</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--wa-hover)] text-left transition"
                  >
                    <Copy size={14} />
                    <span>Salin Teks</span>
                  </button>

                  <button
                    onClick={handleForward}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--wa-hover)] text-left transition"
                  >
                    <Forward size={14} />
                    <span>Teruskan</span>
                  </button>

                  <button
                    onClick={handleStar}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--wa-hover)] text-left transition"
                  >
                    <Star
                      size={14}
                      className={isStarred ? 'text-amber-400 fill-amber-400' : ''}
                    />
                    <span>{isStarred ? 'Hapus bintang' : 'Bintang'}</span>
                  </button>

                  <hr className="my-1 border-[var(--wa-border)]" />

                  <button
                    onClick={() => handleDelete(false)}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-red-500/10 text-red-500 text-left transition"
                  >
                    <Trash2 size={14} />
                    <span>Hapus untuk Saya</span>
                  </button>

                  {isMe && (
                    <button
                      onClick={() => handleDelete(true)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-red-500/10 text-red-500 text-left transition"
                    >
                      <Trash2 size={14} />
                      <span>Hapus untuk Semua</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reaction Badges Pill */}
        <MessageReactions
          reactions={message.reactions}
          onReact={handleReact}
          isMe={isMe}
        />
      </div>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-amber-300/70 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}
