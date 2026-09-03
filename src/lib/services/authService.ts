import { Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface RegisteredAccount extends Profile {
  email: string;
  password?: string;
}

const USERS_STORAGE_KEY = 'dardcor_registered_users';
const CURRENT_USER_KEY = 'dardcor_current_user';

export function setAuthCookie(userId: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `dardcor_auth_token=${encodeURIComponent(userId)}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `dardcor_auth_token=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )dardcor_auth_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getRegisteredUsers(): RegisteredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRegisteredUser(account: RegisteredAccount) {
  if (typeof window === 'undefined') return;
  const existing = getRegisteredUsers();
  const filtered = existing.filter(
    (u) => u.id !== account.id && u.email !== account.email && u.username !== account.username
  );
  filtered.push(account);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
}

export function getStoredCurrentUser(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredCurrentUser(user: Profile | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export async function getCurrentUser(): Promise<Profile | null> {
  // 1. Jika Supabase aktif
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setAuthCookie(profile.id);
          setStoredCurrentUser(profile);
          return profile as Profile;
        }

        // Jika profile di tabel profiles belum sempat terbuat oleh trigger, buat otomatis
        const meta = session.user.user_metadata || {};
        const fallbackProfile: Profile = {
          id: session.user.id,
          username: meta.username || session.user.email?.split('@')[0] || 'user',
          display_name: meta.display_name || meta.username || 'Pengguna',
          avatar_url:
            meta.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          about: meta.about || 'Ada! Menggunakan Dardcor Media.',
          is_online: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert(fallbackProfile);
        } catch (e) {
          console.error('Error upserting fallback profile:', e);
        }

        setAuthCookie(fallbackProfile.id);
        setStoredCurrentUser(fallbackProfile);
        return fallbackProfile;
      }
    } catch (err) {
      console.error('Error in getCurrentUser with Supabase:', err);
    }
  }

  // 2. Cek sesi lokal (tersimpan di localStorage)
  const storedUser = getStoredCurrentUser();
  if (storedUser) {
    setAuthCookie(storedUser.id);
    return storedUser;
  }

  // 3. Cek dari daftar user terdaftar
  const cookieUserId = getAuthCookie();
  if (cookieUserId) {
    const allUsers = getRegisteredUsers();
    const found = allUsers.find((u) => u.id === cookieUserId);
    if (found) {
      setStoredCurrentUser(found);
      return found;
    }
  }

  // Jika benar-benar tidak ada sesi aktif, bersihkan cookie agar tidak loop
  clearAuthCookie();
  return null;
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase sign out error:', err);
    }
  }

  clearAuthCookie();
  setStoredCurrentUser(null);
}
