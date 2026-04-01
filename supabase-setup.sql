-- ARIS Database Tables
CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGINT PRIMARY KEY,
  date TEXT NOT NULL,
  ref TEXT NOT NULL,
  desc TEXT,
  debit JSONB NOT NULL DEFAULT '[]',
  credit JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('hutang', 'piutang')),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  due_date TEXT,
  desc TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
