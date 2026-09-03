'use client';

import { MessageReaction } from '@/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { cn } from '@/lib/utils';

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageReactionsProps {
  reactions?: MessageReaction[];
  onReact: (emoji: string) => void;
  isMe: boolean;
}

export function MessageReactions({ reactions = [], onReact, isMe }: MessageReactionsProps) {
  const { user } = useAuthStore();

  if (reactions.length === 0) return null;

  // Kelompokkan reaksi berdasarkan emoji
  const grouped = reactions.reduce<{ [emoji: string]: { count: number; hasReacted: boolean } }>(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, hasReacted: false };
      }
      acc[r.emoji].count += 1;
      if (user && r.user_id === user.id) {
        acc[r.emoji].hasReacted = true;
      }
      return acc;
    },
    {}
  );

  return (
    <div
      className={cn(
        'absolute -bottom-2.5 flex items-center gap-1 z-10 select-none',
        isMe ? 'right-2' : 'left-2'
      )}
    >
      <div className="flex items-center gap-1 bg-[var(--wa-header-bg)] border border-[var(--wa-border)] rounded-full px-1.5 py-0.5 shadow-sm text-xs backdrop-blur-md">
        {Object.entries(grouped).map(([emoji, data]) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onReact(emoji);
            }}
            className={cn(
              'flex items-center gap-0.5 px-1 py-0.2 rounded-full hover:scale-110 transition',
              data.hasReacted ? 'bg-[#00a884]/20 text-[#00a884]' : ''
            )}
          >
            <span>{emoji}</span>
            {data.count > 1 && (
              <span className="text-[10px] font-medium text-[var(--wa-text-secondary)]">
                {data.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ReactionPickerBarProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isMe: boolean;
}

export function ReactionPickerBar({ isOpen, onSelect, onClose, isMe }: ReactionPickerBarProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'absolute -top-10 flex items-center gap-1 bg-[var(--wa-header-bg)] border border-[var(--wa-border)] rounded-full px-2 py-1 shadow-xl z-30 animate-in zoom-in-95 duration-150',
        isMe ? 'right-0' : 'left-0'
      )}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="text-lg p-1 hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
