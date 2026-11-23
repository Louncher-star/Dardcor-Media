'use client';

import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';

interface ChatSearchBarProps {
  query: string;
  onChange: (value: string) => void;
  onClose: () => void;
  resultCount: number;
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export function ChatSearchBar({
  query,
  onChange,
  onClose,
  resultCount,
  activeIndex,
  onNext,
  onPrev,
}: ChatSearchBarProps) {
  return (
    <div className="px-3 py-2 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] flex items-center gap-2 shrink-0">
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-[var(--wa-bg-sidebar)] rounded-full border border-[var(--wa-border)] focus-within:border-[#8b5cf6] transition">
        <Search size={16} className="text-[var(--wa-text-secondary)] shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari pesan dalam obrolan ini..."
          className="flex-1 min-w-0 bg-transparent text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 focus:outline-none"
        />
        {query && (
          <span className="text-[11px] text-[var(--wa-text-secondary)] shrink-0">
            {resultCount === 0 ? 'tidak ada' : `${activeIndex + 1}/${resultCount}`}
          </span>
        )}
      </div>

      <button
        onClick={onPrev}
        disabled={resultCount === 0}
        title="Hasil sebelumnya"
        className="p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] disabled:opacity-40 transition"
      >
        <ArrowUp size={17} />
      </button>

      <button
        onClick={onNext}
        disabled={resultCount === 0}
        title="Hasil berikutnya"
        className="p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] disabled:opacity-40 transition"
      >
        <ArrowDown size={17} />
      </button>

      <button
        onClick={onClose}
        title="Tutup pencarian"
        className="p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
      >
        <X size={17} />
      </button>
    </div>
  );
}
