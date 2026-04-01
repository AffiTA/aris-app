'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface Category {
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

const CATEGORIES: Category[] = [
  { name: 'Gaji', type: 'income', icon: '💰' },
  { name: 'Penjualan', type: 'income', icon: '🛒' },
  { name: 'Investasi', type: 'income', icon: '📈' },
  { name: 'Lainnya (Masuk)', type: 'income', icon: '📥' },
  { name: 'Makanan', type: 'expense', icon: '🍔' },
  { name: 'Transport', type: 'expense', icon: '🚗' },
  { name: 'Kebutuhan', type: 'expense', icon: '📱' },
  { name: 'Hiburan', type: 'expense', icon: '🎬' },
  { name: 'Pakaian', type: 'expense', icon: '👕' },
  { name: 'Kesehatan', type: 'expense', icon: '💊' },
  { name: 'Pendidikan', type: 'expense', icon: '📚' },
  { name: 'Rokok', type: 'expense', icon: '🚬' },
  { name: 'Tagihan', type: 'expense', icon: '📄' },
  { name: 'Lainnya (Keluar)', type: 'expense', icon: '📤' },
];

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'];

function fmt(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'rb';
  return num.toLocaleString('id-ID');
}

function fmtFull(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

function getTx(): Transaction[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem('aris_tx');
  return d ? JSON.parse(d) : [];
}

function saveTx(tx: Transaction[]) {
  localStorage.setItem('aris_tx', JSON.stringify(tx));
}

function getMonthDays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const result = [];
  for (let i = 1; i <= days; i++) {
    result.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
  }
  return result;
}

export default function ARISDashboard() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [animateIn, setAnimateIn] = useState(false);

  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    setTx(getTx());
    setLoading(false);
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  const monthly = tx.filter(t => t.date.startsWith(month));
  const income = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income * 100) : 0;

  const expenseCat = CATEGORIES.filter(c => c.type === 'expense').map(c => ({
    name: c.name,
    icon: c.icon,
    value: monthly.filter(t => t.category === c.name && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const incomeCat = CATEGORIES.filter(c => c.type === 'income').map(c => ({
    name: c.name,
    icon: c.icon,
    value: monthly.filter(t => t.category === c.name && t.type === 'income').reduce((s, t) => s + t.amount, 0)
  })).filter(c => c.value > 0);

  const allDays = getMonthDays();
  const dailyData = allDays.map(d => {
    const dayTx = monthly.filter(t => t.date === d);
    return {
      date: d.slice(-2),
      income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const topExpense = expenseCat.slice(0, 5);

  const cats = CATEGORIES.filter(c => c.type === formType);

  function openForm(type: 'income' | 'expense') {
    setFormType(type);
    setShowForm(true);
  }

  function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newTx: Transaction = {
      id: Date.now(),
      type: formType,
      category: fd.get('category') as string,
      description: fd.get('description') as string || '',
      amount: Number(fd.get('amount')),
      date: fd.get('date') as string,
    };
    const updated = [...tx, newTx];
    setTx(updated);
    saveTx(updated);
    setShowForm(false);
  }

  function deleteTx(id: number) {
    const updated = tx.filter(t => t.id !== id);
    setTx(updated);
    saveTx(updated);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3em', animation: 'pulse 1.5s infinite' }}>📊</div>
          <p style={{ color: '#888', marginTop: '10px', fontSize: '0.9em' }}>Memuat ARIS...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes countUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; backdrop-filter: blur(20px); transition: all 0.3s ease; }
        .card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .btn { border: none; border-radius: 14px; padding: 14px 20px; font-size: 0.9em; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn:hover { transform: translateY(-2px); }
        .btn-income { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
        .btn-income:hover { box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
        .btn-expense { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; box-shadow: 0 4px 15px rgba(239,68,68,0.3); }
        .btn-expense:hover { box-shadow: 0 6px 20px rgba(239,68,68,0.4); }
        .tx-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(0,0,0,0.2); border-radius: 14px; margin-bottom: 8px; transition: all 0.2s ease; }
        .tx-row:hover { background: rgba(0,0,0,0.3); }
        .tab { padding: 10px 20px; border-radius: 12px; font-size: 0.85em; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; }
        .tab-active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
        .tab-inactive { background: rgba(255,255,255,0.05); color: #888; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 50; animation: fadeIn 0.2s ease; }
        .modal { background: linear-gradient(135deg, #1e1e3f, #16213e); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; width: 100%; max-width: 420px; animation: slideUp 0.3s ease; }
        input, select { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 16px; color: white; font-size: 0.95em; outline: none; transition: all 0.2s ease; }
        input:focus, select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        input::placeholder { color: #555; }
        .kpi-value { font-size: 1.8em; font-weight: 800; letter-spacing: -1px; }
        .gradient-text { background: linear-gradient(135deg, #6366f1, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-green { text-shadow: 0 0 20px rgba(16,185,129,0.5); }
        .glow-red { text-shadow: 0 0 20px rgba(239,68,68,0.5); }
        .progress-bar { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', animation: 'slideUp 0.5s ease' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>📊</div>
              <div>
                <h1 style={{ fontSize: '1.5em', fontWeight: 800 }} className="gradient-text">ARIS</h1>
                <p style={{ fontSize: '0.7em', color: '#666', marginTop: '-2px' }}>Akuntansi Rapi Sistematis</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveTab('dashboard')} className={`tab ${activeTab === 'dashboard' ? 'tab-active' : 'tab-inactive'}`}>📊 Dashboard</button>
            <button onClick={() => setActiveTab('transactions')} className={`tab ${activeTab === 'transactions' ? 'tab-active' : 'tab-inactive'}`}>📋 Riwayat</button>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div style={{ animation: 'slideUp 0.5s ease' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7em', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>📥 Pemasukan</p>
                <p className="kpi-value" style={{ color: '#10b981' }}>{fmt(income)}</p>
                <p style={{ fontSize: '0.7em', color: '#10b981', marginTop: '4px' }}>{fmtFull(income)}</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7em', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>📤 Pengeluaran</p>
                <p className="kpi-value" style={{ color: '#ef4444' }}>{fmt(expense)}</p>
                <p style={{ fontSize: '0.7em', color: '#ef4444', marginTop: '4px' }}>{fmtFull(expense)}</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7em', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>💰 Saldo</p>
                <p className="kpi-value" style={{ color: balance >= 0 ? '#6366f1' : '#ef4444' }}>{fmt(balance)}</p>
                <p style={{ fontSize: '0.7em', color: balance >= 0 ? '#6366f1' : '#ef4444', marginTop: '4px' }}>
                  {savingsRate.toFixed(0)}% tabungan
                </p>
              </div>
            </div>

            {/* Savings Progress */}
            {income > 0 && (
              <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8em', color: '#888' }}>🎯 Target Tabungan</span>
                  <span style={{ fontSize: '0.8em', fontWeight: 600, color: savingsRate >= 20 ? '#10b981' : '#f59e0b' }}>
                    {savingsRate.toFixed(1)}% {savingsRate >= 20 ? '✅' : '⚠️'}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(savingsRate, 100)}%`, background: savingsRate >= 20 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
                </div>
                <p style={{ fontSize: '0.7em', color: '#555', marginTop: '6px' }}>Target: 20% dari penghasilan</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => openForm('income')} className="btn btn-income">➕ Pemasukan</button>
              <button onClick={() => openForm('expense')} className="btn btn-expense">➖ Pengeluaran</button>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {/* Area Chart */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px', fontWeight: 600 }}>📈 Aliran Kas Harian</h3>
                {dailyData.some(d => d.income > 0 || d.expense > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                      <Tooltip contentStyle={{ background: '#1e1e3f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.8em' }} formatter={(v) => fmtFull(Number(v))} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="Masuk" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Keluar" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '2em', marginBottom: '10px' }}>📊</span>
                    <p style={{ color: '#555', fontSize: '0.85em' }}>Tambah transaksi pertama!</p>
                  </div>
                )}
              </div>

              {/* Donut Chart */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px', fontWeight: 600 }}>🍩 Pengeluaran</h3>
                {expenseCat.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} style={{ fontSize: '0.7em' }}>
                        {expenseCat.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e1e3f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.8em' }} formatter={(v) => fmtFull(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '2em', marginBottom: '10px' }}>🍩</span>
                    <p style={{ color: '#555', fontSize: '0.85em' }}>Belum ada data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Expenses */}
            {topExpense.length > 0 && (
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px', fontWeight: 600 }}>🔥 Top Pengeluaran</h3>
                {topExpense.map((item, i) => {
                  const pct = expense > 0 ? (item.value / expense * 100) : 0;
                  return (
                    <div key={i} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.85em', color: '#ccc' }}>{item.icon} {item.name}</span>
                        <span style={{ fontSize: '0.85em', fontWeight: 600 }}>{fmtFull(item.value)} <span style={{ color: '#666', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i] }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Transactions Preview */}
            {tx.length > 0 && (
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.85em', color: '#888', fontWeight: 600 }}>🕐 Transaksi Terakhir</h3>
                  <button onClick={() => setActiveTab('transactions')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8em', cursor: 'pointer', fontWeight: 600 }}>Lihat semua →</button>
                </div>
                {[...tx].reverse().slice(0, 5).map((t) => (
                  <div key={t.id} className="tx-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.type === 'income' ? '#10b981' : '#ef4444', boxShadow: t.type === 'income' ? '0 0 10px #10b981' : '0 0 10px #ef4444' }}></div>
                      <div>
                        <p style={{ fontSize: '0.85em', fontWeight: 600 }}>{t.category}</p>
                        <p style={{ fontSize: '0.7em', color: '#666' }}>{t.description || t.date}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444', fontSize: '0.9em' }}>
                      {t.type === 'income' ? '+' : '-'}{fmtFull(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Transactions Tab */
          <div style={{ animation: 'slideUp 0.5s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => openForm('income')} className="btn btn-income">➕ Pemasukan</button>
              <button onClick={() => openForm('expense')} className="btn btn-expense">➖ Pengeluaran</button>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.85em', color: '#888', marginBottom: '16px', fontWeight: 600 }}>
                📋 Semua Transaksi ({tx.length})
              </h3>
              {tx.length > 0 ? (
                [...tx].reverse().map((t) => (
                  <div key={t.id} className="tx-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.type === 'income' ? '#10b981' : '#ef4444' }}></div>
                      <div>
                        <p style={{ fontSize: '0.85em', fontWeight: 600 }}>{t.category}</p>
                        <p style={{ fontSize: '0.7em', color: '#666' }}>{t.description || '-'} · {t.date}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444', fontSize: '0.9em' }}>
                        {t.type === 'income' ? '+' : '-'}{fmtFull(t.amount)}
                      </span>
                      <button onClick={() => deleteTx(t.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75em' }}>✕</button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <span style={{ fontSize: '3em' }}>📭</span>
                  <p style={{ color: '#555', marginTop: '10px' }}>Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#333', fontSize: '0.7em', marginTop: '30px', paddingBottom: '20px' }}>
          <span className="gradient-text" style={{ fontWeight: 700 }}>ARIS</span> — Akuntansi Rapi Sistematis © 2026
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2 style={{ fontSize: '1.2em', fontWeight: 700, marginBottom: '20px' }}>
              {formType === 'income' ? '📥 Tambah Pemasukan' : '📤 Tambah Pengeluaran'}
            </h2>
            <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600 }}>KATEGORI</label>
                <select name="category" required>
                  {cats.map((c) => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600 }}>JUMLAH (Rp)</label>
                <input name="amount" type="number" required placeholder="15000" />
              </div>
              <div>
                <label style={{ fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600 }}>TANGGAL</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75em', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 600 }}>KETERANGAN</label>
                <input name="description" type="text" placeholder="Opsional" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontWeight: 600, cursor: 'pointer', fontSize: '0.9em' }}>Batal</button>
                <button type="submit" className={`btn ${formType === 'income' ? 'btn-income' : 'btn-expense'}`} style={{ width: '100%' }}>💾 Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
