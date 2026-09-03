'use client';

import { Search, X } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery, chatFilter, setChatFilter } = useChatStore();

  const filters = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: 'Belum dibaca' },
    { key: 'favorites', label: 'Favorit' },
    { key: 'groups', label: 'Grup' },
  ] as const;

  return (
    <div className="p-2.5 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)] flex flex-col gap-2 shrink-0 select-none">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-[var(--wa-text-secondary)] pointer-events-none">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kontak atau pesan..."
          className="w-full pl-9 pr-8 py-1.5 bg-[var(--wa-header-bg)] rounded-xl text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 text-sm focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] border border-transparent focus:border-[#8b5cf6]/40 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] p-0.5 rounded-full"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filters.map((f) => {
          const isActive = chatFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setChatFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#7c3aed]/25 text-[#a78bfa] border border-[#8b5cf6]/40 shadow-sm'
                  : 'bg-[var(--wa-header-bg)] text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)] border border-transparent'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
