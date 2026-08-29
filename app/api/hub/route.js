import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import HubAccount from '@/models/HubAccount';
import InstituteData from '@/models/InstituteData';

export const dynamic = 'force-dynamic';

// Hard-coded Hub Super-Admin credentials (kept server-side only)
const HUB_USERNAME = 'Ahsan3727';
const HUB_PASSWORD = 'Ahsan3727';

function authHeader(req) {
  const auth = req.headers.get('x-hub-auth') || '';
  const [user, pass] = Buffer.from(auth, 'base64').toString().split(':');
  return user === HUB_USERNAME && pass === HUB_PASSWORD;
}

// POST /api/hub  — either login-check OR create account
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── Login verification ───────────────────────────────────────
    if (action === 'login') {
      const { username, password } = body;
      if (username === HUB_USERNAME && password === HUB_PASSWORD) {
        return NextResponse.json({ ok: true, message: 'Hub authenticated.' });
      }
      return NextResponse.json({ ok: false, error: 'Invalid hub credentials.' }, { status: 401 });
    }

    // ── Create principal account ─────────────────────────────────
    if (action === 'create') {
      if (!authHeader(req)) {
        return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
      }
      const { instituteName, principalName, username, password, notes } = body;
      if (!instituteName || !principalName || !username || !password) {
        return NextResponse.json({ ok: false, error: 'All fields are required.' }, { status: 400 });
      }

      const existing = await HubAccount.findOne({ username: username.toLowerCase() });
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Username already exists.' }, { status: 409 });
      }

      const account = await HubAccount.create({
        instituteName,
        principalName,
        username: username.toLowerCase(),
        password,
        notes: notes || '',
      });

      // Also update the primary institute admin credentials
      // (for now, single-institute mode: updates the main admin account)
      await InstituteData.findOneAndUpdate(
        { identifier: 'primary_institute' },
        {
          $set: {
            'admin.username': username.toLowerCase(),
            'admin.password': password,
            'admin.name': principalName,
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        ok: true,
        account: {
          id: account._id,
          instituteName: account.instituteName,
          principalName: account.principalName,
          username: account.username,
          notes: account.notes,
          isActive: account.isActive,
          createdAt: account.createdAt,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Hub API error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// GET /api/hub — list all principal accounts
export async function GET(req) {
  try {
    if (!authHeader(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
    }
    await connectToDatabase();
    const accounts = await HubAccount.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      ok: true,
      accounts: accounts.map((a) => ({
        id: a._id,
        instituteName: a.instituteName,
        principalName: a.principalName,
        username: a.username,
        notes: a.notes,
        isActive: a.isActive,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Hub GET error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/hub — delete a principal account by id
export async function DELETE(req) {
  try {
    if (!authHeader(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await req.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Account ID required.' }, { status: 400 });
    }
    await HubAccount.findByIdAndDelete(id);
    return NextResponse.json({ ok: true, message: 'Account deleted.' });
  } catch (error) {
    console.error('Hub DELETE error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
