import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  // Total income
  const income = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?"
  ).get(month) as { total: number };

  // Total expense
  const expense = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?"
  ).get(month) as { total: number };

  // Expense by category
  const expenseByCategory = db.prepare(
    "SELECT category, SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC"
  ).all(month);

  // Income by category
  const incomeByCategory = db.prepare(
    "SELECT category, SUM(amount) as total FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC"
  ).all(month);

  // Daily transactions for chart
  const dailyData = db.prepare(
    `SELECT date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    WHERE strftime('%Y-%m', date) = ?
    GROUP BY date ORDER BY date`
  ).all(month);

  // Total debts
  const totalHutang = db.prepare(
    "SELECT COALESCE(SUM(amount - paid), 0) as total FROM debts WHERE type = 'hutang' AND status = 'active'"
  ).get() as { total: number };

  const totalPiutang = db.prepare(
    "SELECT COALESCE(SUM(amount - paid), 0) as total FROM debts WHERE type = 'piutang' AND status = 'active'"
  ).get() as { total: number };

  // Recent transactions
  const recentTransactions = db.prepare(
    "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10"
  ).all();

  return NextResponse.json({
    month,
    summary: {
      income: income.total,
      expense: expense.total,
      balance: income.total - expense.total,
      hutang: totalHutang.total,
      piutang: totalPiutang.total,
    },
    expenseByCategory,
    incomeByCategory,
    dailyData,
    recentTransactions,
  });
}
