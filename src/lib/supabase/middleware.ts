import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isValidUuid } from '@/lib/security/sanitize';
import { securityHeadersForEnvironment } from '@/lib/security/headers';

function withSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeadersForEnvironment())) {
    response.headers.set(key, value);
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  let supabaseUser = null;

  const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') &&
    Boolean(configuredKey) &&
    configuredKey !== 'your-anon-key-here';

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

  // Cek token sesi (Supabase Auth session atau dardcor_auth_token UUID yang valid)
  const localAuthToken = request.cookies.get('dardcor_auth_token')?.value;
  const hasValidLocalToken = isValidUuid(localAuthToken);
  const isAuthenticated = Boolean(supabaseUser || hasValidLocalToken);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/chat');
  const isPublicApi = pathname.startsWith('/api/auth/callback');

  if (isPublicApi) {
    return withSecurityHeaders(supabaseResponse);
  }

  // 1. Jika belum login dan mencoba membuka rute yang dilindungi (/chat), alihkan ke /login
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return withSecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  // 2. Jika sudah login dan mencoba mengakses /login atau /register, alihkan ke /chat
  if (isAuthenticated && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    return withSecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  return withSecurityHeaders(supabaseResponse);
}
