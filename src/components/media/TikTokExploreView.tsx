'use client';

import { useState } from 'react';
import { Play, Heart, Flame, Music, Gamepad2, Tv, Sparkles, Utensils, Award } from 'lucide-react';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface TikTokExploreViewProps {
  videos: TikTokVideoItem[];
  onSelectVideo: (video: TikTokVideoItem) => void;
  onFilterCategory: (keyword: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: '🔥 Semua Trending', query: '' },
  { id: 'komedi', label: '😂 Komedi', query: 'lucu komedi' },
  { id: 'musik', label: '🎵 Musik', query: 'musik lagu sound' },
  { id: 'game', label: '🎮 Game', query: 'game gaming mlbb' },
  { id: 'anime', label: '🎌 Anime', query: 'anime edit' },
  { id: 'kuliner', label: '🍜 Kuliner', query: 'makanan resep kuliner' },
  { id: 'olahraga', label: '⚽ Olahraga', query: 'sepakbola futsal olahraga' },
];

export function TikTokExploreView({
  videos,
  onSelectVideo,
  onFilterCategory,
}: TikTokExploreViewProps) {
  const [selectedCat, setSelectedCat] = useState('all');

  const handleCategoryClick = (cat: typeof CATEGORIES[0]) => {
    setSelectedCat(cat.id);
    onFilterCategory(cat.query);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 space-y-6 text-white bg-black">
      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCat === cat.id
                ? 'bg-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/30'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {videos.map((vid, idx) => (
          <div
            key={`${vid.id}_exp_${idx}`}
            onClick={() => onSelectVideo(vid)}
            className="group relative aspect-[9/16] bg-[#161616] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-[#FE2C55] transition shadow-lg"
          >
            <img
              src={vid.cover_url}
              alt={vid.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-between p-2.5">
              <div className="flex justify-end">
                <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition">
                  <Play size={11} fill="white" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-white line-clamp-2 leading-snug">
                  {vid.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/60 pt-0.5">
                  <span className="truncate max-w-[65%]">@{vid.author.nickname}</span>
                  <span className="flex items-center gap-1">
                    <Heart size={10} fill="currentColor" /> {vid.digg_count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
