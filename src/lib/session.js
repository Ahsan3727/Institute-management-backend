import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET environment variable is not set (or is shorter than 16 ' +
        'characters). Set it to a long random string in .env.local / your ' +
        'Vercel project\'s Environment Variables before starting the app.'
    );
  }
  return encoder.encode(secret);
}

// Two independent cookies: one for the institute app (admin/teacher/parent),
// one for the separate Hub super-admin panel. Kept separate so a Hub
// session can never be mistaken for — or reused as — institute access,
// and vice versa.
export const SESSION_COOKIE_NAME = 'institute_session';
export const HUB_SESSION_COOKIE_NAME = 'hub_session';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export async function signSessionToken(payload, { maxAgeSeconds = SESSION_MAX_AGE_SECONDS } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/**
 * Signs `payload` and attaches it to `response` as an httpOnly cookie.
 * `response` must be a NextResponse instance.
 */
export async function setSessionCookie(
  response,
  payload,
  { cookieName = SESSION_COOKIE_NAME, maxAgeSeconds = SESSION_MAX_AGE_SECONDS } = {}
) {
  const token = await signSessionToken(payload, { maxAgeSeconds });
  response.cookies.set(cookieName, token, cookieOptions(maxAgeSeconds));
  return response;
}

export function clearSessionCookie(response, cookieName = SESSION_COOKIE_NAME) {
  response.cookies.set(cookieName, '', { ...cookieOptions(0), maxAge: 0 });
  return response;
}

/** Reads + verifies the session cookie off an incoming NextRequest. */
export async function getSession(request, cookieName = SESSION_COOKIE_NAME) {
  const token = request.cookies.get(cookieName)?.value;
  return verifySessionToken(token);
}

/**
 * Convenience guard for route handlers:
 *   const { session, error, status } = await requireSession(req, { roles: ['admin'] });
 *   if (error) return NextResponse.json({ ok: false, error }, { status });
 */
export async function requireSession(request, { roles, cookieName = SESSION_COOKIE_NAME } = {}) {
  const session = await getSession(request, cookieName);
  if (!session) {
    return { session: null, error: 'Authentication required.', status: 401 };
  }
  if (roles && roles.length && !roles.includes(session.role)) {
    return { session: null, error: 'You are not authorized to perform this action.', status: 403 };
  }
  return { session, error: null, status: 200 };
}
