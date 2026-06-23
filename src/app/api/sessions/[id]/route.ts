import { NextResponse } from 'next/server';
import { dbGet, dbAll } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await dbGet('SELECT * FROM billing_sessions WHERE id = ?', [id]);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const items = await dbAll('SELECT * FROM items_ledger WHERE session_id = ?', [id]);
    const chatLog = await dbAll('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC', [id]);
    
    return NextResponse.json({
      success: true,
      session,
      items,
      chatLog: chatLog.map((c: any) => ({
        role: c.sender_role,
        text: c.raw_transcript
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
