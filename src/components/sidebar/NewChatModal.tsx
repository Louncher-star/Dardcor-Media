'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, UserPlus } from 'lucide-react';
import { Profile, Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getRegisteredUsers } from '@/lib/services/authService';
import { saveUserChats } from '@/lib/services/chatService';
import { DEMO_CONTACTS } from '@/lib/utils/demoData';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewGroup: () => void;
}

export function NewChatModal({ isOpen, onClose, onOpenNewGroup }: NewChatModalProps) {
  const { user } = useAuthStore();
  const { chats, addChat, setActiveChatId } = useChatStore();

  const [search, setSearch] = useState('');
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      if (!isSupabaseConfigured()) {
        const registered = getRegisteredUsers().filter((u) => u.id !== user?.id);
        // Gabungkan pengguna yang terdaftar dengan kontak rekomendasi
        const merged: Profile[] = [...registered];
        DEMO_CONTACTS.forEach((dc) => {
          if (!merged.some((m) => m.username === dc.username || m.id === dc.id)) {
            merged.push(dc);
          }
        });
        setUsersList(merged);
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .order('display_name', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching users:', error);
        setUsersList(DEMO_CONTACTS);
      } else if (data) {
        setUsersList(data as Profile[]);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const filteredUsers = usersList.filter(
    (u) =>
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = async (targetUser: Profile) => {
    if (!user) return;

    // Cek apakah obrolan 1-on-1 dengan user ini sudah ada
    const existingChat = chats.find(
      (c) =>
        !c.is_group &&
        (c.other_participant?.id === targetUser.id ||
          c.participants.some((p) => p.user_id === targetUser.id))
    );

    if (existingChat) {
      setActiveChatId(existingChat.id);
      onClose();
      return;
    }

    // Jika belum ada, buat chat baru
    if (!isSupabaseConfigured()) {
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        is_group: false,
        created_by: user.id,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        other_participant: targetUser,
        participants: [
          {
            id: `cp_${Date.now()}_1`,
            chat_id: `chat_${Date.now()}`,
            user_id: user.id,
            role: 'member',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: user,
          },
          {
            id: `cp_${Date.now()}_2`,
            chat_id: `chat_${Date.now()}`,
            user_id: targetUser.id,
            role: 'member',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: targetUser,
          },
        ],
      };

      const updatedChats = [newChat, ...chats];
      addChat(newChat);
      saveUserChats(user.id, updatedChats);
      setActiveChatId(newChat.id);
      onClose();
      return;
    }

    try {
      const supabase = createClient();

      // 1. Insert chat baru
      const { data: newChatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          is_group: false,
          created_by: user.id,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // 2. Insert peserta chat (user saat ini dan target user)
      const { error: partError } = await supabase.from('chat_participants').insert([
        { chat_id: newChatData.id, user_id: user.id },
        { chat_id: newChatData.id, user_id: targetUser.id },
      ]);

      if (partError) throw partError;

      const createdChat: Chat = {
        ...newChatData,
        other_participant: targetUser,
        participants: [
          {
            id: `cp_${Date.now()}_1`,
            chat_id: newChatData.id,
            user_id: user.id,
            role: 'member',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          {
            id: `cp_${Date.now()}_2`,
            chat_id: newChatData.id,
            user_id: targetUser.id,
            role: 'member',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: targetUser,
          },
        ],
      };

      addChat(createdChat);
      setActiveChatId(createdChat.id);
      onClose();
    } catch (err) {
      console.error('Gagal membuat obrolan:', err);
      alert('Gagal memulai obrolan.');
    }
  };

  return (
    <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-28 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] text-white p-4 flex flex-col justify-between shrink-0 select-none shadow-md">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition">
            <ArrowLeft size={22} />
          </button>
          <span className="font-semibold text-lg">Mulai Obrolan Baru</span>
        </div>
      </div>

      {/* Search Contact Input */}
      <div className="p-3 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)]">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-[var(--wa-text-secondary)] pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau username..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--wa-header-bg)] rounded-lg text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 text-sm focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
          />
        </div>
      </div>

      {/* New Group Action Button */}
      <button
        onClick={() => {
          onClose();
          onOpenNewGroup();
        }}
        className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[var(--wa-hover)] border-b border-[var(--wa-border)]/50 transition text-left select-none"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center shadow-md shadow-purple-900/30">
          <Users size={20} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[var(--wa-text-primary)]">Grup Baru</h4>
          <p className="text-xs text-[var(--wa-text-secondary)]">Buat ruang obrolan bersama teman</p>
        </div>
      </button>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-[11px] font-semibold text-[#c084fc] uppercase tracking-wider select-none">
          Kontak di Dardcor Media
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-[var(--wa-text-secondary)]">
            <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--wa-text-secondary)]">
            Tidak ada kontak ditemukan.
          </div>
        ) : (
          filteredUsers.map((target) => (
            <div
              key={target.id}
              onClick={() => handleSelectUser(target)}
              className="w-full px-4 py-2.5 flex items-center gap-3.5 hover:bg-[var(--wa-hover)] cursor-pointer transition select-none border-b border-[var(--wa-border)]/30"
            >
              <Avatar src={target.avatar_url} name={target.display_name} size="md" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[var(--wa-text-primary)] truncate">
                  {target.display_name}
                </h4>
                <p className="text-xs text-[var(--wa-text-secondary)] truncate">
                  {target.about || `@${target.username}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
