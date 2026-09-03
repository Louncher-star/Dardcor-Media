'use client';

import { useState } from 'react';
import { X, Heart, Film, Bookmark, Edit3, Check, Upload, Play } from 'lucide-react';
import { useTikTokAuthStore } from '@/lib/store/useTikTokAuthStore';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface TikTokProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  likedVideos: TikTokVideoItem[];
  savedVideos: TikTokVideoItem[];
  uploadedVideos: TikTokVideoItem[];
  feedVideos?: TikTokVideoItem[];
  onSelectVideo: (video: TikTokVideoItem) => void;
  onOpenUpload?: () => void;
}

export function TikTokProfileView({
  isOpen,
  onClose,
  likedVideos,
  savedVideos,
  uploadedVideos,
  feedVideos = [],
  onSelectVideo,
  onOpenUpload,
}: TikTokProfileViewProps) {
  const { tiktokUser, updateTikTokProfile } = useTikTokAuthStore();
  const [activeTab, setActiveTab] = useState<'uploaded' | 'liked' | 'saved'>('uploaded');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(tiktokUser?.signature || '');

  if (!isOpen || !tiktokUser) return null;

  const handleSaveBio = () => {
    updateTikTokProfile({ signature: bioInput.trim() });
    setIsEditingBio(false);
  };

  // 1. Video Saya: Gabungan video profil real hasil scraping (10 video) + video yang diunggah pengguna
  const scrapedUserVideos: TikTokVideoItem[] = (tiktokUser.user_videos as TikTokVideoItem[]) || [];
  const authorFromFeed = feedVideos.filter(
    (v) =>
      v.author.unique_id?.toLowerCase() === tiktokUser.unique_id?.toLowerCase() ||
      (v.author.id && v.author.id === tiktokUser.id)
  );

  const rawMyVideos = [...scrapedUserVideos, ...uploadedVideos, ...authorFromFeed];
  const myVideos = Array.from(new Map(rawMyVideos.map((v) => [v.id, v])).values());

  // 2. Video Disukai: Gabungan likes sesi saat ini + video liked real dari profil TikTok
  const initialLiked: TikTokVideoItem[] = (tiktokUser.liked_videos as TikTokVideoItem[]) || [];
  const rawLiked = [...likedVideos, ...initialLiked];
  const allLikedVideos = Array.from(new Map(rawLiked.map((v) => [v.id, v])).values());

  // 3. Video Favorit: Gabungan favorit sesi saat ini + video favorit real dari profil TikTok
  const initialSaved: TikTokVideoItem[] = (tiktokUser.saved_videos as TikTokVideoItem[]) || [];
  const rawSaved = [...savedVideos, ...initialSaved];
  const allSavedVideos = Array.from(new Map(rawSaved.map((v) => [v.id, v])).values());

  const currentList =
    activeTab === 'uploaded' ? myVideos : activeTab === 'liked' ? allLikedVideos : allSavedVideos;

  const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    tiktokUser.unique_id || 'user'
  )}`;

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-white">Profil Akun TikTok</span>
            {tiktokUser.verified && (
              <span className="w-4 h-4 rounded-full bg-[#20D5EC] text-black flex items-center justify-center text-[10px] font-black">
                ✓
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Avatar & Identitas */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#FE2C55] shadow-xl flex-shrink-0 bg-[#222222]">
              <img
                src={tiktokUser.avatar_url || fallbackAvatar}
                alt={tiktokUser.nickname}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = fallbackAvatar;
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-xl font-black text-white">{tiktokUser.nickname}</h2>
              <p className="text-xs text-white/60 font-semibold">@{tiktokUser.unique_id}</p>
              {tiktokUser.email && (
                <p className="text-[11px] text-white/40">{tiktokUser.email}</p>
              )}

              {/* Bio */}
              <div className="pt-2">
                {isEditingBio ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FE2C55]"
                    />
                    <button
                      onClick={handleSaveBio}
                      className="p-1.5 rounded-lg bg-[#FE2C55] text-white text-xs"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="text-xs text-white/80 whitespace-pre-line">
                      {tiktokUser.signature || 'Belum ada bio.'}
                    </p>
                    <button
                      onClick={() => {
                        setBioInput(tiktokUser.signature || '');
                        setIsEditingBio(true);
                      }}
                      className="text-white/40 hover:text-white"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <div>
              <div className="text-base font-black text-white">
                {tiktokUser.following_count.toLocaleString()}
              </div>
              <div className="text-[11px] text-white/50">Mengikuti</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-base font-black text-white">
                {tiktokUser.follower_count.toLocaleString()}
              </div>
              <div className="text-[11px] text-white/50">Pengikut</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-base font-black text-white">
                {tiktokUser.heart_count.toLocaleString()}
              </div>
              <div className="text-[11px] text-white/50">Suka</div>
            </div>
          </div>

          {/* Tabs: Video Saya, Disukai, Favorit */}
          <div>
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('uploaded')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'uploaded'
                    ? 'border-[#FE2C55] text-[#FE2C55]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Film size={14} />
                <span>Video Saya ({myVideos.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'liked'
                    ? 'border-[#FE2C55] text-[#FE2C55]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Heart size={14} />
                <span>Disukai ({allLikedVideos.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'saved'
                    ? 'border-[#FE2C55] text-[#FE2C55]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Bookmark size={14} />
                <span>Favorit ({allSavedVideos.length})</span>
              </button>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-4">
              {currentList.length > 0 ? (
                currentList.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => {
                      onSelectVideo(vid);
                      onClose();
                    }}
                    className="relative aspect-[9/16] bg-[#222222] rounded-xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition border border-white/10"
                  >
                    <img
                      src={vid.cover_url}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:opacity-90 transition"
                    />
                    {/* Play count overlay ala TikTok */}
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow-md">
                      <Play size={10} className="fill-white" />
                      <span>
                        {vid.play_count > 1000
                          ? `${(vid.play_count / 1000).toFixed(1)}K`
                          : vid.play_count || 120}
                      </span>
                    </div>

                    {/* Gradient title hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                      <span className="text-[10px] text-white font-semibold line-clamp-2">
                        {vid.title}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-14 flex flex-col items-center justify-center text-center space-y-3">
                  {activeTab === 'uploaded' ? (
                    <>
                      <Film size={44} className="text-white/20" />
                      <p className="text-sm font-bold text-white/80">Belum ada video yang diunggah</p>
                      <p className="text-xs text-white/40 max-w-xs">
                        Bagikan momen dan video kreatif Anda di Dardcor Media.
                      </p>
                      {onOpenUpload && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenUpload();
                          }}
                          className="mt-2 px-5 py-2.5 rounded-xl bg-[#FE2C55] hover:bg-[#e02449] text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition"
                        >
                          <Upload size={15} />
                          <span>Unggah Video Pertama</span>
                        </button>
                      )}
                    </>
                  ) : activeTab === 'liked' ? (
                    <>
                      <Heart size={44} className="text-white/20" />
                      <p className="text-sm font-bold text-white/80">Belum ada video yang disukai</p>
                      <p className="text-xs text-white/40 max-w-xs">
                        Video yang Anda sukai dengan menekan tanda hati (❤️) akan tersimpan di sini.
                      </p>
                    </>
                  ) : (
                    <>
                      <Bookmark size={44} className="text-white/20" />
                      <p className="text-sm font-bold text-white/80">Belum ada video favorit</p>
                      <p className="text-xs text-white/40 max-w-xs">
                        Video yang Anda bookmark (🔖) akan tersimpan rapi di sini.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
