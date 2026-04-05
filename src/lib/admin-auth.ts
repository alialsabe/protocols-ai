import { NextResponse } from 'next/server';

/**
 * Checks the Authorization header against ADMIN_API_KEY.
 * Returns a 401 NextResponse if unauthorized, otherwise null.
 *
 * Usage:
 *   const authError = requireAdminAuth(request);
 *   if (authError) return authError;
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    // Fail closed: if no key is configured, block all access
    return NextResponse.json(
      { error: 'Admin access is not configured' },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== adminKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  return null;
}
