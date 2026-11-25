import { Profile, UserStatus, StatusView } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toValidUuid } from '@/lib/utils/uuidUtils';

const LOCAL_STATUSES_KEY = 'dardcor_local_statuses';

function readLocalStatuses(): UserStatus[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STATUSES_KEY);
    const list: UserStatus[] = raw ? JSON.parse(raw) : [];
    return list.filter((status) => new Date(status.expires_at).getTime() > Date.now());
  } catch {
    return [];
  }
}

function writeLocalStatuses(statuses: UserStatus[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STATUSES_KEY, JSON.stringify(statuses));
  } catch {}
}

export async function fetchActiveStatuses(): Promise<UserStatus[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_statuses')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        const userIds = Array.from(new Set(data.map((status) => status.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p as Profile]));
        return data.map((status) => ({
          ...status,
          profile: profileMap.get(status.user_id),
        })) as UserStatus[];
      }
    } catch (err) {
      console.warn('Gagal memuat status dari cloud:', err);
    }
  }

  // Jangan tampilkan status cache lokal saat sesi cloud aktif.
  if (isSupabaseConfigured()) return [];
  return readLocalStatuses();
}

export async function createStatus(
  user: Profile,
  payload: { caption?: string; mediaUrl?: string; backgroundColor?: string }
): Promise<UserStatus> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const fallback: UserStatus = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `status_${Date.now()}`,
    user_id: user.id,
    media_url: payload.mediaUrl || null,
    caption: payload.caption || null,
    background_color: payload.backgroundColor || '#7c3aed',
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    profile: user,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_statuses')
        .insert({
          user_id: toValidUuid(user.id),
          media_url: payload.mediaUrl || null,
          caption: payload.caption || null,
          background_color: payload.backgroundColor || '#7c3aed',
          expires_at: expires.toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        return { ...(data as UserStatus), profile: user };
      }
    } catch (err) {
      console.warn('Gagal menyimpan status ke cloud, memakai penyimpanan lokal:', err);
    }
  }

  const statuses = readLocalStatuses();
  writeLocalStatuses([fallback, ...statuses]);
  return fallback;
}

export async function deleteStatus(statusId: string, userId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('user_statuses')
        .delete()
        .eq('id', statusId)
        .eq('user_id', toValidUuid(userId));
    } catch (err) {
      console.error('Gagal menghapus status:', err);
    }
  }

  writeLocalStatuses(readLocalStatuses().filter((status) => status.id !== statusId));
}

export async function recordStatusView(statusId: string, viewer: Profile) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('status_views')
        .upsert(
          {
            status_id: statusId,
            viewer_id: toValidUuid(viewer.id),
            viewed_at: new Date().toISOString(),
          },
          { onConflict: 'status_id,viewer_id' }
        );
    } catch (err) {
      console.warn('Gagal mencatat pemirsa status ke cloud:', err);
    }
  }

  // Fallback penyimpanan lokal
  try {
    const raw = localStorage.getItem('dardcor_status_views') || '{}';
    const viewsMap = JSON.parse(raw);
    if (!viewsMap[statusId]) viewsMap[statusId] = [];
    if (!viewsMap[statusId].some((v: any) => v.viewer_id === viewer.id)) {
      viewsMap[statusId].push({
        id: `view_${Date.now()}_${Math.random()}`,
        status_id: statusId,
        viewer_id: viewer.id,
        viewed_at: new Date().toISOString(),
        viewer: viewer,
      });
      localStorage.setItem('dardcor_status_views', JSON.stringify(viewsMap));
    }
  } catch {}
}

export async function fetchStatusViewers(statusId: string): Promise<StatusView[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('status_views')
        .select('*')
        .eq('status_id', statusId)
        .order('viewed_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const viewerIds = data.map((v) => v.viewer_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', viewerIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p as Profile]));
        return data.map((v) => ({
          ...v,
          viewer: profileMap.get(v.viewer_id),
        })) as StatusView[];
      }
    } catch (err) {
      console.warn('Gagal mengambil pemirsa status dari cloud:', err);
    }
  }

  // Fallback penyimpanan lokal
  try {
    const raw = localStorage.getItem('dardcor_status_views') || '{}';
    const viewsMap = JSON.parse(raw);
    return viewsMap[statusId] || [];
  } catch {
    return [];
  }
}
