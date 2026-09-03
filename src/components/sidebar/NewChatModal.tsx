'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, UserPlus, MessageSquarePlus, Sparkles } from 'lucide-react';
import { Profile, Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { fetchCloudProfiles } from '@/lib/services/authService';
import { saveUserChats } from '@/lib/services/chatService';

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
  const [isCreatingChat, setIsCreatingChat] = useState<string | null>(null);

  // Muat HANYA data pengguna asli dari database Supabase (tanpa data statis!)
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const allProfiles = await fetchCloudProfiles();
        // Saring: Jangan tampilkan akun yang sedang login sendiri
        const realUsers = allProfiles.filter(
          (u) => u.id !== user?.id && u.username?.toLowerCase() !== user?.username?.toLowerCase()
        );
        setUsersList(realUsers);
      } catch (err) {
        console.error('Error fetching real contacts from database:', err);
        setUsersList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, user?.id, user?.username]);

  if (!isOpen) return null;

  const filteredUsers = usersList.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = async (targetUser: Profile) => {
    if (!user || isCreatingChat) return;
    setIsCreatingChat(targetUser.id);

    try {
      // 1. Cek apakah obrolan 1-on-1 dengan pengguna ini sudah pernah dibuat sebelumnya
      const existingChat = chats.find(
        (c) =>
          !c.is_group &&
          (c.other_participant?.id === targetUser.id ||
            c.participants?.some((p) => p.user_id === targetUser.id))
      );

      if (existingChat) {
        setActiveChatId(existingChat.id);
        onClose();
        return;
      }

      // 2. Generate UUID standar PostgreSQL
      const newChatId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'c0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

      let createdChat: Chat = {
        id: newChatId,
        is_group: false,
        created_by: user.id,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        other_participant: targetUser,
        participants: [
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cp_${Date.now()}_1`,
            chat_id: newChatId,
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
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cp_${Date.now()}_2`,
            chat_id: newChatId,
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

      // 3. Simpan obrolan baru ke Supabase Cloud Database secara realtime
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: newChatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            id: newChatId,
            is_group: false,
            created_by: user.id,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (!chatError && newChatData) {
          createdChat = {
            ...createdChat,
            id: newChatData.id,
          };

          await supabase.from('chat_participants').insert([
            { chat_id: newChatData.id, user_id: user.id },
            { chat_id: newChatData.id, user_id: targetUser.id },
          ]);
        }
      }

      // 4. Perbarui state lokal dan aktifkan chat
      const updatedChats = [createdChat, ...chats];
      addChat(createdChat);
      saveUserChats(user.id, updatedChats);
      setActiveChatId(createdChat.id);
      onClose();
    } catch (err) {
      console.error('Error starting new chat:', err);
    } finally {
      setIsCreatingChat(null);
    }
  };

  return (
    <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-28 bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#4f46e5] text-white p-4 flex flex-col justify-between shrink-0 select-none shadow-md">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition">
            <ArrowLeft size={22} />
          </button>
          <span className="font-semibold text-lg">Mulai Obrolan Baru</span>
        </div>
      </div>

      {/* Search Input & Add Button Bar */}
      <div className="p-3 border-b border-[var(--wa-border)] bg-[var(--wa-bg-sidebar)] space-y-2">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-[var(--wa-text-secondary)] pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau @username teman..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--wa-header-bg)] rounded-xl text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
          />
        </div>
      </div>

      {/* New Group Action Button */}
      <button
        onClick={() => {
          onClose();
          onOpenNewGroup();
        }}
        className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[var(--wa-hover)] border-b border-[var(--wa-border)]/50 transition text-left select-none group"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center shadow-md shadow-purple-900/30 group-hover:scale-105 transition-transform">
          <Users size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[var(--wa-text-primary)]">Grup Baru</h4>
          <p className="text-xs text-[var(--wa-text-secondary)]">Buat ruang obrolan bersama teman</p>
        </div>
        <span className="text-xs text-[#a78bfa] font-medium px-2.5 py-1 bg-purple-500/10 rounded-lg">
          + Buat Grup
        </span>
      </button>

      {/* Real Contact List from Database */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-[#c084fc] uppercase tracking-wider select-none bg-[var(--wa-bg-sidebar)]">
          <span>Semua Pengguna Terdaftar ({filteredUsers.length})</span>
          <span className="text-[10px] text-emerald-400 font-normal lowercase">● realtime cloud</span>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-[var(--wa-text-secondary)] gap-2">
            <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Memuat kontak dari database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--wa-text-secondary)] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-[#a78bfa] flex items-center justify-center">
              <Users size={24} />
            </div>
            {search ? (
              <p>Tidak ada pengguna dengan username &ldquo;{search}&rdquo;.</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium text-[var(--wa-text-primary)]">Belum ada pengguna lain terdaftar.</p>
                <p className="text-[11px] text-purple-300/60 max-w-xs">
                  Minta teman Anda mendaftar di Dardcor Media untuk langsung muncul di sini secara otomatis.
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredUsers.map((target) => (
            <div
              key={target.id}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--wa-hover)] transition select-none border-b border-[var(--wa-border)]/30"
            >
              {/* User Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Avatar src={target.avatar_url} name={target.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-[var(--wa-text-primary)] truncate">
                      {target.display_name}
                    </h4>
                    {target.is_online && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--wa-text-secondary)] truncate">
                    @{target.username} • {target.about || 'Ada! Menggunakan Dardcor Media.'}
                  </p>
                </div>
              </div>

              {/* Action Button: Tambah Teman / Mulai Chat */}
              <button
                onClick={() => handleSelectUser(target)}
                disabled={isCreatingChat === target.id}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition shrink-0 disabled:opacity-50"
              >
                {isCreatingChat === target.id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Tambah Teman</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
