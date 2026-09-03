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

// In-memory cache for comments: key -> { timestamp, data }
const commentsCache = new Map<string, { timestamp: number; data: ScrapedComment[]; total: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Convert unix timestamp to relative time string
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Baru saja';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}h`;
  const date = new Date(timestamp * 1000);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('video_id') || '';
  const videoUrl = searchParams.get('url') || (videoId ? `https://www.tiktok.com/@tiktok/video/${videoId}` : '');

  if (!videoUrl && !videoId) {
    return NextResponse.json({ success: false, message: 'URL atau video_id diperlukan' }, { status: 400 });
  }

  const cacheKey = videoId || videoUrl;
  const cached = commentsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      total: cached.total,
      data: cached.data,
      cached: true,
    });
  }

  // Target URL to send to TikWM
  const targetUrl = videoId ? `https://www.tiktok.com/@tiktok/video/${videoId}` : videoUrl;

  try {
    const apiUrl = `https://tikwm.com/api/comment/list?url=${encodeURIComponent(targetUrl)}&count=30`;

    let data: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(apiUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.code === 0) {
            data = json;
            break;
          }
        }
      } catch {
        // network issue
      }
      // Wait 1.1s before retry to clear rate limit
      await new Promise((r) => setTimeout(r, 1100));
    }

    if (data && data.data && typeof data.data === 'object') {
      const dataObj = data.data as Record<string, unknown>;
      const rawComments = Array.isArray(dataObj.comments) ? dataObj.comments : [];

      const comments: ScrapedComment[] = rawComments.map((item: Record<string, unknown>) => {
        const user = (item.user || {}) as Record<string, unknown>;
        return {
          id: String(item.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
          user_name: String(user.nickname || user.unique_id || 'Pengguna TikTok'),
          user_handle: String(user.unique_id || 'tiktok_user'),
          user_avatar: String(
            user.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                String(user.unique_id || 'user')
              )}`
          ),
          text: String(item.text || ''),
          created_at: formatRelativeTime(Number(item.create_time || 0)),
          likes: Number(item.digg_count || 0),
          liked: false,
        };
      });

      const total = Number(dataObj.total) || comments.length;
      commentsCache.set(cacheKey, { timestamp: Date.now(), data: comments, total });

      return NextResponse.json({
        success: true,
        total,
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
