'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Ban,
  Bell,
  BellOff,
  Check,
  Info,
  MoreVertical,
  Phone,
  Search,
  Star,
  Timer,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';
import { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { CallModal } from './CallModal';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { formatChatListTime } from '@/lib/utils/dateUtils';
import {
  clearChatMessagesForUser,
  deleteChatForUser,
  setUserBlocked,
  updateChatPrefs,
  updateChatSettings,
} from '@/lib/services/chatService';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  onOpenInfo?: () => void;
  onToggleSearch?: () => void;
  onOpenStarred?: () => void;
}

const DISAPPEARING_OPTIONS = [
  { seconds: 0, label: 'Nonaktif' },
  { seconds: 86400, label: '24 jam' },
  { seconds: 604800, label: '7 hari' },
  { seconds: 7776000, label: '90 hari' },
];

export function ChatHeader({
  chat,
  onBack,
  onOpenInfo,
  onToggleSearch,
  onOpenStarred,
}: ChatHeaderProps) {
  const { user } = useAuthStore();
  const {
    onlineUserIds,
    typingUsers,
    blockedUserIds,
    setActiveChatId,
    setMessages,
    updateChat,
    toggleBlockedUser,
    deleteChat,
  } = useChatStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video' } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowDisappearing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherUser = chat.other_participant;
  const isOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false;
  const isBlocked = Boolean(otherUser && blockedUserIds.includes(otherUser.id));

  const chatTyping = typingUsers[chat.id];
  const isTyping = chatTyping && Object.keys(chatTyping).length > 0;
  const typingName = isTyping ? Object.values(chatTyping)[0] : '';

  const chatName = chat.is_group
    ? chat.group_name || 'Grup Komunitas'
    : otherUser?.display_name || otherUser?.username || 'Pengguna';

  const chatAvatar = chat.is_group ? chat.group_avatar_url : otherUser?.avatar_url;

  const renderSubtitle = () => {
    if (isTyping) {
      return (
        <span className="text-[var(--wa-teal)] font-medium">
          {chat.is_group ? `${typingName} sedang mengetik...` : 'sedang mengetik...'}
        </span>
      );
    }

    if (chat.is_group) {
      const participants = chat.participants || [];
      if (participants.length > 0) {
        const names = participants
          .slice(0, 4)
          .map((p) => p.profile?.display_name || (p.user_id === user?.id ? 'Anda' : 'Anggota'))
          .filter(Boolean)
          .join(', ');
        return (
          <span className="truncate">
            {names}
            {participants.length > 4 ? `, +${participants.length - 4}` : ''}
          </span>
        );
      }
      return <span>Grup obrolan</span>;
    }

    if (isOnline) {
      return <span className="text-[var(--wa-teal)]">online</span>;
    }

    if (otherUser?.last_seen) {
      return <span>terakhir dilihat {formatChatListTime(otherUser.last_seen)}</span>;
    }

    return <span>{otherUser?.about || 'Ada! Menggunakan Dardcor Media.'}</span>;
  };

  const handleClearMessages = async () => {
    if (!confirm('Bersihkan semua pesan dalam obrolan ini? Tindakan ini hanya berlaku untuk Anda.')) {
      return;
    }
    setMessages(chat.id, []);
    setMenuOpen(false);
    if (user) await clearChatMessagesForUser(chat.id, user.id);
  };

  const handleToggleMute = () => {
    const next = !chat.is_muted;
    updateChat(chat.id, { is_muted: next });
    if (user) updateChatPrefs(chat.id, user.id, { is_muted: next });
    setMenuOpen(false);
  };

  const handleToggleBlock = async () => {
    if (!user || !otherUser) return;
    const next = !isBlocked;
    if (next && !confirm(`Blokir ${chatName}? Kontak tidak akan bisa mengirim pesan.`)) return;
    toggleBlockedUser(otherUser.id);
    await setUserBlocked(user.id, otherUser.id, next);
    setMenuOpen(false);
  };

  const handleDisappearing = (seconds: number) => {
    updateChat(chat.id, { disappearing_seconds: seconds });
    if (user) updateChatSettings(chat.id, user.id, { disappearing_seconds: seconds });
    setShowDisappearing(false);
    setMenuOpen(false);
  };

  const handleDeleteChat = async () => {
    if (!user) return;
    if (!confirm(`Hapus obrolan "${chatName}"? Obrolan akan hilang dari daftar Anda.`)) return;
    await deleteChatForUser(chat.id, user.id);
    deleteChat(chat.id);
    setActiveChatId(null);
    setMenuOpen(false);
  };

  const menuItem =
    'w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition text-sm';

  return (
    <header className="h-[59px] px-3 md:px-4 bg-[var(--wa-header-bg)] flex items-center justify-between shrink-0 select-none z-10">
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer rounded-lg py-1"
        onClick={onOpenInfo}
        title="Info kontak atau grup"
      >
        {onBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden w-9 h-9 -ml-1.5 rounded-full text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)] active:scale-90 transition flex items-center justify-center shrink-0"
            title="Kembali"
            aria-label="Kembali ke daftar obrolan"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <Avatar
          src={chatAvatar}
          name={chatName}
          size="md"
          isGroup={chat.is_group}
          isOnline={isOnline}
        />

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-[16px] font-medium text-[var(--wa-text-primary)] truncate">
              {chatName}
            </h2>
            {chat.is_muted && (
              <BellOff size={14} className="text-[var(--wa-text-secondary)] shrink-0" />
            )}
          </div>
          <p className="text-[13px] text-[var(--wa-text-secondary)] truncate leading-[17px]">
            {renderSubtitle()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 text-[var(--wa-text-secondary)]">
        <button
          onClick={onToggleSearch}
          title="Cari dalam obrolan"
          aria-label="Cari dalam obrolan"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition"
        >
          <Search size={20} />
        </button>

        <button
          onClick={() => setActiveCall({ type: 'video' })}
          title="Panggilan video"
          aria-label="Panggilan video"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition"
        >
          <Video size={20} />
        </button>

        <button
          onClick={() => setActiveCall({ type: 'audio' })}
          title="Panggilan suara"
          aria-label="Panggilan suara"
          className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition"
        >
          <Phone size={19} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setShowDisappearing(false);
            }}
            title="Menu obrolan"
            aria-label="Menu obrolan"
            className="p-2 rounded-full hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)] transition"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-[230px] bg-[var(--wa-bg-sidebar)] rounded-md shadow-2xl border border-[var(--wa-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenInfo?.();
                }}
                className={menuItem}
              >
                <Info size={17} />
                <span>{chat.is_group ? 'Info grup' : 'Info kontak'}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenStarred?.();
                }}
                className={menuItem}
              >
                <Star size={17} />
                <span>Pesan berbintang</span>
              </button>

              <button onClick={handleToggleMute} className={menuItem}>
                {chat.is_muted ? <Bell size={17} /> : <BellOff size={17} />}
                <span>{chat.is_muted ? 'Bunyikan notifikasi' : 'Bisukan notifikasi'}</span>
              </button>

              <button
                onClick={() => setShowDisappearing((prev) => !prev)}
                className={menuItem}
              >
                <Timer size={17} />
                <span className="flex-1">Pesan sementara</span>
                {chat.disappearing_seconds ? (
                  <span className="text-[11px] text-[var(--wa-text-secondary)]">
                    {DISAPPEARING_OPTIONS.find((o) => o.seconds === chat.disappearing_seconds)
                      ?.label || 'Aktif'}
                  </span>
                ) : null}
              </button>

              {showDisappearing && (
                <div className="pl-4 pr-1.5 pb-1">
                  {DISAPPEARING_OPTIONS.map((option) => (
                    <button
                      key={option.seconds}
                      onClick={() => handleDisappearing(option.seconds)}
                      className="w-full px-3 py-2 flex items-center justify-between rounded text-[13px] text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)]"
                    >
                      <span>{option.label}</span>
                      {(chat.disappearing_seconds || 0) === option.seconds && (
                        <Check size={15} className="text-[var(--wa-teal)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!chat.is_group && (
                <button
                  onClick={handleToggleBlock}
                  className={cn(menuItem, 'text-rose-500')}
                >
                  <Ban size={17} />
                  <span>{isBlocked ? 'Buka blokir kontak' : 'Blokir kontak'}</span>
                </button>
              )}

              <div className="my-1.5 border-t border-[var(--wa-border)]" />

              <button onClick={handleClearMessages} className={menuItem}>
                <Trash2 size={17} />
                <span>Bersihkan obrolan</span>
              </button>

              <button onClick={handleDeleteChat} className={cn(menuItem, 'text-rose-500')}>
                <Trash2 size={17} />
                <span>Hapus obrolan</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setActiveChatId(null);
                }}
                className={menuItem}
              >
                <XCircle size={17} />
                <span>Tutup obrolan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Fullscreen Interactive Audio/Video Call */}
      {activeCall && (
        <CallModal
          isOpen={Boolean(activeCall)}
          callType={activeCall.type}
          contact={otherUser || null}
          chatName={chatName}
          onClose={() => setActiveCall(null)}
        />
      )}
    </header>
  );
}
