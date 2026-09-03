'use client';

import { Check, CheckCheck, Camera, Mic, Video, FileText, Pin, VolumeX, Ban } from 'lucide-react';
import { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { formatChatListTime } from '@/lib/utils/dateUtils';
import { cn } from '@/lib/utils';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
}

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const { user } = useAuthStore();
  const { onlineUserIds, typingUsers } = useChatStore();

  const otherUser = chat.other_participant;
  const isOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false;

  const chatTyping = typingUsers[chat.id];
  const isTyping = chatTyping && Object.keys(chatTyping).length > 0;
  const typingName = isTyping ? Object.values(chatTyping)[0] : '';

  const chatName = chat.is_group
    ? chat.group_name || 'Grup Komunitas'
    : otherUser?.display_name || otherUser?.username || 'Pengguna';

  const chatAvatar = chat.is_group
    ? chat.group_avatar_url
    : otherUser?.avatar_url;

  const lastMsg = chat.last_message;
  const isMe = lastMsg && user && lastMsg.sender_id === user.id;

  // Render Last Message Icon & Preview Text
  const renderMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="text-[#c084fc] font-medium flex items-center gap-1 animate-pulse">
          {chat.is_group ? `${typingName} sedang mengetik...` : 'Sedang mengetik...'}
        </span>
      );
    }

    if (!lastMsg) {
      return <span className="italic text-[var(--wa-text-secondary)]/70">Mulai obrolan</span>;
    }

    if (lastMsg.is_deleted_for_all) {
      return (
        <span className="italic text-[var(--wa-text-secondary)]/70 flex items-center gap-1">
          <Ban size={13} />
          Pesan ini telah dihapus
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1 truncate text-xs text-[var(--wa-text-secondary)]">
        {/* Delivery checkmarks if sent by me */}
        {isMe && (
          <span className="shrink-0">
            {lastMsg.statuses && lastMsg.statuses.some((s) => s.status === 'read') ? (
              <CheckCheck size={16} className="text-[#a855f7]" />
            ) : lastMsg.statuses && lastMsg.statuses.some((s) => s.status === 'delivered') ? (
              <CheckCheck size={16} className="text-[var(--wa-text-secondary)]" />
            ) : (
              <Check size={16} className="text-[var(--wa-text-secondary)]" />
            )}
          </span>
        )}

        {/* Media Icon */}
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

        {/* Text snippet */}
        {lastMsg.content && lastMsg.message_type === 'text' && (
          <span className="truncate">{lastMsg.content}</span>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'w-full h-[72px] px-3 flex items-center gap-3 cursor-pointer select-none transition-colors relative border-b border-[var(--wa-border)]/40',
        isActive
          ? 'bg-[var(--wa-active)] dark:bg-[#272042]'
          : 'hover:bg-[var(--wa-hover)] bg-[var(--wa-bg-sidebar)]'
      )}
    >
      {/* Avatar */}
      <Avatar
        src={chatAvatar}
        name={chatName}
        size="lg"
        isGroup={chat.is_group}
        isOnline={isOnline}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
        {/* Top Row: Name & Timestamp */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[var(--wa-text-primary)] truncate">
            {chatName}
          </h3>
          <span className="text-[11px] text-[var(--wa-text-secondary)] shrink-0 ml-2 font-medium">
            {formatChatListTime(chat.last_message_at || chat.updated_at)}
          </span>
        </div>

        {/* Bottom Row: Message preview & Unread badge */}
        <div className="flex items-center justify-between">
          <div className="truncate text-xs text-[var(--wa-text-secondary)] pr-2">
            {renderMessagePreview()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Unread Count Badge */}
            {chat.unread_count && chat.unread_count > 0 ? (
              <span className="min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md shadow-purple-900/40">
                {chat.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
