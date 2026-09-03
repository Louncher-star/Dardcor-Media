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

// Scrape videos by TikTok Challenge/Hashtag API (Hasil 100% Sesuai Query)
async function searchTikTokByChallenge(keyword: string, count = 20): Promise<TikTokVideoItem[]> {
  const clean = keyword.trim().replace(/^#+/, '');
  const tagsToTry = [
    clean.replace(/[^a-zA-Z0-9_]/g, ''),
    clean.replace(/\s+/g, ''),
    clean.toLowerCase(),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const tag of tagsToTry) {
    try {
      const infoUrl = `https://tikwm.com/api/challenge/info?challenge_name=${encodeURIComponent(tag)}`;
      const res = await fetch(infoUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      const json = await res.json();

      if (json && json.code === 0 && json.data?.id) {
        const postsUrl = `https://tikwm.com/api/challenge/posts?challenge_id=${encodeURIComponent(
          json.data.id
        )}&count=${encodeURIComponent(count)}`;
        const pRes = await fetch(postsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          cache: 'no-store',
        });
        const pJson = await pRes.json();

        if (pJson && pJson.code === 0 && Array.isArray(pJson.data?.videos) && pJson.data.videos.length > 0) {
          return pJson.data.videos.map((item: Record<string, unknown>) => {
            const author = (item.author || {}) as Record<string, unknown>;
            const music = (item.music_info || {}) as Record<string, unknown>;
            return {
              id: String(item.id || item.video_id || `tt_sch_${Date.now()}_${Math.random()}`),
              title: String(item.title || keyword),
              video_url: String(item.play || item.wmplay || ''),
              cover_url: String(item.origin_cover || item.cover || ''),
              duration: Number(item.duration || 15),
              play_count: Number(item.play_count || 10000),
              digg_count: Number(item.digg_count || 1200),
              comment_count: Number(item.comment_count || 80),
              share_count: Number(item.share_count || 25),
              create_time: Number(item.create_time || Math.floor(Date.now() / 1000)),
              author: {
                id: String(author.id || ''),
                unique_id: String(author.unique_id || 'creator'),
                nickname: String(author.nickname || author.unique_id || 'TikTok Creator'),
                avatar: String(
                  author.avatar ||
                    author.avatarThumb ||
                    'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg'
                ),
              },
              music_info: {
                title: String(music.title || 'Original Sound'),
                author: String(music.author || author.nickname || 'TikTok'),
                play: music.play ? String(music.play) : undefined,
              },
            };
          });
        }
      }
    } catch (err) {
      console.warn(`Gagal scrape challenge untuk tag "${tag}":`, err);
    }
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'ID';
  const count = parseInt(searchParams.get('count') || '25', 10);
  const keywords = (searchParams.get('keywords') || '').trim();
  const excludeIdsRaw = searchParams.get('exclude_ids') || '';
  const excludeIds = new Set(excludeIdsRaw.split(',').map((s) => s.trim()).filter(Boolean));

  // 1. JIKA ADA PENCARIAN (KEYWORDS): Scrape hasil real dari TikTok Challenge / Tag API
  if (keywords) {
    const searchResults = await searchTikTokByChallenge(keywords, count);
    if (searchResults.length > 0) {
      const filteredResults = searchResults.filter((v) => !excludeIds.has(v.id));
      return NextResponse.json({
        success: true,
        isSearch: true,
        keyword: keywords,
        count: filteredResults.length > 0 ? filteredResults.length : searchResults.length,
        data: filteredResults.length > 0 ? filteredResults : searchResults,
      });
    }
  }

  // 2. JIKA FEED REGULER (BERANDA / FYP): Ambil video real TikTok dengan rotasi multi-region
  const regionPool = [
    region,
    'ID',
    'GLOBAL',
    'US',
    'JP',
    'MY',
    'SG',
    'KR',
    'TH',
    'VN',
    'PH',
    'BR',
    'GB',
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Ambil region acak jika exclude_ids sudah banyak (indikasi infinite scroll / refresh lanjutan)
  const sortedRegions = excludeIds.size > 0
    ? [...regionPool].sort(() => 0.5 - Math.random())
    : regionPool;

  const collectedVideos: TikTokVideoItem[] = [];

  for (const reg of sortedRegions) {
    if (collectedVideos.length >= count) break;

    try {
      const apiUrl = `https://tikwm.com/api/feed/list?region=${encodeURIComponent(
        reg
      )}&count=30`;

      let response: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
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
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (!response || !response.ok) continue;

      const data = await response.json();

      if (data && data.code === 0 && Array.isArray(data.data) && data.data.length > 0) {
        const items = data.data.filter(
          (item: Record<string, unknown>) => item.play || item.wmplay
        );

        for (const item of items) {
          const id = String(item.id || item.video_id || `tt_${Date.now()}_${Math.random()}`);

          // Deduplikasi: Lewati video yang sudah pernah dilihat pengguna
          if (excludeIds.has(id)) continue;
          if (collectedVideos.some((v) => v.id === id)) continue;

          // Jika ada keyword pencarian dan challenge gagal, filter secara ketat di sini
          if (keywords) {
            const title = String(item.title || '').toLowerCase();
            const authorName = String(
              ((item.author as Record<string, unknown>)?.nickname) || ''
            ).toLowerCase();
            const kw = keywords.toLowerCase();
            if (!title.includes(kw) && !authorName.includes(kw)) continue;
          }

          const author = (item.author || {}) as Record<string, unknown>;
          const music = (item.music_info || {}) as Record<string, unknown>;

          collectedVideos.push({
            id,
            title: String(item.title || 'Video TikTok'),
            video_url: String(item.play || item.wmplay || ''),
            cover_url: String(item.origin_cover || item.cover || ''),
            duration: Number(item.duration || 15),
            play_count: Number(item.play_count || 10000),
            digg_count: Number(item.digg_count || 1500),
            comment_count: Number(item.comment_count || 85),
            share_count: Number(item.share_count || 40),
            create_time: Number(item.create_time || Math.floor(Date.now() / 1000)),
            author: {
              id: String(author.id || ''),
              unique_id: String(author.unique_id || 'tiktok_creator'),
              nickname: String(author.nickname || 'Kreator TikTok'),
              avatar: String(
                author.avatar ||
                  author.avatarThumb ||
                  'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg'
              ),
            },
            music_info: {
              title: String(music.title || 'Audio Asli'),
              author: String(music.author || author.nickname || 'TikTok'),
              play: music.play ? String(music.play) : undefined,
            },
          });

          if (collectedVideos.length >= count) break;
        }
      }
    } catch (err) {
      console.warn(`Gagal scraping feed TikTok region ${reg}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    region,
    count: collectedVideos.length,
    data: collectedVideos,
  });
}
