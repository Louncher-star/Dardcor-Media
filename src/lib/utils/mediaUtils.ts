import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export async function uploadChatMedia(
  file: File | Blob,
  fileName: string,
  folder: 'images' | 'videos' | 'audios' | 'documents'
): Promise<{ url: string; path: string }> {
  // Jika Supabase belum dikonfigurasi, gunakan Local Blob URL untuk pengujian langsung
  if (!isSupabaseConfigured()) {
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, path: `local/${folder}/${fileName}` };
  }

  const supabase = createClient();
  const fileExt = fileName.split('.').pop() || 'dat';
  const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${folder}/${cleanName}`;

  const { data, error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading chat media:', error);
    // Fallback ke Object URL jika ada kendala jaringan/bucket belum dibuat
    const fallbackUrl = URL.createObjectURL(file);
    return { url: fallbackUrl, path: filePath };
  }

  const { data: publicUrlData } = supabase.storage
    .from('chat-media')
    .getPublicUrl(data.path);

  return { url: publicUrlData.publicUrl, path: data.path };
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file);
  }

  const supabase = createClient();
  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    return URL.createObjectURL(file);
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
