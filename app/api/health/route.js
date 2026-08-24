import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ ok: true, status: 'connected', message: 'MongoDB connected successfully.' });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { ok: false, status: 'error', error: error.message || 'Database connection failed' },
      { status: 500 }
    );
  }
}
