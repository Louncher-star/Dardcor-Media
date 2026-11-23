'use client';

import Link from 'next/link';
import { CircleDashed, MessageSquare, Moon, Settings, Sun } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface AppNavigationSidebarProps {
  onOpenProfile?: () => void;
  onOpenStatus?: () => void;
  onOpenSettings?: () => void;
}

interface RailButtonProps {
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function RailButton({ label, icon: Icon, active, badge, onClick }: RailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'group relative w-10 h-10 rounded-full flex items-center justify-center transition-colors',
        active
          ? 'bg-[var(--wa-rail-active)] text-[var(--wa-teal)]'
          : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)] hover:text-[var(--wa-text-primary)]'
      )}
    >
      <Icon size={24} />

      {Boolean(badge && badge > 0) && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--wa-badge)] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--wa-bg-sidebar)]">
          {badge! > 99 ? '99+' : badge}
        </span>
      )}

      <span className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:block whitespace-nowrap rounded-md bg-[var(--wa-header-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--wa-text-primary)] shadow-lg border border-[var(--wa-border)]">
        {label}
      </span>
    </button>
  );
}

export function AppNavigationSidebar({
  onOpenProfile,
  onOpenStatus,
  onOpenSettings,
}: AppNavigationSidebarProps = {}) {
  const { user } = useAuthStore();
  const { chats, theme, toggleTheme } = useChatStore();

  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <aside className="hidden md:flex w-16 shrink-0 flex-col items-center bg-[var(--wa-bg-sidebar)] border-r border-[var(--wa-border)] py-3 z-30 select-none">
      <Link
        href="/chat"
        title="Dardcor Media"
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6d28d9] via-[#8b5cf6] to-[#a855f7] flex items-center justify-center text-white font-black text-lg shadow-sm hover:brightness-110 transition"
      >
        D
      </Link>

      <nav className="mt-6 w-full flex flex-col items-center gap-1">
        <RailButton label="Obrolan" icon={MessageSquare} active badge={totalUnread} />
        <RailButton label="Status" icon={CircleDashed} onClick={onOpenStatus} />
      </nav>

      <div className="mt-auto w-full flex flex-col items-center gap-1 pt-2">
        <RailButton
          label={`Mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
          icon={theme === 'dark' ? Sun : Moon}
          onClick={toggleTheme}
        />
        <RailButton label="Pengaturan" icon={Settings} onClick={onOpenSettings} />

        <div className="w-8 border-t border-[var(--wa-border)] my-1.5" />

        <button
          type="button"
          onClick={onOpenProfile}
          title={`Profil: ${user?.display_name || user?.username || 'Saya'}`}
          aria-label="Profil saya"
          className="rounded-full hover:ring-2 hover:ring-[var(--wa-border)] transition"
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name || user?.username || 'Saya'}
            size="md"
          />
        </button>
      </div>
    </aside>
  );
}
