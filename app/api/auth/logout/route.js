import { NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res, SESSION_COOKIE_NAME);
  return res;
}
