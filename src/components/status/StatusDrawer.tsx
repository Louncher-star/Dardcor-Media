'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserStatus } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { DEMO_STATUSES } from '@/lib/utils/demoData';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface StatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatusDrawer({ isOpen, onClose }: StatusDrawerProps) {
  const { user } = useAuthStore();
  const [activeStatus, setActiveStatus] = useState<UserStatus | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-28 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] text-white p-4 flex flex-col justify-between shrink-0 select-none shadow-md">
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <ArrowLeft size={22} />
            </button>
            <span className="font-semibold text-lg">Cerita & Status</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* My Status */}
          <div className="p-4 flex items-center gap-3.5 hover:bg-[var(--wa-hover)] cursor-pointer transition select-none border-b border-[var(--wa-border)]">
            <div className="relative">
              <Avatar src={user?.avatar_url} name={user?.display_name || 'Saya'} size="lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center border-2 border-[var(--wa-bg-sidebar)] shadow">
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[var(--wa-text-primary)]">Status Saya</h4>
              <p className="text-xs text-[var(--wa-text-secondary)]">Klik untuk menambahkan status baru</p>
            </div>
          </div>

          {/* Recent Updates Header */}
          <div className="px-4 py-3 text-[11px] font-semibold text-[#c084fc] uppercase tracking-wider select-none">
            Pembaruan Terkini
          </div>

          {/* Contacts' Statuses */}
          {DEMO_STATUSES.map((status) => (
            <div
              key={status.id}
              onClick={() => setActiveStatus(status)}
              className="px-4 py-3 flex items-center gap-3.5 hover:bg-[var(--wa-hover)] cursor-pointer transition select-none border-b border-[var(--wa-border)]/20"
            >
              {/* Purple circular border around avatar */}
              <div className="p-0.5 rounded-full border-2 border-[#a855f7]">
                <Avatar
                  src={status.profile?.avatar_url}
                  name={status.profile?.display_name || 'Teman'}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[var(--wa-text-primary)] truncate">
                  {status.profile?.display_name}
                </h4>
                <p className="text-xs text-[var(--wa-text-secondary)]">
                  {formatChatListTime(status.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Story Viewer Modal */}
      {activeStatus && (
        <div
          onClick={() => setActiveStatus(null)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150 select-none"
        >
          {/* Header Inside Story */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Avatar
                src={activeStatus.profile?.avatar_url}
                name={activeStatus.profile?.display_name || 'User'}
                size="md"
              />
              <div className="text-white">
                <h3 className="text-sm font-semibold">{activeStatus.profile?.display_name}</h3>
                <p className="text-[11px] text-white/70">{formatChatListTime(activeStatus.created_at)}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveStatus(null)}
              className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Story Content Canvas */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm h-[560px] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col items-center justify-center p-6 text-white"
            style={{
              backgroundColor: activeStatus.background_color || '#005c4b',
            }}
          >
            {activeStatus.media_url ? (
              <img
                src={activeStatus.media_url}
                alt="Story"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center font-bold text-xl leading-relaxed p-4">
                {activeStatus.caption}
              </div>
            )}

            {activeStatus.media_url && activeStatus.caption && (
              <div className="absolute bottom-4 inset-x-4 p-3 bg-black/60 backdrop-blur-md rounded-xl text-center text-sm">
                {activeStatus.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
