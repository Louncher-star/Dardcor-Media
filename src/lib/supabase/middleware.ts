import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  let supabaseUser = null;

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://');

  if (isConfigured) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    supabaseUser = data?.user;
  }

  // Cek token sesi lokal jika Supabase belum aktif atau menggunakan sesi lokal
  const localAuthToken = request.cookies.get('dardcor_auth_token')?.value;
  const isAuthenticated = Boolean(supabaseUser || localAuthToken);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isChatRoute = pathname.startsWith('/chat');
  const isPublicApi = pathname.startsWith('/api/auth/callback');

  if (isPublicApi) {
    return supabaseResponse;
  }

  // 1. Jika belum login dan mencoba membuka ruang obrolan /chat, alihkan ke /login
  if (!isAuthenticated && isChatRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Jika sudah login dan mencoba mengakses /login atau /register, alihkan ke /chat
  if (isAuthenticated && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
