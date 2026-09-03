'use client';

import { useState } from 'react';
import { X, Upload, Video, Check, Hash } from 'lucide-react';
import { TikTokUser } from '@/lib/store/useTikTokAuthStore';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface TikTokUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TikTokUser | null;
  onVideoUploaded: (newVideo: TikTokVideoItem) => void;
}

const POPULAR_HASHTAGS = ['#fyp', '#trending', '#viral', '#foryoupage', '#tiktokindonesia', '#anime', '#kuliner'];

export function TikTokUploadModal({
  isOpen,
  onClose,
  currentUser,
  onVideoUploaded,
}: TikTokUploadModalProps) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddHashtag = (tag: string) => {
    setTitle((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const uploadedItem: TikTokVideoItem = {
      id: `custom_vid_${Date.now()}`,
      title: title.trim(),
      video_url:
        videoUrl.trim() ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      cover_url:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
      duration: 20,
      play_count: 1,
      digg_count: 0,
      comment_count: 0,
      share_count: 0,
      create_time: Math.floor(Date.now() / 1000),
      author: {
        id: currentUser?.id || 'me',
        unique_id: currentUser?.unique_id || 'thedardcorsociety',
        nickname: currentUser?.nickname || 'The Dardcor Society',
        avatar:
          currentUser?.avatar_url ||
          'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg',
      },
      music_info: {
        title: `Suara Asli - ${currentUser?.nickname || 'TikTok'}`,
        author: currentUser?.nickname || 'TikTok',
      },
    };

    onVideoUploaded(uploadedItem);
    setIsSubmitting(false);
    setTitle('');
    setVideoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-[#FE2C55]" />
            <h3 className="text-lg font-bold text-white">Unggah Video ke TikTok</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handlePublish} className="mt-5 space-y-4">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-white/20 hover:border-[#FE2C55] rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
            <div className="w-12 h-12 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
              <Video size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Pilih video untuk diunggah</p>
              <p className="text-[10px] text-white/50 mt-0.5">MP4 atau WebM (Resolusi 720p atau lebih tinggi)</p>
            </div>
          </div>

          {/* Optional video URL */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">
              URL Video Langsung (Opsional / Demo)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://...mp4"
              className="w-full bg-white/5 border border-white/15 focus:border-[#FE2C55] rounded-xl py-2 px-3 text-xs text-white placeholder-white/40 focus:outline-none transition"
            />
          </div>

          {/* Title & Caption */}
          <div>
            <label className="text-[11px] font-bold text-white/60 block mb-1">
              Keterangan & Tagar Video
            </label>
            <textarea
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tulis judul menarik dan tagar untuk video Anda..."
              required
              className="w-full bg-white/5 border border-white/15 focus:border-[#FE2C55] rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none transition resize-none"
            />

            {/* Quick Hashtag Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_HASHTAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddHashtag(tag)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-semibold text-[#25F4EE] flex items-center gap-0.5 transition"
                >
                  <Hash size={10} />
                  <span>{tag.replace('#', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-50 text-white flex items-center gap-1.5 shadow-lg shadow-[#FE2C55]/30 transition"
            >
              <Check size={14} />
              <span>Posting Video</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
