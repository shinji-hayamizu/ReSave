import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // セッションリフレッシュ - getUser()を呼び出すことで自動的にトークンがリフレッシュされる
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証が必要なパスの定義
  const protectedPaths = ['/', '/cards', '/study', '/stats', '/settings', '/tags'];
  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  // 認証ページのパス
  const authPaths = ['/login', '/signup', '/reset-password'];
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // API Routesは別途認証（Mobile用）
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // 静的アセットは認証不要
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/favicon.ico';

  if (isStaticAsset) {
    return supabaseResponse;
  }

  // 未認証ユーザーをログインページへリダイレクト
  if (isProtectedPath && !user && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーを認証ページからリダイレクト
  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
