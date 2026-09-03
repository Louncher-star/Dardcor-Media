'use client';

import { useState } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ChatList } from './ChatList';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import { ProfileDrawer } from './ProfileDrawer';

interface SidebarProps {
  onOpenStatus: () => void;
}

export function Sidebar({ onOpenStatus }: SidebarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-[var(--wa-bg-sidebar)] border-r border-[var(--wa-border)] relative shrink-0 z-20">
      {/* Top Header */}
      <SidebarHeader
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenStatus={onOpenStatus}
      />

      {/* Search Bar & Filter Chips */}
      <SearchBar />

      {/* Scrollable Chat List */}
      <ChatList onStartNewChat={() => setIsNewChatOpen(true)} />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />
    </aside>
  );
}
