import { NextRequest, NextResponse } from 'next/server';

export interface ScrapedComment {
  id: string;
  user_name: string;
  user_handle: string;
  user_avatar: string;
  text: string;
  created_at: string;
  likes: number;
  liked: boolean;
}

// Convert unix timestamp to relative time string
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Baru saja';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  const date = new Date(timestamp * 1000);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('video_id') || '';
  const videoUrl = searchParams.get('url') || (videoId ? `https://www.tiktok.com/@user/video/${videoId}` : '');

  if (!videoUrl) {
    return NextResponse.json({ success: false, message: 'URL atau video_id diperlukan' }, { status: 400 });
  }

  try {
    const apiUrl = `https://tikwm.com/api/comment/list?url=${encodeURIComponent(videoUrl)}&count=25`;

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`TikWM response not ok: ${res.status}`);
    }

    const data = await res.json();

    if (data && data.data && Array.isArray(data.data.comments)) {
      const comments: ScrapedComment[] = data.data.comments.map((item: Record<string, unknown>) => {
        const user = (item.user || {}) as Record<string, unknown>;
        return {
          id: String(item.id || `c_${Date.now()}_${Math.random()}`),
          user_name: String(user.nickname || user.unique_id || 'Pengguna TikTok'),
          user_handle: String(user.unique_id || 'tiktok_user'),
          user_avatar: String(
            user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=tiktok_comment'
          ),
          text: String(item.text || ''),
          created_at: formatRelativeTime(Number(item.create_time || 0)),
          likes: Number(item.digg_count || 0),
          liked: false,
        };
      });

      return NextResponse.json({
        success: true,
        total: data.data.total || comments.length,
        data: comments,
      });
    }

    return NextResponse.json({
      success: true,
      total: 0,
      data: [],
    });
  } catch (error) {
    console.error('Error fetching real TikTok comments:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil komentar realtime',
      error: String(error),
      data: [],
    });
  }
}
