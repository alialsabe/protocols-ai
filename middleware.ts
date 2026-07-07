import { type NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - image/video/font assets
     * - research/* (public, read-only, ISR-cached content pages — the auth
     *   session refresh sets cookies that would make these responses
     *   uncacheable at the CDN; auth on these pages is handled client-side)
     */
    '/((?!_next/static|_next/image|favicon.ico|research|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
