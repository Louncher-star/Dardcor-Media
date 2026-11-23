'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { UserStatus } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { createStatus, deleteStatus, fetchActiveStatuses } from '@/lib/services/statusService';
import { uploadChatMedia } from '@/lib/utils/mediaUtils';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface StatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKGROUND_COLORS = ['#7c3aed', '#0f766e', '#be123c', '#1d4ed8', '#b45309', '#334155'];

export function StatusDrawer({ isOpen, onClose }: StatusDrawerProps) {
  const { user } = useAuthStore();

  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [activeGroup, setActiveGroup] = useState<UserStatus[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetchActiveStatuses().then((list) => {
      if (alive) setStatuses(list);
    });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const myStatuses = statuses.filter((status) => status.user_id === user?.id);

  const groupedOthers = Object.values(
    statuses
      .filter((status) => status.user_id !== user?.id)
      .reduce<Record<string, UserStatus[]>>((groups, status) => {
        groups[status.user_id] = [...(groups[status.user_id] || []), status];
        return groups;
      }, {})
  );

  const currentStatus = activeGroup?.[activeIndex];

  useEffect(() => {
    if (!activeGroup || !currentStatus) return;
    const timer = setTimeout(() => {
      if (activeIndex < activeGroup.length - 1) {
        setActiveIndex((index) => index + 1);
      } else {
        setActiveGroup(null);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeGroup, activeIndex, currentStatus]);

  if (!isOpen) return null;

  const resetComposer = () => {
    setCaption('');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBackgroundColor(BACKGROUND_COLORS[0]);
    setIsCreateOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePostStatus = async () => {
    if (!user) return;
    if (!caption.trim() && !selectedFile) {
      alert('Tulis sesuatu atau pilih foto untuk status Anda.');
      return;
    }

    setIsPosting(true);
    try {
      let mediaUrl: string | undefined;
      if (selectedFile) {
        const uploaded = await uploadChatMedia(
          selectedFile,
          `status_${Date.now()}_${selectedFile.name}`,
          'images',
          undefined,
          user.id
        );
        mediaUrl = uploaded.url;
      }

      const newStatus = await createStatus(user, {
        caption: caption.trim() || undefined,
        mediaUrl,
        backgroundColor,
      });

      setStatuses((prev) => [newStatus, ...prev]);
      resetComposer();
    } catch (err) {
      console.error('Gagal membuat status:', err);
      alert('Gagal membuat status. Coba lagi.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteMine = async (statusId: string) => {
    if (!user) return;
    if (!confirm('Hapus status ini?')) return;
    await deleteStatus(statusId, user.id);
    setStatuses((prev) => prev.filter((status) => status.id !== statusId));
    setActiveGroup(null);
  };

  const openGroup = (group: UserStatus[]) => {
    setActiveGroup(group);
    setActiveIndex(0);
  };

  const goNext = () => {
    if (!activeGroup) return;
    if (activeIndex < activeGroup.length - 1) setActiveIndex((index) => index + 1);
    else setActiveGroup(null);
  };

  const goPrev = () => {
    if (!activeGroup) return;
    if (activeIndex > 0) setActiveIndex((index) => index - 1);
  };

  return (
    <>
      <div className="absolute inset-0 bg-[var(--wa-bg-sidebar)] z-40 flex flex-col panel-slide-in">
        <div className="h-24 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] text-white p-4 flex flex-col justify-end shrink-0 select-none shadow-md safe-top">
          <div className="flex items-center gap-5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition"
              title="Kembali"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <span className="font-semibold text-lg block">Status</span>
              <span className="text-[11px] text-white/70">Hilang otomatis setelah 24 jam</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status saya */}
          <div className="p-4 flex items-center gap-3.5 border-b border-[var(--wa-border)] select-none">
            <button
              onClick={() => (myStatuses.length > 0 ? openGroup(myStatuses) : setIsCreateOpen(true))}
              className="relative shrink-0"
              title={myStatuses.length > 0 ? 'Lihat status saya' : 'Tambah status'}
            >
              <div
                className={`p-0.5 rounded-full ${
                  myStatuses.length > 0 ? 'border-2 border-[#a855f7]' : ''
                }`}
              >
                <Avatar src={user?.avatar_url} name={user?.display_name || 'Saya'} size="lg" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center border-2 border-[var(--wa-bg-sidebar)] shadow">
                <Plus size={15} strokeWidth={3} />
              </span>
            </button>

            <button
              onClick={() => (myStatuses.length > 0 ? openGroup(myStatuses) : setIsCreateOpen(true))}
              className="flex-1 min-w-0 text-left"
            >
              <h4 className="text-sm font-semibold text-[var(--wa-text-primary)]">Status Saya</h4>
              <p className="text-xs text-[var(--wa-text-secondary)]">
                {myStatuses.length > 0
                  ? `${myStatuses.length} pembaruan • ketuk untuk melihat`
                  : 'Klik untuk menambahkan status baru'}
              </p>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-semibold hover:bg-purple-500/25 transition"
            >
              Buat
            </button>
          </div>

          <div className="px-4 py-3 text-[11px] font-semibold text-[#c084fc] uppercase tracking-wider select-none">
            Pembaruan Terkini
          </div>

          {groupedOthers.length === 0 ? (
            <div className="p-8 text-center text-[var(--wa-text-secondary)]">
              <p className="text-sm font-medium text-[var(--wa-text-primary)]">Belum ada status baru</p>
              <p className="text-xs mt-1 max-w-[220px] mx-auto">
                Status dari kontak Anda akan muncul di sini dan otomatis hilang setelah 24 jam.
              </p>
            </div>
          ) : (
            groupedOthers.map((group) => {
              const latest = group[0];
              return (
                <button
                  key={latest.user_id}
                  onClick={() => openGroup(group)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-[var(--wa-hover)] transition select-none border-b border-[var(--wa-border)]/20 text-left"
                >
                  <div className="p-0.5 rounded-full border-2 border-[#a855f7]">
                    <Avatar
                      src={latest.profile?.avatar_url}
                      name={latest.profile?.display_name || 'Teman'}
                      size="md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--wa-text-primary)] truncate">
                      {latest.profile?.display_name || `@${latest.profile?.username || 'pengguna'}`}
                    </h4>
                    <p className="text-xs text-[var(--wa-text-secondary)]">
                      {formatChatListTime(latest.created_at)}
                      {group.length > 1 ? ` • ${group.length} pembaruan` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--wa-text-secondary)] shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Komposer status baru */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between text-white mb-3">
              <h3 className="text-sm font-bold">Buat status</h3>
              <button
                onClick={resetComposer}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="relative w-full aspect-[9/16] max-h-[60dvh] rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl"
              style={{ backgroundColor }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Pratinjau status" className="w-full h-full object-cover" />
              ) : (
                <p className="text-white text-xl font-bold text-center px-6 whitespace-pre-wrap break-words">
                  {caption || 'Ketik sesuatu...'}
                </p>
              )}

              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tambahkan keterangan..."
                className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-black/45 backdrop-blur-sm text-white text-sm placeholder:text-white/60 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                title="Pilih foto"
              >
                <ImagePlus size={19} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-1.5 flex-1">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      backgroundColor === color ? 'border-white scale-110' : 'border-white/30'
                    }`}
                    title="Warna latar"
                  />
                ))}
              </div>

              <button
                onClick={handlePostStatus}
                disabled={isPosting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>{isPosting ? 'Mengunggah' : 'Kirim'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penampil status */}
      {activeGroup && currentStatus && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-center justify-center p-0 sm:p-4">
          <div className="relative w-full h-full sm:max-w-sm sm:h-[88dvh] sm:rounded-2xl overflow-hidden bg-black">
            {/* Progress */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
              {activeGroup.map((status, index) => (
                <span
                  key={status.id}
                  className={`h-0.5 flex-1 rounded-full ${
                    index <= activeIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-7 left-3 right-3 z-20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  src={currentStatus.profile?.avatar_url}
                  name={currentStatus.profile?.display_name || 'User'}
                  size="sm"
                />
                <div className="min-w-0 text-white">
                  <h3 className="text-xs font-semibold truncate">
                    {currentStatus.user_id === user?.id
                      ? 'Status saya'
                      : currentStatus.profile?.display_name}
                  </h3>
                  <p className="text-[10px] text-white/70">
                    {formatChatListTime(currentStatus.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {currentStatus.user_id === user?.id && (
                  <button
                    onClick={() => handleDeleteMine(currentStatus.id)}
                    className="p-2 text-white/80 hover:text-red-400 rounded-full bg-white/10 transition"
                    title="Hapus status"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setActiveGroup(null)}
                  className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{ backgroundColor: currentStatus.background_color || '#7c3aed' }}
            >
              {currentStatus.media_url ? (
                <img
                  src={currentStatus.media_url}
                  alt="Status"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-white text-xl font-bold text-center whitespace-pre-wrap break-words">
                  {currentStatus.caption}
                </p>
              )}
            </div>

            {currentStatus.media_url && currentStatus.caption && (
              <div className="absolute bottom-4 inset-x-4 z-20 p-3 bg-black/60 backdrop-blur-md rounded-xl text-center text-sm text-white">
                {currentStatus.caption}
              </div>
            )}

            <button
              onClick={goPrev}
              className="absolute left-0 top-16 bottom-0 w-1/3 z-10 group"
              title="Sebelumnya"
            >
              <span className="opacity-0 group-hover:opacity-100 transition text-white bg-black/30 rounded-full p-1 inline-flex">
                <ChevronLeft size={18} />
              </span>
            </button>

            <button
              onClick={goNext}
              className="absolute right-0 top-16 bottom-0 w-1/3 z-10 group"
              title="Berikutnya"
            >
              <span className="opacity-0 group-hover:opacity-100 transition text-white bg-black/30 rounded-full p-1 inline-flex float-right">
                <ChevronRight size={18} />
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
