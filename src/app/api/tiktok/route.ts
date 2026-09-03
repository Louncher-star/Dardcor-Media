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
  create_time?: number;
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
  const keywords = (searchParams.get('keywords') || '').toLowerCase().trim();

  // Region fallback chain untuk memastikan selalu mendapatkan konten TikTok real
  const regionsToTry = [region, 'ID', 'MY', 'SG', 'GLOBAL', 'US', 'JP'].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  for (const reg of regionsToTry) {
    try {
      const apiUrl = `https://tikwm.com/api/feed/list?region=${encodeURIComponent(
        reg
      )}&count=${encodeURIComponent(count)}`;

      let response: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch(apiUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            cache: 'no-store',
          });
          if (response && response.ok) break;
        } catch {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (!response || !response.ok) continue;

      const data = await response.json();

      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        let items = data.data.filter(
          (item: Record<string, unknown>) => item.play || item.wmplay
        );

        if (keywords) {
          const filtered = items.filter((item: Record<string, unknown>) => {
            const title = String(item.title || '').toLowerCase();
            const author = String(
              ((item.author as Record<string, unknown>)?.nickname) || ''
            ).toLowerCase();
            return title.includes(keywords) || author.includes(keywords);
          });
          if (filtered.length > 0) {
            items = filtered;
          }
        }

        const videos: TikTokVideoItem[] = items.map((item: Record<string, unknown>) => {
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
            create_time: Number(item.create_time || Math.floor(Date.now() / 1000)),
            author: {
              id: String(author.id || ''),
              unique_id: String(author.unique_id || 'tiktok_creator'),
              nickname: String(author.nickname || 'Kreator TikTok'),
              avatar: String(
                author.avatar || 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg'
              ),
            },
            music_info: {
              title: String(music.title || 'Audio Asli'),
              author: String(music.author || author.nickname || 'TikTok'),
              play: music.play ? String(music.play) : undefined,
            },
          };
        });

        if (videos.length > 0) {
          return NextResponse.json({
            success: true,
            region: reg,
            count: videos.length,
            data: videos,
          });
        }
      }
    } catch (err) {
      console.warn(`Gagal scraping feed TikTok region ${reg}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    region,
    count: 0,
    data: [],
  });
}
