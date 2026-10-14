import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export async function uploadChatMedia(
  file: File | Blob,
  fileName: string,
  folder: 'images' | 'videos' | 'audios' | 'documents' | 'files' | string = 'documents'
): Promise<{ url: string; path: string }> {
  // Jika Supabase belum dikonfigurasi, gunakan Local Blob URL untuk pengujian langsung
  if (!isSupabaseConfigured()) {
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, path: `local/${folder}/${fileName}` };
  }

  const supabase = createClient();
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() || 'dat' : 'dat';
  const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanName = `${Date.now()}_${sanitizedOriginal}`;
  const filePath = `${folder}/${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error, falling back to local object URL:', error.message);
      const fallbackUrl = URL.createObjectURL(file);
      return { url: fallbackUrl, path: filePath };
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, path: data.path };
  } catch (err) {
    console.error('Exception in uploadChatMedia:', err);
    const fallbackUrl = URL.createObjectURL(file);
    return { url: fallbackUrl, path: filePath };
  }
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
