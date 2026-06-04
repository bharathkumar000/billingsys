import { NextResponse } from 'next/server';
import { initDb, dbAll, dbRun, dbGet } from '@/lib/db';

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
    const rows = await dbAll(`
      SELECT s.*, COALESCE(SUM(i.total_price), 0) AS grand_total 
      FROM billing_sessions s 
      LEFT JOIN items_ledger i ON s.id = i.session_id 
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `);
    return NextResponse.json({ success: true, sessions: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json();
    const { id } = body;
    let { title } = body;
    const now = new Date().toISOString();
    
    if (!title) {
      const todayStr = now.split('T')[0]; // "2026-06-04"
      const countRow = await dbGet<{ count: number }>(
        "SELECT COUNT(*) as count FROM billing_sessions WHERE created_at LIKE ?",
        [`${todayStr}%`]
      );
      const seq = (countRow?.count || 0) + 1;
      const seqStr = String(seq).padStart(4, '0');
      const formattedDate = todayStr.replace(/-/g, '');
      title = `INV-${formattedDate}-${seqStr}`;
    }
    
    await dbRun(
      'INSERT INTO billing_sessions (id, session_title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [id, title, now, now]
    );
    
    return NextResponse.json({ success: true, session: { id, session_title: title } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
