import { Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isValidUuid, toValidUuid } from '@/lib/utils/uuidUtils';

// Akun lokal hanya dipakai saat Supabase belum dikonfigurasi (mode demo).
// Password disimpan sebagai hash PBKDF2, bukan teks biasa.
export interface RegisteredAccount extends Profile {
  email: string;
  password_hash?: string;
  password_salt?: string;
  /** Hanya untuk migrasi akun lama; tidak pernah ditulis lagi. */
  password?: string;
}

const USERS_STORAGE_KEY = 'dardcor_registered_users';
const CURRENT_USER_KEY = 'dardcor_current_user';
const PBKDF2_ITERATIONS = 210000;

export function setAuthCookie(userId: string) {
  if (typeof document === 'undefined') return;
  const safeId = toValidUuid(userId);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `dardcor_auth_token=${encodeURIComponent(
    safeId
  )}; path=/; max-age=2592000; SameSite=Lax${secure}`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `dardcor_auth_token=; path=/; max-age=0; SameSite=Lax${secure}`;
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

export function setStoredCurrentUser(user: Profile | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
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

// ---------------------------------------------------------------------------
// HASH PASSWORD LOKAL (PBKDF2-SHA256)
// ---------------------------------------------------------------------------
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function createSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

async function derivePassword(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function saveRegisteredUser(account: RegisteredAccount) {
  if (typeof window === 'undefined') return;
  const existing = getRegisteredUsers();
  const filtered = existing.filter(
    (user) =>
      user.id !== account.id &&
      user.email !== account.email &&
      user.username !== account.username
  );
  filtered.push(account);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
}

export async function saveLocalAccount(
  profile: Profile,
  email: string,
  password: string
): Promise<RegisteredAccount> {
  const salt = createSalt();
  const hash = await derivePassword(password, salt);
  const account: RegisteredAccount = {
    ...profile,
    email: email.trim().toLowerCase(),
    password_hash: hash,
    password_salt: salt,
  };

  const existing = getRegisteredUsers();
  const filtered = existing.filter(
    (user) =>
      user.id !== account.id &&
      user.email !== account.email &&
      user.username !== account.username
  );
  filtered.push(account);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
  return account;
}

export async function verifyLocalAccount(
  email: string,
  password: string
): Promise<RegisteredAccount | null> {
  const users = getRegisteredUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;

  // Akun baru: verifikasi hash PBKDF2.
  if (found.password_hash && found.password_salt) {
    const hash = await derivePassword(password, found.password_salt);
    return constantTimeEqual(hash, found.password_hash) ? found : null;
  }

  // Migrasi akun lama yang masih menyimpan password teks biasa.
  if (found.password && found.password === password) {
    const { password: legacyPassword, ...rest } = found;
    void legacyPassword;
    const upgraded = await saveLocalAccount(rest, found.email, password);
    return upgraded;
  }

  return null;
}

// ---------------------------------------------------------------------------
// SUPABASE: PROFIL & SESI
// ---------------------------------------------------------------------------
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
        payload.phone_number = password;
        payload.password = password;
      }

      const { error } = await supabase.from('profiles').upsert(payload);

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
        .select('id, username, display_name, avatar_url, about, is_online, last_seen, created_at, updated_at')
        .order('display_name', { ascending: true });

      if (!error && data) {
        return data as Profile[];
      }
    } catch (e) {
      console.error('Error fetching cloud profiles:', e);
    }
  }

  if (isSupabaseConfigured()) return [];
  return getRegisteredUsers();
}

export async function getCurrentUser(): Promise<Profile | null> {
  // 1. Cek sesi Supabase Auth server jika ada
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setAuthCookie(profile.id);
          setStoredCurrentUser(profile as Profile);
          return profile as Profile;
        }

        const meta = user.user_metadata || {};
        const fallbackProfile: Profile = {
          id: user.id,
          username: meta.username || user.email?.split('@')[0] || 'user',
          display_name: meta.display_name || meta.username || 'Pengguna',
          avatar_url:
            meta.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          about: meta.about || 'Ada! Menggunakan Dardcor Media.',
          is_online: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await saveRegisteredUserToCloud(fallbackProfile, user.email);
        setAuthCookie(fallbackProfile.id);
        setStoredCurrentUser(fallbackProfile);
        return fallbackProfile;
      }
    } catch (err) {
      console.error('Error reading Supabase session:', err);
    }
  }

  // 2. Jika Supabase Auth session tidak ada (misal login via profiles fallback / email unconfirmed),
  // verifikasi ID sesi cookie/stored user langsung ke tabel database cloud profiles
  const cookieUserId = getAuthCookie();
  const storedUser = getStoredCurrentUser();
  const candidateId =
    (cookieUserId && isValidUuid(cookieUserId) ? cookieUserId : null) ||
    (storedUser?.id && isValidUuid(storedUser.id) ? storedUser.id : null);

  if (candidateId && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', candidateId)
        .maybeSingle();

      if (dbProfile) {
        setStoredCurrentUser(dbProfile as Profile);
        setAuthCookie(dbProfile.id);
        return dbProfile as Profile;
      }
    } catch (err) {
      console.warn('Error fetching cloud profile by candidate ID:', err);
    }
  }

  // 3. Fallback sesi lokal / demo (tersimpan di localStorage)
  if (storedUser) {
    if (!isValidUuid(storedUser.id)) {
      storedUser.id = toValidUuid(storedUser.id);
      setStoredCurrentUser(storedUser);
    }
    setAuthCookie(storedUser.id);
    return storedUser;
  }

  if (cookieUserId) {
    const found = getRegisteredUsers().find((user) => user.id === cookieUserId);
    if (found) {
      setStoredCurrentUser(found);
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

  // Bersihkan cache obrolan di perangkat agar sesi berikutnya tidak mewarisi data.
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('dardcor_chats_') ||
          key.startsWith('dardcor_messages_') ||
          key.startsWith('dardcor_starred_') ||
          key === 'dardcor_local_statuses'
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {}
  }
}
