'use client';

import { useState, useEffect, useRef } from 'react';
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
  Globe
} from 'lucide-react';
import { getCurrentUser } from '@/lib/services/authService';
import { Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

export default function MediaFeedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [videos, setVideos] = useState<TikTokVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('ID');
  const [viewMode, setViewMode] = useState<'reels' | 'grid'>('reels');

  // Reels Mode State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  // 2. Fetch video TikTok real-time dari API
  const fetchTikTokFeed = async (regionCode: string) => {
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`/api/tiktok?region=${regionCode}&count=15`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setVideos(json.data);
        setCurrentIndex(0);
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

  // Kontrol video saat berganti indeks
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Auto-play policy browser (terutama di mobile)
          setIsMuted(true);
          videoRef.current?.play().catch(() => {});
        });
      }
    }
  }, [currentIndex, isPlaying]);

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

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (diffY > 45) {
      // Swipe Up -> Next video
      handleNextVideo();
    } else if (diffY < -45) {
      // Swipe Down -> Prev video
      handlePrevVideo();
    }
    touchStartY.current = null;
  };

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
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentIndex, videos.length, isPlaying]);

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f0d19] text-white select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-purple-900/50" />
        <span className="text-sm tracking-widest text-[#a78bfa] font-bold">DARDCOR MEDIA</span>
        <span className="text-xs text-[#a78bfa]/70 mt-1">Memuat Media Feed...</span>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#0b0914] text-white select-none relative">
      {/* Top Navbar: Fully Responsive for Mobile, Tablet, & Desktop */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 md:px-8 bg-[#120f20]/95 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left: Brand Logo & Navigation Tabs */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center shadow-md shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <Film size={17} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent truncate">
                Dardcor Media
              </span>
              <span className="hidden sm:inline text-[9px] text-[#c084fc] font-semibold tracking-widest uppercase">
                TikTok Realtime Feed
              </span>
            </div>
          </Link>

          {/* Tab Switcher (Desktop & Tablet) */}
          <div className="hidden md:flex items-center bg-[#1c162e] p-1 rounded-xl border border-purple-500/20">
            <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-md shadow-purple-900/40 flex items-center gap-1.5">
              <Film size={14} />
              <span>Media Feed</span>
            </button>
            <Link
              href="/chat"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-purple-200/80 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>Chat Obrolan</span>
            </Link>
          </div>
        </div>

        {/* Center: Region Filter Pills (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#181329] p-1 rounded-xl border border-purple-500/20">
          {[
            { id: 'ID', label: '🇮🇩 ID' },
            { id: 'GLOBAL', label: '🌍 Global' },
            { id: 'US', label: '🇺🇸 US' },
            { id: 'JP', label: '🇯🇵 JP' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                selectedRegion === r.id
                  ? 'bg-purple-600/40 text-[#c084fc] border border-purple-500/50'
                  : 'text-purple-200/60 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Right: Actions, Region Selector for Mobile, View Mode & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Region Dropdown Selector */}
          <div className="lg:hidden flex items-center">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-[#1c162e] border border-purple-500/30 text-[#c084fc] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
            >
              <option value="ID">🇮🇩 ID</option>
              <option value="GLOBAL">🌍 Global</option>
              <option value="US">🇺🇸 US</option>
              <option value="JP">🇯🇵 JP</option>
            </select>
          </div>

          {/* Refresh Realtime Feed Button */}
          <button
            onClick={() => fetchTikTokFeed(selectedRegion)}
            disabled={isLoadingVideos}
            title="Refresh Feed Realtime"
            className="p-1.5 sm:p-2 rounded-xl bg-[#1c162e] hover:bg-[#281f42] border border-purple-500/20 text-purple-300 hover:text-white transition disabled:opacity-50"
          >
            <RotateCw size={15} className={isLoadingVideos ? 'animate-spin' : ''} />
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#1c162e] p-0.5 rounded-xl border border-purple-500/20">
            <button
              onClick={() => setViewMode('reels')}
              title="Tampilan Reels"
              className={`p-1 sm:p-1.5 rounded-lg transition ${
                viewMode === 'reels' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
              }`}
            >
              <Smartphone size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Tampilan Grid"
              className={`p-1 sm:p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-purple-500/20">
            <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || 'Saya'} size="sm" />
            <span className="hidden xl:inline text-xs font-semibold text-purple-100 max-w-[90px] truncate">
              {currentUser?.display_name || currentUser?.username}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Adapts to Full Height on Mobile & Desktop */}
      <main className="flex-1 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex items-center justify-center relative overflow-hidden bg-[#07050e]">
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
          /* ================= REELS / SHORTS VERTICAL PLAYER ================= */
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full sm:max-w-[420px] md:max-w-[450px] h-full sm:h-[94%] sm:my-auto bg-black sm:rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 sm:border sm:border-purple-500/30 flex items-center justify-center"
          >
            {currentVideo && (
              <>
                {/* Video Element */}
                <video
                  ref={videoRef}
                  src={currentVideo.video_url}
                  poster={currentVideo.cover_url}
                  className="w-full h-full object-cover cursor-pointer"
                  loop
                  playsInline
                  autoPlay
                  muted={isMuted}
                  onClick={togglePlay}
                />

                {/* Pause Indicator overlay */}
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

                {/* Top Controls: Sound & Index Info */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-20 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white font-medium">
                    {currentIndex + 1} / {videos.length}
                  </div>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 pointer-events-auto transition active:scale-95"
                  >
                    {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                </div>

                {/* Right Side Social Overlay Buttons: Positioned safely above mobile bottom nav */}
                <div className="absolute right-2.5 sm:right-3 bottom-24 sm:bottom-16 flex flex-col items-center gap-4 sm:gap-5 z-20">
                  {/* Author Avatar with Plus Badge */}
                  <div className="relative group cursor-pointer" title={`@${currentVideo.author.unique_id}`}>
                    <img
                      src={currentVideo.author.avatar}
                      alt={currentVideo.author.nickname}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                      +
                    </div>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(currentVideo.id)}
                    className="flex flex-col items-center gap-1 text-white active:scale-125 hover:scale-110 transition-transform"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                        likedVideos[currentVideo.id]
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                          : 'bg-black/50 border border-white/15 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart
                        size={19}
                        fill={likedVideos[currentVideo.id] ? 'currentColor' : 'none'}
                        className={likedVideos[currentVideo.id] ? 'text-white' : ''}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold drop-shadow">
                      {formatNumber(
                        currentVideo.digg_count + (likedVideos[currentVideo.id] ? 1 : 0)
                      )}
                    </span>
                  </button>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center gap-1 text-white">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/15 flex items-center justify-center backdrop-blur-md">
                      <MessageCircle size={19} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold drop-shadow">
                      {formatNumber(currentVideo.comment_count)}
                    </span>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(currentVideo)}
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
                    title="Bagikan Video"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/15 flex items-center justify-center backdrop-blur-md">
                      {copiedId === currentVideo.id ? <Check size={17} className="text-emerald-400" /> : <Share2 size={19} />}
                    </div>
                    <span className="text-[10px] font-bold drop-shadow">
                      {copiedId === currentVideo.id ? 'Tersalin' : formatNumber(currentVideo.share_count)}
                    </span>
                  </button>
                </div>

                {/* Bottom Video Info & Music Details: Positioned with safe bottom padding */}
                <div className="absolute left-3 sm:left-4 right-16 bottom-20 sm:bottom-5 z-20 space-y-1.5 pointer-events-auto">
                  {/* Creator Handle */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-white drop-shadow-md hover:underline cursor-pointer">
                      @{currentVideo.author.nickname}
                    </h3>
                    <span className="text-[10px] text-purple-300 font-mono">
                      #{currentVideo.author.unique_id}
                    </span>
                  </div>

                  {/* Video Caption */}
                  <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md">
                    {currentVideo.title}
                  </p>

                  {/* Music Info */}
                  <div className="flex items-center gap-2 text-[11px] text-purple-200/90 pt-0.5">
                    <Music size={12} className="shrink-0 animate-pulse text-[#c084fc]" />
                    <span className="truncate">
                      {currentVideo.music_info?.title || 'Suara Asli'} • {currentVideo.music_info?.author || currentVideo.author.nickname}
                    </span>
                  </div>
                </div>

                {/* Up/Down Navigation Floating Buttons (Desktop) */}
                <div className="hidden lg:flex absolute -right-16 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
                  <button
                    onClick={handlePrevVideo}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-2xl bg-[#1a142c] hover:bg-[#251d3d] border border-purple-500/30 text-purple-300 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                    title="Video Sebelumnya (Arrow Up)"
                  >
                    <ChevronUp size={22} />
                  </button>
                  <button
                    onClick={handleNextVideo}
                    disabled={currentIndex === videos.length - 1}
                    className="p-3 rounded-2xl bg-[#1a142c] hover:bg-[#251d3d] border border-purple-500/30 text-purple-300 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                    title="Video Selanjutnya (Arrow Down)"
                  >
                    <ChevronDown size={22} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ================= GRID EXPLORER VIEW ================= */
          <div className="w-full h-full overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 sm:pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {videos.map((vid, idx) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode('reels');
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

        {/* Floating / Bottom Mobile Action Bar: Safe & Clean on All Phones */}
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
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 disabled:opacity-30 transition"
                title="Sebelumnya"
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-[10px] font-mono text-purple-300">
                {currentIndex + 1}/{videos.length}
              </span>
              <button
                onClick={handleNextVideo}
                disabled={currentIndex === videos.length - 1}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 disabled:opacity-30 transition"
                title="Selanjutnya"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
