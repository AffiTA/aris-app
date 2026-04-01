import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'aris.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT DEFAULT '📦'
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('hutang', 'piutang')),
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    paid REAL DEFAULT 0,
    due_date TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paid')),
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Insert default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)');
  const defaultCategories = [
    ['Gaji', 'income', '💰'],
    ['Penjualan', 'income', '🛒'],
    ['Investasi', 'income', '📈'],
    ['Lainnya (Masuk)', 'income', '📥'],
    ['Makanan', 'expense', '🍔'],
    ['Transport', 'expense', '🚗'],
    ['Kebutuhan', 'expense', '📱'],
    ['Hiburan', 'expense', '🎬'],
    ['Pakaian', 'expense', '👕'],
    ['Kesehatan', 'expense', '💊'],
    ['Pendidikan', 'expense', '📚'],
    ['Rokok', 'expense', '🚬'],
    ['Tagihan', 'expense', '📄'],
    ['Lainnya (Keluar)', 'expense', '📤'],
  ];
  const insertMany = db.transaction((cats: string[][]) => {
    for (const cat of cats) {
      insertCat.run(...cat);
    }
  });
  insertMany(defaultCategories);
}

export default db;
