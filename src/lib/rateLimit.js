// Simple in-memory sliding-window rate limiter for login endpoints.
//
// IMPORTANT LIMITATION: Vercel serverless functions are not guaranteed to
// reuse the same process between invocations, so this Map can reset between
// requests in production and will not perfectly enforce the limit across a
// distributed deployment. It still helps (warm instances are common and it
// fully protects `next start` / single-process deployments), but for a
// strict guarantee under real load, swap this for a shared store such as
// Upstash Redis or Vercel KV, keyed the same way (see checkRateLimit below).
const buckets = new Map();

export function checkRateLimit(key, { limit = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - entry.windowStart) };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
