'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';

export function SearchBar() {
  const { chats, searchQuery, setSearchQuery, chatFilter, setChatFilter } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChats = chats.filter((chat) => !chat.is_archived);

  const filters = [
    { key: 'all', label: 'Semua', count: activeChats.length },
    { key: 'unread', label: 'Belum dibaca', count: activeChats.filter((c) => (c.unread_count || 0) > 0).length },
    { key: 'favorites', label: 'Favorit', count: activeChats.filter((c) => c.is_pinned).length },
    { key: 'groups', label: 'Grup', count: activeChats.filter((c) => c.is_group).length },
  ] as const;

  return (
    <div className="px-3 pt-1.5 pb-2 bg-[var(--wa-bg-sidebar)] border-b border-[var(--wa-border)] flex flex-col gap-2 shrink-0 select-none">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-3 text-[var(--wa-text-secondary)] pointer-events-none"
        />

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari atau mulai obrolan baru"
          aria-label="Cari obrolan"
          className="w-full h-[35px] pl-10 pr-9 bg-[var(--wa-header-bg)] rounded-lg text-[14px] text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 transition"
        />

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            title="Hapus pencarian"
            aria-label="Hapus pencarian"
            className="absolute right-2.5 p-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => {
          const isActive = chatFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setChatFilter(f.key)}
              className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#ede9fe] text-[#6d28d9] dark:bg-[#3b2f5c] dark:text-[#e9d5ff] font-medium'
                  : 'bg-[var(--wa-header-bg)] text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)]'
              }`}
            >
              <span>{f.label}</span>
              {f.count > 0 && (
                <span
                  className={`text-[11px] tabular-nums ${
                    isActive ? 'opacity-80' : 'opacity-60'
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
