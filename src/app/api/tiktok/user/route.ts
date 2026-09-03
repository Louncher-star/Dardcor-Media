import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface TikTokScrapedUser {
  id?: string;
  unique_id: string;
  nickname: string;
  avatar_url: string;
  signature: string;
  verified: boolean;
  follower_count: number;
  following_count: number;
  heart_count: number;
  video_count: number;
  sec_uid?: string;
}

// Fungsi Scraper Real TikTok Profil Pengguna
export async function scrapeTikTokUserProfile(rawUsername: string): Promise<TikTokScrapedUser | null> {
  const username = rawUsername.replace(/^@+/, '').trim();
  if (!username) return null;

  // Header browser simulasi mobile yang terbukti sukses melewati proteksi TikTok
  const requestHeaders = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
  };

  const urlsToTry = [
    `https://www.tiktok.com/@${encodeURIComponent(username)}`,
    `https://m.tiktok.com/v/@${encodeURIComponent(username)}.html`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: requestHeaders,
        cache: 'no-store',
      });

      if (!res.ok) continue;

      const html = await res.text();
      if (!html || html.length < 500) continue;

      // 1. Ekstrak data utama dari skrip Rehydration TikTok
      const rehydrationMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
      );

      if (rehydrationMatch) {
        try {
          const parsed = JSON.parse(rehydrationMatch[1]);
          const userDetail =
            parsed['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo;

          if (userDetail && userDetail.user) {
            const u = userDetail.user;
            const stats = userDetail.stats || {};

            return {
              unique_id: String(u.uniqueId || username),
              nickname: String(u.nickname || u.uniqueId || username),
              avatar_url: String(
                u.avatarLarger ||
                  u.avatarMedium ||
                  u.avatarThumb ||
                  'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg'
              ),
              signature: String(u.signature || ''),
              verified: Boolean(u.verified),
              follower_count: Number(stats.followerCount || 0),
              following_count: Number(stats.followingCount || 0),
              heart_count: Number(stats.heartCount || stats.heart || 0),
              video_count: Number(stats.videoCount || 0),
              sec_uid: u.secUid ? String(u.secUid) : undefined,
            };
          }
        } catch (parseErr) {
          console.warn('Gagal parse JSON rehydration TikTok:', parseErr);
        }
      }

      // 2. Ekstrak cadangan dari Open Graph meta tags jika skrip rehydration terenkripsi
      const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
      const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
      const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1];

      if (ogTitle || ogImage) {
        let cleanNickname = username;
        if (ogTitle) {
          cleanNickname = ogTitle.split('(@')[0].trim() || username;
        }

        return {
          unique_id: username,
          nickname: cleanNickname,
          avatar_url: ogImage || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + username,
          signature: ogDesc || '',
          verified: false,
          follower_count: 0,
          following_count: 0,
          heart_count: 0,
          video_count: 0,
        };
      }
    } catch (fetchErr) {
      console.warn(`Gagal scrape TikTok profil dari ${url}:`, fetchErr);
    }
  }

  return null;
}

// Simpan atau perbarui akun TikTok ke Supabase (jika database aktif)
async function saveTikTokAccountToDatabase(profile: TikTokScrapedUser) {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createClient();
    await supabase.from('tiktok_accounts').upsert(
      {
        unique_id: profile.unique_id,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
        signature: profile.signature,
        verified: profile.verified,
        follower_count: profile.follower_count,
        following_count: profile.following_count,
        heart_count: profile.heart_count,
        video_count: profile.video_count,
        sec_uid: profile.sec_uid,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'unique_id' }
    );
  } catch (dbErr) {
    console.warn('Gagal simpan akun tiktok ke database:', dbErr);
  }
}

// GET /api/tiktok/user?username=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || searchParams.get('unique_id');

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'Parameter username diperlukan' },
      { status: 400 }
    );
  }

  const profile = await scrapeTikTokUserProfile(username);

  if (!profile) {
    return NextResponse.json(
      { success: false, error: `Profil TikTok @${username} tidak ditemukan atau privat.` },
      { status: 404 }
    );
  }

  await saveTikTokAccountToDatabase(profile);

  return NextResponse.json({
    success: true,
    data: profile,
  });
}

// POST /api/tiktok/user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body.username || body.unique_id;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username diperlukan' },
        { status: 400 }
      );
    }

    const profile = await scrapeTikTokUserProfile(username);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: `Profil TikTok @${username} tidak ditemukan atau akun privat.` },
        { status: 404 }
      );
    }

    await saveTikTokAccountToDatabase(profile);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal memproses permintaan login TikTok' },
      { status: 500 }
    );
  }
}
