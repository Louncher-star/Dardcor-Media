'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Ban,
  Bell,
  BellOff,
  Camera,
  Check,
  CheckCheck,
  FileText,
  Mail,
  Mic,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  Video,
  VolumeX,
} from 'lucide-react';
import { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { formatChatListTime } from '@/lib/utils/dateUtils';
import {
  clearChatMessagesForUser,
  deleteChatForUser,
  updateChatPrefs,
} from '@/lib/services/chatService';
import { cn } from '@/lib/utils';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
}

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const { user } = useAuthStore();
  const {
    chats,
    onlineUserIds,
    typingUsers,
    drafts,
    updateChat,
    deleteChat,
    setMessages,
    setActiveChatId,
  } = useChatStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const openMenu = (x?: number, y?: number) => {
    const rect = menuButtonRef.current?.getBoundingClientRect();
    const width = 224;
    const height = 330;
    const desiredLeft = x ?? (rect ? rect.right - width : 16);
    const desiredTop = y ?? (rect ? rect.top : 16);
    setMenuPos({
      left: Math.max(8, Math.min(desiredLeft, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(desiredTop, window.innerHeight - height - 8)),
    });
    setMenuOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherUser = chat.other_participant;
  const isOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false;

  const chatTyping = typingUsers[chat.id];
  const isTyping = chatTyping && Object.keys(chatTyping).length > 0;
  const typingName = isTyping ? Object.values(chatTyping)[0] : '';

  const chatName = chat.is_group
    ? chat.group_name || 'Grup Komunitas'
    : otherUser?.display_name || otherUser?.username || 'Pengguna';

  const chatAvatar = chat.is_group ? chat.group_avatar_url : otherUser?.avatar_url;

  const lastMsg = chat.last_message;
  const isMe = lastMsg && user && lastMsg.sender_id === user.id;
  const draft = drafts[chat.id] || '';
  const hasUnread = (chat.unread_count || 0) > 0;

  const applyPrefs = (prefs: { is_pinned?: boolean; is_archived?: boolean; is_muted?: boolean }) => {
    updateChat(chat.id, prefs);
    if (user) updateChatPrefs(chat.id, user.id, prefs);
    setMenuOpen(false);
  };

  const handleTogglePin = () => {
    if (!chat.is_pinned) {
      const currentPinnedCount = chats.filter((c) => c.is_pinned).length;
      if (currentPinnedCount >= 3) {
        alert(
          'Anda hanya dapat menyematkan maksimal 3 obrolan (standar WhatsApp). Lepaskan sematan obrolan lain terlebih dahulu.'
        );
        setMenuOpen(false);
        return;
      }
    }
    applyPrefs({ is_pinned: !chat.is_pinned });
  };
  const handleToggleMute = () => applyPrefs({ is_muted: !chat.is_muted });
  const handleToggleArchive = () => {
    applyPrefs({ is_archived: !chat.is_archived });
    if (!chat.is_archived && isActive) setActiveChatId(null);
  };

  const handleMarkUnread = () => {
    updateChat(chat.id, { unread_count: 1 });
    if (isActive) setActiveChatId(null);
    setMenuOpen(false);
  };

  const handleClear = async () => {
    if (!user) return;
    if (!confirm(`Bersihkan semua pesan di obrolan "${chatName}"? Tindakan ini hanya berlaku untuk Anda.`)) {
      return;
    }
    setMessages(chat.id, []);
    updateChat(chat.id, { last_message: null, unread_count: 0 });
    await clearChatMessagesForUser(chat.id, user.id);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Hapus obrolan "${chatName}"? Obrolan akan hilang dari daftar Anda.`)) {
      return;
    }
    await deleteChatForUser(chat.id, user.id);
    deleteChat(chat.id);
    setMenuOpen(false);
  };

  const renderMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="text-[#c084fc] font-medium flex items-center gap-1 animate-pulse">
          {chat.is_group ? `${typingName} sedang mengetik...` : 'Sedang mengetik...'}
        </span>
      );
    }

    if (draft.trim()) {
      return (
        <div className="flex items-center gap-1 truncate text-[13px] text-[var(--wa-text-secondary)]">
          <span className="shrink-0 font-medium text-[var(--wa-draft)]">Draf:</span>
          <span className="truncate">{draft}</span>
        </div>
      );
    }

    if (!lastMsg) {
      return <span className="italic text-[13px] text-[var(--wa-text-secondary)]/70">Mulai obrolan</span>;
    }

    if (lastMsg.is_deleted_for_all) {
      return (
        <span className="italic text-[13px] text-[var(--wa-text-secondary)]/70 flex items-center gap-1">
          <Ban size={13} />
          Pesan ini telah dihapus
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1 truncate text-[13px] text-[var(--wa-text-secondary)]">
        {isMe && (
          <span className="shrink-0">
            {lastMsg.statuses && lastMsg.statuses.some((s) => s.status === 'read') ? (
              <CheckCheck size={16} className="text-[var(--wa-ticks-blue)]" />
            ) : lastMsg.statuses && lastMsg.statuses.some((s) => s.status === 'delivered') ? (
              <CheckCheck size={16} className="text-[var(--wa-text-secondary)]" />
            ) : (
              <Check size={16} className="text-[var(--wa-text-secondary)]" />
            )}
          </span>
        )}

        {lastMsg.message_type === 'image' && (
          <span className="flex items-center gap-1 shrink-0 font-medium text-purple-300">
            <Camera size={14} /> Foto
          </span>
        )}
        {lastMsg.message_type === 'audio' && (
          <span className="flex items-center gap-1 shrink-0 font-medium text-[#c084fc]">
            <Mic size={14} /> Pesan suara
          </span>
        )}
        {lastMsg.message_type === 'video' && (
          <span className="flex items-center gap-1 shrink-0 font-medium text-purple-300">
            <Video size={14} /> Video
          </span>
        )}
        {lastMsg.message_type === 'document' && (
          <span className="flex items-center gap-1 shrink-0 font-medium text-purple-300">
            <FileText size={14} /> {lastMsg.media_name || 'Dokumen'}
          </span>
        )}

        {lastMsg.content && lastMsg.message_type === 'text' && (
          <span className="truncate">{lastMsg.content}</span>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => {
        if (longPressTriggered.current) {
          longPressTriggered.current = false;
          return;
        }
        onSelect();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
      }}
      onTouchStart={() => {
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
          longPressTriggered.current = true;
          openMenu();
        }, 500);
      }}
      onTouchEnd={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }}
      onTouchMove={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }}
      className={cn(
        'w-full min-h-[72px] px-[13px] py-2 flex items-center gap-3 cursor-pointer select-none transition-colors relative group',
        isActive
          ? 'bg-[var(--wa-active)]'
          : 'hover:bg-[var(--wa-hover)] bg-[var(--wa-bg-sidebar)]'
      )}
    >
      <Avatar
        src={chatAvatar}
        name={chatName}
        size="lg"
        isGroup={chat.is_group}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
        <div className="flex items-baseline justify-between mb-[3px] gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className={cn(
                'text-[15px] text-[var(--wa-text-primary)] truncate',
                hasUnread ? 'font-semibold' : 'font-normal'
              )}
            >
              {chatName}
            </h3>
            {chat.is_pinned && <Pin size={13} className="text-[var(--wa-text-secondary)] shrink-0" />}
            {chat.is_muted && <VolumeX size={14} className="text-[var(--wa-text-secondary)] shrink-0" />}
          </div>
          <span
            className={cn(
              'text-[12px] shrink-0 tabular-nums',
              hasUnread ? 'text-[var(--wa-teal)] font-medium' : 'text-[var(--wa-text-secondary)]'
            )}
          >
            {formatChatListTime(chat.last_message_at || chat.updated_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="truncate pr-1 min-w-0">
            {renderMessagePreview()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasUnread ? (
              <span className="min-w-[20px] h-5 px-1.5 bg-[var(--wa-badge)] text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                {chat.unread_count! > 99 ? '99+' : chat.unread_count}
              </span>
            ) : null}

            <div ref={menuRef} className="relative">
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuOpen) setMenuOpen(false);
                  else openMenu();
                }}
                title="Opsi obrolan"
                className="p-1.5 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-border)]/50 transition md:opacity-0 md:group-hover:opacity-100"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ top: menuPos.top, left: menuPos.left }}
                  className="fixed w-56 bg-white dark:bg-[#1f1a33] border border-[var(--wa-border)] rounded-2xl shadow-2xl py-1.5 z-[200] text-sm animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={handleTogglePin}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
                  >
                    {chat.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    <span>{chat.is_pinned ? 'Lepas sematan' : 'Sematkan obrolan'}</span>
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
                  >
                    {chat.is_muted ? <Bell size={16} /> : <BellOff size={16} />}
                    <span>{chat.is_muted ? 'Bunyikan notifikasi' : 'Bisukan notifikasi'}</span>
                  </button>

                  <button
                    onClick={handleToggleArchive}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
                  >
                    {chat.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                    <span>{chat.is_archived ? 'Keluarkan dari arsip' : 'Arsipkan obrolan'}</span>
                  </button>

                  <button
                    onClick={handleMarkUnread}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
                  >
                    <Mail size={16} />
                    <span>Tandai belum dibaca</span>
                  </button>

                  <hr className="my-1.5 border-[var(--wa-border)]" />

                  <button
                    onClick={handleClear}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
                  >
                    <Trash2 size={16} />
                    <span>Bersihkan obrolan</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 text-left text-red-500 transition"
                  >
                    <Trash2 size={16} />
                    <span>Hapus obrolan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
