'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardData {
  month: string;
  summary: {
    income: number;
    expense: number;
    balance: number;
    hutang: number;
    piutang: number;
  };
  expenseByCategory: { category: string; total: number }[];
  incomeByCategory: { category: string; total: number }[];
  dailyData: { date: string; income: number; expense: number }[];
  recentTransactions: { id: number; type: string; category: string; description: string; amount: number; date: string }[];
}

const COLORS = ['#667eea', '#00d4aa', '#ffd93d', '#ff6b6b', '#45b7d1', '#96ceb4', '#ff9ff3', '#54a0ff', '#f39c12', '#e74c3c'];

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<{ id: number; name: string; type: string; icon: string }[]>([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const res = await fetch(`/api/dashboard?month=${currentMonth}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function openForm(type: 'income' | 'expense') {
    setFormType(type);
    const res = await fetch(`/api/categories?type=${type}`);
    const cats = await res.json();
    setCategories(cats);
    setShowForm(true);
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: formType,
        category: formData.get('category'),
        description: formData.get('description'),
        amount: Number(formData.get('amount')),
        date: formData.get('date'),
      }),
    });
    setShowForm(false);
    fetchDashboard();
  }

  async function deleteTransaction(id: number) {
    if (confirm('Hapus transaksi ini?')) {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      fetchDashboard();
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-gray-400">Loading ARIS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-400 bg-clip-text text-transparent">
              📊 ARIS
            </h1>
            <p className="text-gray-500 text-sm">Akuntansi Rapi Sistematis</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pemasukan</p>
            <p className="text-xl font-bold text-green-400 mt-1">{formatRupiah(data.summary.income)}</p>
          </div>
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pengeluaran</p>
            <p className="text-xl font-bold text-red-400 mt-1">{formatRupiah(data.summary.expense)}</p>
          </div>
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo</p>
            <p className={`text-xl font-bold mt-1 ${data.summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatRupiah(data.summary.balance)}
            </p>
          </div>
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Hutang</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{formatRupiah(data.summary.hutang)}</p>
          </div>
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Piutang</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{formatRupiah(data.summary.piutang)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => openForm('income')} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl py-3 font-medium transition">
            ➕ Pemasukan
          </button>
          <button onClick={() => openForm('expense')} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl py-3 font-medium transition">
            ➖ Pengeluaran
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Daily Chart */}
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-4">📈 Grafik Harian</h3>
            {data.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.dailyData}>
                  <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v) => v.slice(-2)} />
                  <YAxis tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: '#1e1e3f', border: 'none', borderRadius: 8 }} formatter={(v) => formatRupiah(Number(v))} />
                  <Bar dataKey="income" fill="#00d4aa" radius={[4, 4, 0, 0]} name="Masuk" />
                  <Bar dataKey="expense" fill="#ff6b6b" radius={[4, 4, 0, 0]} name="Keluar" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-center py-10">Belum ada data</p>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-4">🍩 Pengeluaran per Kategori</h3>
            {data.expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.expenseByCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {data.expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e1e3f', border: 'none', borderRadius: 8 }} formatter={(v) => formatRupiah(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-center py-10">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#12122a] border border-[#1e1e3f] rounded-xl p-4">
          <h3 className="text-sm text-gray-400 mb-4">📋 Transaksi Terakhir</h3>
          {data.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-[#0f0f23] rounded-lg hover:bg-[#151530] transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    <div>
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-xs text-gray-500">{t.description || t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-6">Belum ada transaksi. Klik tombol di atas untuk mulai!</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-700 text-xs mt-6 pb-4">
          ARIS — Akuntansi Rapi Sistematis © 2026
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12122a] border border-[#1e1e3f] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {formType === 'income' ? '📥 Tambah Pemasukan' : '📤 Tambah Pengeluaran'}
            </h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Kategori</label>
                <select name="category" required className="w-full bg-[#0f0f23] border border-[#1e1e3f] rounded-lg p-3 text-white">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Jumlah (Rp)</label>
                <input name="amount" type="number" required placeholder="15000" className="w-full bg-[#0f0f23] border border-[#1e1e3f] rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tanggal</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[#0f0f23] border border-[#1e1e3f] rounded-lg p-3 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Keterangan (opsional)</label>
                <input name="description" type="text" placeholder="Beli nasi goreng" className="w-full bg-[#0f0f23] border border-[#1e1e3f] rounded-lg p-3 text-white" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-3 transition">Batal</button>
                <button type="submit" className={`flex-1 rounded-lg py-3 font-medium transition ${formType === 'income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
