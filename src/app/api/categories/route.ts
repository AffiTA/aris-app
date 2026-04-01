import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let query = 'SELECT * FROM categories';
  if (type) {
    query += ' WHERE type = ?';
    const categories = db.prepare(query).all(type);
    return NextResponse.json(categories);
  }

  const categories = db.prepare(query).all();
  return NextResponse.json(categories);
}
