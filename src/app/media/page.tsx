'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Share2,
  Bookmark,
  Music,
  Volume2,
  VolumeX,
  Play,
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
  Bell,
  MoreHorizontal,
  Smartphone,
  Monitor,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useTikTokAuthStore } from '@/lib/store/useTikTokAuthStore';
import { getCurrentUser } from '@/lib/services/authService';
import { TikTokVideoItem } from '@/app/api/tiktok/route';
import { ScrapedComment } from '@/app/api/tiktok/comments/route';
import { CreatorProfileModal } from '@/components/media/CreatorProfileModal';
import { CommentDrawer } from '@/components/media/CommentDrawer';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';
import { TikTokLoginModal } from '@/components/media/TikTokLoginModal';
import { TikTokMessagesDrawer } from '@/components/media/TikTokMessagesDrawer';
import { TikTokLiveModal } from '@/components/media/TikTokLiveModal';
import { TikTokExploreView } from '@/components/media/TikTokExploreView';
import { TikTokUploadModal } from '@/components/media/TikTokUploadModal';
import { TikTokActivityDrawer } from '@/components/media/TikTokActivityDrawer';
import { TikTokProfileView } from '@/components/media/TikTokProfileView';
import { TikTokMoreMenu } from '@/components/media/TikTokMoreMenu';

// ================= TIKTOK 3D OFFSET GLITCH LOGO =================
function TikTokLogo() {
  return (
    <div className="flex items-center gap-2 select-none cursor-pointer">
      <div className="relative w-6 h-6 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="absolute -left-[1px] -top-[1px] w-6 h-6 fill-[#25F4EE] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="absolute left-[1px] top-[1px] w-6 h-6 fill-[#FE2C55] opacity-90 pointer-events-none"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
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
  const { setUser } = useAuthStore();
  const { setMobileSidebarOpen } = useChatStore();

  // TikTok dedicated auth store
  const {
    tiktokUser,
    isLoggedIn: isTikTokLoggedIn,
    initSession: initTikTokSession,
    logoutTikTok,
    addLikedVideo,
    removeLikedVideo,
    addSavedVideo,
    removeSavedVideo,
  } = useTikTokAuthStore();

  // Feed & navigation
  const [videos, setVideos] = useState<TikTokVideoItem[]>([]);
  const [userUploadedVideos, setUserUploadedVideos] = useState<TikTokVideoItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('ID');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<
    'saran' | 'jelajahi' | 'mengikuti' | 'teman'
  >('saran');
  const [activeIndex, setActiveIndex] = useState(0);

  // TikTok Sidebar toggle (on desktop)
  const [isTikTokSidebarCollapsed, setIsTikTokSidebarCollapsed] = useState(false);

  // Top-Right TikTok Account Dropdown (Gambar 2)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement | null>(null);

  // Video playback & audio
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileFeedContainerRef = useRef<HTMLDivElement | null>(null);

  // Floating hearts on double tap
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Interactive states (Likes, Favorites, Follows, Comments)
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});
  const [favoritedVideoIds, setFavoritedVideoIds] = useState<Record<string, boolean>>({});
  const [followingCreatorIds, setFollowingCreatorIds] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, ScrapedComment[]>>({});

  // Modals & Drawers
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMessagesDrawerOpen, setIsMessagesDrawerOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Creator Modal & Comment Drawer
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

  // 1. Initial auth check for Dardcor & TikTok
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    checkAuth();
    initTikTokSession();
  }, [setUser, initTikTokSession]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pool region TikTok untuk variasi tak terbatas (Infinite Feed)
  const REGION_POOL = ['ID', 'GLOBAL', 'US', 'JP', 'MY', 'SG', 'KR', 'TH', 'VN', 'PH', 'BR', 'GB'];
  const [regionPoolIndex, setRegionPoolIndex] = useState(0);
  const seenVideoIdsRef = useRef<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 2. Fetch live TikTok feed (Dukungan Fresh Random Feed & Deduplikasi)
  const loadFeed = useCallback(
    async (region: string, query: string, isRefresh = false) => {
      setIsLoadingFeed(true);
      try {
        let targetRegion = region;
        if (isRefresh) {
          const nextIdx = (regionPoolIndex + 1) % REGION_POOL.length;
          setRegionPoolIndex(nextIdx);
          targetRegion = REGION_POOL[nextIdx];
        }

        const excludeParam = Array.from(seenVideoIdsRef.current).slice(-100).join(',');
        const url = `/api/tiktok?region=${encodeURIComponent(targetRegion)}&count=25${
          query ? `&keywords=${encodeURIComponent(query)}` : ''
        }${excludeParam ? `&exclude_ids=${encodeURIComponent(excludeParam)}` : ''}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const freshVideos = isRefresh
            ? data.data.filter((v: TikTokVideoItem) => !seenVideoIdsRef.current.has(v.id))
            : data.data;

          const finalList = freshVideos.length > 0 ? freshVideos : data.data;
          finalList.forEach((v: TikTokVideoItem) => seenVideoIdsRef.current.add(v.id));

          setVideos(finalList);
          setActiveIndex(0);

          if (mobileFeedContainerRef.current) {
            mobileFeedContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
          }
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error('Failed to fetch TikTok feed:', err);
      } finally {
        setIsLoadingFeed(false);
      }
    },
    [regionPoolIndex]
  );

  // 3. Load More Videos secara otomatis (Unlimited Scroll Tanpa Batas)
  const loadMoreVideos = useCallback(async () => {
    if (isLoadingMore || isLoadingFeed) return;
    setIsLoadingMore(true);

    try {
      const nextIdx = (regionPoolIndex + 1) % REGION_POOL.length;
      setRegionPoolIndex(nextIdx);
      const nextReg = REGION_POOL[nextIdx];

      const excludeParam = Array.from(seenVideoIdsRef.current).slice(-150).join(',');
      const url = `/api/tiktok?region=${encodeURIComponent(nextReg)}&count=20${
        submittedQuery ? `&keywords=${encodeURIComponent(submittedQuery)}` : ''
      }&exclude_ids=${encodeURIComponent(excludeParam)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const fresh = data.data.filter((v: TikTokVideoItem) => !seenVideoIdsRef.current.has(v.id));
        const toAdd = fresh.length > 0 ? fresh : data.data;
        toAdd.forEach((v: TikTokVideoItem) => seenVideoIdsRef.current.add(v.id));

        setVideos((prev) => [...prev, ...toAdd]);
      }
    } catch (err) {
      console.warn('Gagal memuat video lanjutan:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isLoadingFeed, regionPoolIndex, submittedQuery]);

  useEffect(() => {
    loadFeed(selectedRegion, submittedQuery);
  }, [selectedRegion, submittedQuery, loadFeed]);

  // Filtered videos based on active menu
  const displayedVideos: TikTokVideoItem[] = (() => {
    const all = [...userUploadedVideos, ...videos];
    if (activeMenu === 'mengikuti') {
      const followed = all.filter((v) => followingCreatorIds[v.author.id]);
      return followed.length > 0 ? followed : all;
    }
    if (activeMenu === 'teman') {
      return all.slice(0, 10);
    }
    return all;
  })();

  const currentVideo: TikTokVideoItem | undefined = displayedVideos[activeIndex];

  // Sinkronisasi posisi scroll container mobile saat activeIndex berubah
  useEffect(() => {
    if (mobileFeedContainerRef.current) {
      const targetY = activeIndex * mobileFeedContainerRef.current.clientHeight;
      if (Math.abs(mobileFeedContainerRef.current.scrollTop - targetY) > 20) {
        mobileFeedContainerRef.current.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);

  // Handler scroll native mobile dengan CSS Scroll Snap (60/120fps fluid, nol jeda)
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || el.clientHeight === 0) return;
    const newIdx = Math.round(el.scrollTop / el.clientHeight);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < displayedVideos.length) {
      setActiveIndex(newIdx);
      setIsPlaying(true);
    }
    // Pre-fetch video berikutnya saat mendekati akhir daftar
    if (newIdx >= displayedVideos.length - 3) {
      loadMoreVideos();
    }
  };

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
    if (activeIndex < displayedVideos.length - 1) {
      setActiveIndex((prev) => prev + 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
    if (activeIndex >= displayedVideos.length - 3) {
      loadMoreVideos();
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
  }, [activeIndex, displayedVideos, currentVideo]);

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
    setActiveMenu('saran');
  };

  // 4. Toggle Like
  const handleToggleLike = (videoId: string) => {
    const isCurrentlyLiked = Boolean(likedVideoIds[videoId]);
    setLikedVideoIds((prev) => ({ ...prev, [videoId]: !isCurrentlyLiked }));

    const targetVid = displayedVideos.find((v) => v.id === videoId);
    if (targetVid) {
      if (!isCurrentlyLiked) {
        addLikedVideo(targetVid);
      } else {
        removeLikedVideo(videoId);
      }
    }

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
    const isFav = Boolean(favoritedVideoIds[videoId]);
    setFavoritedVideoIds((prev) => ({ ...prev, [videoId]: !isFav }));

    const targetVid = displayedVideos.find((v) => v.id === videoId);
    if (targetVid) {
      if (!isFav) {
        addSavedVideo(targetVid);
      } else {
        removeSavedVideo(videoId);
      }
    }
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
      user_name: tiktokUser?.nickname || 'Pengguna TikTok',
      user_handle: tiktokUser?.unique_id || 'user',
      user_avatar:
        tiktokUser?.avatar_url ||
        'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg',
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

  // 12. Handle video upload
  const handleNewVideoUploaded = (newVid: TikTokVideoItem) => {
    setUserUploadedVideos((prev) => [newVid, ...prev]);
    setActiveIndex(0);
    setActiveMenu('saran');
  };

  // Suggested creators list
  const suggestedCreators = Array.from(
    new Map(videos.map((v) => [v.author.id || v.author.unique_id, v.author])).values()
  ).slice(0, 6);

  // Liked & saved lists for profile
  const likedVideosList = displayedVideos.filter((v) => likedVideoIds[v.id]);
  const savedVideosList = displayedVideos.filter((v) => favoritedVideoIds[v.id]);

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
      {/* 2. TIKTOK INTERFACE CONTAINER (Exact Match to Gambar 1 & Gambar 2)       */}
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
              <div onClick={() => setActiveMenu('saran')}>
                <TikTokLogo />
              </div>
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
            {/* 1. Saran (Home / For you - Active in Red) */}
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

            {/* 2. Jelajahi */}
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

            {/* 3. Mengikuti */}
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

            {/* 4. Teman */}
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

            {/* 5. LIVE */}
            <button
              onClick={() => setIsLiveModalOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Radio size={20} className="text-[#FE2C55] animate-pulse" />
              {!isTikTokSidebarCollapsed && <span>LIVE</span>}
            </button>

            {/* 6. Pesan (TikTok Direct Messages - KHUSUS TIKTOK, TIDAK KE /chat) */}
            <button
              onClick={() => setIsMessagesDrawerOpen(true)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <MessageCircle size={20} />
                {!isTikTokSidebarCollapsed && <span>Pesan</span>}
              </div>
              {!isTikTokSidebarCollapsed && (
                <span className="w-4 h-4 rounded-full bg-[#FE2C55] text-white text-[10px] font-black flex items-center justify-center shadow-md">
                  3
                </span>
              )}
            </button>

            {/* 7. Aktivitas */}
            <button
              onClick={() => setIsActivityDrawerOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Bell size={20} />
              {!isTikTokSidebarCollapsed && <span>Aktivitas</span>}
            </button>

            {/* 8. Unggah */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Upload size={20} />
              {!isTikTokSidebarCollapsed && <span>Unggah</span>}
            </button>

            {/* 9. Profil (TikTok Profile) */}
            <button
              onClick={() => {
                if (isTikTokLoggedIn) {
                  setIsProfileViewOpen(true);
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition ${
                isTikTokSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <User size={20} />
              {!isTikTokSidebarCollapsed && <span>Profil</span>}
            </button>

            {/* 10. Lainnya */}
            <button
              onClick={() => setIsMoreMenuOpen(true)}
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

        {/* ================= CENTER MAIN VIEW ================= */}
        <main className="flex-1 h-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
          {/* Mobile Top Header (< md): Menu Hamburger + Tabs + Search (Selalu Fixed di Atas, Tidak Pernah Hilang) */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gradient-to-b from-black/95 via-black/60 to-transparent px-4 flex items-center justify-between pointer-events-auto pt-[env(safe-area-inset-top,0px)]">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/90 hover:text-white"
              title="Buka Menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-5 text-sm font-extrabold text-white">
              <span
                onClick={() => setActiveMenu('mengikuti')}
                className={`cursor-pointer transition ${
                  activeMenu === 'mengikuti' ? 'border-b-2 border-white pb-0.5 text-white font-black' : 'text-white/60'
                }`}
              >
                Mengikuti
              </span>
              <span
                onClick={() => setActiveMenu('saran')}
                className={`cursor-pointer transition ${
                  activeMenu === 'saran' ? 'border-b-2 border-white pb-0.5 text-white font-black' : 'text-white/60'
                }`}
              >
                Saran
              </span>
            </div>
            <button
              onClick={() => setActiveMenu('jelajahi')}
              className="p-1.5 rounded-full text-white/90 hover:text-white transition"
              title="Cari Video & Kreator"
            >
              <Search size={22} />
            </button>
          </div>

          {/* Top-Right Tools & Account Dropdown (Exact Match to Gambar 2) */}
          <div className="hidden md:flex items-center gap-3 absolute top-5 right-6 z-30">
            {/* Desktop / Mobile app icons */}
            <div className="flex items-center gap-2 bg-[#222222]/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-lg">
              <button
                onClick={() => handleShareVideo(currentVideo || displayedVideos[0])}
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
            </div>

            {/* TikTok Account Button & Dropdown (Gambar 2) */}
            <div className="relative" ref={accountDropdownRef}>
              {isTikTokLoggedIn && tiktokUser ? (
                <button
                  onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-[#FE2C55] transition shadow-lg flex items-center justify-center bg-[#222222]"
                  title={`Akun TikTok: ${tiktokUser.nickname}`}
                >
                  <img
                    src={
                      tiktokUser.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        tiktokUser.unique_id
                      )}`
                    }
                    alt={tiktokUser.nickname}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        tiktokUser.unique_id
                      )}`;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-[#FE2C55] hover:bg-[#e02449] text-white font-bold text-xs shadow-lg transition"
                >
                  Masuk
                </button>
              )}

              {/* Dropdown Menu (Persis Gambar 2) */}
              {isAccountDropdownOpen && isTikTokLoggedIn && (
                <div className="absolute right-0 mt-2 w-48 bg-[#222222] border border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in">
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      setIsProfileViewOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition"
                  >
                    <User size={16} />
                    <span>Lihat profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      logoutTikTok();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition border-t border-white/10"
                  >
                    <LogOut size={16} />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= CONDITION 1: EXPLORE VIEW ================= */}
          {activeMenu === 'jelajahi' ? (
            <TikTokExploreView
              videos={videos}
              onSelectVideo={(v) => {
                const idx = displayedVideos.findIndex((item) => item.id === v.id);
                if (idx !== -1) setActiveIndex(idx);
                setActiveMenu('saran');
              }}
              onFilterCategory={(kw) => {
                setSubmittedQuery(kw);
              }}
            />
          ) : isLoadingFeed ? (
            /* ================= CONDITION 2: LOADING ================= */
            <div className="flex flex-col items-center justify-center gap-3 text-white/60">
              <div className="w-10 h-10 border-4 border-[#FE2C55] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Memuat video realtime TikTok...</p>
            </div>
          ) : !currentVideo ? (
            /* ================= CONDITION 3: EMPTY FEED ================= */
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
            /* ================= CONDITION 4: MAIN VIDEO PLAYER ================= */
            <>
              {/* ================= 4A. MOBILE VIEW (< md): 60/120fps CSS Scroll Snap Container (Fluid, Nol Jeda) ================= */}
              <div
                ref={mobileFeedContainerRef}
                onScroll={handleMobileScroll}
                className="md:hidden w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative select-none bg-black"
                style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {displayedVideos.map((vid, idx) => {
                  const isCurrent = idx === activeIndex;
                  const isNearby = Math.abs(idx - activeIndex) <= 1;

                  return (
                    <div
                      key={vid.id}
                      data-index={idx}
                      className="w-full h-[100dvh] snap-start snap-always shrink-0 relative flex items-center justify-center bg-black overflow-hidden"
                    >
                      {/* Video or Image Poster for optimal performance */}
                      {isNearby ? (
                        <video
                          ref={isCurrent ? activeVideoRef : null}
                          src={vid.video_url}
                          poster={vid.cover_url}
                          className="w-full h-full object-cover cursor-pointer"
                          loop
                          playsInline
                          autoPlay={isCurrent}
                          muted={isMuted}
                          onTimeUpdate={isCurrent ? handleTimeUpdate : undefined}
                          onClick={togglePlay}
                        />
                      ) : (
                        <img
                          src={vid.cover_url}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Floating Hearts on Double Tap */}
                      {isCurrent &&
                        floatingHearts.map((heart) => (
                          <div
                            key={heart.id}
                            style={{ left: heart.x, top: heart.y }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-bounce"
                          >
                            <Heart size={70} fill="#FE2C55" color="#FE2C55" />
                          </div>
                        ))}

                      {/* Sound Toggle (Top-Left) */}
                      <button
                        onClick={() => setIsMuted((prev) => !prev)}
                        className="absolute top-16 left-4 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition shadow-lg"
                        title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
                      >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>

                      {/* Center Play Indicator when paused */}
                      {isCurrent && !isPlaying && (
                        <div
                          onClick={togglePlay}
                          className="absolute inset-0 bg-black/35 flex items-center justify-center cursor-pointer z-20"
                        >
                          <div className="w-16 h-16 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
                            <Play size={28} fill="white" className="translate-x-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Floating Action Overlay on the Right (Persis Gambar 1) */}
                      <div className="absolute right-2.5 bottom-20 z-30 flex flex-col items-center gap-3.5 pointer-events-auto">
                        {/* Creator Avatar with Red '+' badge */}
                        <div className="relative mb-1">
                          <img
                            src={vid.author.avatar}
                            alt={vid.author.nickname}
                            referrerPolicy="no-referrer"
                            onClick={() => handleOpenCreator(vid.author)}
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                vid.author.unique_id
                              )}`;
                            }}
                            className="w-11 h-11 rounded-full object-cover border-2 border-white cursor-pointer shadow-lg active:scale-95 transition"
                          />
                          {!followingCreatorIds[vid.author.id] && (
                            <button
                              onClick={() => handleToggleFollow(vid.author.id)}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FE2C55] text-white flex items-center justify-center font-black text-xs shadow-md"
                              title="Ikuti Kreator"
                            >
                              +
                            </button>
                          )}
                        </div>

                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(vid.id)}
                          className="flex flex-col items-center gap-0.5 text-white active:scale-90 transition"
                        >
                          <Heart
                            size={28}
                            fill={likedVideoIds[vid.id] ? '#FE2C55' : 'rgba(255,255,255,0.9)'}
                            color={likedVideoIds[vid.id] ? '#FE2C55' : 'white'}
                            className="drop-shadow-lg"
                          />
                          <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {formatCount(vid.digg_count)}
                          </span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => handleOpenComments(vid)}
                          className="flex flex-col items-center gap-0.5 text-white active:scale-90 transition"
                        >
                          <MessageCircle size={28} className="text-white drop-shadow-lg fill-white/10" />
                          <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {formatCount(vid.comment_count)}
                          </span>
                        </button>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleToggleFavorite(vid.id)}
                          className="flex flex-col items-center gap-0.5 text-white active:scale-90 transition"
                        >
                          <Bookmark
                            size={28}
                            fill={favoritedVideoIds[vid.id] ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                            color={favoritedVideoIds[vid.id] ? '#f59e0b' : 'white'}
                            className="drop-shadow-lg"
                          />
                          <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {formatCount(vid.share_count ? vid.share_count * 2 : 594)}
                          </span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShareVideo(vid)}
                          className="flex flex-col items-center gap-0.5 text-white active:scale-90 transition"
                        >
                          <Share2 size={28} className="text-white drop-shadow-lg" />
                          <span className="text-[11px] font-bold text-white drop-shadow-md">
                            {formatCount(vid.share_count || 113)}
                          </span>
                        </button>

                        {/* Spinning Vinyl Music Disc */}
                        <div className="w-10 h-10 rounded-full bg-black/80 border-2 border-[#333333] overflow-hidden flex items-center justify-center animate-[spin_4s_linear_infinite] shadow-xl mt-1">
                          <img
                            src={vid.author.avatar}
                            alt="Audio"
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=disc`;
                            }}
                          />
                        </div>
                      </div>

                      {/* Bottom Details Overlay (Caption, Author, Audio) */}
                      <div className="absolute left-0 right-0 bottom-0 z-20 p-4 pb-20 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-1.5 pointer-events-auto pr-16">
                        <div
                          onClick={() => handleOpenCreator(vid.author)}
                          className="font-black text-sm hover:underline cursor-pointer drop-shadow-md flex items-center gap-1.5"
                        >
                          <span>{vid.author.nickname}</span>
                        </div>

                        <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md font-medium">
                          {vid.title}
                        </p>

                        <div className="flex items-center gap-1 text-[11px] text-white/60 hover:underline cursor-pointer drop-shadow-sm">
                          <span>Lihat terjemahan</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-white/90 font-medium pt-0.5 drop-shadow-md">
                          <Music size={12} className="flex-shrink-0 animate-pulse text-[#FE2C55]" />
                          <span className="truncate">
                            {vid.music_info?.title || 'Suara asli - ' + vid.author.nickname}
                          </span>
                        </div>

                        {/* Progress Bar (Hanya video aktif) */}
                        {isCurrent && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= 4B. DESKTOP VIEW (md:): Centered Card Player with Controls ================= */}
              <div className="hidden md:flex items-center justify-center w-full h-full p-4 bg-black overflow-hidden relative">
                {/* VIDEO FRAME BOX */}
                <div
                  onDoubleClick={handleVideoDoubleClick}
                  className="relative h-[86vh] max-h-[820px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none flex items-center justify-center group"
                >
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

                  {/* Sound Toggle Button */}
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

                  {/* Bottom Details Overlay */}
                  <div className="absolute left-0 right-0 bottom-0 z-20 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 pointer-events-auto">
                    <div
                      onClick={() => handleOpenCreator(currentVideo.author)}
                      className="font-bold text-sm hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <span>—{currentVideo.author.nickname}</span>
                    </div>

                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                      {currentVideo.title}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-white/50 hover:underline cursor-pointer">
                      <span>Lihat terjemahan</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium pt-1">
                      <Music size={12} className="flex-shrink-0 animate-pulse" />
                      <span className="truncate">
                        {currentVideo.music_info?.title || 'Suara asli - ' + currentVideo.author.nickname}
                      </span>
                    </div>

                    {/* Red Progress Bar */}
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

                {/* DESKTOP ONLY: RIGHT VERTICAL FLOATING ACTION COLUMN */}
                <div className="flex flex-col items-center gap-4 ml-4 sm:ml-5 z-20">
                  {/* Creator Avatar with Red '+' badge */}
                  <div className="relative mb-1">
                    <img
                      src={currentVideo.author.avatar}
                      alt={currentVideo.author.nickname}
                      referrerPolicy="no-referrer"
                      onClick={() => handleOpenCreator(currentVideo.author)}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                          currentVideo.author.unique_id
                        )}`;
                      }}
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

                  {/* Spinning Music Vinyl Disc */}
                  <div className="w-10 h-10 rounded-full bg-black border-2 border-[#222222] overflow-hidden flex items-center justify-center animate-spin duration-[4000ms] shadow-lg">
                    <img
                      src={currentVideo.author.avatar}
                      alt="Album"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=disc`;
                      }}
                    />
                  </div>
                </div>

                {/* UP / DOWN NAVIGATION CHEVRONS (Desktop) */}
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
                    disabled={activeIndex === displayedVideos.length - 1}
                    className="w-10 h-10 rounded-full bg-[#222222] hover:bg-[#333333] disabled:opacity-30 disabled:hover:bg-[#222222] text-white flex items-center justify-center transition shadow-lg"
                    title="Video Selanjutnya (Arrow Down)"
                  >
                    <ChevronDown size={22} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (Exact Match to Gambar 1) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 text-white">
        {/* 1. Beranda */}
        <button
          onClick={() => setActiveMenu('saran')}
          className={`flex flex-col items-center gap-0.5 transition ${
            activeMenu === 'saran' ? 'text-white font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Home size={20} className={activeMenu === 'saran' ? 'fill-white' : ''} />
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* 2. Temukan */}
        <button
          onClick={() => setActiveMenu('jelajahi')}
          className={`flex flex-col items-center gap-0.5 transition ${
            activeMenu === 'jelajahi' ? 'text-white font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Compass size={20} className={activeMenu === 'jelajahi' ? 'text-[#FE2C55]' : ''} />
          <span className="text-[10px]">Temukan</span>
        </button>

        {/* 3. TikTok 3D Plus Upload Button (Gambar 1) */}
        <button
          onClick={() => {
            if (isTikTokLoggedIn) setIsUploadModalOpen(true);
            else setIsLoginModalOpen(true);
          }}
          className="relative w-11 h-7 flex items-center justify-center cursor-pointer transition active:scale-95"
          title="Unggah Video"
        >
          <div className="absolute inset-0 bg-[#00F2FE] rounded-lg -translate-x-1" />
          <div className="absolute inset-0 bg-[#FE2C55] rounded-lg translate-x-1" />
          <div className="relative w-full h-full bg-white rounded-lg flex items-center justify-center text-black font-black text-lg leading-none shadow-sm">
            +
          </div>
        </button>

        {/* 4. Kotak Masuk */}
        <button
          onClick={() => {
            if (isTikTokLoggedIn) setIsMessagesDrawerOpen(true);
            else setIsLoginModalOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
        >
          <MessageSquare size={20} />
          <span className="text-[10px]">Kotak Masuk</span>
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => {
            if (isTikTokLoggedIn) setIsProfileViewOpen(true);
            else setIsLoginModalOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
        >
          {isTikTokLoggedIn && tiktokUser ? (
            <img
              src={tiktokUser.avatar_url}
              alt={tiktokUser.nickname}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-white/40"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=user`;
              }}
            />
          ) : (
            <User size={20} />
          )}
          <span className="text-[10px]">Profil</span>
        </button>
      </nav>

      {/* ================= MODALS & DRAWERS ================= */}
      {/* 1. TikTok Login Modal (Masuk Akun TikTok via Gmail / Username) */}
      <TikTokLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* 2. TikTok Direct Messages Drawer (KHUSUS TIKTOK, BUKAN CHAT DARDCOR) */}
      <TikTokMessagesDrawer
        isOpen={isMessagesDrawerOpen}
        onClose={() => setIsMessagesDrawerOpen(false)}
        currentUser={tiktokUser}
        feedVideos={displayedVideos}
      />

      {/* 3. TikTok LIVE Modal */}
      <TikTokLiveModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        currentUser={tiktokUser}
        video={currentVideo || videos[0]}
      />

      {/* 4. TikTok Upload Video Studio Modal */}
      <TikTokUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={tiktokUser}
        onVideoUploaded={handleNewVideoUploaded}
      />

      {/* 5. TikTok Activity / Notifications Drawer */}
      <TikTokActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
      />

      {/* 6. TikTok User Profile Modal / View */}
      <TikTokProfileView
        isOpen={isProfileViewOpen}
        onClose={() => setIsProfileViewOpen(false)}
        likedVideos={likedVideosList}
        savedVideos={savedVideosList}
        uploadedVideos={userUploadedVideos}
        feedVideos={displayedVideos}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onSelectVideo={(v) => {
          const idx = displayedVideos.findIndex((item) => item.id === v.id);
          if (idx !== -1) setActiveIndex(idx);
          setActiveMenu('saran');
        }}
      />

      {/* 7. TikTok More Settings Menu */}
      <TikTokMoreMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />

      {/* 8. Scraped Creator Profile Modal */}
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
          const idx = displayedVideos.findIndex((item) => item.id === v.id);
          if (idx !== -1) setActiveIndex(idx);
          setActiveMenu('saran');
          setIsCreatorProfileOpen(false);
        }}
      />

      {/* 9. Live TikTok Comments Drawer */}
      <CommentDrawer
        isOpen={Boolean(activeCommentVideo)}
        onClose={() => setActiveCommentVideo(null)}
        comments={activeCommentVideo ? commentsMap[activeCommentVideo.id] || [] : []}
        isLoading={isLoadingComments}
        currentUser={{
          id: tiktokUser?.id || 'tt_me',
          username: tiktokUser?.unique_id || 'user',
          display_name: tiktokUser?.nickname || 'TikTok User',
          avatar_url: tiktokUser?.avatar_url || '',
          created_at: '',
          updated_at: '',
        }}
        onPostComment={handlePostComment}
        onLikeComment={handleLikeComment}
      />
    </div>
  );
}
