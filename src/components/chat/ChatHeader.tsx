'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, Phone, Video, Trash2, XCircle } from 'lucide-react';
import { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
}

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  const { user } = useAuthStore();
  const { onlineUserIds, typingUsers, setActiveChatId, setMessages } = useChatStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Subtitle status
  const renderSubtitle = () => {
    if (isTyping) {
      return (
        <span className="text-[#c084fc] font-medium animate-pulse">
          {chat.is_group ? `${typingName} sedang mengetik...` : 'sedang mengetik...'}
        </span>
      );
    }

    if (chat.is_group) {
      if (chat.participants && chat.participants.length > 0) {
        const names = chat.participants
          .map((p) => p.profile?.display_name || (p.user_id === user?.id ? 'Anda' : 'Anggota'))
          .filter(Boolean)
          .join(', ');
        return <span className="truncate max-w-xs">{names}</span>;
      }
      return <span>Grup Obrolan</span>;
    }

    if (isOnline) {
      return <span className="text-[#c084fc] font-medium">online</span>;
    }

    if (otherUser?.last_seen) {
      return <span>terakhir dilihat {formatChatListTime(otherUser.last_seen)}</span>;
    }

    return <span>{otherUser?.about || 'Ada! Menggunakan Dardcor Media.'}</span>;
  };

  const handleClearMessages = () => {
    if (confirm('Bersihkan semua pesan dalam obrolan ini?')) {
      setMessages(chat.id, []);
      setMenuOpen(false);
    }
  };

  const handleCloseChat = () => {
    setActiveChatId(null);
  };

  return (
    <header className="h-16 px-4 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] flex items-center justify-between shrink-0 select-none z-10 backdrop-blur-md">
      {/* Left: Avatar & Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full"
          >
            <ArrowLeft size={20} />
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
          <h2 className="text-sm font-semibold text-[var(--wa-text-primary)] truncate">
            {chatName}
          </h2>
          <p className="text-xs text-[var(--wa-text-secondary)] truncate">
            {renderSubtitle()}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-[var(--wa-text-secondary)]">
        <button
          onClick={() => alert('Fitur panggilan video segera hadir di Dardcor Media.')}
          title="Panggilan Video"
          className="p-2.5 rounded-full hover:bg-[var(--wa-hover)] hover:text-purple-300 transition"
        >
          <Video size={19} />
        </button>

        <button
          onClick={() => alert('Fitur panggilan suara segera hadir di Dardcor Media.')}
          title="Panggilan Suara"
          className="p-2.5 rounded-full hover:bg-[var(--wa-hover)] hover:text-purple-300 transition"
        >
          <Phone size={18} />
        </button>

        <button
          title="Cari dalam obrolan"
          className="p-2.5 rounded-full hover:bg-[var(--wa-hover)] hover:text-purple-300 transition"
        >
          <Search size={19} />
        </button>

        {/* Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu Obrolan"
            className="p-2.5 rounded-full hover:bg-[var(--wa-hover)] hover:text-purple-300 transition"
          >
            <MoreVertical size={19} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-[#1f1a33] rounded-2xl shadow-2xl border border-[var(--wa-border)] py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleClearMessages}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                <Trash2 size={16} />
                <span>Bersihkan Pesan</span>
              </button>

              <button
                onClick={handleCloseChat}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
              >
                <XCircle size={16} />
                <span>Tutup Obrolan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
