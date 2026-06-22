import { NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { 
      items = [], 
      chatLog = [], 
      title,
      customerName,
      invoiceDate,
      destination,
      dispatchedThrough,
      termsOfDelivery,
      consigneeName,
      consigneeAddress,
      consigneeGstin,
      buyerAddress,
      buyerGstin
    } = body;
    const isoDate = new Date().toISOString();

    const session = await dbGet<any>('SELECT * FROM billing_sessions WHERE id = ?', [id]);
    if (!session) {
      await dbRun(
        `INSERT INTO billing_sessions (
          id, session_title, created_at, updated_at, 
          customer_name, invoice_date, destination, dispatched_through, terms_of_delivery,
          consignee_name, consignee_address, consignee_gstin, buyer_address, buyer_gstin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, title || 'Voice Session', isoDate, isoDate,
          customerName || '', invoiceDate || '', destination || '', dispatchedThrough || '', termsOfDelivery || '',
          consigneeName || '', consigneeAddress || '', consigneeGstin || '', buyerAddress || '', buyerGstin || ''
        ]
      );
    } else {
      await dbRun(
        `UPDATE billing_sessions SET 
          session_title = ?, 
          updated_at = ?,
          customer_name = ?,
          invoice_date = ?,
          destination = ?,
          dispatched_through = ?,
          terms_of_delivery = ?,
          consignee_name = ?,
          consignee_address = ?,
          consignee_gstin = ?,
          buyer_address = ?,
          buyer_gstin = ?
         WHERE id = ?`,
        [
          title || session.session_title, 
          isoDate,
          customerName !== undefined ? customerName : session.customer_name,
          invoiceDate !== undefined ? invoiceDate : session.invoice_date,
          destination !== undefined ? destination : session.destination,
          dispatchedThrough !== undefined ? dispatchedThrough : session.dispatched_through,
          termsOfDelivery !== undefined ? termsOfDelivery : session.terms_of_delivery,
          consigneeName !== undefined ? consigneeName : session.consignee_name,
          consigneeAddress !== undefined ? consigneeAddress : session.consignee_address,
          consigneeGstin !== undefined ? consigneeGstin : session.consignee_gstin,
          buyerAddress !== undefined ? buyerAddress : session.buyer_address,
          buyerGstin !== undefined ? buyerGstin : session.buyer_gstin,
          id
        ]
      );
    }

    await dbRun('DELETE FROM items_ledger WHERE session_id = ?', [id]);
    for (const item of items) {
      const itemId = 'item_' + Math.floor(100000 + Math.random() * 900000);
      await dbRun(
        `INSERT INTO items_ledger (id, session_id, item_name_en, item_name_kn, quantity, unit, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
          item.item_name_en,
          item.item_name_kn,
          item.quantity,
          item.unit,
          item.unit_price,
          item.quantity * item.unit_price
        ]
      );
    }

    await dbRun('DELETE FROM chat_history WHERE session_id = ?', [id]);
    for (const chat of chatLog) {
      const chatId = 'chat_' + Math.floor(100000 + Math.random() * 900000);
      const chatTime = chat.created_at || new Date().toISOString();
      await dbRun(
        'INSERT INTO chat_history (id, session_id, sender_role, raw_transcript, created_at) VALUES (?, ?, ?, ?, ?)',
        [chatId, id, chat.role, chat.text, chatTime]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
