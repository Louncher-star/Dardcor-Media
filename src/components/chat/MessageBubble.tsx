'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, ChevronDown, Reply, Smile, Copy, Trash2, Ban } from 'lucide-react';
import { Message } from '@/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { formatMessageTime } from '@/lib/utils/dateUtils';
import { MediaMessage } from './MediaMessage';
import { VoiceMessage } from './VoiceMessage';
import { MessageReactions, ReactionPickerBar } from './MessageReactions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isGroup?: boolean;
}

export function MessageBubble({ message, isGroup = false }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const { setReplyingToMessage, deleteMessage, addReaction, removeReaction } = useChatStore();

  const isMe = user?.id === message.sender_id;
  const isDeleted = message.is_deleted_for_all;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      return <CheckCheck size={16} className="text-[#c084fc]" />;
    }
    if (hasDelivered) {
      return <CheckCheck size={16} className="text-[var(--wa-text-secondary)]" />;
    }
    return <Check size={16} className="text-[var(--wa-text-secondary)]" />;
  };

  return (
    <div
      className={cn(
        'w-full flex my-1 relative group select-text',
        isMe ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        ref={menuRef}
        className={cn(
          'relative max-w-[85%] sm:max-w-[70%] rounded-xl px-3 py-1.5 shadow-sm text-sm transition-all',
          isMe
            ? 'bg-[var(--wa-green-outgoing)] text-[var(--wa-text-primary)] rounded-tr-none'
            : 'bg-[var(--wa-bubble-incoming)] text-[var(--wa-text-primary)] rounded-tl-none',
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
          <div className="text-xs font-semibold text-[#c084fc] mb-0.5 select-none">
            {message.sender.display_name || message.sender.username}
          </div>
        )}

        {/* Replying-To Quote Preview */}
        {message.reply_to && (
          <div className="mb-1.5 p-2 bg-black/5 dark:bg-white/5 border-l-4 border-[#8b5cf6] rounded text-xs select-none">
            <span className="font-semibold text-[#c084fc] block truncate">
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

            {/* Text Message */}
            {message.content && (
              <div className="whitespace-pre-wrap break-words leading-relaxed pr-14">
                {message.content}
              </div>
            )}
          </>
        )}

        {/* Time and Status Ticks (Bottom Right of Bubble) */}
        <div className="flex items-center justify-end gap-1 text-[11px] text-[var(--wa-text-secondary)] mt-0.5 select-none ml-auto float-right clear-both">
          <span>{formatMessageTime(message.created_at)}</span>
          {renderTicks()}
        </div>

        {/* Hover Action Menu Trigger */}
        {!isDeleted && (
          <div
            className={cn(
              'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 select-none',
              isMe ? 'left-[-46px]' : 'right-[-46px]'
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
