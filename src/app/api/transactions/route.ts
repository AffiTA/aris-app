import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const type = searchParams.get('type');

  let query = 'SELECT * FROM transactions';
  const params: string[] = [];
  const conditions: string[] = [];

  if (month) {
    conditions.push("strftime('%Y-%m', date) = ?");
    params.push(month);
  }

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const transactions = db.prepare(query).all(...params);
  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, category, description, amount, date } = body;

  if (!type || !category || !amount || !date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO transactions (type, category, description, amount, date) VALUES (?, ?, ?, ?, ?)'
  ).run(type, category, description || '', amount, date);

  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
