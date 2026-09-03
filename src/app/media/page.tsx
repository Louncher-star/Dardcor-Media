'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Film, 
  Heart, 
  MessageCircle, 
  Share2, 
  Music, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Play, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  Smartphone,
  Check,
  Sparkles
} from 'lucide-react';
import { getCurrentUser } from '@/lib/services/authService';
import { Profile } from '@/types';
import { TikTokVideoItem } from '@/app/api/tiktok/route';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';

interface ReelItemProps {
  video: TikTokVideoItem;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  liked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  copied: boolean;
  formatNumber: (n: number) => string;
  index: number;
}

function ReelItem({
  video,
  isActive,
  isMuted,
  toggleMute,
  liked,
  onToggleLike,
  onShare,
  copied,
  formatNumber,
  index,
}: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Play / Pause video sesuai status aktif di viewport
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      data-index={index}
      style={{ width: '100%', height: '100%', aspectRatio: '9/16' }}
      className="reel-slide relative w-full h-full snap-start snap-always shrink-0 bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Video Element: object-cover di dalam frame 9:16 agar pas sempurna tanpa zoom-in berlebih */}
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.cover_url}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      {/* Pause Indicator Overlay */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity z-10"
        >
          <div className="w-16 h-16 rounded-full bg-purple-600/80 text-white flex items-center justify-center shadow-lg backdrop-blur-sm">
            <Play size={28} className="translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Top Audio Mute Button */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center z-20 pointer-events-none">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 pointer-events-auto transition active:scale-95 shadow-md"
          title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
      </div>

      {/* Right Side Social Overlay: Love, Comment, Share (Terkunci tepat di tepi kanan video) */}
      <div className="absolute right-2.5 sm:right-3.5 bottom-24 sm:bottom-16 flex flex-col items-center gap-4 sm:gap-5 z-20">
        {/* Creator Avatar with Follow Badge */}
        <div className="relative group cursor-pointer" title={`@${video.author.unique_id}`}>
          <img
            src={video.author.avatar}
            alt={video.author.nickname}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white object-cover shadow-lg"
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
            +
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={onToggleLike}
          className="flex flex-col items-center gap-1 text-white active:scale-125 hover:scale-110 transition-transform"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              liked
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                : 'bg-black/50 border border-white/15 text-white hover:bg-white/20'
            }`}
          >
            <Heart
              size={19}
              fill={liked ? 'currentColor' : 'none'}
              className={liked ? 'text-white' : ''}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold drop-shadow">
            {formatNumber(video.digg_count + (liked ? 1 : 0))}
          </span>
        </button>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1 text-white">
          <div className="w-10 h-10 rounded-full bg-black/50 border border-white/15 flex items-center justify-center backdrop-blur-md">
            <MessageCircle size={19} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold drop-shadow">
            {formatNumber(video.comment_count)}
          </span>
        </div>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
          title="Bagikan Video"
        >
          <div className="w-10 h-10 rounded-full bg-black/50 border border-white/15 flex items-center justify-center backdrop-blur-md">
            {copied ? <Check size={17} className="text-emerald-400" /> : <Share2 size={19} />}
          </div>
          <span className="text-[10px] font-bold drop-shadow">
            {copied ? 'Tersalin' : formatNumber(video.share_count)}
          </span>
        </button>
      </div>

      {/* Bottom Video Info & Music Details */}
      <div className="absolute left-3 sm:left-4 right-16 bottom-20 sm:bottom-5 z-20 space-y-1.5 pointer-events-auto">
        {/* Creator Handle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="font-bold text-sm text-white drop-shadow-md hover:underline cursor-pointer">
            @{video.author.nickname}
          </h3>
          <span className="text-[10px] text-purple-300 font-mono">
            #{video.author.unique_id}
          </span>
        </div>

        {/* Video Caption */}
        <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md">
          {video.title}
        </p>

        {/* Music Info */}
        <div className="flex items-center gap-2 text-[11px] text-purple-200/90 pt-0.5">
          <Music size={12} className="shrink-0 animate-pulse text-[#c084fc]" />
          <span className="truncate">
            {video.music_info?.title || 'Suara Asli'} • {video.music_info?.author || video.author.nickname}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MediaFeedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Video State
  const [videos, setVideos] = useState<TikTokVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('ID');
  const [viewMode, setViewMode] = useState<'reels' | 'grid'>('reels');

  // Reels Active State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Cek sesi pengguna
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setCurrentUser(user);
        setIsLoadingAuth(false);
      }
    });
  }, [router]);

  // 2. Fetch video awal
  const fetchTikTokFeed = async (regionCode: string) => {
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`/api/tiktok?region=${regionCode}&count=15&_t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setVideos(json.data);
        setActiveIndex(0);
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    } catch (err) {
      console.error('Error loading TikTok feed:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchTikTokFeed(selectedRegion);
  }, [selectedRegion]);

  // 3. Infinite Scrolling: Tarik video berikutnya secara otomatis (Unlimited Feed)
  const loadMoreVideos = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/tiktok?region=${selectedRegion}&count=15&_t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const uniqueNew = json.data.filter((v: TikTokVideoItem) => !existingIds.has(v.id));
          if (uniqueNew.length > 0) {
            return [...prev, ...uniqueNew];
          }
          return [
            ...prev,
            ...json.data.map((v: TikTokVideoItem) => ({
              ...v,
              id: `${v.id}_${Date.now()}_${Math.random()}`,
            })),
          ];
        });
      }
    } catch (err) {
      console.error('Error loading more videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, selectedRegion]);

  // 4. Scroll Listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== 'reels') return;

    const handleScroll = () => {
      const height = container.clientHeight;
      if (height === 0) return;
      const index = Math.round(container.scrollTop / height);
      if (index >= 0 && index < videos.length && index !== activeIndex) {
        setActiveIndex(index);
      }

      if (index >= videos.length - 3 && !isLoadingMore) {
        loadMoreVideos();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [videos.length, activeIndex, viewMode, isLoadingMore, loadMoreVideos]);

  const scrollToVideo = useCallback((index: number) => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * height,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  const handleNextVideo = () => {
    if (activeIndex < videos.length - 1) {
      scrollToVideo(activeIndex + 1);
    } else {
      loadMoreVideos();
    }
  };

  const handlePrevVideo = () => {
    if (activeIndex > 0) {
      scrollToVideo(activeIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'reels') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeIndex, videos.length]);

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const handleShare = (video: TikTokVideoItem) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: video.title,
          text: `Tonton video seru dari @${video.author.nickname} di Dardcor Media:`,
          url: video.video_url,
        })
        .catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(video.video_url);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0d19] text-white select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-purple-900/50" />
        <span className="text-sm tracking-widest text-[#a78bfa] font-bold">DARDCOR MEDIA</span>
        <span className="text-xs text-[#a78bfa]/70 mt-1">Memuat Media Feed...</span>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex bg-[#07050e] text-white select-none relative">
      {/* ================= UNIFIED DESKTOP NAVIGATION SIDEBAR ================= */}
      <AppNavigationSidebar />

      {/* ================= MAIN CONTENT VIEW ================= */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#0e0a1b]/95 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between shrink-0 z-20 shadow-md">
          {/* Left: Mobile Brand & Quick Header Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="md:hidden flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center shadow-md shadow-purple-900/40">
                <Film size={16} className="text-white" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                Dardcor
              </span>
            </Link>

            {/* Desktop Quick Header Info */}
            <div className="hidden md:flex items-center gap-2 text-xs text-purple-200">
              <Sparkles size={14} className="text-[#c084fc]" />
              <span className="font-semibold text-white">TikTok Realtime Media</span>
              <span className="text-purple-400/80">• Video Trending Indonesia & Dunia</span>
            </div>
          </div>

          {/* Center: Region Filter Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#181329] p-1 rounded-xl border border-purple-500/20">
            {[
              { id: 'ID', label: '🇮🇩 Indonesia' },
              { id: 'GLOBAL', label: '🌍 Global' },
              { id: 'US', label: '🇺🇸 USA' },
              { id: 'JP', label: '🇯🇵 Japan' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-3 py-1 text-xs rounded-lg transition font-medium ${
                  selectedRegion === r.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-purple-200/60 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Right: Region Selector (Mobile), Refresh, View Mode */}
          <div className="flex items-center gap-2">
            {/* Mobile Region Dropdown */}
            <div className="lg:hidden flex items-center">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-[#1c162e] border border-purple-500/30 text-[#c084fc] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="ID">🇮🇩 ID</option>
                <option value="GLOBAL">🌍 Global</option>
                <option value="US">🇺🇸 US</option>
                <option value="JP">🇯🇵 JP</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchTikTokFeed(selectedRegion)}
              disabled={isLoadingVideos}
              title="Muat Ulang Feed Realtime"
              className="p-1.5 sm:p-2 rounded-xl bg-[#1c162e] hover:bg-[#281f42] border border-purple-500/20 text-purple-300 hover:text-white transition disabled:opacity-50"
            >
              <RotateCw size={15} className={isLoadingVideos ? 'animate-spin' : ''} />
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#1c162e] p-0.5 rounded-xl border border-purple-500/20">
              <button
                onClick={() => setViewMode('reels')}
                title="Tampilan Reels (Scroll Vertikal)"
                className={`p-1 sm:p-1.5 rounded-lg transition ${
                  viewMode === 'reels' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
                }`}
              >
                <Smartphone size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid Explorer"
                className={`p-1 sm:p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Video Canvas Container: Centered & Responsif di Laptop / Desktop */}
        <main className="flex-1 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex items-center justify-center relative overflow-hidden bg-[#06040d]">
          {isLoadingVideos ? (
            <div className="flex flex-col items-center justify-center gap-3 text-purple-300">
              <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-900/50" />
              <p className="text-xs font-medium">Mengambil video TikTok realtime...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center p-6 space-y-3">
              <p className="text-sm text-purple-200">Tidak ada video ditemukan untuk wilayah ini.</p>
              <button
                onClick={() => fetchTikTokFeed(selectedRegion)}
                className="px-4 py-2 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-semibold rounded-xl"
              >
                Coba Lagi
              </button>
            </div>
          ) : viewMode === 'reels' ? (
            /* ================= VERTICAL REELS CONTAINER (RESPONSIF PENUH DI LAPTOP/HP) ================= */
            <div className="relative w-full h-full flex items-center justify-center p-0 sm:py-2">
              {/* Frame Video Scrollable Vertikal: Dibatasi presisi dengan maxWidth & aspectRatio agar tidak melebar */}
              <div
                ref={containerRef}
                style={{
                  width: '100%',
                  maxWidth: '390px',
                  height: '100%',
                  maxHeight: '840px',
                  aspectRatio: '9/16',
                }}
                className="w-full sm:max-w-[390px] h-full sm:h-[92%] sm:max-h-[840px] aspect-[9/16] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-black sm:rounded-3xl shadow-2xl shadow-purple-950/90 sm:border sm:border-purple-500/35 relative mx-auto shrink-0"
              >
                {videos.map((vid, idx) => (
                  <ReelItem
                    key={`${vid.id}_${idx}`}
                    video={vid}
                    isActive={idx === activeIndex}
                    isMuted={isMuted}
                    toggleMute={() => setIsMuted((m) => !m)}
                    liked={Boolean(likedVideos[vid.id])}
                    onToggleLike={() => toggleLike(vid.id)}
                    onShare={() => handleShare(vid)}
                    copied={copiedId === vid.id}
                    formatNumber={formatNumber}
                    index={idx}
                  />
                ))}

                {/* Indikator Memuat Video Baru (Unlimited Scroll) */}
                {isLoadingMore && (
                  <div className="w-full py-6 flex items-center justify-center gap-2 text-purple-300 text-xs">
                    <RotateCw size={14} className="animate-spin" />
                    <span>Memuat video baru...</span>
                  </div>
                )}
              </div>

              {/* Tombol Navigasi Panah Atas & Bawah di Desktop */}
              <div className="hidden lg:flex absolute right-4 xl:right-10 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
                <button
                  onClick={handlePrevVideo}
                  disabled={activeIndex === 0}
                  className="p-3 rounded-2xl bg-[#1a142c] hover:bg-[#251d3d] border border-purple-500/30 text-purple-300 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-95"
                  title="Video Sebelumnya (Arrow Up / Scroll Up)"
                >
                  <ChevronUp size={22} />
                </button>
                <button
                  onClick={handleNextVideo}
                  className="p-3 rounded-2xl bg-[#1a142c] hover:bg-[#251d3d] border border-purple-500/30 text-purple-300 hover:text-white transition shadow-lg active:scale-95"
                  title="Video Selanjutnya (Arrow Down / Scroll Down)"
                >
                  <ChevronDown size={22} />
                </button>
              </div>
            </div>
          ) : (
            /* ================= GRID EXPLORER VIEW ================= */
            <div className="w-full h-full overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 sm:pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                {videos.map((vid, idx) => (
                  <div
                    key={`${vid.id}_grid_${idx}`}
                    onClick={() => {
                      setViewMode('reels');
                      setTimeout(() => scrollToVideo(idx), 50);
                    }}
                    className="group relative aspect-[9/16] bg-[#1a152b] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-purple-500/20 hover:border-purple-500/60 transition-all hover:scale-[1.02] shadow-lg"
                  >
                    <img
                      src={vid.cover_url}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2.5 sm:p-3">
                      <div className="flex justify-end">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                          <Play size={11} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] sm:text-xs font-medium text-white line-clamp-2">{vid.title}</p>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-purple-200/80 pt-0.5">
                          <span className="truncate max-w-[60%]">@{vid.author.nickname}</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Heart size={9} fill="currentColor" /> {formatNumber(vid.digg_count)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating Mobile Bottom Action Bar */}
          <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm bg-[#130f24]/95 backdrop-blur-xl border border-purple-500/35 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-2xl shadow-purple-950/80">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs font-bold text-[#c084fc] px-2.5 py-1 bg-purple-600/20 rounded-lg">
                <Film size={15} />
                <span>Media</span>
              </button>
              <Link
                href="/chat"
                className="flex items-center gap-1 text-xs font-medium text-purple-200/70 hover:text-white px-2.5 py-1 rounded-lg transition"
              >
                <MessageSquare size={15} />
                <span>Chat</span>
              </Link>
            </div>

            {/* Quick Prev & Next Controls for Mobile */}
            {viewMode === 'reels' && (
              <div className="flex items-center gap-1.5 border-l border-purple-500/30 pl-3">
                <button
                  onClick={handlePrevVideo}
                  disabled={activeIndex === 0}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 disabled:opacity-30 transition"
                  title="Sebelumnya (Scroll Up)"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={handleNextVideo}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 transition"
                  title="Selanjutnya (Scroll Down)"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
