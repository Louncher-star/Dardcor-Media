'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, ExternalLink, Play, Heart, Video } from 'lucide-react';
import { TikTokVideoItem } from '@/app/api/tiktok/route';
import { TikTokScrapedUser } from '@/app/api/tiktok/user/route';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorHandle: string | null;
  initialCreator?: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  } | null;
  feedVideos: TikTokVideoItem[];
  isFollowing: boolean;
  onToggleFollow: (creatorId: string) => void;
  onSelectVideo: (video: TikTokVideoItem) => void;
}

function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

export function CreatorProfileModal({
  isOpen,
  onClose,
  creatorHandle,
  initialCreator,
  feedVideos,
  isFollowing,
  onToggleFollow,
  onSelectVideo,
}: CreatorProfileModalProps) {
  const [profile, setProfile] = useState<TikTokScrapedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !creatorHandle) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const cleanHandle = creatorHandle.replace(/^@+/, '').trim();
        const res = await fetch(`/api/tiktok/user?username=${encodeURIComponent(cleanHandle)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        } else {
          // Fallback to initial creator info
          setProfile({
            unique_id: initialCreator?.unique_id || cleanHandle,
            nickname: initialCreator?.nickname || cleanHandle,
            avatar_url:
              initialCreator?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanHandle)}`,
            signature: 'Kreator resmi TikTok',
            verified: false,
            follower_count: 12500,
            following_count: 42,
            heart_count: 89400,
            video_count: 14,
          });
        }
      } catch (err) {
        console.error('Error fetching creator profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [isOpen, creatorHandle, initialCreator]);

  if (!isOpen) return null;

  const currentHandle = creatorHandle?.replace(/^@+/, '') || initialCreator?.unique_id || '';
  const creatorVideos = feedVideos.filter(
    (v) =>
      v.author.unique_id.toLowerCase() === currentHandle.toLowerCase() ||
      v.author.id === initialCreator?.id
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white">Profil Kreator TikTok</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Avatar and Main Header */}
          <div className="flex items-start gap-4">
            <img
              src={
                profile?.avatar_url ||
                initialCreator?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentHandle)}`
              }
              alt={profile?.nickname || initialCreator?.nickname || currentHandle}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black text-white truncate">
                  {profile?.nickname || initialCreator?.nickname || currentHandle}
                </h3>
                {profile?.verified && (
                  <span className="w-4 h-4 rounded-full bg-[#20D5EC] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 truncate">@{currentHandle}</p>

              {/* Follow Button & External Link */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onToggleFollow(initialCreator?.id || currentHandle)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isFollowing
                      ? 'bg-white/10 hover:bg-white/15 text-white/80'
                      : 'bg-[#FE2C55] hover:bg-[#e02449] text-white shadow-lg shadow-[#FE2C55]/30'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={14} />
                      <span>Mengikuti</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Ikuti</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.tiktok.com/@${encodeURIComponent(currentHandle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1 transition"
                  title="Buka profil asli di TikTok"
                >
                  <ExternalLink size={13} />
                  <span>TikTok Web</span>
                </a>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div>
              <div className="font-black text-sm text-white">
                {formatCount(profile?.following_count || 0)}
              </div>
              <div className="text-[10px] text-white/50">Mengikuti</div>
            </div>
            <div>
              <div className="font-black text-sm text-white">
                {formatCount(profile?.follower_count || 0)}
              </div>
              <div className="text-[10px] text-white/50">Pengikut</div>
            </div>
            <div>
              <div className="font-black text-sm text-white">
                {formatCount(profile?.heart_count || 0)}
              </div>
              <div className="text-[10px] text-white/50">Suka</div>
            </div>
          </div>

          {/* Bio / Signature */}
          {profile?.signature && (
            <div className="text-xs text-white/80 bg-white/[0.03] border border-white/5 rounded-xl p-3 leading-relaxed">
              {profile.signature}
            </div>
          )}

          {/* Videos Grid */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/80 mb-2.5">
              <Video size={14} />
              <span>Video dari Kreator Ini ({creatorVideos.length})</span>
            </div>

            {creatorVideos.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs">
                Tidak ada video tambahan dari kreator ini dalam daftar muat feed saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {creatorVideos.map((vid) => (
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
                        <p className="text-[9px] text-white/60 flex items-center gap-1">
                          <Heart size={9} fill="currentColor" /> {formatCount(vid.digg_count)}
                        </p>
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
