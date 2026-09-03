import { NextRequest, NextResponse } from 'next/server';

export interface TikTokVideoItem {
  id: string;
  title: string;
  video_url: string;
  cover_url: string;
  duration: number;
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
  music_info?: {
    title: string;
    author: string;
    play?: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'ID';
  const count = searchParams.get('count') || '15';

  try {
    const apiUrl = `https://tikwm.com/api/feed/list?region=${encodeURIComponent(
      region
    )}&count=${encodeURIComponent(count)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`TikWM response not ok: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.data && Array.isArray(data.data)) {
      const videos: TikTokVideoItem[] = data.data
        .filter((item: Record<string, unknown>) => item.play || item.wmplay)
        .map((item: Record<string, unknown>) => {
          const author = (item.author || {}) as Record<string, unknown>;
          const music = (item.music_info || {}) as Record<string, unknown>;

          return {
            id: String(item.id || item.video_id || `tt_${Date.now()}_${Math.random()}`),
            title: String(item.title || 'Video TikTok'),
            video_url: String(item.play || item.wmplay || ''),
            cover_url: String(item.origin_cover || item.cover || ''),
            duration: Number(item.duration || 0),
            play_count: Number(item.play_count || 0),
            digg_count: Number(item.digg_count || 0),
            comment_count: Number(item.comment_count || 0),
            share_count: Number(item.share_count || 0),
            author: {
              id: String(author.id || ''),
              unique_id: String(author.unique_id || 'tiktok_user'),
              nickname: String(author.nickname || 'TikTok Creator'),
              avatar: String(author.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=tiktok'),
            },
            music_info: {
              title: String(music.title || 'Audio Asli'),
              author: String(music.author || author.nickname || 'TikTok'),
              play: music.play ? String(music.play) : undefined,
            },
          };
        });

      return NextResponse.json({
        success: true,
        region,
        count: videos.length,
        data: videos,
      });
    }

    throw new Error('No video data found in response');
  } catch (error) {
    console.error('Error fetching real-time TikTok videos:', error);

    // Fallback data jika external scraper sedang lambat
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil feed real-time dari TikTok, silakan coba lagi.',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
