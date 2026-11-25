import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gagal mengambil metadata' }, { status: 502 });
    }

    const html = await res.text();

    const getMeta = (prop: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : null);
    const description = getMeta('description');
    let image = getMeta('image');

    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, targetUrl).href;
      } catch {
        image = null;
      }
    }

    const domain = new URL(targetUrl).hostname.replace(/^www\./, '');

    return NextResponse.json({
      url: targetUrl,
      title: title || domain,
      description: description || null,
      image: image || null,
      site_name: domain,
    });
  } catch {
    return NextResponse.json({ error: 'Timeout atau gagal mengambil preview' }, { status: 500 });
  }
}
