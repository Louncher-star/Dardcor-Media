import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toValidUuid } from '@/lib/utils/uuidUtils';

export interface ChunkedMediaManifest {
  chunked: true;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalParts: number;
  parts: string[];
}

export interface UploadProgress {
  currentPart: number;
  totalParts: number;
  percent: number;
}

// Batas chunking: 40 MB (Supabase Free Tier memiliki batas maksimum 50 MB per file)
export const CHUNK_THRESHOLD = 40 * 1024 * 1024;
export const CHUNK_SIZE = 35 * 1024 * 1024; // 35 MB per chunk

export async function uploadChatMedia(
  file: File | Blob,
  fileName: string,
  folder: 'images' | 'videos' | 'audios' | 'documents' | 'files' | string = 'documents',
  onProgress?: (progress: UploadProgress) => void,
  ownerId?: string
): Promise<{ url: string; path: string }> {
  // Jika Supabase belum dikonfigurasi, gunakan Local Blob URL untuk pengujian offline
  if (!isSupabaseConfigured()) {
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, path: `local/${folder}/${fileName}` };
  }

  const supabase = createClient();
  const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  // Setiap unggahan berada di folder userId agar kebijakan Storage bisa memverifikasi pemilik.
  const baseFolder = ownerId ? `${toValidUuid(ownerId)}/${folder}` : folder;

  // =========================================================================
  // 1. FILE BESAR (>40 MB, misalnya 155 MB): UNGGAH DENGAN TEKNOLOGI CHUNKING
  // =========================================================================
  if (file.size > CHUNK_THRESHOLD) {
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const chunkUrls: string[] = [];
    const baseChunkPath = `${baseFolder}/chunked/${fileId}`;

    for (let i = 0; i < totalParts; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, (i + 1) * CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);
      const chunkFileName = `${sanitizedOriginal}.part${i}`;
      const chunkFilePath = `${baseChunkPath}/${chunkFileName}`;

      if (onProgress) {
        onProgress({
          currentPart: i + 1,
          totalParts,
          percent: Math.round(((i) / totalParts) * 100),
        });
      }

      const { data: chunkData, error: chunkErr } = await supabase.storage
        .from('chat-media')
        .upload(chunkFilePath, chunkBlob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (chunkErr) {
        console.error(`Gagal mengunggah bagian ${i + 1}/${totalParts}:`, chunkErr);
        throw new Error(
          `Gagal mengunggah file ${fileName} (bagian ${i + 1}/${totalParts}): ${chunkErr.message}`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(chunkData.path);

      chunkUrls.push(publicUrlData.publicUrl);
    }

    if (onProgress) {
      onProgress({
        currentPart: totalParts,
        totalParts,
        percent: 100,
      });
    }

    const manifest: ChunkedMediaManifest = {
      chunked: true,
      fileName,
      fileSize: file.size,
      mimeType: (file as File).type || 'application/octet-stream',
      totalParts,
      parts: chunkUrls,
    };

    return {
      url: JSON.stringify(manifest),
      path: baseChunkPath,
    };
  }

  // =========================================================================
  // 2. FILE STANDAR (<=40 MB): UNGGAH SECARA LANGSUNG
  // =========================================================================
  const cleanName = `${fileId}_${sanitizedOriginal}`;
  const filePath = `${baseFolder}/${cleanName}`;

  if (onProgress) {
    onProgress({ currentPart: 1, totalParts: 1, percent: 50 });
  }

  const { data, error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Gagal mengunggah file ${fileName}: ${error.message}`);
  }

  if (onProgress) {
    onProgress({ currentPart: 1, totalParts: 1, percent: 100 });
  }

  const { data: publicUrlData } = supabase.storage
    .from('chat-media')
    .getPublicUrl(data.path);

  return { url: publicUrlData.publicUrl, path: data.path };
}

// =========================================================================
// 3. FUNGSI UNDUH HANDAL ALA WHATSAPP REAL (MENDUKUNG CHUNKED & DIRECT)
// =========================================================================
export async function downloadMediaFile(
  mediaUrl: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (!mediaUrl) return;

  // A. File Chunked (>40 MB seperti Filter Kanban.zip 155 MB)
  if (mediaUrl.startsWith('{') && mediaUrl.includes('"chunked":true')) {
    try {
      const manifest: ChunkedMediaManifest = JSON.parse(mediaUrl);
      const totalParts = manifest.parts.length;
      const partBlobs: Blob[] = [];

      for (let i = 0; i < totalParts; i++) {
        if (onProgress) {
          onProgress(Math.round((i / totalParts) * 100));
        }

        // Retry hingga 3 kali per bagian chunk jika ada lonjakan jaringan
        let res: Response | null = null;
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            res = await fetch(manifest.parts[i]);
            if (res.ok) break;
          } catch (e: unknown) {
            lastError = e instanceof Error ? e : new Error(String(e));
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!res || !res.ok) {
          throw new Error(
            `Gagal mengunduh bagian ${i + 1} dari ${totalParts} (${res ? 'HTTP ' + res.status : lastError?.message || 'Gangguan koneksi'})`
          );
        }
        const blob = await res.blob();
        partBlobs.push(blob);
      }

      if (onProgress) onProgress(100);

      const combinedBlob = new Blob(partBlobs, {
        type: manifest.mimeType || 'application/octet-stream',
      });
      triggerBrowserDownload(combinedBlob, manifest.fileName || fileName);
      return;
    } catch (e: unknown) {
      console.error('Error saat menggabungkan dan mengunduh file chunked:', e);
      throw e;
    }
  }

  // B. Peringatan jika ini adalah Blob URL usang dari sesi browser lama
  if (mediaUrl.startsWith('blob:')) {
    try {
      const res = await fetch(mediaUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerBrowserDownload(blob, fileName);
        return;
      }
    } catch {}
    alert(
      `File "${fileName}" tidak dapat diunduh karena file sebelumnya gagal tersimpan ke Supabase Storage (hanya tersimpan sementara di memori tab lama). Silakan unggah kembali file tersebut.`
    );
    return;
  }

  // C. Unduh langsung untuk URL Supabase Storage publik (?download=fileName)
  // Cara ini menghemat RAM browser secara drastis & mendukung resume bawaan Chrome
  try {
    if (mediaUrl.includes('supabase.co/storage/v1/object/public/')) {
      const separator = mediaUrl.includes('?') ? '&' : '?';
      const downloadParam = `download=${encodeURIComponent(fileName)}`;
      const directUrl = `${mediaUrl}${separator}${downloadParam}`;

      const a = document.createElement('a');
      a.href = directUrl;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 100);

      if (onProgress) onProgress(100);
      return;
    }
  } catch (err) {
    console.warn('Supabase direct download parameter failed, falling back to blob fetch:', err);
  }

  // D. File normal / eksternal via fetch blob
  try {
    if (onProgress) onProgress(20);
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (onProgress) onProgress(70);
    const blob = await res.blob();
    if (onProgress) onProgress(100);
    triggerBrowserDownload(blob, fileName);
  } catch (err) {
    console.warn('Direct fetch download failed, fallback to direct anchor:', err);
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 100);
  }
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 100);

  // PENTING: Jangan revoke blobUrl terlalu cepat (sebelumnya hanya 15 detik)!
  // Untuk file besar (155 MB), browser membutuhkan waktu menulis stream ke disk.
  // Revokasi dini menyebabkan pesan "Failed - Network error" di Chrome.
  // Pertahankan blob URL selama 10 menit (600.000 ms).
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 600000);
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file);
  }

  const supabase = createClient();
  const fileExt = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'png';
  const filePath = `${toValidUuid(userId)}/avatar_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Gagal mengunggah foto profil: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
