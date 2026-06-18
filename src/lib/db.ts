import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'billing.db');

// Ensure db directory structure exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database at:', dbPath);
  }
});

// Promise-based wrappers for sqlite3
export function dbRun(sql: string, params: any[] = []): Promise<{ id: string | number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

export function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

export function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

export async function initDb() {
  console.log('Initializing database schema...');
  
  await dbRun(`
    CREATE TABLE IF NOT EXISTS billing_sessions (
      id TEXT PRIMARY KEY,
      session_title TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  const addColumn = async (col: string) => {
    try {
      await dbRun(`ALTER TABLE billing_sessions ADD COLUMN ${col} TEXT`);
      console.log(`Column ${col} added to billing_sessions.`);
    } catch (err: any) {
      if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
        // Safe to ignore duplicate column
      } else {
        console.warn(`Could not add column ${col}:`, err.message);
      }
    }
  };

  await addColumn('customer_name');
  await addColumn('invoice_date');
  await addColumn('destination');
  await addColumn('dispatched_through');
  await addColumn('terms_of_delivery');
  await addColumn('consignee_name');
  await addColumn('consignee_address');
  await addColumn('consignee_gstin');
  await addColumn('buyer_address');
  await addColumn('buyer_gstin');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS items_ledger (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      item_name_en TEXT NOT NULL,
      item_name_kn TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY(session_id) REFERENCES billing_sessions(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      sender_role TEXT CHECK(sender_role IN ('user', 'assistant')),
      raw_transcript TEXT NOT NULL,
      created_at TEXT,
      FOREIGN KEY(session_id) REFERENCES billing_sessions(id) ON DELETE CASCADE
    )
  `);

  console.log('Database tables successfully verified/created.');
}
