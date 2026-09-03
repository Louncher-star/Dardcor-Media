'use client';

import { create } from 'zustand';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

export interface TikTokUser {
  id: string;
  unique_id: string;
  nickname: string;
  avatar_url: string;
  email?: string;
  signature?: string;
  verified?: boolean;
  follower_count: number;
  following_count: number;
  heart_count: number;
  video_count: number;
  digg_count?: number;
  friend_count?: number;
  user_videos?: TikTokVideoItem[];
  liked_videos?: TikTokVideoItem[];
  saved_videos?: TikTokVideoItem[];
}

interface TikTokAuthState {
  tiktokUser: TikTokUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithTikTok: (identifier: string, isGmail?: boolean, customHandle?: string) => Promise<boolean>;
  logoutTikTok: () => void;
  updateTikTokProfile: (updated: Partial<TikTokUser>) => void;
  addLikedVideo: (video: TikTokVideoItem) => void;
  removeLikedVideo: (videoId: string) => void;
  addSavedVideo: (video: TikTokVideoItem) => void;
  removeSavedVideo: (videoId: string) => void;
  initSession: () => void;
}

const STORAGE_KEY = 'tiktok_user_session';

export const useTikTokAuthStore = create<TikTokAuthState>((set, get) => ({
  tiktokUser: null,
  isLoggedIn: false,
  isLoading: false,

  initSession: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const user = JSON.parse(saved);
        // Hapus akun dummy lama 'thedardcorsociety' jika ada
        if (user.unique_id === 'thedardcorsociety') {
          localStorage.removeItem(STORAGE_KEY);
          set({ tiktokUser: null, isLoggedIn: false });
          return;
        }
        set({ tiktokUser: user, isLoggedIn: true });
        return;
      }
    } catch {}

    set({ tiktokUser: null, isLoggedIn: false });
  },

  loginWithTikTok: async (identifier: string, isGmail = false, customHandle?: string) => {
    set({ isLoading: true });
    try {
      const cleanInput = identifier.trim();
      if (!cleanInput) {
        set({ isLoading: false });
        return false;
      }

      // Tentukan target username TikTok yang akan discrape secara real
      let targetUsername = cleanInput.replace(/^@+/, '');
      let userEmail: string | undefined = undefined;

      if (isGmail || cleanInput.includes('@')) {
        userEmail = cleanInput;
        if (customHandle && customHandle.trim()) {
          targetUsername = customHandle.trim().replace(/^@+/, '');
        } else {
          const prefix = cleanInput.split('@')[0].toLowerCase();
          // Jika email berkaitan dengan dardcor, gunakan username real dardcor
          if (prefix.includes('dardcor')) {
            targetUsername = 'dardcor';
          } else {
            targetUsername = prefix.replace(/[^a-z0-9_]/g, '_');
          }
        }
      }

      // Panggil endpoint scraper live real TikTok
      const res = await fetch(`/api/tiktok/user?username=${encodeURIComponent(targetUsername)}`);
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        const user: TikTokUser = {
          id: data.id || `tt_${data.unique_id}`,
          unique_id: data.unique_id,
          nickname: data.nickname || targetUsername,
          avatar_url: data.avatar_url,
          email: userEmail,
          signature: data.signature || '',
          verified: Boolean(data.verified),
          follower_count: data.follower_count || 0,
          following_count: data.following_count || 0,
          heart_count: data.heart_count || 0,
          video_count: data.video_count || 0,
          digg_count: data.digg_count || 0,
          friend_count: data.friend_count || 0,
          user_videos: data.videos || [],
          liked_videos: data.liked_videos || [],
          saved_videos: data.favorite_videos || [],
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        set({ tiktokUser: user, isLoggedIn: true, isLoading: false });
        return true;
      } else {
        // Jika akun tidak ditemukan sama sekali di TikTok
        set({ isLoading: false });
        return false;
      }
    } catch (err) {
      console.error('Error logging into TikTok:', err);
      set({ isLoading: false });
      return false;
    }
  },

  logoutTikTok: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ tiktokUser: null, isLoggedIn: false });
  },

  updateTikTokProfile: (updated: Partial<TikTokUser>) => {
    const current = get().tiktokUser;
    if (!current) return;
    const next = { ...current, ...updated };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    set({ tiktokUser: next });
  },

  addLikedVideo: (video: TikTokVideoItem) => {
    const current = get().tiktokUser;
    if (!current) return;
    const existing = current.liked_videos || [];
    if (existing.some((v) => v.id === video.id)) return;
    const nextList = [video, ...existing];
    const nextUser = {
      ...current,
      liked_videos: nextList,
      digg_count: (current.digg_count || existing.length) + 1,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    set({ tiktokUser: nextUser });
  },

  removeLikedVideo: (videoId: string) => {
    const current = get().tiktokUser;
    if (!current) return;
    const existing = current.liked_videos || [];
    const nextList = existing.filter((v) => v.id !== videoId);
    const nextUser = {
      ...current,
      liked_videos: nextList,
      digg_count: Math.max(0, (current.digg_count || existing.length) - 1),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    set({ tiktokUser: nextUser });
  },

  addSavedVideo: (video: TikTokVideoItem) => {
    const current = get().tiktokUser;
    if (!current) return;
    const existing = current.saved_videos || [];
    if (existing.some((v) => v.id === video.id)) return;
    const nextList = [video, ...existing];
    const nextUser = { ...current, saved_videos: nextList };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    set({ tiktokUser: nextUser });
  },

  removeSavedVideo: (videoId: string) => {
    const current = get().tiktokUser;
    if (!current) return;
    const existing = current.saved_videos || [];
    const nextList = existing.filter((v) => v.id !== videoId);
    const nextUser = { ...current, saved_videos: nextList };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {}
    set({ tiktokUser: nextUser });
  },
}));
