'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

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

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];

function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatShort(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' Jt';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' Rb';
  return n.toString();
}

function getTx(): Transaction[] {
  if (typeof window === 'undefined') return [];
  const d = localStorage.getItem('aris_v2');
  return d ? JSON.parse(d) : [];
}

function saveTx(tx: Transaction[]) {
  localStorage.setItem('aris_v2', JSON.stringify(tx));
}

export default function App() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState<'home' | 'history'>('home');
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    setTx(getTx());
    setReady(true);
  }, []);

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const month = tx.filter(t => t.date.startsWith(monthStr));

  const income = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = month.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;

  const expByCat = CATEGORIES.filter(c => c.type === 'expense').map(c => ({
    name: c.name,
    icon: c.icon,
    value: month.filter(t => t.category === c.name).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daily = Array.from({ length: days }, (_, i) => {
    const d = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
    const dayTx = month.filter(t => t.date === d);
    return {
      day: String(i + 1),
      masuk: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      keluar: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  function addTx(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const t: Transaction = {
      id: Date.now(),
      type: modalType,
      category: fd.get('cat') as string,
      description: fd.get('desc') as string || '',
      amount: Number(fd.get('amount')),
      date: fd.get('date') as string,
    };
    const updated = [...tx, t];
    setTx(updated);
    saveTx(updated);
    setModal(false);
  }

  function removeTx(id: number) {
    const updated = tx.filter(t => t.id !== id);
    setTx(updated);
    saveTx(updated);
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Memuat ARIS...</p>
        </div>
      </div>
    );
  }

  const cats = CATEGORIES.filter(c => c.type === modalType);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        ::selection { background: #6366f120; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1e293b' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                <span style={{ fontSize: 18 }}>📊</span>
              </div>
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>ARIS</h1>
                <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Akuntansi Rapi Sistematis</p>
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{monthName}</span>
          </div>
        </header>

        <main style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px 100px' }}>

          {tab === 'home' ? (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              {/* Balance Card */}
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)', borderRadius: 20, padding: 24, color: 'white', marginBottom: 16, boxShadow: '0 8px 32px rgba(99,102,241,0.25)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <p style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, marginBottom: 4 }}>💰 Saldo Bulan Ini</p>
                <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>{formatRp(balance)}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>↑ MASUK</p>
                    <p style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{formatShort(income)}</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>↓ KELUAR</p>
                    <p style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{formatShort(expense)}</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>🎯 TABUNG</p>
                    <p style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{savingsRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <button onClick={() => { setModalType('income'); setModal(true); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 16 }}>＋</span> Pemasukan
                </button>
                <button onClick={() => { setModalType('expense'); setModal(true); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(239,68,68,0.3)', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 16 }}>－</span> Pengeluaran
                </button>
              </div>

              {/* Cashflow Chart */}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: '#6366f1', borderRadius: 2 }}></span>
                  ALIRAN KAS HARIAN
                </h3>
                {daily.some(d => d.masuk > 0 || d.keluar > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={daily}>
                      <defs>
                        <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatShort(Number(v))} width={40} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: 'white', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} formatter={(v) => formatRp(Number(v))} />
                      <Area type="monotone" dataKey="masuk" stroke="#10b981" strokeWidth={2} fill="url(#gIn)" name="Masuk" />
                      <Area type="monotone" dataKey="keluar" stroke="#ef4444" strokeWidth={2} fill="url(#gOut)" name="Keluar" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>📈</span>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>Belum ada data</p>
                    <p style={{ fontSize: 11, marginTop: 2 }}>Tambah transaksi pertamamu!</p>
                  </div>
                )}
              </div>

              {/* Expense Breakdown */}
              {expByCat.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>🍩 PENGELUARAN</h3>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={expByCat.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} strokeWidth={0}>
                          {expByCat.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, color: 'white', fontSize: 11 }} formatter={(v) => formatRp(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>📊 DETAIL</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {expByCat.slice(0, 5).map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{formatShort(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {tx.length > 0 && (
                <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>🕐 TRANSAKSI TERAKHIR</h3>
                    <button onClick={() => setTab('history')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>Lihat Semua</button>
                  </div>
                  {[...tx].reverse().slice(0, 5).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'income' ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          {CATEGORIES.find(c => c.name === t.category)?.icon || '📦'}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{t.category}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.description || t.date}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {t.type === 'income' ? '+' : '-'}{formatShort(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {tx.length === 0 && (
                <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>👋</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Selamat Datang di ARIS!</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>Mulai catat keuanganmu dengan klik tombol di atas</p>
                </div>
              )}
            </div>
          ) : (
            /* History Tab */
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setModalType('income'); setModal(true); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>＋ Pemasukan</button>
                <button onClick={() => { setModalType('expense'); setModal(true); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>－ Pengeluaran</button>
              </div>
              <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>📋 SEMUA TRANSAKSI ({tx.length})</h3>
                {tx.length > 0 ? [...tx].reverse().map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'income' ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {CATEGORIES.find(c => c.name === t.category)?.icon || '📦'}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{t.category}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.description || '-'} · {t.date}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>{t.type === 'income' ? '+' : '-'}{formatShort(t.amount)}</p>
                      <button onClick={() => removeTx(t.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, color: '#ef4444', fontWeight: 600 }}>✕</button>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: 30, color: '#cbd5e1' }}>
                    <span style={{ fontSize: 36 }}>📭</span>
                    <p style={{ marginTop: 8, fontSize: 13 }}>Belum ada transaksi</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '8px 20px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', zIndex: 40 }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-around' }}>
            <button onClick={() => setTab('home')} style={{ background: 'none', border: 'none', padding: '8px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 20, opacity: tab === 'home' ? 1 : 0.4 }}>🏠</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: tab === 'home' ? '#6366f1' : '#94a3b8' }}>Home</span>
            </button>
            <button onClick={() => setTab('history')} style={{ background: 'none', border: 'none', padding: '8px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 20, opacity: tab === 'history' ? 1 : 0.4 }}>📋</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: tab === 'history' ? '#6366f1' : '#94a3b8' }}>Riwayat</span>
            </button>
          </div>
        </nav>

        {/* Modal */}
        {modal && (
          <div onClick={(e) => e.target === e.currentTarget && setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s ease' }}>
              <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, textAlign: 'center' }}>
                {modalType === 'income' ? '📥 Tambah Pemasukan' : '📤 Tambah Pengeluaran'}
              </h2>
              <form onSubmit={addTx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>KATEGORI</label>
                  <select name="cat" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}>
                    {cats.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>JUMLAH (Rp)</label>
                  <input name="amount" type="number" required placeholder="15.000" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>TANGGAL</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>KETERANGAN</label>
                  <input name="desc" type="text" placeholder="Opsional" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setModal(false)} style={{ padding: 14, borderRadius: 14, background: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 14, color: '#64748b', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" style={{ padding: 14, borderRadius: 14, background: modalType === 'income' ? '#10b981' : '#ef4444', border: 'none', fontWeight: 700, fontSize: 14, color: 'white', cursor: 'pointer', boxShadow: `0 2px 8px ${modalType === 'income' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>💾 Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
