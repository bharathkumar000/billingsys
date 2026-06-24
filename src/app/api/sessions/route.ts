import { NextResponse } from 'next/server';
import { initDb, dbAll, dbRun } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureDb();
    const rows = await dbAll('SELECT * FROM billing_sessions ORDER BY updated_at DESC');
    return NextResponse.json({ success: true, sessions: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json();
    const { id, title } = body;
    const now = new Date().toISOString();
    
    await dbRun(
      'INSERT INTO billing_sessions (id, session_title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [id, title, now, now]
    );
    
    return NextResponse.json({ success: true, session: { id, session_title: title } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
