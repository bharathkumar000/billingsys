import path from 'path';
import fs from 'fs';

let db: any = null;

export function getDb() {
  if (db) return db;

  // Lazily require sqlite3 to prevent native evaluation at build time
  const sqlite3 = require('sqlite3');

  let dbPath = path.join(process.cwd(), 'billing.db');

  // Vercel deployment: database filesystem is read-only, use /tmp/billing.db
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDbPath = path.join('/tmp', 'billing.db');
    
    // Copy the initial database seed if it exists and doesn't exist in /tmp yet
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        try {
          fs.copyFileSync(dbPath, tmpDbPath);
          console.log('Seeded SQLite database to /tmp/billing.db');
        } catch (err: any) {
          console.warn('Failed to seed SQLite database to /tmp:', err.message);
        }
      }
    }
    dbPath = tmpDbPath;
  }

  // Ensure db directory structure exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err: any) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
    }
  });

  return db;
}

// Promise-based wrappers for sqlite3
export function dbRun(sql: string, params: any[] = []): Promise<{ id: string | number }> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, params, function (this: any, err: any) {
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
    const database = getDb();
    database.get(sql, params, (err: any, row: any) => {
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
    const database = getDb();
    database.all(sql, params, (err: any, rows: any) => {
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
  await addColumn('consignee_phone');
  await addColumn('buyer_phone');

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
