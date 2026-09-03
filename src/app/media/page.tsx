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
  Pause, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  Smartphone,
  Check,
  Globe,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '@/lib/services/authService';
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
          // Auto-play policy browser
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

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const handleShare = (video: TikTokVideoItem) => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Tonton video keren dari @${video.author.nickname} di Dardcor Media:`,
        url: video.video_url,
      }).catch(() => {});
    } else {
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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0914] text-white select-none relative">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-8 bg-[#120f20]/90 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left: Brand Logo & Navigation Tabs */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center shadow-md shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <Film size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                Dardcor Media
              </span>
              <span className="text-[9px] text-[#c084fc] font-semibold tracking-widest uppercase">
                TikTok Realtime Feed
              </span>
            </div>
          </Link>

          {/* Tab Switcher: Media vs Chat */}
          <div className="hidden sm:flex items-center bg-[#1c162e] p-1 rounded-xl border border-purple-500/20">
            <button
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white shadow-md shadow-purple-900/40 flex items-center gap-1.5"
            >
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

        {/* Center: Region Filter Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#181329] p-1 rounded-xl border border-purple-500/20">
          {[
            { id: 'ID', label: '🇮🇩 Indonesia' },
            { id: 'GLOBAL', label: '🌍 Global' },
            { id: 'US', label: '🇺🇸 USA' },
            { id: 'JP', label: '🇯🇵 Japan' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${
                selectedRegion === r.id
                  ? 'bg-purple-600/30 text-[#c084fc] border border-purple-500/40'
                  : 'text-purple-200/60 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Refresh Realtime Feed Button */}
          <button
            onClick={() => fetchTikTokFeed(selectedRegion)}
            disabled={isLoadingVideos}
            title="Refresh Feed Realtime"
            className="p-2 rounded-xl bg-[#1c162e] hover:bg-[#281f42] border border-purple-500/20 text-purple-300 hover:text-white transition disabled:opacity-50"
          >
            <RotateCw size={16} className={isLoadingVideos ? 'animate-spin' : ''} />
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#1c162e] p-0.5 rounded-xl border border-purple-500/20">
            <button
              onClick={() => setViewMode('reels')}
              title="Tampilan Reels / Shorts"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'reels' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
              }`}
            >
              <Smartphone size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Tampilan Grid Explorer"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-purple-300/60 hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-purple-500/20">
            <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || 'Saya'} size="sm" />
            <span className="hidden lg:inline text-xs font-semibold text-purple-100 max-w-[100px] truncate">
              {currentUser?.display_name || currentUser?.username}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden bg-[#090712]">
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
          <div className="relative w-full max-w-[440px] h-full sm:h-[94%] my-auto bg-black sm:rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border sm:border-purple-500/30 flex items-center justify-center">
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
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                  <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white font-medium">
                    {currentIndex + 1} / {videos.length}
                  </div>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 pointer-events-auto transition"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>

                {/* Right Side Social Overlay Buttons */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
                  {/* Author Avatar with Follow/Profile Badge */}
                  <div className="relative group cursor-pointer" title={`@${currentVideo.author.unique_id}`}>
                    <img
                      src={currentVideo.author.avatar}
                      alt={currentVideo.author.nickname}
                      className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                      +
                    </div>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(currentVideo.id)}
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                        likedVideos[currentVideo.id]
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                          : 'bg-black/40 border border-white/15 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart
                        size={20}
                        fill={likedVideos[currentVideo.id] ? 'currentColor' : 'none'}
                        className={likedVideos[currentVideo.id] ? 'text-white' : ''}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-shadow">
                      {formatNumber(
                        currentVideo.digg_count + (likedVideos[currentVideo.id] ? 1 : 0)
                      )}
                    </span>
                  </button>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center gap-1 text-white">
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center backdrop-blur-md">
                      <MessageCircle size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-shadow">
                      {formatNumber(currentVideo.comment_count)}
                    </span>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(currentVideo)}
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                    title="Bagikan Video"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/15 flex items-center justify-center backdrop-blur-md">
                      {copiedId === currentVideo.id ? <Check size={18} className="text-emerald-400" /> : <Share2 size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-shadow">
                      {copiedId === currentVideo.id ? 'Tersalin' : formatNumber(currentVideo.share_count)}
                    </span>
                  </button>
                </div>

                {/* Bottom Video Info & Music Details */}
                <div className="absolute left-4 right-16 bottom-5 z-20 space-y-2 pointer-events-auto">
                  {/* Creator Handle */}
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white drop-shadow-md hover:underline cursor-pointer">
                      @{currentVideo.author.nickname}
                    </h3>
                    <span className="text-[10px] text-purple-300 font-mono">
                      #{currentVideo.author.unique_id}
                    </span>
                  </div>

                  {/* Video Title / Description */}
                  <p className="text-xs text-white/90 line-clamp-2 leading-relaxed drop-shadow-md">
                    {currentVideo.title}
                  </p>

                  {/* Music Info */}
                  <div className="flex items-center gap-2 text-[11px] text-purple-200/90 pt-1">
                    <Music size={13} className="shrink-0 animate-pulse text-[#c084fc]" />
                    <span className="truncate">
                      {currentVideo.music_info?.title || 'Suara Asli'} • {currentVideo.music_info?.author || currentVideo.author.nickname}
                    </span>
                  </div>
                </div>

                {/* Up/Down Navigation Floating Buttons (Desktop) */}
                <div className="hidden sm:flex absolute -right-16 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
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
          <div className="w-full h-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.map((vid, idx) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode('reels');
                  }}
                  className="group relative aspect-[9/16] bg-[#1a152b] rounded-2xl overflow-hidden cursor-pointer border border-purple-500/20 hover:border-purple-500/60 transition-all hover:scale-[1.02] shadow-lg"
                >
                  <img
                    src={vid.cover_url}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                        <Play size={12} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-white line-clamp-2">{vid.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-purple-200/80 pt-1">
                        <span>@{vid.author.nickname}</span>
                        <span className="flex items-center gap-1">
                          <Heart size={10} fill="currentColor" /> {formatNumber(vid.digg_count)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Switcher to Chat (Mobile & Tablet) */}
        <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#151126]/95 backdrop-blur-md border border-purple-500/30 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl">
          <button className="flex items-center gap-1.5 text-xs font-bold text-[#c084fc]">
            <Film size={16} />
            <span>Media</span>
          </button>
          <div className="w-px h-4 bg-purple-500/30" />
          <Link href="/chat" className="flex items-center gap-1.5 text-xs font-medium text-purple-200/80 hover:text-white">
            <MessageSquare size={16} />
            <span>Chat</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
