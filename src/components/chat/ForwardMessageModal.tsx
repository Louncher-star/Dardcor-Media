'use client';

import { useMemo, useState } from 'react';
import { Check, Forward, Search, X } from 'lucide-react';
import { Message } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { appendMessage } from '@/lib/services/chatService';

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

export function ForwardMessageModal({ isOpen, message, onClose }: ForwardMessageModalProps) {
  const { user } = useAuthStore();
  const { chats, addMessage } = useChatStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const availableChats = useMemo(
    () =>
      chats
        .filter((chat) => !chat.is_archived)
        .filter((chat) => {
          const name = chat.is_group
            ? chat.group_name || ''
            : chat.other_participant?.display_name || chat.other_participant?.username || '';
          return name.toLowerCase().includes(search.toLowerCase());
        }),
    [chats, search]
  );

  if (!isOpen || !message) return null;

  const toggleChat = (chatId: string) => {
    setSelected((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (!user || selected.length === 0) return;
    setIsSending(true);

    for (const chatId of selected) {
      const targetChat = chats.find((c) => c.id === chatId);
      if (!targetChat) continue;

      const newId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

      const forwarded: Message = {
        id: newId,
        chat_id: chatId,
        sender_id: user.id,
        content: message.content,
        message_type: message.message_type,
        media_url: message.media_url,
        media_name: message.media_name,
        media_size: message.media_size,
        media_mime_type: message.media_mime_type,
        media_duration: message.media_duration,
        reply_to_id: null,
        reply_to: null,
        is_deleted_for_all: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: user,
        reactions: [],
        statuses: [],
      };

      addMessage(forwarded);
      await appendMessage(forwarded, user.id, targetChat.other_participant?.id);
    }

    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md max-h-[85dvh] bg-[var(--wa-bg-sidebar)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="h-14 px-4 flex items-center justify-between bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <Forward size={18} className="text-purple-300" />
            <h2 className="text-sm font-bold text-[var(--wa-text-primary)]">Teruskan pesan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-3 py-2 border-b border-[var(--wa-border)] shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--wa-text-secondary)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obrolan..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--wa-header-bg)] rounded-xl text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {availableChats.length === 0 ? (
            <p className="p-6 text-center text-xs text-[var(--wa-text-secondary)]">
              Tidak ada obrolan yang cocok.
            </p>
          ) : (
            availableChats.map((chat) => {
              const name = chat.is_group
                ? chat.group_name || 'Grup'
                : chat.other_participant?.display_name || chat.other_participant?.username || 'Pengguna';
              const checked = selected.includes(chat.id);

              return (
                <button
                  key={chat.id}
                  onClick={() => toggleChat(chat.id)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--wa-hover)] transition text-left"
                >
                  <Avatar
                    src={chat.is_group ? chat.group_avatar_url : chat.other_participant?.avatar_url}
                    name={name}
                    size="md"
                    isGroup={chat.is_group}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--wa-text-primary)] truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-[var(--wa-text-secondary)] truncate">
                      {chat.is_group
                        ? `${chat.participants?.length || 0} anggota`
                        : `@${chat.other_participant?.username || 'pengguna'}`}
                    </p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white'
                        : 'border-[var(--wa-text-secondary)]'
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <footer className="p-3 border-t border-[var(--wa-border)] shrink-0">
          <button
            onClick={handleForward}
            disabled={selected.length === 0 || isSending}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-sm font-semibold disabled:opacity-50 transition"
          >
            {isSending ? 'Mengirim...' : `Kirim ke ${selected.length || 0} obrolan`}
          </button>
        </footer>
      </div>
    </div>
  );
}
