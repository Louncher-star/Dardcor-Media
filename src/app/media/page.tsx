'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Search,
  Users,
  Compass,
  Home,
  Menu,
  X,
  User,
  LogOut,
  Upload,
  RotateCw,
  ExternalLink,
  Radio,
  Check,
  PanelLeftClose,
  Film,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser, logoutUser, clearAuthCookie } from '@/lib/services/authService';
import { TikTokVideoItem } from '@/app/api/tiktok/route';
import { ScrapedComment } from '@/app/api/tiktok/comments/route';
import { UserProfileModal } from '@/components/media/UserProfileModal';
import { CreatorProfileModal } from '@/components/media/CreatorProfileModal';
import { CommentDrawer } from '@/components/media/CommentDrawer';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

// ================= TIKTOK 3D OFFSET LOGO =================
function TikTokLogo() {
  return (
    <div className="flex items-center gap-2 select-none cursor-pointer">
      <div className="relative w-7 h-7 flex items-center justify-center">
        {/* Cyan glitch shadow */}
        <svg
          viewBox="0 0 24 24"
          className="absolute -left-[1.5px] -top-[1.5px] w-7 h-7 fill-[#25F4EE] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* Red glitch shadow */}
        <svg
          viewBox="0 0 24 24"
          className="absolute left-[1.5px] top-[1.5px] w-7 h-7 fill-[#FE2C55] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* Base white */}
        <svg viewBox="0 0 24 24" className="relative w-7 h-7 fill-white">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
      </div>
      <span className="font-extrabold text-2xl tracking-tight text-white hidden sm:inline">
        TikTok
      </span>
      <span className="text-[10px] font-bold text-[#c084fc] bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
        MEDIA
      </span>
    </div>
  );
}

function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

export default function TikTokMediaPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { chats, isMobileSidebarOpen, setMobileSidebarOpen } = useChatStore();

  // State feed & search
  const [videos, setVideos] = useState<TikTokVideoItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('ID');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'foryou' | 'explore' | 'following'>('foryou');
  const [activeIndex, setActiveIndex] = useState(0);

  // Audio & playback settings
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);

  // Interactive states (Likes, Favorites, Follows, Comments)
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});
  const [favoritedVideoIds, setFavoritedVideoIds] = useState<Record<string, boolean>>({});
  const [followingCreatorIds, setFollowingCreatorIds] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, ScrapedComment[]>>({});

  // Modals & Drawers
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedCreatorHandle, setSelectedCreatorHandle] = useState<string | null>(null);
  const [selectedCreatorInfo, setSelectedCreatorInfo] = useState<{
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  } | null>(null);
  const [isCreatorProfileOpen, setIsCreatorProfileOpen] = useState(false);
  const [activeCommentVideo, setActiveCommentVideo] = useState<TikTokVideoItem | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Mobile full screen active detection
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    checkAuth();
  }, [setUser]);

  // 2. Fetch live TikTok feed
  const loadFeed = useCallback(
    async (region: string, query: string) => {
      setIsLoadingFeed(true);
      try {
        const url = `/api/tiktok?region=${encodeURIComponent(region)}&count=25${
          query ? `&keywords=${encodeURIComponent(query)}` : ''
        }`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVideos(data.data);
          setActiveIndex(0);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error('Failed to fetch TikTok feed:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFeed(selectedRegion, submittedQuery);
  }, [selectedRegion, submittedQuery, loadFeed]);

  // 3. Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  // 4. Toggle Like on Video (instant count update)
  const handleToggleLike = (videoId: string) => {
    const isCurrentlyLiked = Boolean(likedVideoIds[videoId]);
    setLikedVideoIds((prev) => ({ ...prev, [videoId]: !isCurrentlyLiked }));

    // Increment / Decrement video digg_count live
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              digg_count: isCurrentlyLiked ? Math.max(0, v.digg_count - 1) : v.digg_count + 1,
            }
          : v
      )
    );
  };

  // 5. Toggle Favorite / Bookmark
  const handleToggleFavorite = (videoId: string) => {
    setFavoritedVideoIds((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  // 6. Toggle Follow on Creator
  const handleToggleFollow = (creatorId: string) => {
    setFollowingCreatorIds((prev) => ({ ...prev, [creatorId]: !prev[creatorId] }));
  };

  // 7. Share video
  const handleShareVideo = (video: TikTokVideoItem) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(video.video_url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  // 8. Open Comments Drawer & fetch live comments
  const handleOpenComments = async (video: TikTokVideoItem) => {
    setActiveCommentVideo(video);

    if (!commentsMap[video.id]) {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/tiktok/comments?video_id=${encodeURIComponent(video.id)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCommentsMap((prev) => ({ ...prev, [video.id]: json.data }));
        } else {
          setCommentsMap((prev) => ({ ...prev, [video.id]: [] }));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // 9. Post new comment from logged-in user
  const handlePostComment = (text: string) => {
    if (!activeCommentVideo || !text.trim()) return;

    const newComment: ScrapedComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_name: user?.display_name || user?.username || 'Pengguna Dardcor',
      user_handle: user?.username || 'user',
      user_avatar:
        user?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          user?.username || 'user'
        )}`,
      text: text.trim(),
      created_at: 'Baru saja',
      likes: 0,
      liked: false,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [activeCommentVideo.id]: [newComment, ...(prev[activeCommentVideo.id] || [])],
    }));

    // Update video's comment count
    setVideos((prev) =>
      prev.map((v) =>
        v.id === activeCommentVideo.id ? { ...v, comment_count: v.comment_count + 1 } : v
      )
    );
  };

  // 10. Like comment
  const handleLikeComment = (commentId: string) => {
    if (!activeCommentVideo) return;
    setCommentsMap((prev) => {
      const list = prev[activeCommentVideo.id] || [];
      return {
        ...prev,
        [activeCommentVideo.id]: list.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked: !c.liked,
                likes: c.liked ? Math.max(0, c.likes - 1) : c.likes + 1,
              }
            : c
        ),
      };
    });
  };

  // 11. Open Creator Profile modal
  const handleOpenCreator = (creator: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  }) => {
    setSelectedCreatorHandle(creator.unique_id);
    setSelectedCreatorInfo(creator);
    setIsCreatorProfileOpen(true);
  };

  // 12. Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    clearAuthCookie();
    setUser(null);
    router.push('/login');
  };

  // 13. Update Profile
  const handleUpdateProfile = async (updated: Partial<Profile>) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('profiles').update(updated).eq('id', user.id);
    setUser({ ...user, ...updated });
  };

  // Filtered creator suggestions dynamically from the scraped feed
  const suggestedCreators = Array.from(
    new Map(videos.map((v) => [v.author.id || v.author.unique_id, v.author])).values()
  ).slice(0, 6);

  // Liked & saved lists for UserProfileModal
  const likedVideosList = videos.filter((v) => likedVideoIds[v.id]);
  const savedVideosList = videos.filter((v) => favoritedVideoIds[v.id]);

  // Unread chat messages count
  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-[#FE2C55] selection:text-white">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] bg-[#242424] border border-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400" />
          <span>Tautan video berhasil disalin ke clipboard!</span>
        </div>
      )}

      {/* Unified Mobile Navigation Drawer */}
      <AppNavigationSidebar />

      {/* ================= 1. DESKTOP & TABLET TOP HEADER ================= */}
      <header className="sticky top-0 z-50 h-16 bg-[#121212]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-7 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger menu trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Buka Menu"
          >
            <Menu size={22} />
          </button>
          <Link href="/media">
            <TikTokLogo />
          </Link>
        </div>

        {/* Center: Search input (hidden on small mobile, visible sm+) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center flex-1 max-w-md mx-4 relative"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari akun dan video..."
            className="w-full bg-[#2f2f2f] hover:bg-[#383838] focus:bg-[#2f2f2f] border border-transparent focus:border-white/30 rounded-full py-2.5 pl-4 pr-12 text-sm text-white placeholder-white/50 focus:outline-none transition"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Right: Actions (Messages, Upload, Profile) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Link to Chat with Unread Badge */}
          <Link
            href="/chat"
            className="relative p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Buka Chat Obrolan"
          >
            <MessageSquare size={22} />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FE2C55] text-white text-[9px] font-extrabold flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </Link>

          {/* User Profile Avatar / Login Button */}
          {user ? (
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition group"
              title="Lihat Profil Akun Anda"
            >
              <img
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    user.username || 'user'
                  )}`
                }
                alt={user.display_name || user.username}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#FE2C55] group-hover:scale-105 transition"
              />
              <span className="hidden md:inline text-xs font-bold text-white max-w-[100px] truncate">
                {user.display_name || user.username}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg bg-[#FE2C55] hover:bg-[#e02449] text-white text-xs font-bold transition shadow-lg shadow-[#FE2C55]/30"
            >
              Masuk
            </Link>
          )}
        </div>
      </header>

      {/* ================= 2. MAIN LAYOUT (DESKTOP SIDEBAR + CENTER FEED) ================= */}
      <div className="flex-1 flex w-full relative">
        {/* DESKTOP LEFT SIDEBAR: STRICTLY HIDDEN ON MOBILE (lg:flex ONLY) */}
        <aside className="hidden lg:flex flex-col w-64 fixed top-16 bottom-0 left-0 bg-[#121212] border-r border-white/10 p-3 space-y-4 overflow-y-auto z-40">
          {/* Main navigation */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('foryou')}
              className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'foryou' ? 'text-[#FE2C55] bg-white/5' : 'text-white hover:bg-white/5'
              }`}
            >
              <Home size={22} className={activeTab === 'foryou' ? 'text-[#FE2C55]' : ''} />
              <span>Untuk Anda</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'explore' ? 'text-[#FE2C55] bg-white/5' : 'text-white hover:bg-white/5'
              }`}
            >
              <Compass size={22} className={activeTab === 'explore' ? 'text-[#FE2C55]' : ''} />
              <span>Jelajahi</span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'following' ? 'text-[#FE2C55] bg-white/5' : 'text-white hover:bg-white/5'
              }`}
            >
              <Users size={22} className={activeTab === 'following' ? 'text-[#FE2C55]' : ''} />
              <span>Mengikuti</span>
            </button>

            <Link
              href="/chat"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-4">
                <MessageSquare size={22} className="text-[#c084fc]" />
                <span>Chat Obrolan</span>
              </div>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FE2C55] text-white text-[10px] font-black">
                  {totalUnread}
                </span>
              )}
            </Link>
          </nav>

          <div className="h-px bg-white/10" />

          {/* Content Region Selector */}
          <div className="space-y-2 px-1">
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Wilayah Konten
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ID', label: '🇮🇩 Indonesia' },
                { id: 'GLOBAL', label: '🌍 Global' },
                { id: 'US', label: '🇺🇸 USA' },
                { id: 'JP', label: '🇯🇵 Japan' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                    selectedRegion === r.id
                      ? 'bg-[#FE2C55] text-white shadow-md shadow-[#FE2C55]/30'
                      : 'bg-[#222] hover:bg-[#2e2e2e] text-white/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Suggested Creators (Real Scraped Accounts from Feed) */}
          <div className="space-y-2 px-1">
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Akun yang Disarankan
            </div>
            <div className="space-y-2">
              {suggestedCreators.map((creator) => {
                const isFollowed = Boolean(followingCreatorIds[creator.id]);
                return (
                  <div
                    key={creator.id || creator.unique_id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/5 transition"
                  >
                    <div
                      onClick={() => handleOpenCreator(creator)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <img
                        src={creator.avatar}
                        alt={creator.nickname}
                        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate hover:underline">
                          {creator.nickname}
                        </div>
                        <div className="text-[10px] text-white/50 truncate">
                          @{creator.unique_id}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(creator.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded transition ${
                        isFollowed
                          ? 'text-white/40 hover:text-white/60'
                          : 'text-[#FE2C55] hover:bg-[#FE2C55]/10'
                      }`}
                    >
                      {isFollowed ? 'Mengikuti' : 'Ikuti'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Footer Info */}
          <footer className="text-[11px] text-white/40 space-y-2 px-1 pb-6">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span>Tentang</span>
              <span>Ruang Berita</span>
              <span>Kontak</span>
              <span>Karier</span>
              <span>Bantuan</span>
            </div>
            <p className="text-[10px]">© 2026 Dardcor Media - TikTok Live</p>
          </footer>
        </aside>

        {/* ================= 3. CENTER FEED VIEW (RESPONSIVE FOR BOTH MOBILE & DESKTOP) ================= */}
        <main
          ref={feedContainerRef}
          className="flex-1 lg:ml-64 w-full flex flex-col items-center min-h-[calc(100vh-4rem)]"
        >
          {/* Loading Feed Indicator */}
          {isLoadingFeed ? (
            <div className="flex flex-col items-center justify-center my-auto py-24 gap-3 text-white/60">
              <div className="w-10 h-10 border-4 border-[#FE2C55] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold">Memuat feed video realtime TikTok...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center my-auto py-24 gap-3 text-white/50 text-center px-4">
              <Film size={44} className="opacity-30" />
              <p className="text-base font-bold">Tidak ada video yang ditemukan.</p>
              <p className="text-xs text-white/40">Coba ganti kata kunci pencarian atau pilih wilayah lain.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSubmittedQuery('');
                  loadFeed(selectedRegion, '');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#FE2C55] text-white text-xs font-bold"
              >
                Muat Ulang Feed
              </button>
            </div>
          ) : (
            /* ================= RESPONSIVE VIDEO FEED ================= */
            <div className="w-full flex flex-col items-center">
              {/* MOBILE REELS (Full Height Snap Scroll on < 1024px) */}
              <div className="lg:hidden w-full h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-scroll scroll-smooth">
                {videos.map((vid, idx) => {
                  const isLiked = Boolean(likedVideoIds[vid.id]);
                  const isFavorited = Boolean(favoritedVideoIds[vid.id]);
                  const isFollowed = Boolean(followingCreatorIds[vid.author.id]);

                  return (
                    <div
                      key={`${vid.id}_m_${idx}`}
                      className="w-full h-full snap-start relative flex items-center justify-center bg-black overflow-hidden select-none"
                    >
                      {/* Video Stream */}
                      <video
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                        }}
                        src={vid.video_url}
                        poster={vid.cover_url}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        muted={isMuted}
                        autoPlay={idx === 0}
                        onClick={(e) => {
                          const v = e.currentTarget;
                          if (v.paused) v.play();
                          else v.pause();
                        }}
                        onDoubleClick={() => handleToggleLike(vid.id)}
                      />

                      {/* Mute button on top right of video */}
                      <button
                        onClick={() => setIsMuted((prev) => !prev)}
                        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                      >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>

                      {/* Right Action Bar (Overlaid on Mobile) */}
                      <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4">
                        {/* Author Avatar with Follow Plus */}
                        <div className="relative mb-2">
                          <img
                            src={vid.author.avatar}
                            alt={vid.author.nickname}
                            onClick={() => handleOpenCreator(vid.author)}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white cursor-pointer shadow-lg"
                          />
                          {!isFollowed && (
                            <button
                              onClick={() => handleToggleFollow(vid.author.id)}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FE2C55] text-white flex items-center justify-center font-bold text-xs shadow-md"
                            >
                              +
                            </button>
                          )}
                        </div>

                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(vid.id)}
                          className="flex flex-col items-center gap-1 text-white group"
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                              isLiked ? 'bg-[#FE2C55]/20 text-[#FE2C55]' : 'bg-black/40 text-white'
                            }`}
                          >
                            <Heart size={24} fill={isLiked ? '#FE2C55' : 'none'} />
                          </div>
                          <span className="text-[11px] font-bold shadow-black drop-shadow">
                            {formatCount(vid.digg_count)}
                          </span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => handleOpenComments(vid)}
                          className="flex flex-col items-center gap-1 text-white"
                        >
                          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                            <MessageCircle size={24} />
                          </div>
                          <span className="text-[11px] font-bold shadow-black drop-shadow">
                            {formatCount(vid.comment_count)}
                          </span>
                        </button>

                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleFavorite(vid.id)}
                          className="flex flex-col items-center gap-1 text-white"
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                              isFavorited ? 'bg-amber-500/20 text-amber-400' : 'bg-black/40 text-white'
                            }`}
                          >
                            <Bookmark size={24} fill={isFavorited ? '#f59e0b' : 'none'} />
                          </div>
                          <span className="text-[11px] font-bold shadow-black drop-shadow">
                            Favorit
                          </span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShareVideo(vid)}
                          className="flex flex-col items-center gap-1 text-white"
                        >
                          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                            <Share2 size={24} />
                          </div>
                          <span className="text-[11px] font-bold shadow-black drop-shadow">
                            {formatCount(vid.share_count)}
                          </span>
                        </button>

                        {/* Rotating Music Disc */}
                        <div className="w-10 h-10 rounded-full bg-black/70 border-2 border-white/20 flex items-center justify-center animate-spin duration-[4000ms]">
                          <Music size={16} className="text-white" />
                        </div>
                      </div>

                      {/* Bottom Details Overlay (Mobile) */}
                      <div className="absolute left-3 bottom-4 right-16 z-20 text-white space-y-2 text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <div
                          onClick={() => handleOpenCreator(vid.author)}
                          className="font-bold text-sm hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                          <span>@{vid.author.unique_id}</span>
                        </div>
                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed font-normal">
                          {vid.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
                          <Music size={12} className="flex-shrink-0 animate-pulse" />
                          <span className="truncate">{vid.music_info?.title || 'Suara asli'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP FEED CARDS (>= 1024px) Exact TikTok Web Style */}
              <div className="hidden lg:flex flex-col items-center w-full max-w-2xl py-6 space-y-8">
                {videos.map((vid, idx) => {
                  const isLiked = Boolean(likedVideoIds[vid.id]);
                  const isFavorited = Boolean(favoritedVideoIds[vid.id]);
                  const isFollowed = Boolean(followingCreatorIds[vid.author.id]);

                  return (
                    <article
                      key={`${vid.id}_d_${idx}`}
                      className="w-full max-w-[620px] pb-6 border-b border-white/10 flex flex-col space-y-3"
                    >
                      {/* Header: Author + Follow */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => handleOpenCreator(vid.author)}
                          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                        >
                          <img
                            src={vid.author.avatar}
                            alt={vid.author.nickname}
                            className="w-12 h-12 rounded-full object-cover border border-white/20 group-hover:border-[#FE2C55] transition flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-sm text-white group-hover:underline truncate">
                                {vid.author.nickname}
                              </h4>
                              <span className="text-xs text-white/50 truncate">
                                @{vid.author.unique_id}
                              </span>
                            </div>
                            <p className="text-xs text-white/90 mt-1 line-clamp-2">{vid.title}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-white/60 font-semibold mt-1">
                              <Music size={12} />
                              <span className="truncate">
                                {vid.music_info?.title || 'suara asli - ' + vid.author.nickname}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Follow Button */}
                        <button
                          onClick={() => handleToggleFollow(vid.author.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0 ${
                            isFollowed
                              ? 'border border-white/20 text-white/60 hover:border-white/40'
                              : 'border border-[#FE2C55] text-[#FE2C55] hover:bg-[#FE2C55]/10'
                          }`}
                        >
                          {isFollowed ? 'Mengikuti' : 'Ikuti'}
                        </button>
                      </div>

                      {/* Video Player & Vertical Action Column */}
                      <div className="flex items-end gap-4 pl-14">
                        {/* 9:16 Video Player Container */}
                        <div className="relative w-[320px] h-[560px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group flex-shrink-0">
                          <video
                            src={vid.video_url}
                            poster={vid.cover_url}
                            className="w-full h-full object-cover cursor-pointer"
                            loop
                            playsInline
                            muted={isMuted}
                            onClick={(e) => {
                              const v = e.currentTarget;
                              if (v.paused) v.play();
                              else v.pause();
                            }}
                            onDoubleClick={() => handleToggleLike(vid.id)}
                          />

                          {/* Sound Toggle */}
                          <button
                            onClick={() => setIsMuted((prev) => !prev)}
                            className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white"
                          >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                        </div>

                        {/* Right Vertical Action Buttons */}
                        <div className="flex flex-col items-center gap-4 pb-2">
                          {/* Like Button */}
                          <button
                            onClick={() => handleToggleLike(vid.id)}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                                isLiked
                                  ? 'bg-[#FE2C55]/20 text-[#FE2C55]'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <Heart size={20} fill={isLiked ? '#FE2C55' : 'none'} />
                            </div>
                            <span className="text-xs font-bold text-white/80">
                              {formatCount(vid.digg_count)}
                            </span>
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={() => handleOpenComments(vid)}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
                              <MessageCircle size={20} />
                            </div>
                            <span className="text-xs font-bold text-white/80">
                              {formatCount(vid.comment_count)}
                            </span>
                          </button>

                          {/* Bookmark Button */}
                          <button
                            onClick={() => handleToggleFavorite(vid.id)}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                                isFavorited
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <Bookmark size={20} fill={isFavorited ? '#f59e0b' : 'none'} />
                            </div>
                            <span className="text-xs font-bold text-white/80">Favorit</span>
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={() => handleShareVideo(vid)}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
                              <Share2 size={20} />
                            </div>
                            <span className="text-xs font-bold text-white/80">
                              {formatCount(vid.share_count)}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}
      {/* 1. Logged-in User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        user={user}
        likedVideosList={likedVideosList}
        savedVideosList={savedVideosList}
        onSelectVideo={(v) => {
          setIsUserProfileOpen(false);
        }}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 2. Scraped Creator Profile Modal */}
      <CreatorProfileModal
        isOpen={isCreatorProfileOpen}
        onClose={() => setIsCreatorProfileOpen(false)}
        creatorHandle={selectedCreatorHandle}
        initialCreator={selectedCreatorInfo}
        feedVideos={videos}
        isFollowing={
          Boolean(selectedCreatorInfo && followingCreatorIds[selectedCreatorInfo.id])
        }
        onToggleFollow={(id) => handleToggleFollow(id)}
        onSelectVideo={() => setIsCreatorProfileOpen(false)}
      />

      {/* 3. Live TikTok Comments Drawer */}
      <CommentDrawer
        isOpen={Boolean(activeCommentVideo)}
        onClose={() => setActiveCommentVideo(null)}
        comments={activeCommentVideo ? commentsMap[activeCommentVideo.id] || [] : []}
        isLoading={isLoadingComments}
        currentUser={user}
        onPostComment={handlePostComment}
        onLikeComment={handleLikeComment}
      />
    </div>
  );
}
