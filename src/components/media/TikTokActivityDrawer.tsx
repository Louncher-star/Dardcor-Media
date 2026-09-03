'use client';

import { useState } from 'react';
import { X, Heart, MessageCircle, UserPlus, Bell, AtSign } from 'lucide-react';

interface TikTokActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTIVITIES = [
  {
    id: 'a1',
    type: 'like',
    user: 'JOKER DZ',
    handle: 'jokerded16',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=joker',
    text: 'menyukai video Anda.',
    time: '2 jam yang lalu',
  },
  {
    id: 'a2',
    type: 'comment',
    user: '—Lipxzź Dé Mélonzz',
    handle: 'lipxzz_melonzz',
    avatar: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg',
    text: 'mengomentari: "Keren banget bang soundnya!"',
    time: '5 jam yang lalu',
  },
  {
    id: 'a3',
    type: 'follow',
    user: 'ZARR',
    handle: 'zarr_creator',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=zarr',
    text: 'mulai mengikuti Anda.',
    time: '1 hari yang lalu',
  },
  {
    id: 'a4',
    type: 'mention',
    user: 'cecayys',
    handle: 'cecayys',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cecayys',
    text: 'menyebut Anda dalam komentar video.',
    time: '2 hari yang lalu',
  },
];

export function TikTokActivityDrawer({ isOpen, onClose }: TikTokActivityDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'like' | 'comment' | 'follow'>('all');

  if (!isOpen) return null;

  const filtered = ACTIVITIES.filter((a) => (filter === 'all' ? true : a.type === filter));

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-[#181818] border-l border-white/10 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#FE2C55]" />
            <h3 className="font-extrabold text-sm text-white">Aktivitas & Notifikasi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 border-b border-white/5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'like', label: 'Suka' },
            { id: 'comment', label: 'Komentar' },
            { id: 'follow', label: 'Pengikut' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#FE2C55] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Activities */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filtered.map((item) => (
            <div key={item.id} className="p-3.5 flex items-start gap-3 hover:bg-white/5 transition">
              <div className="relative">
                <img
                  src={item.avatar}
                  alt={item.user}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FE2C55] flex items-center justify-center text-white text-[9px]">
                  {item.type === 'like' && <Heart size={9} fill="white" />}
                  {item.type === 'comment' && <MessageCircle size={9} fill="white" />}
                  {item.type === 'follow' && <UserPlus size={9} />}
                  {item.type === 'mention' && <AtSign size={9} />}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-white leading-snug">
                  <span className="font-bold">{item.user}</span> {item.text}
                </p>
                <span className="text-[10px] text-white/40 mt-1 block">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
