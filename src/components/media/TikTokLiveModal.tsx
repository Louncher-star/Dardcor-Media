'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Gift, Users, Share2, Radio, Sparkles } from 'lucide-react';
import { TikTokUser } from '@/lib/store/useTikTokAuthStore';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface LiveComment {
  id: string;
  user: string;
  avatar: string;
  text: string;
}

interface TikTokLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TikTokUser | null;
  video: TikTokVideoItem | null;
}

export function TikTokLiveModal({
  isOpen,
  onClose,
  currentUser,
  video,
}: TikTokLiveModalProps) {
  const [comments, setComments] = useState<LiveComment[]>([
    { id: '1', user: 'riyan_gamer', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=riyan', text: 'Halo bang! Semangat terus streamingnya! 🔥' },
    { id: '2', user: 'bella_cantik', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bella', text: 'Keren banget bang skillnya!' },
    { id: '3', user: 'dimas_pratama', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dimas', text: 'Sapa aku dong kak' },
    { id: '4', user: 'salsa_putri', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=salsa', text: 'Halo semuanya selamat malam ✨' },
  ]);

  const [inputComment, setInputComment] = useState('');
  const [viewerCount, setViewerCount] = useState(14820);
  const [likeCount, setLikeCount] = useState(45200);
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; x: number }[]>([]);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Simulate incoming live chat comments
  useEffect(() => {
    if (!isOpen) return;

    const fakeNames = ['andi_99', 'citra_ayu', 'budi_santoso', 'maya_lestari', 'fajar_gaming', 'rizky_cool'];
    const fakeTexts = [
      'Gokil sih ini!',
      'Keren banget bang 🔥',
      'Lanjut terus!',
      'Mantap jiwa bro',
      'Kirim mawar buat abang 🌹',
      'Auto follow nih',
      'Halo dari Jakarta!',
    ];

    const interval = setInterval(() => {
      const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const randomText = fakeTexts[Math.floor(Math.random() * fakeTexts.length)];
      const newC: LiveComment = {
        id: `lc_${Date.now()}`,
        user: randomName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`,
        text: randomText,
      };

      setComments((prev) => [...prev.slice(-25), newC]);
      setViewerCount((v) => v + Math.floor(Math.random() * 7) - 3);
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !video) return null;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputComment.trim()) return;

    const userComment: LiveComment = {
      id: `lc_user_${Date.now()}`,
      user: currentUser?.nickname || currentUser?.unique_id || 'Saya',
      avatar:
        currentUser?.avatar_url ||
        'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      text: inputComment.trim(),
    };

    setComments((prev) => [...prev, userComment]);
    setInputComment('');
  };

  const handleSendGift = () => {
    setLikeCount((prev) => prev + 50);
    const giftId = Date.now();
    setFloatingGifts((prev) => [...prev, { id: giftId, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== giftId));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[820px] bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-white">
        {/* Left / Main: Video Live Stream */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video
            src={video.video_url}
            poster={video.cover_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            playsInline
          />

          {/* Top Live Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            {/* Host info */}
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full pl-1.5 pr-3 py-1">
              <img
                src={video.author.avatar}
                alt={video.author.nickname}
                className="w-8 h-8 rounded-full object-cover border border-[#FE2C55]"
              />
              <div>
                <div className="text-xs font-bold text-white truncate max-w-[120px]">
                  {video.author.nickname}
                </div>
                <div className="text-[9px] text-[#FE2C55] font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55] animate-ping" />
                  <span>SIARAN LANGSUNG</span>
                </div>
              </div>
            </div>

            {/* Viewer Count & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-white">
                <Users size={14} className="text-[#20D5EC]" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Floating Heart / Gift Animation */}
          {floatingGifts.map((g) => (
            <div
              key={g.id}
              style={{ left: `${g.x}%` }}
              className="absolute bottom-16 pointer-events-none z-30 animate-bounce"
            >
              <Heart size={44} fill="#FE2C55" color="#FE2C55" />
            </div>
          ))}
        </div>

        {/* Right / Side: Interactive Realtime Live Chat */}
        <div className="w-full md:w-80 h-64 md:h-full bg-[#121212] border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-[#FE2C55] animate-pulse" />
              <span className="text-xs font-bold text-white">Obrolan Langsung</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <Heart size={12} className="text-[#FE2C55]" fill="#FE2C55" />
              <span>{likeCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Live Chat Message Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2 animate-in fade-in">
                <img
                  src={c.avatar}
                  alt={c.user}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white/60 text-[11px] mr-1.5 truncate">
                    {c.user}:
                  </span>
                  <span className="text-white/90 text-xs break-words">{c.text}</span>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Chat Input & Gift Footer */}
          <div className="p-3 border-t border-white/10 bg-[#161616] space-y-2">
            <form onSubmit={handleSendComment} className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputComment}
                onChange={(e) => setInputComment(e.target.value)}
                placeholder="Kirim komentar live..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-[#FE2C55] rounded-full px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputComment.trim()}
                className="w-7 h-7 rounded-full bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-40 text-white flex items-center justify-center transition flex-shrink-0"
              >
                <Send size={12} />
              </button>
            </form>

            <button
              onClick={handleSendGift}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition"
            >
              <Gift size={15} />
              <span>Kirim Gift / Suka LIVE (+50)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
