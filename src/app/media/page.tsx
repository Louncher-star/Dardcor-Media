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
  Radio,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Film,
  MessageSquare,
  Bell,
  MoreHorizontal,
  Smartphone,
  Monitor,
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

// ================= TIKTOK 3D OFFSET GLITCH LOGO =================
function TikTokLogo() {
  return (
    <div className="flex items-center gap-2 select-none cursor-pointer">
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Cyan glitch shadow */}
        <svg
          viewBox="0 0 24 24"
          className="absolute -left-[1px] -top-[1px] w-6 h-6 fill-[#25F4EE] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* Red glitch shadow */}
        <svg
          viewBox="0 0 24 24"
          className="absolute left-[1px] top-[1px] w-6 h-6 fill-[#FE2C55] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* Sharp white base */}
        <svg viewBox="0 0 24 24" className="relative w-6 h-6 fill-white">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
      </div>
      <span className="font-extrabold text-xl tracking-tight text-white">
        TikTok
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
  const [activeMenu, setActiveMenu] = useState<'saran' | 'jelajahi' | 'mengikuti' | 'teman' | 'live'>('saran');
  const [activeIndex, setActiveIndex] = useState(0);

  // TikTok Sidebar toggle (on desktop)
  const [isTikTokSidebarCollapsed, setIsTikTokSidebarCollapsed] = useState(false);

  // Video playback & audio
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Floating hearts on double tap
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

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

  // Active video item
  const currentVideo: TikTokVideoItem | undefined = videos[activeIndex];

  // Video progress time update
  const handleTimeUpdate = () => {
    if (activeVideoRef.current) {
      setCurrentTime(activeVideoRef.current.currentTime);
      if (activeVideoRef.current.duration) {
        setDuration(activeVideoRef.current.duration);
      }
    }
  };

  // Switch video (next / prev)
  const goToNextVideo = () => {
    if (activeIndex < videos.length - 1) {
      setActiveIndex((prev) => prev + 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const goToPrevVideo = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNextVideo();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrevVideo();
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (activeVideoRef.current) {
          if (activeVideoRef.current.paused) {
            activeVideoRef.current.play();
            setIsPlaying(true);
          } else {
            activeVideoRef.current.pause();
            setIsPlaying(false);
          }
        }
      } else if (e.key === 'l') {
        if (currentVideo) handleToggleLike(currentVideo.id);
      } else if (e.key === 'c') {
        if (currentVideo) handleOpenComments(currentVideo);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos, currentVideo]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (activeVideoRef.current) {
      if (activeVideoRef.current.paused) {
        activeVideoRef.current.play();
        setIsPlaying(true);
      } else {
        activeVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Double Click / Double Tap on Video (popping hearts + like)
  const handleVideoDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentVideo) {
      if (!likedVideoIds[currentVideo.id]) {
        handleToggleLike(currentVideo.id);
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const heartId = Date.now() + Math.random();
      setFloatingHearts((prev) => [...prev, { id: heartId, x, y }]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
      }, 900);
    }
  };

  // 3. Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  // 4. Toggle Like
  const handleToggleLike = (videoId: string) => {
    const isCurrentlyLiked = Boolean(likedVideoIds[videoId]);
    setLikedVideoIds((prev) => ({ ...prev, [videoId]: !isCurrentlyLiked }));

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

  // 5. Toggle Favorite
  const handleToggleFavorite = (videoId: string) => {
    setFavoritedVideoIds((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  // 6. Toggle Follow
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

  // 9. Post comment
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

  // 11. Open Creator Profile
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

  // Dynamic suggested creators from feed
  const suggestedCreators = Array.from(
    new Map(videos.map((v) => [v.author.id || v.author.unique_id, v.author])).values()
  ).slice(0, 6);

  // Liked & saved lists for UserProfileModal
  const likedVideosList = videos.filter((v) => likedVideoIds[v.id]);
  const savedVideosList = videos.filter((v) => favoritedVideoIds[v.id]);

  // Total unread chat messages
  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Progress percentage
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-black text-white font-sans selection:bg-[#FE2C55] selection:text-white relative">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[400] bg-[#222222] border border-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400" />
          <span>Tautan video berhasil disalin ke clipboard!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FAR-LEFT: DARDCOR MEDIA DEFAULT SIDEBAR (Gambar 3 - Slim Rail w-[58px]) */}
      {/* ========================================================================= */}
      <AppNavigationSidebar defaultCollapsed={true} />

      {/* ========================================================================= */}
      {/* 2. TIKTOK INTERFACE CONTAINER (Exact Match to Gambar 1)                   */}
      {/* ========================================================================= */}
      <div className="flex-1 h-full flex overflow-hidden relative bg-black">
        {/* ================= DESKTOP TIKTOK SIDEBAR (Gambar 1) ================= */}
        <aside
          className={`hidden md:flex flex-col bg-black border-r border-white/10 shrink-0 h-full overflow-y-auto transition-all duration-300 z-20 ${
            isTikTokSidebarCollapsed ? 'w-16 p-2 items-center' : 'w-[230px] p-4'
          }`}
        >
          {/* Top Row: TikTok Logo + Collapse Button [|] */}
          <div className="flex items-center justify-between mb-4 w-full">
            {!isTikTokSidebarCollapsed && (
              <Link href="/media">
                <TikTokLogo />
              </Link>
            )}
            <button
              onClick={() => setIsTikTokSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title={isTikTokSidebarCollapsed ? 'Buka Sidebar TikTok' : 'Kecilkan Sidebar TikTok'}
            >
              {isTikTokSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Search Pill Input ("Cari" like Gambar 1) */}
          {!isTikTokSidebarCollapsed ? (
            <form onSubmit={handleSearchSubmit} className="relative mb-5 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari"
                className="w-full bg-[#262626] hover:bg-[#2f2f2f] focus:bg-[#262626] border border-transparent focus:border-white/30 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-white/50 focus:outline-none transition"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setIsTikTokSidebarCollapsed(false)}
              className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-white/70 hover:text-white mb-4 transition"
              title="Cari"
            >
              <Search size={16} />
            </button>
          )}

          {/* Navigation Items (Exact Match to Gambar 1 in Indonesian) */}
          <nav className="flex-1 space-y-1 w-full text-[13px] font-bold">
            {/* Saran (Home / For you - Active in Red) */}
            <button
              onClick={() => setActiveMenu('saran')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition ${
                activeMenu === 'saran'
                  ? 'text-[#FE2C55] bg-white/[0.04]'
                  : 'text-white hover:bg-white/5'
              } ${isTikTokSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Home size={20} className={activeMenu === 'saran' ? 'text-[#FE2C55] fill-[#FE2C55]' : ''} />
              {!isTikTokSidebarCollapsed && <span>Saran</span>}
            </button>

            {/* Jelajahi */}
            <button
              onClick={() => setActiveMenu('jelajahi')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition ${
                activeMenu === 'jelajahi'
                  ? 'text-[#FE2C55] bg-white/[0.04]'
                  : 'text-white hover:bg-white/5'
              } ${isTikTokSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Compass size={20} className={activeMenu === 'jelajahi' ? 'text-[#FE2C55]' : ''} />
              {!isTikTokSidebarCollapsed && <span>Jelajahi</span>}
            </button>

            {/* Mengikuti */}
            <button
              onClick={() => setActiveMenu('mengikuti')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition ${
                activeMenu === 'mengikuti'
                  ? 'text-[#FE2C55] bg-white/[0.04]'
                  : 'text-white hover:bg-white/5'
              } ${isTikTokSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Users size={20} className={activeMenu === 'mengikuti' ? 'text-[#FE2C55]' : ''} />
              {!isTikTokSidebarCollapsed && <span>Mengikuti</span>}
            </button>

            {/* Teman */}
            <button
              onClick={() => setActiveMenu('teman')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition ${
                activeMenu === 'teman'
                  ? 'text-[#FE2C55] bg-white/[0.04]'
                  : 'text-white hover:bg-white/5'
              } ${isTikTokSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Users size={20} className={activeMenu === 'teman' ? 'text-[#FE2C55]' : ''} />
              {!isTikTokSidebarCollapsed && <span>Teman</span>}
            </button>

            {/* LIVE */}
            <button
              onClick={() => setActiveMenu('live')}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition ${
                activeMenu === 'live'
                  ? 'text-[#FE2C55] bg-white/[0.04]'
                  : 'text-white hover:bg-white/5'
              } ${isTikTokSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Radio size={20} className={activeMenu === 'live' ? 'text-[#FE2C55]' : ''} />
              {!isTikTokSidebarCollapsed && <span>LIVE</span>}
            </button>

            {/* Pesan (Chat with unread count) */}
            <Link
              href="/chat"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <MessageCircle size={20} />
                {!isTikTokSidebarCollapsed && <span>Pesan</span>}
              </div>
              {!isTikTokSidebarCollapsed && totalUnread > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FE2C55] text-white text-[10px] font-black flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>

            {/* Aktivitas */}
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Bell size={20} />
              {!isTikTokSidebarCollapsed && <span>Aktivitas</span>}
            </button>

            {/* Unggah */}
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Upload size={20} />
              {!isTikTokSidebarCollapsed && <span>Unggah</span>}
            </button>

            {/* Profil */}
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <User size={20} />
              {!isTikTokSidebarCollapsed && <span>Profil</span>}
            </button>

            {/* Lainnya */}
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <MoreHorizontal size={20} />
              {!isTikTokSidebarCollapsed && <span>Lainnya</span>}
            </button>
          </nav>

          {/* Region selector pills on desktop sidebar */}
          {!isTikTokSidebarCollapsed && (
            <div className="pt-3 border-t border-white/10 space-y-2 w-full">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-1">
                Wilayah Feed
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ID', label: 'ID Indonesia' },
                  { id: 'GLOBAL', label: 'Global' },
                  { id: 'US', label: 'US USA' },
                  { id: 'JP', label: 'JP Japan' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRegion(r.id)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition truncate ${
                      selectedRegion === r.id
                        ? 'bg-[#FE2C55] text-white shadow-md'
                        : 'bg-[#222222] hover:bg-[#2c2c2c] text-white/70'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Accounts (Real Live Creators from Feed) */}
          {!isTikTokSidebarCollapsed && (
            <div className="pt-3 border-t border-white/10 space-y-2 w-full">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-1">
                Akun yang disarankan
              </div>
              <div className="space-y-1.5">
                {suggestedCreators.slice(0, 5).map((creator) => {
                  const isFollowed = Boolean(followingCreatorIds[creator.id]);
                  return (
                    <div
                      key={creator.id || creator.unique_id}
                      className="flex items-center justify-between gap-2 p-1 rounded-xl hover:bg-white/5 transition"
                    >
                      <div
                        onClick={() => handleOpenCreator(creator)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                      >
                        <img
                          src={creator.avatar}
                          alt={creator.nickname}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0"
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
                        className={`text-xs font-bold px-2 py-0.5 rounded transition ${
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
          )}
        </aside>

        {/* ================= CENTER VIDEO PLAYER (Exact Match to Gambar 1) ================= */}
        <main className="flex-1 h-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
          {/* Mobile Top Header (< md): Menu Hamburger + Tabs */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-30 h-14 bg-gradient-to-b from-black/80 to-transparent px-4 flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/80 hover:text-white"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-4 text-sm font-extrabold text-white">
              <span className="text-white/50 cursor-pointer">Mengikuti</span>
              <span className="border-b-2 border-white pb-0.5 cursor-pointer">Saran</span>
            </div>
            <button
              onClick={() => setIsUserProfileOpen(true)}
              className="w-7 h-7 rounded-full border border-white/30 overflow-hidden"
            >
              <img
                src={
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    user?.username || 'user'
                  )}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          {/* Top-Right Tools Capsule (Desktop like Gambar 1) */}
          <div className="hidden md:flex items-center gap-3 absolute top-5 right-6 z-30">
            <div className="flex items-center gap-2 bg-[#222222]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
              <button
                onClick={() => handleShareVideo(currentVideo || videos[0])}
                className="p-1 text-white/60 hover:text-white transition"
                title="Dapatkan Aplikasi Desktop"
              >
                <Monitor size={16} />
              </button>
              <span className="w-px h-3.5 bg-white/20" />
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-1 text-white/60 hover:text-white transition"
                title="Buka Aplikasi Mobile"
              >
                <Smartphone size={16} />
              </button>
              <span className="w-px h-3.5 bg-white/20" />
              <button
                onClick={() => setIsUserProfileOpen(true)}
                className="w-6 h-6 rounded-full overflow-hidden border border-[#FE2C55] transition hover:scale-105"
                title="Lihat Profil Akun Anda"
              >
                <img
                  src={
                    user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      user?.username || 'user'
                    )}`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>

          {/* Loading Feed State */}
          {isLoadingFeed ? (
            <div className="flex flex-col items-center justify-center gap-3 text-white/60">
              <div className="w-10 h-10 border-4 border-[#FE2C55] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Memuat video realtime TikTok...</p>
            </div>
          ) : !currentVideo ? (
            <div className="flex flex-col items-center justify-center gap-3 text-white/50 text-center px-4">
              <Film size={44} className="opacity-30" />
              <p className="text-sm font-bold">Tidak ada video yang ditemukan.</p>
              <button
                onClick={() => loadFeed(selectedRegion, '')}
                className="px-4 py-2 rounded-xl bg-[#FE2C55] text-white text-xs font-bold"
              >
                Muat Ulang
              </button>
            </div>
          ) : (
            /* Main Centered Video + Right Floating Column Structure */
            <div className="relative flex items-center justify-center w-full h-full p-2 sm:p-4">
              {/* VIDEO FRAME BOX */}
              <div
                onDoubleClick={handleVideoDoubleClick}
                className="relative h-[86vh] max-h-[820px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none flex items-center justify-center group"
              >
                {/* Real TikTok Stream Video */}
                <video
                  ref={activeVideoRef}
                  key={currentVideo.id}
                  src={currentVideo.video_url}
                  poster={currentVideo.cover_url}
                  className="w-full h-full object-cover cursor-pointer"
                  loop
                  playsInline
                  autoPlay
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onClick={togglePlay}
                />

                {/* Floating Hearts on Double Tap */}
                {floatingHearts.map((heart) => (
                  <div
                    key={heart.id}
                    style={{ left: heart.x, top: heart.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-bounce"
                  >
                    <Heart size={70} fill="#FE2C55" color="#FE2C55" />
                  </div>
                ))}

                {/* Sound Toggle Button (Top-Left of Video Frame like Gambar 1) */}
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition shadow-lg"
                  title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Center Play Indicator when paused */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 bg-black/35 flex items-center justify-center cursor-pointer z-20"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
                      <Play size={28} fill="white" className="translate-x-0.5" />
                    </div>
                  </div>
                )}

                {/* Bottom Details Overlay (Caption, Author, Audio) */}
                <div className="absolute left-0 right-0 bottom-0 z-20 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 pointer-events-auto">
                  {/* Author Name */}
                  <div
                    onClick={() => handleOpenCreator(currentVideo.author)}
                    className="font-bold text-sm hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>—{currentVideo.author.nickname}</span>
                  </div>

                  {/* Caption & Hashtags */}
                  <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                    {currentVideo.title}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-white/50 hover:underline cursor-pointer">
                    <span>Lihat terjemahan</span>
                  </div>

                  {/* Audio Music Track */}
                  <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium pt-1">
                    <Music size={12} className="flex-shrink-0 animate-pulse" />
                    <span className="truncate">
                      {currentVideo.music_info?.title || 'Suara asli - ' + currentVideo.author.nickname}
                    </span>
                  </div>

                  {/* Red Progress Bar (Gambar 1) */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      if (activeVideoRef.current) {
                        activeVideoRef.current.currentTime = newTime;
                      }
                    }}
                    className="w-full h-1 bg-white/20 hover:h-2 rounded-full cursor-pointer overflow-hidden transition-all pt-0.5"
                  >
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-[#FE2C55] rounded-full transition-all duration-100"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT VERTICAL FLOATING ACTION COLUMN (Exact Match to Gambar 1) */}
              <div className="flex flex-col items-center gap-4 ml-4 sm:ml-5 z-20">
                {/* Creator Avatar with Red '+' badge */}
                <div className="relative mb-1">
                  <img
                    src={currentVideo.author.avatar}
                    alt={currentVideo.author.nickname}
                    onClick={() => handleOpenCreator(currentVideo.author)}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white cursor-pointer shadow-lg hover:scale-105 transition"
                  />
                  {!followingCreatorIds[currentVideo.author.id] && (
                    <button
                      onClick={() => handleToggleFollow(currentVideo.author.id)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FE2C55] text-white flex items-center justify-center font-bold text-xs shadow-md hover:scale-110 transition"
                      title="Ikuti Kreator"
                    >
                      +
                    </button>
                  )}
                </div>

                {/* Like Button ❤️ */}
                <button
                  onClick={() => handleToggleLike(currentVideo.id)}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                      likedVideoIds[currentVideo.id]
                        ? 'bg-[#FE2C55]/25 text-[#FE2C55]'
                        : 'bg-[#222222] hover:bg-[#333333] text-white'
                    }`}
                  >
                    <Heart
                      size={22}
                      fill={likedVideoIds[currentVideo.id] ? '#FE2C55' : 'none'}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white/80">
                    {formatCount(currentVideo.digg_count)}
                  </span>
                </button>

                {/* Comment Button 💬 */}
                <button
                  onClick={() => handleOpenComments(currentVideo)}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white transition">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-[11px] font-bold text-white/80">
                    {formatCount(currentVideo.comment_count)}
                  </span>
                </button>

                {/* Bookmark Button 🔖 */}
                <button
                  onClick={() => handleToggleFavorite(currentVideo.id)}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                      favoritedVideoIds[currentVideo.id]
                        ? 'bg-amber-500/25 text-amber-400'
                        : 'bg-[#222222] hover:bg-[#333333] text-white'
                    }`}
                  >
                    <Bookmark
                      size={22}
                      fill={favoritedVideoIds[currentVideo.id] ? '#f59e0b' : 'none'}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white/80">
                    {formatCount(currentVideo.share_count ? currentVideo.share_count * 2 : 594)}
                  </span>
                </button>

                {/* Share Button ↗️ */}
                <button
                  onClick={() => handleShareVideo(currentVideo)}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white transition">
                    <Share2 size={22} />
                  </div>
                  <span className="text-[11px] font-bold text-white/80">
                    {formatCount(currentVideo.share_count || 113)}
                  </span>
                </button>

                {/* Spinning Music Vinyl Disc (Gambar 1) */}
                <div className="w-10 h-10 rounded-full bg-black border-2 border-[#222222] overflow-hidden flex items-center justify-center animate-spin duration-[4000ms] shadow-lg">
                  <img
                    src={currentVideo.author.avatar}
                    alt="Album"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* UP / DOWN NAVIGATION CHEVRONS (Gambar 1) */}
              <div className="hidden lg:flex flex-col items-center gap-2.5 ml-4 z-20">
                <button
                  onClick={goToPrevVideo}
                  disabled={activeIndex === 0}
                  className="w-10 h-10 rounded-full bg-[#222222] hover:bg-[#333333] disabled:opacity-30 disabled:hover:bg-[#222222] text-white flex items-center justify-center transition shadow-lg"
                  title="Video Sebelumnya (Arrow Up)"
                >
                  <ChevronUp size={22} />
                </button>
                <button
                  onClick={goToNextVideo}
                  disabled={activeIndex === videos.length - 1}
                  className="w-10 h-10 rounded-full bg-[#222222] hover:bg-[#333333] disabled:opacity-30 disabled:hover:bg-[#222222] text-white flex items-center justify-center transition shadow-lg"
                  title="Video Selanjutnya (Arrow Down)"
                >
                  <ChevronDown size={22} />
                </button>
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
          const idx = videos.findIndex((item) => item.id === v.id);
          if (idx !== -1) setActiveIndex(idx);
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
        onSelectVideo={(v) => {
          const idx = videos.findIndex((item) => item.id === v.id);
          if (idx !== -1) setActiveIndex(idx);
          setIsCreatorProfileOpen(false);
        }}
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
