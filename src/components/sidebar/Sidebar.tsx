'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ChatList } from './ChatList';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import { ProfileDrawer } from './ProfileDrawer';
import { ArchivedChatsDrawer } from './ArchivedChatsDrawer';

interface SidebarProps {
  onOpenSettings: () => void;
  isProfileOpen?: boolean;
  onProfileOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  onOpenSettings,
  isProfileOpen: controlledProfileOpen,
  onProfileOpenChange,
}: SidebarProps) {
  const [internalProfileOpen, setInternalProfileOpen] = useState(false);
  const isProfileOpen = controlledProfileOpen ?? internalProfileOpen;
  const setIsProfileOpen = (open: boolean) => {
    setInternalProfileOpen(open);
    onProfileOpenChange?.(open);
  };
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);

  return (
    <aside className="w-full md:w-[380px] lg:w-[410px] h-full flex flex-col bg-[var(--wa-bg-sidebar)] border-r border-[var(--wa-border)] relative shrink-0 z-20">
      <SidebarHeader
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenArchived={() => setIsArchivedOpen(true)}
        onOpenSettings={onOpenSettings}
      />

      <SearchBar />

      <div className="flex-1 flex flex-col min-h-0 pb-[60px] md:pb-0">
        <ChatList
          onStartNewChat={() => setIsNewChatOpen(true)}
          onOpenArchived={() => setIsArchivedOpen(true)}
        />
      </div>

      {/* FAB obrolan baru — hanya mobile, ala WhatsApp */}
      <button
        type="button"
        onClick={() => setIsNewChatOpen(true)}
        title="Obrolan baru"
        aria-label="Obrolan baru"
        className="md:hidden absolute bottom-[76px] right-4 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 active:scale-95 transition z-30"
      >
        <Plus size={26} />
      </button>

      <ArchivedChatsDrawer isOpen={isArchivedOpen} onClose={() => setIsArchivedOpen(false)} />

      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {isNewChatOpen && (
        <NewChatModal
          isOpen
          onClose={() => setIsNewChatOpen(false)}
          onOpenNewGroup={() => {
            setIsNewChatOpen(false);
            setIsNewGroupOpen(true);
          }}
        />
      )}

      {isNewGroupOpen && <NewGroupModal isOpen onClose={() => setIsNewGroupOpen(false)} />}
    </aside>
  );
}
