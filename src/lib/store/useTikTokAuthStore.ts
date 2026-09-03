'use client';

import { create } from 'zustand';

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
}

interface TikTokAuthState {
  tiktokUser: TikTokUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithTikTok: (identifier: string, isGmail?: boolean) => Promise<boolean>;
  logoutTikTok: () => void;
  updateTikTokProfile: (updated: Partial<TikTokUser>) => void;
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
        set({ tiktokUser: user, isLoggedIn: true });
        return;
      }
    } catch {}

    // Default session: akun demo TikTok yang otentik jika belum ada
    const defaultUser: TikTokUser = {
      id: 'tt_usr_default',
      unique_id: 'thedardcorsociety',
      nickname: 'The Dardcor Society',
      avatar_url: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg',
      email: 'thedardcorsociety@gmail.com',
      signature: 'Dardcor Media Official TikTok • Creator & Developer',
      verified: true,
      follower_count: 128400,
      following_count: 86,
      heart_count: 1450000,
      video_count: 32,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    } catch {}
    set({ tiktokUser: defaultUser, isLoggedIn: true });
  },

  loginWithTikTok: async (identifier: string, isGmail = false) => {
    set({ isLoading: true });
    try {
      const cleanIdentifier = identifier.trim().replace(/^@+/, '');
      if (!cleanIdentifier) return false;

      let user: TikTokUser;

      if (isGmail || cleanIdentifier.includes('@')) {
        // Login via Google / Gmail
        const namePart = cleanIdentifier.split('@')[0];
        user = {
          id: `tt_${Date.now()}`,
          unique_id: namePart.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          nickname: namePart.replace(/[._]/g, ' ').toUpperCase(),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanIdentifier)}`,
          email: cleanIdentifier,
          signature: `Akun resmi TikTok (${cleanIdentifier})`,
          verified: false,
          follower_count: 1250,
          following_count: 48,
          heart_count: 34200,
          video_count: 6,
        };
      } else {
        // Login via Username TikTok (scraping real profile)
        try {
          const res = await fetch(`/api/tiktok/user?username=${encodeURIComponent(cleanIdentifier)}`);
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            user = {
              id: data.id || `tt_${data.unique_id}`,
              unique_id: data.unique_id,
              nickname: data.nickname,
              avatar_url: data.avatar_url,
              signature: data.signature,
              verified: Boolean(data.verified),
              follower_count: data.follower_count || 5200,
              following_count: data.following_count || 120,
              heart_count: data.heart_count || 64000,
              video_count: data.video_count || 12,
            };
          } else {
            throw new Error('Fallback username');
          }
        } catch {
          user = {
            id: `tt_${Date.now()}`,
            unique_id: cleanIdentifier.toLowerCase(),
            nickname: cleanIdentifier,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanIdentifier)}`,
            signature: `Halo! Saya ${cleanIdentifier} di TikTok.`,
            verified: false,
            follower_count: 3400,
            following_count: 75,
            heart_count: 85200,
            video_count: 10,
          };
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set({ tiktokUser: user, isLoggedIn: true, isLoading: false });
      return true;
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
}));
