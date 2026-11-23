'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  Bell,
  BellOff,
  Check,
  Download,
  FileText,
  ImageIcon,
  LogOut,
  Search,
  Star,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { Chat, ChatParticipant, Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { fetchCloudProfiles } from '@/lib/services/authService';
import {
  addChatParticipants,
  clearChatMessagesForUser,
  deleteChatForUser,
  removeChatParticipant,
  setUserBlocked,
  updateChatPrefs,
  updateChatSettings,
} from '@/lib/services/chatService';
import { downloadMediaFile } from '@/lib/utils/mediaUtils';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface ChatInfoDrawerProps {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  onOpenStarred: () => void;
  onOpenSearch: () => void;
}

export function ChatInfoDrawer({
  chat,
  isOpen,
  onClose,
  onOpenStarred,
  onOpenSearch,
}: ChatInfoDrawerProps) {
  const { user } = useAuthStore();
  const {
    messages,
    updateChat,
    deleteChat,
    setMessages,
    setLightboxMessage,
    starredMessageIds,
    blockedUserIds,
    toggleBlockedUser,
  } = useChatStore();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);

  const chatMessages = messages[chat.id] || [];
  const otherUser = chat.other_participant;
  const isGroup = chat.is_group;
  const chatName = isGroup
    ? chat.group_name || 'Grup Komunitas'
    : otherUser?.display_name || otherUser?.username || 'Pengguna';
  const chatAvatar = isGroup ? chat.group_avatar_url : otherUser?.avatar_url;
  const isAdmin =
    chat.my_role === 'admin' ||
    Boolean(chat.participants?.find((p) => p.user_id === user?.id)?.role === 'admin');

  useEffect(() => {
    if (!isAddMemberOpen || !user) return;
    let alive = true;
    fetchCloudProfiles().then((profiles) => {
      if (!alive) return;
      const memberIds = new Set((chat.participants || []).map((p) => p.user_id));
      setAvailableProfiles(
        profiles.filter((p) => p.id !== user.id && !memberIds.has(p.id))
      );
    });
    return () => {
      alive = false;
    };
  }, [isAddMemberOpen, chat.participants, user]);

  const mediaMessages = useMemo(
    () =>
      chatMessages
        .filter(
          (m) =>
            m.media_url &&
            !m.is_deleted_for_all &&
            (m.message_type === 'image' || m.message_type === 'video')
        )
        .slice(-9)
        .reverse(),
    [chatMessages]
  );

  const documentMessages = useMemo(
    () =>
      chatMessages
        .filter((m) => m.media_url && !m.is_deleted_for_all && m.message_type === 'document')
        .slice(-6)
        .reverse(),
    [chatMessages]
  );

  const starredCount = chatMessages.filter((m) => starredMessageIds.includes(m.id)).length;
  const isBlocked = Boolean(otherUser && blockedUserIds.includes(otherUser.id));

  const handleDisappearingChange = async (seconds: number) => {
    if (!user) return;
    updateChat(chat.id, { disappearing_seconds: seconds });
    try {
      await updateChatSettings(chat.id, user.id, { disappearing_seconds: seconds });
    } catch {
      alert('Gagal menyimpan pengaturan pesan sementara.');
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !otherUser) return;
    const confirmed = confirm(
      isBlocked
        ? `Buka blokir ${otherUser.display_name || otherUser.username}?`
        : `Blokir ${otherUser.display_name || otherUser.username}? Anda tidak dapat saling mengirim pesan.`
    );
    if (!confirmed) return;

    try {
      await setUserBlocked(user.id, otherUser.id, !isBlocked);
      toggleBlockedUser(otherUser.id);
    } catch {
      alert('Gagal memperbarui status blokir.');
    }
  };

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const next = !chat.is_muted;
    updateChat(chat.id, { is_muted: next });
    if (user) updateChatPrefs(chat.id, user.id, { is_muted: next });
  };

  const handleClearChat = async () => {
    if (!user) return;
    if (!confirm('Bersihkan semua pesan di obrolan ini? Tindakan ini hanya berlaku untuk Anda.')) return;
    setMessages(chat.id, []);
    updateChat(chat.id, { last_message: null, unread_count: 0 });
    await clearChatMessagesForUser(chat.id, user.id);
    onClose();
  };

  const handleDeleteChat = async () => {
    if (!user) return;
    if (!confirm(`Hapus obrolan "${chatName}" dari daftar Anda?`)) return;
    await deleteChatForUser(chat.id, user.id);
    deleteChat(chat.id);
    onClose();
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    if (!confirm(`Keluar dari grup "${chatName}"?`)) return;
    await removeChatParticipant(chat.id, user.id);
    deleteChat(chat.id);
    onClose();
  };

  const handleRemoveMember = async (participant: ChatParticipant) => {
    const memberName =
      participant.profile?.display_name || participant.profile?.username || 'anggota ini';
    if (!confirm(`Keluarkan ${memberName} dari grup?`)) return;
    await removeChatParticipant(chat.id, participant.user_id);
    updateChat(chat.id, {
      participants: (chat.participants || []).filter((p) => p.user_id !== participant.user_id),
    });
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    setIsSavingMembers(true);
    try {
      await addChatParticipants(chat.id, selectedMembers);
      const added: ChatParticipant[] = selectedMembers.map((id, index) => {
        const profile = availableProfiles.find((p) => p.id === id);
        return {
          id: `cp_${chat.id}_${id}_${index}`,
          chat_id: chat.id,
          user_id: id,
          role: 'member',
          is_pinned: false,
          is_archived: false,
          is_muted: false,
          last_read_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          profile,
        };
      });
      updateChat(chat.id, { participants: [...(chat.participants || []), ...added] });
      setSelectedMembers([]);
      setIsAddMemberOpen(false);
    } catch (err) {
      console.error('Gagal menambahkan anggota:', err);
      alert('Gagal menambahkan anggota grup. Coba lagi.');
    } finally {
      setIsSavingMembers(false);
    }
  };

  const filteredAvailable = availableProfiles.filter(
    (p) =>
      p.display_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      p.username?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative w-full md:max-w-[400px] h-full bg-[var(--wa-bg-sidebar)] flex flex-col shadow-2xl panel-slide-in">
        <header className="h-16 px-4 flex items-center gap-3 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
            title="Tutup info"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold text-[var(--wa-text-primary)]">
            {isGroup ? 'Info Grup' : 'Info Kontak'}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="flex flex-col items-center text-center p-6 border-b border-[var(--wa-border)] bg-[var(--wa-header-bg)]/40">
            <Avatar src={chatAvatar} name={chatName} size="xl" isGroup={isGroup} />
            <h3 className="mt-4 text-lg font-bold text-[var(--wa-text-primary)] break-words">
              {chatName}
            </h3>
            {isGroup ? (
              <p className="text-xs text-[var(--wa-text-secondary)] mt-1">
                Grup • {chat.participants?.length || 0} anggota
              </p>
            ) : (
              <>
                <p className="text-xs text-[var(--wa-text-secondary)] mt-1">
                  @{otherUser?.username || 'pengguna'}
                </p>
                {otherUser?.about && (
                  <p className="text-sm text-[var(--wa-text-primary)]/80 mt-3 max-w-xs">
                    {otherUser.about}
                  </p>
                )}
                {otherUser?.last_seen && (
                  <p className="text-[11px] text-[var(--wa-text-secondary)] mt-1">
                    Terakhir dilihat {formatChatListTime(otherUser.last_seen)}
                  </p>
                )}
              </>
            )}

            {isGroup && chat.group_description && (
              <p className="text-sm text-[var(--wa-text-primary)]/80 mt-3 max-w-xs">
                {chat.group_description}
              </p>
            )}
          </section>

          <section className="p-3 border-b border-[var(--wa-border)] grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleMute}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--wa-header-bg)] hover:bg-[var(--wa-hover)] transition text-[var(--wa-text-primary)]"
            >
              {chat.is_muted ? <Bell size={19} /> : <BellOff size={19} />}
              <span className="text-[11px] font-medium">
                {chat.is_muted ? 'Bunyikan' : 'Bisukan'}
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStarred();
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--wa-header-bg)] hover:bg-[var(--wa-hover)] transition text-[var(--wa-text-primary)]"
            >
              <Star size={19} />
              <span className="text-[11px] font-medium">Berbintang ({starredCount})</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--wa-header-bg)] hover:bg-[var(--wa-hover)] transition text-[var(--wa-text-primary)]"
            >
              <Search size={19} />
              <span className="text-[11px] font-medium">Cari pesan</span>
            </button>

            <button
              onClick={() => {
                const next = !chat.is_archived;
                updateChat(chat.id, { is_archived: next });
                if (user) updateChatPrefs(chat.id, user.id, { is_archived: next });
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--wa-header-bg)] hover:bg-[var(--wa-hover)] transition text-[var(--wa-text-primary)]"
            >
              {chat.is_archived ? <ArchiveRestore size={19} /> : <Archive size={19} />}
              <span className="text-[11px] font-medium">
                {chat.is_archived ? 'Batal arsip' : 'Arsipkan'}
              </span>
            </button>
          </section>

          <section className="p-4 border-b border-[var(--wa-border)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc]">
                Media, tautan & dokumen
              </h4>
              <span className="text-[11px] text-[var(--wa-text-secondary)]">
                {mediaMessages.length + documentMessages.length} item
              </span>
            </div>

            {mediaMessages.length === 0 && documentMessages.length === 0 ? (
              <p className="text-xs text-[var(--wa-text-secondary)]">Belum ada media dibagikan.</p>
            ) : (
              <>
                {mediaMessages.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {mediaMessages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setLightboxMessage(msg)}
                        className="relative aspect-square rounded-lg overflow-hidden bg-[var(--wa-hover)] group"
                        title={msg.media_name || 'Buka media'}
                      >
                        {msg.message_type === 'video' ? (
                          <video
                            src={msg.media_url || undefined}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={msg.media_url || ''}
                            alt={msg.media_name || 'Media'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {documentMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() =>
                      msg.media_url &&
                      downloadMediaFile(msg.media_url, msg.media_name || 'dokumen')
                    }
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--wa-hover)] text-left transition"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center shrink-0">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--wa-text-primary)] truncate">
                        {msg.media_name || 'Dokumen'}
                      </p>
                      <p className="text-[10px] text-[var(--wa-text-secondary)]">
                        {formatChatListTime(msg.created_at)}
                      </p>
                    </div>
                    <Download size={15} className="text-[var(--wa-text-secondary)] shrink-0" />
                  </button>
                ))}
              </>
            )}
          </section>

          {isGroup && (
            <section className="p-4 border-b border-[var(--wa-border)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc]">
                  Anggota grup
                </h4>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-purple-200 transition"
                  >
                    <UserPlus size={14} /> Tambah
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {(chat.participants || []).map((participant) => {
                  const profile = participant.profile;
                  const name =
                    participant.user_id === user?.id
                      ? 'Anda'
                      : profile?.display_name || profile?.username || 'Anggota';
                  return (
                    <div
                      key={participant.id || participant.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--wa-hover)] transition"
                    >
                      <Avatar src={profile?.avatar_url} name={name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[var(--wa-text-primary)] truncate">
                          {name}
                        </p>
                        <p className="text-[10px] text-[var(--wa-text-secondary)] truncate">
                          {participant.role === 'admin' ? 'Admin grup' : 'Anggota'}
                        </p>
                      </div>
                      {isAdmin && participant.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(participant)}
                          title="Keluarkan dari grup"
                          className="p-1.5 rounded-full text-[var(--wa-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <UserMinus size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {isAdmin && isAddMemberOpen && (
                <div className="mt-4 p-3 rounded-xl border border-[var(--wa-border)] bg-[var(--wa-header-bg)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[var(--wa-text-primary)]">
                      Tambah anggota
                    </span>
                    <button
                      onClick={() => setIsAddMemberOpen(false)}
                      className="p-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--wa-text-secondary)]"
                    />
                    <input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Cari kontak..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[var(--wa-bg-sidebar)] border border-[var(--wa-border)] rounded-lg text-xs text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {filteredAvailable.length === 0 ? (
                      <p className="text-[11px] text-[var(--wa-text-secondary)] py-2 text-center">
                        Tidak ada kontak yang bisa ditambahkan.
                      </p>
                    ) : (
                      filteredAvailable.map((profile) => {
                        const checked = selectedMembers.includes(profile.id);
                        return (
                          <button
                            key={profile.id}
                            onClick={() =>
                              setSelectedMembers((prev) =>
                                checked
                                  ? prev.filter((id) => id !== profile.id)
                                  : [...prev, profile.id]
                              )
                            }
                            className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--wa-hover)] transition text-left"
                          >
                            <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-[var(--wa-text-primary)] truncate">
                                {profile.display_name}
                              </p>
                              <p className="text-[10px] text-[var(--wa-text-secondary)] truncate">
                                @{profile.username}
                              </p>
                            </div>
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                checked
                                  ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white'
                                  : 'border-[var(--wa-text-secondary)]'
                              }`}
                            >
                              {checked && <Check size={11} strokeWidth={3} />}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={handleAddMembers}
                    disabled={selectedMembers.length === 0 || isSavingMembers}
                    className="mt-2 w-full py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {isSavingMembers
                      ? 'Menambahkan...'
                      : `Tambah ${selectedMembers.length || ''} anggota`}
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="p-4 border-b border-[var(--wa-border)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] mb-2">
              Pesan sementara
            </h4>
            <select
              value={chat.disappearing_seconds || 0}
              onChange={(e) => handleDisappearingChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value={0}>Nonaktif</option>
              <option value={86400}>24 jam</option>
              <option value={604800}>7 hari</option>
              <option value={7776000}>90 hari</option>
            </select>
            <p className="text-[11px] text-[var(--wa-text-secondary)] mt-1.5">
              Pesan yang lebih lama dari batas ini otomatis disembunyikan dari semua peserta.
            </p>
          </section>

          <section className="p-2">
            {!isGroup && otherUser && (
              <button
                onClick={handleToggleBlock}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                  isBlocked
                    ? 'text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)]'
                    : 'text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Ban size={17} />
                <span className="text-sm">
                  {isBlocked ? 'Buka blokir kontak' : 'Blokir kontak'}
                </span>
              </button>
            )}

            <button
              onClick={handleClearChat}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--wa-hover)] text-left text-[var(--wa-text-primary)] transition"
            >
              <Trash2 size={17} />
              <span className="text-sm">Bersihkan obrolan</span>
            </button>

            {isGroup && (
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-left text-red-500 transition"
              >
                <LogOut size={17} />
                <span className="text-sm">Keluar dari grup</span>
              </button>
            )}

            <button
              onClick={handleDeleteChat}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-left text-red-500 transition"
            >
              <Trash2 size={17} />
              <span className="text-sm">Hapus obrolan</span>
            </button>
          </section>

          <div className="px-4 pb-6 pt-2 flex items-center justify-center gap-2 text-[10px] text-[var(--wa-text-secondary)]">
            <ImageIcon size={12} />
            <span>Media disimpan aman di Dardcor Media</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
