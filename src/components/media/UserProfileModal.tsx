'use client';

import { useState } from 'react';
import { X, Heart, Bookmark, LogOut, Edit3, Check, Play, User } from 'lucide-react';
import { Profile } from '@/types';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile | null;
  likedVideosList: TikTokVideoItem[];
  savedVideosList: TikTokVideoItem[];
  onSelectVideo: (video: TikTokVideoItem) => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: Partial<Profile>) => Promise<void>;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  likedVideosList,
  savedVideosList,
  onSelectVideo,
  onLogout,
  onUpdateProfile,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'liked' | 'saved'>('liked');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [aboutText, setAboutText] = useState(user?.about || 'Pengguna Dardcor Media');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async () => {
    if (!onUpdateProfile) return;
    setIsSaving(true);
    try {
      await onUpdateProfile({
        display_name: displayName.trim(),
        about: aboutText.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentList = activeTab === 'liked' ? likedVideosList : savedVideosList;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#FE2C55]" />
            <h2 className="font-bold text-base text-white">Profil Akun Anda</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card Content */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Avatar & Info */}
          <div className="flex items-start gap-4">
            <img
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || 'user')}`
              }
              alt={user.display_name || user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#FE2C55] shadow-lg shadow-[#FE2C55]/20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              {!isEditing ? (
                <>
                  <h3 className="text-xl font-black text-white truncate">
                    {user.display_name || user.username}
                  </h3>
                  <p className="text-sm text-white/50 truncate">@{user.username}</p>
                  <p className="text-xs text-white/80 mt-1.5 line-clamp-2 leading-relaxed">
                    {user.about || 'Selamat datang di Dardcor Media!'}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition"
                    >
                      <Edit3 size={13} />
                      <span>Edit Profil</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 flex items-center gap-1.5 transition"
                    >
                      <LogOut size={13} />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Nama Tampilan</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FE2C55]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Bio / Status</label>
                    <input
                      type="text"
                      value={aboutText}
                      onChange={(e) => setAboutText(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FE2C55]"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FE2C55] hover:bg-[#e02449] text-white flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Check size={13} />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div>
              <div className="font-extrabold text-base text-white">{likedVideosList.length}</div>
              <div className="text-[11px] text-white/50 font-medium">Suka</div>
            </div>
            <div>
              <div className="font-extrabold text-base text-white">{savedVideosList.length}</div>
              <div className="text-[11px] text-white/50 font-medium">Tersimpan</div>
            </div>
            <div>
              <div className="font-extrabold text-base text-white">Aktif</div>
              <div className="text-[11px] text-emerald-400 font-medium">Online</div>
            </div>
          </div>

          {/* Tabs for Liked & Saved Videos */}
          <div>
            <div className="flex items-center border-b border-white/10 mb-3">
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'liked'
                    ? 'border-[#FE2C55] text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Heart size={14} className={activeTab === 'liked' ? 'text-[#FE2C55] fill-[#FE2C55]' : ''} />
                <span>Video Disukai ({likedVideosList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition ${
                  activeTab === 'saved'
                    ? 'border-[#FE2C55] text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Bookmark size={14} className={activeTab === 'saved' ? 'text-[#FE2C55] fill-[#FE2C55]' : ''} />
                <span>Tersimpan ({savedVideosList.length})</span>
              </button>
            </div>

            {/* Video Grid */}
            {currentList.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                {activeTab === 'liked'
                  ? 'Belum ada video yang Anda sukai. Ketuk dua kali atau tekan tombol hati pada video untuk menyukai!'
                  : 'Belum ada video tersimpan. Tekan tombol bookmark untuk menyimpan video favorit!'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentList.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => {
                      onSelectVideo(vid);
                      onClose();
                    }}
                    className="group relative aspect-[9/16] bg-black rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-[#FE2C55] transition"
                  >
                    <img
                      src={vid.cover_url}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-1.5">
                      <div className="flex justify-end">
                        <div className="w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                          <Play size={10} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-white font-semibold line-clamp-1">{vid.title}</p>
                        <p className="text-[9px] text-white/60 truncate">@{vid.author.nickname}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
