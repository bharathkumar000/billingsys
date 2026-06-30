"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.dbRun = dbRun;
exports.dbGet = dbGet;
exports.dbAll = dbAll;
exports.initDb = initDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(__dirname, '..', 'billing.db');
// Ensure db directory structure exists
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    }
    else {
        console.log('Connected to local SQLite database at:', dbPath);
    }
});
// Promise-based wrappers for sqlite3
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ id: this.lastID });
            }
        });
    });
}
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(row);
            }
        });
    });
}
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}
async function initDb() {
    console.log('Initializing database schema...');
    await dbRun(`
    CREATE TABLE IF NOT EXISTS billing_sessions (
      id TEXT PRIMARY KEY,
      session_title TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);
    const addColumn = async (col) => {
        try {
            await dbRun(`ALTER TABLE billing_sessions ADD COLUMN ${col} TEXT`);
            console.log(`Column ${col} added to billing_sessions.`);
        }
        catch (err) {
            if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
                // Safe to ignore duplicate column
            }
            else {
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
