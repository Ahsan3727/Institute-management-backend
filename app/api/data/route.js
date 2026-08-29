import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import InstituteData from '@/models/InstituteData';
import seedData, { emptyData } from '@/state/seedData';

export const dynamic = 'force-dynamic';

function sanitizeDocument(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  delete obj.identifier;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
}

export async function GET() {
  try {
    await connectToDatabase();
    let record = await InstituteData.findOne({ identifier: 'primary_institute' });

    if (!record) {
      const initial = emptyData();
      record = await InstituteData.create({
        identifier: 'primary_institute',
        ...initial,
      });
      return NextResponse.json({ ok: true, data: initial, source: 'mongodb_initialized' });
    }

    const data = sanitizeDocument(record);
    return NextResponse.json({ ok: true, data, source: 'mongodb' });
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Database fetch failed' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const payload = body.data || body;

    if (!payload || !payload.students || !payload.teachers) {
      return NextResponse.json({ ok: false, error: 'Invalid institute dataset payload' }, { status: 400 });
    }

    const updated = await InstituteData.findOneAndUpdate(
      { identifier: 'primary_institute' },
      {
        $set: {
          admin: payload.admin,
          teachers: payload.teachers || [],
          classes: payload.classes || [],
          subjects: payload.subjects || [],
          students: payload.students || [],
          slos: payload.slos || [],
          dailyLog: payload.dailyLog || [],
          attendance: payload.attendance || [],
          tests: payload.tests || [],
          feePayments: payload.feePayments || [],
          feeSubmissions: payload.feeSubmissions || [],
          salaryPayments: payload.salaryPayments || [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true, data: sanitizeDocument(updated), source: 'mongodb_updated' });
  } catch (error) {
    console.error('Error updating data in MongoDB:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Database update failed' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'reset_demo';

    let newData;
    if (action === 'clear_all') {
      newData = emptyData();
    } else {
      newData = seedData();
    }

    const updated = await InstituteData.findOneAndUpdate(
      { identifier: 'primary_institute' },
      {
        $set: {
          admin: newData.admin,
          teachers: newData.teachers || [],
          classes: newData.classes || [],
          subjects: newData.subjects || [],
          students: newData.students || [],
          slos: newData.slos || [],
          dailyLog: newData.dailyLog || [],
          attendance: newData.attendance || [],
          tests: newData.tests || [],
          feePayments: newData.feePayments || [],
          feeSubmissions: newData.feeSubmissions || [],
          salaryPayments: newData.salaryPayments || [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true, data: sanitizeDocument(updated), message: 'Database reset successfully.' });
  } catch (error) {
    console.error('Error resetting MongoDB data:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Database reset failed' },
      { status: 500 }
    );
  }
}
