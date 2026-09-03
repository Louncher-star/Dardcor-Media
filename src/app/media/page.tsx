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
  Plus, 
  Send, 
  Bell, 
  Compass, 
  Users, 
  Radio, 
  User, 
  UserCheck, 
  Maximize, 
  Check, 
  Copy, 
  X, 
  Smile, 
  AtSign, 
  LogOut, 
  RotateCw, 
  Upload, 
  Home,
  Menu,
  MessageSquare,
  PanelLeftClose,
  Film
} from 'lucide-react';
import { getCurrentUser, logoutUser, clearAuthCookie } from '@/lib/services/authService';
import { useChatStore } from '@/lib/store/useChatStore';
import { Profile } from '@/types';
import { TikTokVideoItem } from '@/app/api/tiktok/route';
import { ScrapedComment } from '@/app/api/tiktok/comments/route';
import { TikTokScrapedUser } from '@/app/api/tiktok/user/route';
import { AppNavigationSidebar } from '@/components/layout/AppNavigationSidebar';

// ================= TIKTOK ICON LOGO (3D CYAN & RED OFFSET GLITCH EFFECT) =================
function TikTokLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Cyan glitch shadow layer */}
        <svg
          viewBox="0 0 24 24"
          style={{ position: 'absolute', left: '-1.5px', top: '-1.5px', width: '28px', height: '28px', fill: '#25F4EE', opacity: 0.9, pointerEvents: 'none' }}
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* Red/Magenta glitch shadow layer */}
        <svg
          viewBox="0 0 24 24"
          style={{ position: 'absolute', left: '1.5px', top: '1.5px', width: '28px', height: '28px', fill: '#FE2C55', opacity: 0.9, pointerEvents: 'none' }}
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
        {/* White sharp base layer */}
        <svg
          viewBox="0 0 24 24"
          style={{ position: 'relative', width: '28px', height: '28px', fill: '#ffffff' }}
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.313 0 .614.053.896.147V9.452a6.34 6.34 0 0 0-.896-.064 6.342 6.342 0 0 0-6.336 6.336 6.342 6.342 0 0 0 6.336 6.336 6.342 6.342 0 0 0 6.336-6.336V9.068a8.17 8.17 0 0 0 4.88 1.603V7.228a4.808 4.808 0 0 1-1.11-.542z" />
        </svg>
      </div>
      <span style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', color: '#ffffff', fontFamily: 'sans-serif' }}>
        TikTok
      </span>
    </div>
  );
}

// Format numbers like 1.2M, 850.5K
function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

// Format time in seconds to mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Lencana Centang Biru Resmi TikTok
function TikTokVerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="#20D5EC" />
      <path
        d="M9 12l2 2 4-4"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ================= TIKTOK VIDEO FEED CARD COMPONENT =================
interface TikTokVideoCardProps {
  video: TikTokVideoItem;
  isActive: boolean;
  isMuted: boolean;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  shareToast: boolean;
  index: number;
  isDesktop: boolean;
}

function TikTokVideoCard({
  video,
  isActive,
  isMuted,
  volume,
  onVolumeChange,
  onToggleMute,
  isLiked,
  onToggleLike,
  isFavorited,
  onToggleFavorite,
  isFollowing,
  onToggleFollow,
  onOpenComments,
  onShare,
  index,
  isDesktop,
}: TikTokVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 15);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  // Play / pause based on viewport active state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      vid.currentTime = 0;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            vid.muted = true;
            vid.play().catch(() => {});
            setIsPlaying(true);
          });
      }
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Sync volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (!isSeeking && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

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

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLiked) {
      onToggleLike();
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const heartId = Date.now() + Math.random();
    setFloatingHearts((prev) => [...prev, { id: heartId, x, y }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 1000);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showShareMenu]);

  // Highlight hashtags in caption
  const renderCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#') || part.startsWith('@')) {
        return (
          <span key={idx} style={{ fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}>
            {part}{' '}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <article
      data-index={index}
      id={`video-card-${index}`}
      style={{
        width: '100%',
        maxWidth: '660px',
        margin: '0 auto',
        padding: '24px 0',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header Row: Author Avatar + Nickname/Handle/Time + Follow Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '10px' }}>
        <img
          src={video.author.avatar}
          alt={video.author.nickname}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {video.author.nickname}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  @{video.author.unique_id}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>2j lalu</span>
              </div>
            </div>

            {/* TikTok Red "Ikuti" / "Mengikuti" Button */}
            <button
              onClick={onToggleFollow}
              style={{
                flexShrink: 0,
                padding: '6px 18px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isFollowing ? 'transparent' : 'transparent',
                borderColor: isFollowing ? '#424242' : '#FE2C55',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: isFollowing ? 'rgba(255,255,255,0.75)' : '#FE2C55',
              }}
            >
              {isFollowing ? 'Mengikuti' : 'Ikuti'}
            </button>
          </div>

          {/* Caption text */}
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.92)', marginTop: '6px', lineHeight: 1.4, wordBreak: 'break-word' }}>
            {renderCaption(video.title)}
          </p>

          {/* Audio line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}>
            <Music size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
              {video.music_info?.title || 'suara asli'} - {video.music_info?.author || video.author.nickname}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Video Player & Right Action Buttons Row (Indented on desktop to match avatar width) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          paddingLeft: isDesktop ? '70px' : '0px',
          marginTop: '6px',
        }}
      >
        {/* Exact 9:16 Video Player Box */}
        <div
          ref={containerRef}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onDoubleClick={handleDoubleClick}
          style={{
            width: isDesktop ? '336px' : '100%',
            maxWidth: '350px',
            height: isDesktop ? '580px' : '520px',
            aspectRatio: '9/16',
            backgroundColor: '#000000',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Real TikTok Video Stream */}
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.cover_url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loop
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />

          {/* Floating Popping Hearts on Double Tap */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              style={{ left: heart.x, top: heart.y, position: 'absolute', pointerEvents: 'none', zIndex: 30 }}
              className="animate-tt-heart"
            >
              <Heart size={72} fill="#FE2C55" color="#FE2C55" />
            </div>
          ))}

          {/* Center Play Overlay Indicator when paused */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                }}
              >
                <Play size={28} fill="#ffffff" color="#ffffff" style={{ transform: 'translateX(2px)' }} />
              </div>
            </div>
          )}

          {/* Top Right Quick Mute Button */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              style={{
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isMuted ? 'Nyalakan Suara (M)' : 'Bisukan Suara (M)'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Bottom Video Controls Bar (Appears on Hover) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
              padding: '24px 12px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 20,
              opacity: showControls || !isPlaying ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Draggable Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeekChange}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              style={{
                width: '100%',
                height: '4px',
                accentColor: '#FE2C55',
                cursor: 'pointer',
              }}
            />

            {/* Bottom Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#ffffff" />}
                </button>

                {/* Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMute();
                    }}
                    style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      onVolumeChange(parseFloat(e.target.value));
                    }}
                    style={{ width: '56px', height: '3px', accentColor: '#FE2C55', cursor: 'pointer' }}
                  />
                </div>

                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                title="Layar Penuh"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Social Action Buttons Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0, paddingBottom: '4px', position: 'relative' }}>
          {/* Creator Avatar with Follow Badge */}
          <div style={{ position: 'relative', marginBottom: '8px', cursor: 'pointer' }} onClick={onToggleFollow}>
            <img
              src={video.author.avatar}
              alt={video.author.nickname}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
            />
            {!isFollowing && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#FE2C55',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                <Plus size={12} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={onToggleLike}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Sukai video"
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isLiked ? '#FE2C55' : 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                boxShadow: isLiked ? '0 4px 15px rgba(254,44,85,0.5)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Heart size={22} fill={isLiked ? '#ffffff' : 'none'} color="#ffffff" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {formatCount(video.digg_count + (isLiked ? 1 : 0))}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={onOpenComments}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Lihat komentar"
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
              }}
            >
              <MessageCircle size={22} color="#ffffff" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {formatCount(video.comment_count)}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleFavorite}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Simpan ke favorit"
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFavorited ? '#FACE15' : 'rgba(255,255,255,0.12)',
                color: isFavorited ? '#000000' : '#ffffff',
                boxShadow: isFavorited ? '0 4px 15px rgba(250,206,21,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Bookmark size={22} fill={isFavorited ? 'currentColor' : 'none'} color={isFavorited ? '#000' : '#ffffff'} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {formatCount(Math.round(video.digg_count * 0.12) + (isFavorited ? 1 : 0))}
            </span>
          </button>

          {/* Share Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShareMenu((prev) => !prev)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Bagikan video"
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                }}
              >
                <Share2 size={22} color="#ffffff" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                {formatCount(video.share_count)}
              </span>
            </button>

            {/* TikTok Share Dropdown */}
            {showShareMenu && (
              <div
                ref={shareMenuRef}
                style={{
                  position: 'absolute',
                  left: '56px',
                  bottom: '0px',
                  width: '240px',
                  backgroundColor: '#242424',
                  border: '1px solid #383838',
                  borderRadius: '16px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                  padding: '8px',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button
                  onClick={() => {
                    onShare();
                    setShowShareMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Copy size={16} color="#25F4EE" />
                  <span>Salin tautan</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Tonton video TikTok dari @${video.author.nickname}: ${video.video_url}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                    W
                  </span>
                  <span>Bagikan ke WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* Spinning Vinyl Record Music Disc */}
          <div style={{ position: 'relative', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying && (
              <div style={{ position: 'absolute', top: '-12px', left: '-12px', color: '#25F4EE', pointerEvents: 'none' }} className="animate-tt-note">
                ♪
              </div>
            )}
            {isPlaying && (
              <div style={{ position: 'absolute', top: '-24px', left: '8px', color: '#FE2C55', animationDelay: '1.2s', pointerEvents: 'none' }} className="animate-tt-note">
                ♫
              </div>
            )}
            <div
              className={isPlaying ? 'animate-spin-disc' : ''}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#111111',
                border: '3px solid #222222',
                boxShadow: '0 4px 15px rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundImage: 'radial-gradient(circle, #222 25%, #111 26%, #1a1a1a 70%, #000 100%)',
              }}
            >
              <img
                src={video.author.avatar}
                alt={video.author.nickname}
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ================= MAIN TIKTOK MEDIA FEED PAGE =================
export default function TikTokMediaFeedPage() {
  const router = useRouter();
  const { chats, setMobileSidebarOpen } = useChatStore();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isDardcorSidebarOpen, setIsDardcorSidebarOpen] = useState(false);

  // Akun Khusus TikTok Media (Terpisah dari akun Dardcor Media Web)
  const [tiktokUser, setTiktokUser] = useState<TikTokScrapedUser | null>(null);
  const [showTikTokLoginModal, setShowTikTokLoginModal] = useState(false);
  const [tiktokUsernameInput, setTiktokUsernameInput] = useState('');
  const [isLoggingInTikTok, setIsLoggingInTikTok] = useState(false);
  const [tiktokLoginError, setTiktokLoginError] = useState('');

  // Screen responsiveness state
  const [isDesktop, setIsDesktop] = useState(true);

  // Video State
  const [videos, setVideos] = useState<TikTokVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('ID');
  const [activeTab, setActiveTab] = useState<'foryou' | 'explore' | 'following' | 'friends'>('foryou');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Video Active Index
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // Social States
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [favoritedVideos, setFavoritedVideos] = useState<Record<string, boolean>>({});
  const [followingCreators, setFollowingCreators] = useState<Record<string, boolean>>({});
  const [shareToast, setShareToast] = useState(false);

  // Interactive Comments Drawer (Real Scraped Comments)
  const [activeCommentVideo, setActiveCommentVideo] = useState<TikTokVideoItem | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, ScrapedComment[]>>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // User Profile Dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Handle responsive resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check auth user Dardcor Media (untuk fitur chat / sidebar)
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Load akun TikTok real tersimpan dari local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dardcor_tiktok_account');
      if (saved) {
        setTiktokUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Gagal membaca akun TikTok tersimpan:', e);
    }
  }, []);

  // Handler Login Akun TikTok Real (Scraping live data dari TikTok)
  const handleTikTokLogin = async (usernameToLogin?: string) => {
    const targetUsername = (usernameToLogin || tiktokUsernameInput).replace(/^@+/, '').trim();
    if (!targetUsername) {
      setTiktokLoginError('Silakan masukkan username akun TikTok asli Anda');
      return;
    }

    setIsLoggingInTikTok(true);
    setTiktokLoginError('');

    try {
      const res = await fetch(`/api/tiktok/user?username=${encodeURIComponent(targetUsername)}`);
      const data = await res.json();

      if (data.success && data.data) {
        setTiktokUser(data.data);
        localStorage.setItem('dardcor_tiktok_account', JSON.stringify(data.data));
        setShowTikTokLoginModal(false);
        setTiktokUsernameInput('');
      } else {
        setTiktokLoginError(data.error || 'Akun TikTok tidak ditemukan atau terjadi kesalahan.');
      }
    } catch (err) {
      setTiktokLoginError('Gagal menghubungkan ke server TikTok. Periksa koneksi internet Anda.');
    } finally {
      setIsLoggingInTikTok(false);
    }
  };

  // Handler Logout Akun TikTok Real
  const handleTikTokLogout = () => {
    setTiktokUser(null);
    localStorage.removeItem('dardcor_tiktok_account');
    setShowProfileMenu(false);
  };

  // Fetch real-time live TikTok feed
  const fetchLiveFeed = async (reg: string, cat?: string, search?: string) => {
    setIsLoadingVideos(true);
    try {
      let queryParams = `region=${encodeURIComponent(reg)}&count=20&_t=${Date.now()}`;
      if (search) {
        queryParams += `&keywords=${encodeURIComponent(search)}`;
      } else if (cat && cat !== 'Semua') {
        queryParams += `&keywords=${encodeURIComponent(cat.toLowerCase())}`;
      }

      const res = await fetch(`/api/tiktok?${queryParams}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setVideos(json.data);
        setActiveIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error fetching live TikTok feed:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed(selectedRegion, selectedCategory, searchQuery);
  }, [selectedRegion, selectedCategory]);

  // Infinite Scroll: Pull next batch of live videos
  const loadMoreVideos = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      let queryParams = `region=${encodeURIComponent(selectedRegion)}&count=15&_t=${Date.now()}`;
      if (searchQuery) {
        queryParams += `&keywords=${encodeURIComponent(searchQuery)}`;
      } else if (selectedCategory && selectedCategory !== 'Semua') {
        queryParams += `&keywords=${encodeURIComponent(selectedCategory.toLowerCase())}`;
      }

      const res = await fetch(`/api/tiktok?${queryParams}`);
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
      console.error('Error loading more TikTok videos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, selectedRegion, selectedCategory, searchQuery]);

  // Scroll listener to update active video card
  useEffect(() => {
    const handleScroll = () => {
      const cards = document.querySelectorAll('article[id^="video-card-"]');
      let currentIdx = activeIndex;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const windowCenter = window.innerHeight / 2;
        const distance = Math.abs(cardCenter - windowCenter);

        if (distance < minDistance) {
          minDistance = distance;
          currentIdx = idx;
        }
      });

      if (currentIdx !== activeIndex && currentIdx >= 0 && currentIdx < videos.length) {
        setActiveIndex(currentIdx);
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900) {
        loadMoreVideos();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [videos.length, activeIndex, loadMoreVideos]);

  const scrollToVideo = (idx: number) => {
    if (idx < 0 || idx >= videos.length) return;
    const target = document.getElementById(`video-card-${idx}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveIndex(idx);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || showUploadModal) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToVideo(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToVideo(activeIndex - 1);
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l') {
        if (videos[activeIndex]) {
          toggleLike(videos[activeIndex].id);
        }
      } else if (e.key === 'c') {
        if (videos[activeIndex]) {
          handleOpenComments(videos[activeIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos, showUploadModal]);

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const toggleFavorite = (videoId: string) => {
    setFavoritedVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const toggleFollow = (authorId: string) => {
    setFollowingCreators((prev) => ({
      ...prev,
      [authorId]: !prev[authorId],
    }));
  };

  const handleShare = (video: TikTokVideoItem) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(video.video_url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  // Open comments drawer & fetch real scraped comments
  const handleOpenComments = async (video: TikTokVideoItem) => {
    setActiveCommentVideo(video);

    if (!commentsMap[video.id]) {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/tiktok/comments?video_id=${encodeURIComponent(video.id)}&url=${encodeURIComponent(video.video_url)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCommentsMap((prev) => ({
            ...prev,
            [video.id]: json.data,
          }));
        } else {
          setCommentsMap((prev) => ({
            ...prev,
            [video.id]: [],
          }));
        }
      } catch (e) {
        console.error('Error fetching comments:', e);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handlePostComment = () => {
    if (!commentInput.trim() || !activeCommentVideo) return;

    if (!tiktokUser) {
      setShowTikTokLoginModal(true);
      return;
    }

    const newComment: ScrapedComment = {
      id: `c_${Date.now()}`,
      user_name: tiktokUser.nickname,
      user_handle: tiktokUser.unique_id,
      user_avatar: tiktokUser.avatar_url,
      text: commentInput.trim(),
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

    setCommentInput('');
  };

  const handleLikeComment = (videoId: string, commentId: string) => {
    setCommentsMap((prev) => {
      const list = prev[videoId] || [];
      return {
        ...prev,
        [videoId]: list.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked: !c.liked,
                likes: c.liked ? c.likes - 1 : c.likes + 1,
              }
            : c
        ),
      };
    });
  };

  // Upload video simulation with real TikTok author
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    if (!tiktokUser) {
      setShowUploadModal(false);
      setShowTikTokLoginModal(true);
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const targetVideoUrl = uploadVideoUrl.trim() || (videos[0]?.video_url || '');
      const newVideo: TikTokVideoItem = {
        id: `upload_${Date.now()}`,
        title: uploadTitle,
        video_url: targetVideoUrl,
        cover_url: videos[0]?.cover_url || tiktokUser.avatar_url,
        duration: 15,
        play_count: 1,
        digg_count: 0,
        comment_count: 0,
        share_count: 0,
        create_time: Math.floor(Date.now() / 1000),
        author: {
          id: tiktokUser.unique_id,
          unique_id: tiktokUser.unique_id,
          nickname: tiktokUser.nickname,
          avatar: tiktokUser.avatar_url,
        },
        music_info: {
          title: 'suara asli - ' + tiktokUser.nickname,
          author: tiktokUser.nickname,
        },
      };

      setVideos((prev) => [newVideo, ...prev]);
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadVideoUrl('');
      scrollToVideo(0);
    }, 600);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showProfileMenu]);

  const totalUnreadMessages = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Suggested creators dynamically from feed
  const suggestedCreators = Array.from(
    new Map(videos.map((v) => [v.author.id || v.author.unique_id, v.author])).values()
  ).slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#ffffff', fontFamily: 'sans-serif', position: 'relative' }}>
      {/* Toast Notification */}
      {shareToast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: '#242424',
            border: '1px solid #383838',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Check size={16} color="#34d399" />
          <span>Tautan disalin ke papan klip!</span>
        </div>
      )}

      {/* ================= 1. FIXED TOP NAVBAR HEADER (h: 60px) ================= */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#121212',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 100,
        }}
      >
        {/* Left Side: Sidebar Navigation Trigger + TikTok Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsDardcorSidebarOpen((prev) => !prev)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Buka Menu Navigasi (Media / Chat)"
          >
            <Menu size={20} />
          </button>

          <Link href="/media" style={{ textDecoration: 'none' }}>
            <TikTokLogo />
          </Link>
        </div>

        {/* Center Search Pill */}
        <div style={{ flex: 1, maxWidth: '480px', margin: '0 24px', position: 'relative', display: isDesktop ? 'block' : 'none' }}>
          <div
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSearchDropdown(false);
                  fetchLiveFeed(selectedRegion, selectedCategory, searchQuery);
                }
              }}
              placeholder="Cari akun dan video"
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '14px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchLiveFeed(selectedRegion, selectedCategory, '');
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={14} />
              </button>
            )}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 10px' }} />
            <button
              onClick={() => {
                setShowSearchDropdown(false);
                fetchLiveFeed(selectedRegion, selectedCategory, searchQuery);
              }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              title="Cari"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Search suggestions dropdown */}
          {showSearchDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: 0,
                right: 0,
                backgroundColor: '#242424',
                border: '1px solid #383838',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                padding: '12px',
                zIndex: 110,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                <span>Topik Populer & Trending</span>
                <button onClick={() => setShowSearchDropdown(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['#fyp', '#indonesia', '#kuliner', '#kucinglucu', '#gaming', '#dance', '#viral'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setShowSearchDropdown(false);
                      fetchLiveFeed(selectedRegion, selectedCategory, tag);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Header Navigation & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* + Unggah Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Unggah</span>
          </button>

          {/* Messages Link */}
          <Link
            href="/chat"
            style={{
              padding: '8px',
              borderRadius: '50%',
              color: '#ffffff',
              textDecoration: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Pesan Obrolan (Chat)"
          >
            <Send size={20} style={{ transform: 'rotate(-45deg)' }} />
            {totalUnreadMessages > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  backgroundColor: '#FE2C55',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </span>
            )}
          </Link>

          {/* Inbox Button */}
          <button
            onClick={() => alert('Tidak ada notifikasi baru.')}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '8px' }}
            title="Kotak Masuk"
          >
            <Bell size={20} />
          </button>

          {/* Real TikTok Account Profile / Login */}
          {tiktokUser ? (
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(254, 44, 85, 0.8)',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(254, 44, 85, 0.35)',
                }}
                title={`Akun TikTok: @${tiktokUser.unique_id}`}
              >
                <img
                  src={tiktokUser.avatar_url}
                  alt={tiktokUser.nickname}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>

              {showProfileMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '260px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
                    padding: '14px',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Profile Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={tiktokUser.avatar_url}
                      alt={tiktokUser.nickname}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tiktokUser.nickname}
                        </span>
                        {tiktokUser.verified && <TikTokVerifiedBadge size={14} />}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.6)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        @{tiktokUser.unique_id}
                      </div>
                    </div>
                  </div>

                  {/* Scraped Statistics Counter */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '4px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '10px 8px',
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                        {formatCount(tiktokUser.following_count)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Mengikuti</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                        {formatCount(tiktokUser.follower_count)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Pengikut</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                        {formatCount(tiktokUser.heart_count)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Suka</div>
                    </div>
                  </div>

                  {/* Bio */}
                  {tiktokUser.signature && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.4,
                        maxHeight: '42px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tiktokUser.signature}
                    </div>
                  )}

                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                  {/* Switch TikTok Account */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowTikTokLoginModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <RotateCw size={16} color="#25F4EE" />
                    <span>Ganti Akun TikTok</span>
                  </button>

                  {/* Logout TikTok Account */}
                  <button
                    onClick={handleTikTokLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#FE2C55',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(254, 44, 85, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Keluar Akun TikTok</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowTikTokLoginModal(true)}
              style={{
                backgroundColor: '#FE2C55',
                color: '#ffffff',
                padding: '7px 20px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(254, 44, 85, 0.4)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e02449')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FE2C55')}
            >
              <User size={16} />
              <span>Masuk</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= 2. DESKTOP SIDEBAR (FIXED LEFT 250px) ================= */}
      {isDesktop && (
        <aside
          style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            bottom: 0,
            width: '250px',
            backgroundColor: '#121212',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            zIndex: 90,
            overflowY: 'auto',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            userSelect: 'none',
          }}
        >
          {/* Main Navigation */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('foryou')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'foryou' ? '#FE2C55' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Home size={24} fill={activeTab === 'foryou' ? '#FE2C55' : 'none'} color={activeTab === 'foryou' ? '#FE2C55' : '#fff'} />
              <span>Untuk Anda</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'explore' ? '#FE2C55' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Compass size={24} fill={activeTab === 'explore' ? '#FE2C55' : 'none'} color={activeTab === 'explore' ? '#FE2C55' : '#fff'} />
              <span>Jelajahi</span>
            </button>

            <button
              onClick={() => setActiveTab('following')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'following' ? '#FE2C55' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <UserCheck size={24} color={activeTab === 'following' ? '#FE2C55' : '#fff'} />
              <span>Mengikuti</span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'friends' ? '#FE2C55' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Users size={24} color={activeTab === 'friends' ? '#FE2C55' : '#fff'} />
              <span>Teman</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '16px',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Radio size={24} />
                <span>LIVE</span>
              </div>
              <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FE2C55', color: '#ffffff', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                Live
              </span>
            </div>
          </nav>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Region Selector */}
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Wilayah Konten
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { id: 'ID', label: '🇮🇩 Indonesia' },
                { id: 'GLOBAL', label: '🌍 Global' },
                { id: 'US', label: '🇺🇸 USA' },
                { id: 'JP', label: '🇯🇵 Japan' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedRegion === r.id ? '#FE2C55' : '#222222',
                    color: '#ffffff',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Suggested Accounts (Real Live Creators) */}
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              Akun yang disarankan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestedCreators.map((creator) => {
                const isFollowed = Boolean(followingCreators[creator.id]);
                return (
                  <div
                    key={creator.id || creator.unique_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <img
                        src={creator.avatar}
                        alt={creator.nickname}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {creator.nickname}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{creator.unique_id}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(creator.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isFollowed ? 'rgba(255,255,255,0.4)' : '#FE2C55',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      {isFollowed ? 'Mengikuti' : 'Ikuti'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Footer Info */}
          <footer style={{ padding: '0 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span>Tentang</span>
              <span>Ruang Berita</span>
              <span>Kontak</span>
              <span>Karier</span>
              <span>ByteDance</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span>TikTok for Good</span>
              <span>Iklan</span>
              <span>Pengembang</span>
              <span>Transparansi</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span>Bantuan</span>
              <span>Keamanan</span>
              <span>Persyaratan</span>
              <span>Privasi</span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              © 2026 TikTok
            </div>
          </footer>
        </aside>
      )}

      {/* ================= 3. CENTER FEED COLUMN ================= */}
      <main
        style={{
          marginTop: '60px',
          marginLeft: isDesktop ? '250px' : '0px',
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: '#121212',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: isDesktop ? '20px 24px 80px 24px' : '12px 12px 80px 12px',
        }}
      >
        {/* Category Chips Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '660px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            userSelect: 'none',
          }}
        >
          {['Semua', 'Komedi', 'Musik', 'Game', 'Makanan', 'Hewan', 'Edukasi', 'Olahraga', 'Otomotif'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: selectedCategory === cat ? '#ffffff' : '#222222',
                color: selectedCategory === cat ? '#000000' : 'rgba(255,255,255,0.85)',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {isLoadingVideos ? (
          <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #FE2C55',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                boxShadow: '0 0 20px rgba(254,44,85,0.4)',
              }}
              className="animate-spin"
            />
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Mengambil data live TikTok...
            </p>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Tidak ada video ditemukan.</p>
            <button
              onClick={() => fetchLiveFeed(selectedRegion, selectedCategory, searchQuery)}
              style={{
                padding: '8px 20px',
                borderRadius: '12px',
                backgroundColor: '#FE2C55',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          /* Live Scraped TikTok Feed List */
          <div style={{ width: '100%', maxWidth: '660px', display: 'flex', flexDirection: 'column' }}>
            {videos.map((vid, idx) => (
              <TikTokVideoCard
                key={`${vid.id}_${idx}`}
                video={vid}
                isActive={idx === activeIndex}
                isMuted={isMuted}
                volume={volume}
                onVolumeChange={(v) => {
                  setVolume(v);
                  if (v > 0) setIsMuted(false);
                }}
                onToggleMute={() => setIsMuted((m) => !m)}
                isLiked={Boolean(likedVideos[vid.id])}
                onToggleLike={() => toggleLike(vid.id)}
                isFavorited={Boolean(favoritedVideos[vid.id])}
                onToggleFavorite={() => toggleFavorite(vid.id)}
                isFollowing={Boolean(followingCreators[vid.author.id])}
                onToggleFollow={() => toggleFollow(vid.author.id)}
                onOpenComments={() => handleOpenComments(vid)}
                onShare={() => handleShare(vid)}
                shareToast={shareToast}
                index={idx}
                isDesktop={isDesktop}
              />
            ))}

            {/* Load More Indicator */}
            {isLoadingMore && (
              <div style={{ width: '100%', padding: '30px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <RotateCw size={16} className="animate-spin" style={{ color: '#FE2C55' }} />
                <span>Memuat video live lainnya...</span>
              </div>
            )}
          </div>
        )}

        {/* Floating Chevrons (Desktop) */}
        {isDesktop && (
          <div style={{ position: 'fixed', right: '32px', bottom: '40px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 80 }}>
            <button
              onClick={() => scrollToVideo(activeIndex - 1)}
              disabled={activeIndex === 0}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#242424',
                border: '1px solid #383838',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: activeIndex === 0 ? 0.3 : 1,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
              title="Video Sebelumnya (Arrow Up / K)"
            >
              <ChevronUp size={22} />
            </button>
            <button
              onClick={() => scrollToVideo(activeIndex + 1)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#242424',
                border: '1px solid #383838',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
              title="Video Selanjutnya (Arrow Down / J)"
            >
              <ChevronDown size={22} />
            </button>
          </div>
        )}
      </main>

      {/* ================= 4. REAL SCRAPED COMMENTS DRAWER ================= */}
      {activeCommentVideo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', justifyContent: 'flex-end', userSelect: 'none' }}>
          {/* Backdrop */}
          <div
            onClick={() => setActiveCommentVideo(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              backgroundColor: '#1e1e1e',
              borderLeft: '1px solid #333333',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 130,
              boxShadow: '0 0 50px rgba(0,0,0,0.9)',
            }}
          >
            {/* Header */}
            <div style={{ height: '60px', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Komentar</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                  ({(commentsMap[activeCommentVideo.id] || []).length})
                </span>
              </div>
              <button
                onClick={() => setActiveCommentVideo(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Summary Row */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', gap: '12px', flexShrink: 0 }}>
              <img
                src={activeCommentVideo.author.avatar}
                alt={activeCommentVideo.author.nickname}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{activeCommentVideo.author.nickname}</div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {activeCommentVideo.title}
                </p>
              </div>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isLoadingComments ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #FE2C55', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Menarik komentar nyata dari TikTok...</span>
                </div>
              ) : (commentsMap[activeCommentVideo.id] || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', padding: '40px 0' }}>
                  Belum ada komentar. Jadilah yang pertama berkomentar!
                </div>
              ) : (
                (commentsMap[activeCommentVideo.id] || []).map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <img
                      src={c.user_avatar}
                      alt={c.user_name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{c.user_name}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{c.created_at}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {c.text}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ cursor: 'pointer' }}>Balas</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLikeComment(activeCommentVideo.id, c.id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: c.liked ? '#FE2C55' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Heart size={14} fill={c.liked ? '#FE2C55' : 'none'} color={c.liked ? '#FE2C55' : 'currentColor'} />
                      <span style={{ fontSize: '10px', fontWeight: 600 }}>{c.likes}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Emoji Tray */}
            {showEmojiTray && (
              <div style={{ padding: '8px 16px', backgroundColor: '#282828', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {['😂', '❤️', '🔥', '👏', '🥺', '😍', '😭', '💯', '🤣', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setCommentInput((prev) => prev + emoji)}
                    style={{ fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{ flex: 1, backgroundColor: '#2b2b2b', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePostComment();
                  }}
                  placeholder="Tambahkan komentar..."
                  style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px' }}
                />
                <button
                  onClick={() => setShowEmojiTray((prev) => !prev)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                <button
                  onClick={() => setCommentInput((prev) => prev + '@')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                  title="Sebut akun (@)"
                >
                  <AtSign size={16} />
                </button>
              </div>

              <button
                onClick={handlePostComment}
                disabled={!commentInput.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#FE2C55',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: commentInput.trim() ? 'pointer' : 'not-allowed',
                  opacity: commentInput.trim() ? 1 : 0.4,
                }}
              >
                Posting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. TIKTOK UPLOAD MODAL ================= */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#222222', border: '1px solid #333333', borderRadius: '16px', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setShowUploadModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Upload size={20} color="#FE2C55" />
              <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#fff', margin: 0 }}>Unggah Video TikTok</h3>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={36} color="#FE2C55" />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>Pilih video untuk diunggah</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Atau seret dan lepas berkas video MP4</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Keterangan / Caption
                </label>
                <textarea
                  rows={3}
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Tulis keterangan menarik dengan #tag dan @sebutan..."
                  style={{
                    width: '100%',
                    backgroundColor: '#181818',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  URL Video MP4 (Opsional)
                </label>
                <input
                  type="url"
                  value={uploadVideoUrl}
                  onChange={(e) => setUploadVideoUrl(e.target.value)}
                  placeholder="https://... (Biarkan kosong untuk video default)"
                  style={{
                    width: '100%',
                    backgroundColor: '#181818',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadTitle.trim()}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#FE2C55',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isUploading || !uploadTitle.trim() ? 'not-allowed' : 'pointer',
                    opacity: isUploading || !uploadTitle.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isUploading ? 'Mengunggah...' : 'Posting Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 6. MOBILE BOTTOM BAR (< 1024px) ================= */}
      {!isDesktop && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '56px',
            backgroundColor: '#121212',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setActiveTab('foryou')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: activeTab === 'foryou' ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
          >
            <Home size={20} fill={activeTab === 'foryou' ? '#fff' : 'none'} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: activeTab === 'explore' ? '#ffffff' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
          >
            <Compass size={20} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Temukan</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              width: '40px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(to right, #25F4EE, #ffffff, #FE2C55)',
              padding: '2px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              +
            </div>
          </button>

          <Link
            href="/chat"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', position: 'relative' }}
          >
            <Send size={20} style={{ transform: 'rotate(-45deg)' }} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Kotak Masuk</span>
            {totalUnreadMessages > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '4px', padding: '1px 5px', borderRadius: '9999px', backgroundColor: '#FE2C55', color: '#fff', fontSize: '8px', fontWeight: 700 }}>
                {totalUnreadMessages}
              </span>
            )}
          </Link>

          <Link
            href={currentUser ? '/profile' : '/login'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
          >
            <User size={20} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Profil</span>
          </Link>
        </nav>
      )}

      {/* ================= DARDCOR MEDIA NAVIGATION SIDEBAR (EXACT MATCH TO GAMBAR 2) ================= */}
      {isDardcorSidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
          {/* Backdrop */}
          <div
            onClick={() => setIsDardcorSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)',
              transition: 'opacity 0.2s',
            }}
          />

          {/* Sidebar Container - Exact Visual Structure from Gambar 2 */}
          <aside
            style={{
              position: 'relative',
              width: '240px',
              maxWidth: '85vw',
              height: '100%',
              backgroundColor: '#100c1e',
              borderRight: '1px solid rgba(168, 85, 247, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              zIndex: 260,
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(124, 58, 237, 0.2)',
              userSelect: 'none',
              boxSizing: 'border-box',
            }}
          >
            <div>
              {/* Header: Title & Subtitle + [PanelLeftClose] Toggle Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    Dardcor Media
                  </span>
                  <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px' }}>
                    FEED & CHAT
                  </span>
                </div>

                <button
                  onClick={() => setIsDardcorSidebarOpen(false)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Tutup Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Media Feed (Active with purple background) */}
                <Link
                  href="/media"
                  onClick={() => setIsDardcorSidebarOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'linear-gradient(to right, #7c3aed, #9333ea)',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.45)',
                    boxSizing: 'border-box',
                  }}
                >
                  <Film size={18} style={{ flexShrink: 0 }} />
                  <span>Media Feed</span>
                </Link>

                {/* Chat Obrolan (Link to /chat) */}
                <Link
                  href="/chat"
                  onClick={() => setIsDardcorSidebarOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'rgba(233, 213, 255, 0.75)',
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(233, 213, 255, 0.75)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageSquare size={18} style={{ flexShrink: 0 }} />
                    <span>Chat Obrolan</span>
                  </div>
                  {totalUnreadMessages > 0 && (
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        backgroundColor: '#f43f5e',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                      }}
                    >
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            {/* Footer Profile & Logout */}
            <div style={{ borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Profile Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#181329',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser?.display_name || 'The Dardcor'}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.display_name || 'The Dardcor'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#c084fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{currentUser?.username || 'thedardcor'}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await logoutUser();
                  clearAuthCookie();
                  setCurrentUser(null);
                  setIsDardcorSidebarOpen(false);
                  router.refresh();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fb7185',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
                <span>Keluar Akun</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ================= TIKTOK REAL ACCOUNT LOGIN MODAL ================= */}
      {showTikTokLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => {
              if (!isLoggingInTikTok) setShowTikTokLoginModal(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '24px',
              boxShadow: '0 24px 70px rgba(0,0,0,0.95), 0 0 35px rgba(254, 44, 85, 0.2)',
              padding: '28px',
              zIndex: 360,
              boxSizing: 'border-box',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowTikTokLoginModal(false)}
              disabled={isLoggingInTikTok}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* Header Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '22px' }}>
              <TikTokLogo />
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '16px', marginBottom: '6px', color: '#ffffff' }}>
                Masuk ke Akun TikTok Real
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
                Ketikkan username TikTok asli Anda. Data profil, foto avatar, pengikut, dan statistik akan ditarik secara live via scraping.
              </p>
            </div>

            {/* Error Message */}
            {tiktokLoginError && (
              <div
                style={{
                  backgroundColor: 'rgba(254, 44, 85, 0.15)',
                  border: '1px solid rgba(254, 44, 85, 0.4)',
                  color: '#FE2C55',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span>{tiktokLoginError}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTikTokLogin();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Username Akun TikTok
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: '46px',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#FE2C55', fontWeight: 800, fontSize: '16px' }}>@</span>
                  <input
                    type="text"
                    value={tiktokUsernameInput}
                    onChange={(e) => setTiktokUsernameInput(e.target.value)}
                    placeholder="Contoh: fuji_an, raffi_nagita, dsb"
                    disabled={isLoggingInTikTok}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                  Coba akun populer atau masukkan username akun Anda:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['fuji_an', 'raffi_nagita', 'attahalilintar', 'sandradewi88'].map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      disabled={isLoggingInTikTok}
                      onClick={() => {
                        setTiktokUsernameInput(suggested);
                        handleTikTokLogin(suggested);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(254, 44, 85, 0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                    >
                      @{suggested}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingInTikTok || !tiktokUsernameInput.trim()}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: isLoggingInTikTok || !tiktokUsernameInput.trim() ? '#444' : '#FE2C55',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isLoggingInTikTok || !tiktokUsernameInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: isLoggingInTikTok || !tiktokUsernameInput.trim() ? 'none' : '0 4px 20px rgba(254, 44, 85, 0.45)',
                  transition: 'all 0.2s',
                }}
              >
                {isLoggingInTikTok ? (
                  <>
                    <RotateCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Menarik Data Real TikTok...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Masuk & Sinkronkan Profil</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              Akun TikTok tersimpan khusus untuk media feed & tersinkronisasi dengan database.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
