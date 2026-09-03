import { Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isValidUuid, toValidUuid } from '@/lib/utils/uuidUtils';

export interface RegisteredAccount extends Profile {
  email: string;
  password?: string;
}

const USERS_STORAGE_KEY = 'dardcor_registered_users';
const CURRENT_USER_KEY = 'dardcor_current_user';

export function setAuthCookie(userId: string) {
  if (typeof document === 'undefined') return;
  const safeId = toValidUuid(userId);
  document.cookie = `dardcor_auth_token=${encodeURIComponent(safeId)}; path=/; max-age=2592000; SameSite=Lax`;
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

export async function saveRegisteredUserToCloud(
  profile: Profile,
  email?: string,
  password?: string
): Promise<boolean> {
  if (!profile) return false;
  const safeId = toValidUuid(profile.id);
  profile.id = safeId;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        id: safeId,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        about: profile.about || 'Ada! Menggunakan Dardcor Media.',
        is_online: true,
        updated_at: new Date().toISOString(),
      };

      if (email) {
        payload.email = email.trim().toLowerCase();
      }

      if (password) {
        payload.phone_number = password; // Fallback kredensial instan
        payload.password = password;
      }

      let { error } = await supabase.from('profiles').upsert(payload);

      // Jika kolom password belum ada di Supabase, fallback tanpa kolom password
      if (error && error.message?.includes('password')) {
        delete payload.password;
        const retry = await supabase.from('profiles').upsert(payload);
        error = retry.error;
      }

      // Jika ada konflik username yang sudah terdaftar di Supabase
      if (error && error.message?.includes('profiles_username_key')) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', profile.username)
          .maybeSingle();

        if (existingUser?.id) {
          profile.id = existingUser.id;
          payload.id = existingUser.id;
          setStoredCurrentUser(profile);
          setAuthCookie(existingUser.id);
          const updateRes = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', existingUser.id);
          if (!updateRes.error) return true;
        }
      }

      if (!error) return true;
      console.warn('Upsert to profiles warning:', error.message);
    } catch (e) {
      console.error('Error saving user to Supabase profiles:', e);
    }
  }
  return false;
}

export async function fetchCloudProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch (e) {
      console.error('Error fetching cloud profiles:', e);
    }
  }

  return getRegisteredUsers();
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
  // 1. Cek Sesi Supabase jika aktif
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

        // Buat profil jika belum ada di tabel profiles
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

        await saveRegisteredUserToCloud(fallbackProfile, session.user.email);
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
    if (!isValidUuid(storedUser.id)) {
      const validId = toValidUuid(storedUser.id);
      storedUser.id = validId;
      setStoredCurrentUser(storedUser);
    }
    setAuthCookie(storedUser.id);
    // Sinkronkan ke cloud jika belum ada
    saveRegisteredUserToCloud(storedUser);
    return storedUser;
  }

  // 3. Cek dari cookie & daftar akun lokal
  const cookieUserId = getAuthCookie();
  if (cookieUserId) {
    const allUsers = getRegisteredUsers();
    const found = allUsers.find((u) => u.id === cookieUserId);
    if (found) {
      setStoredCurrentUser(found);
      saveRegisteredUserToCloud(found, found.email);
      return found;
    }
  }

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
