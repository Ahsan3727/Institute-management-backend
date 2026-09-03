import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import InstituteData from '@/models/InstituteData';
import { verifyPassword } from '@/lib/passwords';
import { setSessionCookie, SESSION_COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function genericError() {
  // Deliberately identical whether the account doesn't exist or the
  // password is wrong — the old code returned a distinct message per case
  // ("Incorrect password for teacher account", etc.), which is a username
  // enumeration oracle. One generic message removes that leak.
  return NextResponse.json({ ok: false, error: 'Invalid username or password.' }, { status: 401 });
}

export async function POST(req) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many login attempts. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const identifier = (body.username || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString();

    if (!identifier || !password) {
      return NextResponse.json({ ok: false, error: 'Username and password are required.' }, { status: 400 });
    }

    await connectToDatabase();

    // ── 1. Admin / Principal ────────────────────────────────────────────
    let doc = await InstituteData.findOne({ 'admin.username': identifier }).select('admin');
    if (doc) {
      const ok = await verifyPassword(password, doc.admin.password);
      if (!ok) {
        await recordAudit({ action: 'login_failed', actorUsername: identifier, ip, meta: { attemptedRole: 'admin' } });
        return genericError();
      }
      const session = {
        role: 'admin',
        instituteId: String(doc._id),
        userId: 'admin',
        username: doc.admin.username,
        name: doc.admin.name,
      };
      const res = NextResponse.json({
        ok: true,
        role: session.role,
        name: session.name,
        username: session.username,
        mustChangePassword: !!doc.admin.mustChangePassword,
      });
      await setSessionCookie(res, session, { cookieName: SESSION_COOKIE_NAME });
      await recordAudit({ action: 'login_success', actorRole: 'admin', actorUsername: identifier, instituteId: doc._id, ip });
      return res;
    }

    // ── 2. Teacher ───────────────────────────────────────────────────────
    doc = await InstituteData.findOne({ 'teachers.username': identifier }).select('teachers');
    let teacher = doc ? doc.teachers.find((t) => t.username === identifier) : null;
    if (teacher) {
      const ok = await verifyPassword(password, teacher.password);
      if (!ok) {
        await recordAudit({ action: 'login_failed', actorUsername: identifier, ip, meta: { attemptedRole: 'teacher' } });
        return genericError();
      }
      const session = {
        role: 'teacher',
        instituteId: String(doc._id),
        userId: teacher.id,
        username: teacher.username,
        name: teacher.name,
      };
      const res = NextResponse.json({
        ok: true,
        role: session.role,
        name: session.name,
        username: session.username,
        teacherId: teacher.id,
        mustChangePassword: !!teacher.mustChangePassword,
      });
      await setSessionCookie(res, session, { cookieName: SESSION_COOKIE_NAME });
      await recordAudit({ action: 'login_success', actorRole: 'teacher', actorUsername: identifier, instituteId: doc._id, ip });
      return res;
    }

    // ── 3. Student / Parent (by username, falling back to guardian phone) ─
    doc = await InstituteData.findOne({ 'students.username': identifier }).select('students');
    let student = doc ? doc.students.find((s) => s.username === identifier) : null;

    if (!student) {
      const digitsOnly = identifier.replace(/\D/g, '');
      if (digitsOnly.length >= 7) {
        // No index supports "digits-only phone match" directly, so this is
        // a bounded scan over institutes that have at least one guardian
        // phone set. Fine at the scale this app runs at; if the number of
        // institutes grows large, add a normalized/indexed phone field
        // instead (tracked alongside the Phase 3.2 schema-split follow-up).
        const candidates = await InstituteData.find({ 'students.guardianPhone': { $exists: true, $ne: '' } }).select(
          'students'
        );
        for (const cand of candidates) {
          const match = cand.students.find((s) => (s.guardianPhone || '').replace(/\D/g, '') === digitsOnly);
          if (match) {
            doc = cand;
            student = match;
            break;
          }
        }
      }
    }

    if (student) {
      const ok = await verifyPassword(password, student.password);
      if (!ok) {
        await recordAudit({ action: 'login_failed', actorUsername: identifier, ip, meta: { attemptedRole: 'parent' } });
        return genericError();
      }
      const session = {
        role: 'parent',
        instituteId: String(doc._id),
        userId: student.id,
        username: student.username,
        name: student.name,
      };
      const res = NextResponse.json({
        ok: true,
        role: session.role,
        name: session.name,
        username: session.username,
        studentId: student.id,
        mustChangePassword: !!student.mustChangePassword,
      });
      await setSessionCookie(res, session, { cookieName: SESSION_COOKIE_NAME });
      await recordAudit({ action: 'login_success', actorRole: 'parent', actorUsername: identifier, instituteId: doc._id, ip });
      return res;
    }

    await recordAudit({ action: 'login_failed', actorUsername: identifier, ip, meta: { attemptedRole: 'unknown' } });
    return genericError();
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ ok: false, error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
