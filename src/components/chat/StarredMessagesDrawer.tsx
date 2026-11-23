'use client';

import { ArrowLeft, FileText, Star, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { setStarredMessage } from '@/lib/services/chatService';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface StarredMessagesDrawerProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StarredMessagesDrawer({ chatId, isOpen, onClose }: StarredMessagesDrawerProps) {
  const { user } = useAuthStore();
  const { messages, starredMessageIds, toggleStarMessage } = useChatStore();

  if (!isOpen) return null;

  const starredMessages = (messages[chatId] || []).filter((m) =>
    starredMessageIds.includes(m.id)
  );

  const handleUnstar = async (messageId: string) => {
    toggleStarMessage(messageId);
    if (user) await setStarredMessage(user.id, messageId, false);
  };

  const handleJump = (messageId: string) => {
    onClose();
    setTimeout(() => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-[140] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative w-full md:max-w-[400px] h-full bg-[var(--wa-bg-sidebar)] flex flex-col shadow-2xl panel-slide-in">
        <header className="h-16 px-4 flex items-center gap-3 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-bold text-[var(--wa-text-primary)]">Pesan berbintang</h2>
            <p className="text-[11px] text-[var(--wa-text-secondary)]">
              {starredMessages.length} pesan disimpan
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          {starredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-[var(--wa-text-secondary)]">
              <div className="w-14 h-14 rounded-full bg-[var(--wa-hover)] flex items-center justify-center">
                <Star size={24} />
              </div>
              <p className="text-sm font-medium text-[var(--wa-text-primary)]">Belum ada pesan berbintang</p>
              <p className="text-xs max-w-[240px]">
                Tekan lama atau buka menu pesan, lalu pilih Bintang untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            starredMessages.map((msg) => (
              <div
                key={msg.id}
                className="group flex items-start gap-2 p-2.5 mb-2 rounded-xl bg-[var(--wa-header-bg)] hover:bg-[var(--wa-hover)] transition"
              >
                <button onClick={() => handleJump(msg.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-[#c084fc] truncate">
                      {msg.sender?.display_name || msg.sender?.username || 'Anda'}
                    </span>
                    <span className="text-[10px] text-[var(--wa-text-secondary)] shrink-0">
                      {formatChatListTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--wa-text-primary)] line-clamp-3 break-words">
                    {msg.is_deleted_for_all ? (
                      <span className="italic text-[var(--wa-text-secondary)]">Pesan telah dihapus</span>
                    ) : msg.content ? (
                      msg.content
                    ) : msg.message_type === 'audio' ? (
                      'Pesan suara'
                    ) : (
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> {msg.media_name || 'Media'}
                      </span>
                    )}
                  </p>
                </button>

                <button
                  onClick={() => handleUnstar(msg.id)}
                  title="Hapus bintang"
                  className="p-1.5 rounded-full text-amber-400 hover:bg-amber-400/10 transition shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
