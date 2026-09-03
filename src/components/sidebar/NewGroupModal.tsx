'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Users, X, Camera } from 'lucide-react';
import { Profile, Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { fetchCloudProfiles } from '@/lib/services/authService';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGroupModal({ isOpen, onClose }: NewGroupModalProps) {
  const { user } = useAuthStore();
  const { addChat, setActiveChatId } = useChatStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedUsers([]);
      setGroupName('');
      setGroupDesc('');
      return;
    }

    const fetchContacts = async () => {
      try {
        const cloudProfiles = await fetchCloudProfiles();
        const realUsers = cloudProfiles.filter((u) => u.id !== user?.id);
        setContacts(realUsers);
      } catch (e) {
        console.error('Error fetching real contacts for group:', e);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const toggleUser = (target: Profile) => {
    if (selectedUsers.some((u) => u.id === target.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== target.id));
    } else {
      setSelectedUsers([...selectedUsers, target]);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      const demoGroupId = `group_${Date.now()}`;
      const newGroupChat: Chat = {
        id: demoGroupId,
        is_group: true,
        group_name: groupName.trim(),
        group_description: groupDesc.trim() || 'Grup Komunitas',
        created_by: user.id,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: [
          {
            id: `cp_${Date.now()}_0`,
            chat_id: demoGroupId,
            user_id: user.id,
            role: 'admin',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: user,
          },
          ...selectedUsers.map((u, i) => ({
            id: `cp_${Date.now()}_${i + 1}`,
            chat_id: demoGroupId,
            user_id: u.id,
            role: 'member' as const,
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: u,
          })),
        ],
      };

      addChat(newGroupChat);
      setActiveChatId(newGroupChat.id);
      setIsLoading(false);
      onClose();
      return;
    }

    try {
      const supabase = createClient();

      // 1. Buat chat grup
      const { data: chatData, error: chatErr } = await supabase
        .from('chats')
        .insert({
          is_group: true,
          group_name: groupName.trim(),
          group_description: groupDesc.trim(),
          created_by: user.id,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatErr) throw chatErr;

      // 2. Tambahkan semua peserta termasuk pembuat grup (admin)
      const participantsToInsert = [
        { chat_id: chatData.id, user_id: user.id, role: 'admin' },
        ...selectedUsers.map((u) => ({
          chat_id: chatData.id,
          user_id: u.id,
          role: 'member',
        })),
      ];

      const { error: partErr } = await supabase
        .from('chat_participants')
        .insert(participantsToInsert);

      if (partErr) throw partErr;

      const newChat: Chat = {
        ...chatData,
        participants: [
          {
            id: `cp_${Date.now()}_0`,
            chat_id: chatData.id,
            user_id: user.id,
            role: 'admin',
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: user,
          },
          ...selectedUsers.map((u, idx) => ({
            id: `cp_${Date.now()}_${idx + 1}`,
            chat_id: chatData.id,
            user_id: u.id,
            role: 'member' as const,
            is_pinned: false,
            is_archived: false,
            is_muted: false,
            last_read_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            profile: u,
          })),
        ],
      };

      addChat(newChat);
      setActiveChatId(newChat.id);
      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Gagal membuat grup baru.');
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-28 bg-[#008069] dark:bg-[#202c33] text-white p-4 flex flex-col justify-between shrink-0 select-none">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (step === 2) setStep(1);
              else onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft size={22} />
          </button>
          <span className="font-semibold text-lg">
            {step === 1 ? 'Tambah Anggota Grup' : 'Info Grup Baru'}
          </span>
        </div>
        {step === 1 && (
          <span className="text-xs text-white/80">
            {selectedUsers.length} dari {contacts.length} dipilih
          </span>
        )}
      </div>

      {step === 1 ? (
        <>
          {/* Selected Chips */}
          {selectedUsers.length > 0 && (
            <div className="p-2 border-b border-[var(--wa-border)] flex items-center gap-1.5 overflow-x-auto">
              {selectedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-[var(--wa-hover)] rounded-full text-xs shrink-0 select-none border border-[var(--wa-border)]"
                >
                  <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                  <span className="max-w-[100px] truncate">{u.display_name}</span>
                  <button
                    onClick={() => toggleUser(u)}
                    className="p-0.5 hover:text-red-500 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="p-3 border-b border-[var(--wa-border)]">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-[var(--wa-text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kontak..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--wa-header-bg)] rounded-lg text-sm text-[var(--wa-text-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto">
            {contacts
              .filter(
                (c) =>
                  c.display_name.toLowerCase().includes(search.toLowerCase()) ||
                  c.username.toLowerCase().includes(search.toLowerCase())
              )
              .map((c) => {
                const isSelected = selectedUsers.some((u) => u.id === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleUser(c)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--wa-hover)] cursor-pointer transition select-none border-b border-[var(--wa-border)]/20"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={c.avatar_url} name={c.display_name} size="md" />
                      <div>
                        <h4 className="text-sm font-medium text-[var(--wa-text-primary)]">
                          {c.display_name}
                        </h4>
                        <p className="text-xs text-[var(--wa-text-secondary)]">@{c.username}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white'
                          : 'border-[var(--wa-text-secondary)]'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Next Button */}
          {selectedUsers.length > 0 && (
            <div className="p-4 bg-[var(--wa-header-bg)] border-t border-[var(--wa-border)] flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:from-[#8b5cf6] hover:to-[#7c3aed] transition"
              >
                <ArrowRight size={22} />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Step 2: Group Info */
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Group Icon Placeholder */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-[var(--wa-hover)] text-[var(--wa-text-secondary)] flex flex-col items-center justify-center border-2 border-dashed border-[var(--wa-border)] cursor-pointer hover:border-[#8b5cf6] transition">
                <Camera size={26} />
                <span className="text-[10px] mt-1 uppercase font-semibold">Foto Grup</span>
              </div>
            </div>

            {/* Group Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[var(--wa-text-secondary)] mb-1 uppercase tracking-wider">
                Nama Grup
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ketik subjek grup di sini"
                className="w-full px-4 py-2.5 bg-[var(--wa-header-bg)] border border-[var(--wa-border)] rounded-lg text-sm text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            {/* Group Description Input */}
            <div>
              <label className="block text-xs font-semibold text-[var(--wa-text-secondary)] mb-1 uppercase tracking-wider">
                Deskripsi Grup (Opsional)
              </label>
              <textarea
                rows={3}
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Deskripsi tujuan grup"
                className="w-full px-4 py-2.5 bg-[var(--wa-header-bg)] border border-[var(--wa-border)] rounded-lg text-sm text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6] resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleCreateGroup}
              disabled={isLoading || !groupName.trim()}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:from-[#8b5cf6] hover:to-[#7c3aed] transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={24} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
