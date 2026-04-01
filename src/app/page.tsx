'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Types
interface Account { id: string; code: string; name: string; type: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'; }
interface JournalEntry { id: number; date: string; ref: string; desc: string; debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[]; }

// Default Chart of Accounts
const DEFAULT_COA: Account[] = [
  { id: '1-101', code: '101', name: 'Kas', type: 'aset' },
  { id: '1-102', code: '102', name: 'Bank', type: 'aset' },
  { id: '1-103', code: '103', name: 'Piutang Usaha', type: 'aset' },
  { id: '1-104', code: '104', name: 'Persediaan', type: 'aset' },
  { id: '1-105', code: '105', name: 'Peralatan', type: 'aset' },
  { id: '1-106', code: '106', name: 'Kendaraan', type: 'aset' },
  { id: '1-107', code: '107', name: 'Gedung', type: 'aset' },
  { id: '2-201', code: '201', name: 'Hutang Usaha', type: 'kewajiban' },
  { id: '2-202', code: '202', name: 'Hutang Bank', type: 'kewajiban' },
  { id: '2-203', code: '203', name: 'Hutang Pajak', type: 'kewajiban' },
  { id: '3-301', code: '301', name: 'Modal', type: 'modal' },
  { id: '3-302', code: '302', name: 'Prive', type: 'modal' },
  { id: '3-303', code: '303', name: 'Laba Ditahan', type: 'modal' },
  { id: '4-401', code: '401', name: 'Pendapatan Jasa', type: 'pendapatan' },
  { id: '4-402', code: '402', name: 'Pendapatan Penjualan', type: 'pendapatan' },
  { id: '4-403', code: '403', name: 'Pendapatan Bunga', type: 'pendapatan' },
  { id: '5-501', code: '501', name: 'Beban Gaji', type: 'beban' },
  { id: '5-502', code: '502', name: 'Beban Sewa', type: 'beban' },
  { id: '5-503', code: '503', name: 'Beban Listrik', type: 'beban' },
  { id: '5-504', code: '504', name: 'Beban Transport', type: 'beban' },
  { id: '5-505', code: '505', name: 'Beban ATK', type: 'beban' },
  { id: '5-506', code: '506', name: 'Beban Internet', type: 'beban' },
  { id: '5-507', code: '507', name: 'HPP', type: 'beban' },
  { id: '5-508', code: '508', name: 'Beban Lain-lain', type: 'beban' },
];

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];
const TYPE_COLORS: Record<string, string> = { aset: '#3b82f6', kewajiban: '#ef4444', modal: '#8b5cf6', pendapatan: '#10b981', beban: '#f59e0b' };

function rp(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
function short(n: number) { if (n >= 1e6) return (n / 1e6).toFixed(1) + ' Jt'; if (n >= 1e3) return (n / 1e3).toFixed(0) + ' Rb'; return n.toString(); }
function load<T>(k: string, d: T): T { if (typeof window === 'undefined') return d; const v = localStorage.getItem('aris_' + k); return v ? JSON.parse(v) : d; }
function save(k: string, v: unknown) { localStorage.setItem('aris_' + k, JSON.stringify(v)); }

type Tab = 'dashboard' | 'journal' | 'ledger' | 'report' | 'coa';

export default function App() {
  const [coa, setCoa] = useState<Account[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(false);
  const [jLines, setJLines] = useState<{ account: string; debit: string; credit: string }[]>([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
  const [jDate, setJDate] = useState(new Date().toISOString().slice(0, 10));
  const [jDesc, setJDesc] = useState('');
  const [ledgerAcc, setLedgerAcc] = useState('');

  useEffect(() => {
    let c = load<Account[]>('coa', []);
    if (c.length === 0) { c = DEFAULT_COA; save('coa', c); }
    setCoa(c);
    setJournal(load<JournalEntry[]>('journal', []));
    setReady(true);
  }, []);

  function saveJournal(j: JournalEntry[]) { setJournal(j); save('journal', j); }
  function nextRef() { return `JU-${String(journal.length + 1).padStart(4, '0')}`; }

  function addJournalEntry(e: React.FormEvent) {
    e.preventDefault();
    const debit = jLines.filter(l => l.account && l.debit).map(l => ({ account: l.account, amount: Number(l.debit) }));
    const credit = jLines.filter(l => l.account && l.credit).map(l => ({ account: l.account, amount: Number(l.credit) }));
    const totalD = debit.reduce((s, l) => s + l.amount, 0);
    const totalC = credit.reduce((s, l) => s + l.amount, 0);
    if (totalD !== totalC) { alert(`Debit (${rp(totalD)}) harus sama dengan Kredit (${rp(totalC)})!`); return; }
    if (totalD === 0) { alert('Isi minimal 1 debit dan 1 kredit!'); return; }
    const entry: JournalEntry = { id: Date.now(), date: jDate, ref: nextRef(), desc: jDesc, debit, credit };
    saveJournal([...journal, entry]);
    setModal(false);
    setJLines([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
    setJDesc('');
  }

  function addLine() { setJLines([...jLines, { account: '', debit: '', credit: '' }]); }
  function removeLine(i: number) { if (jLines.length > 2) setJLines(jLines.filter((_, idx) => idx !== i)); }

  // Calculations
  function getBalance(accName: string) {
    let bal = 0;
    journal.forEach(e => {
      e.debit.forEach(d => { if (d.account === accName) bal += d.amount; });
      e.credit.forEach(c => { if (c.account === accName) bal -= c.amount; });
    });
    return bal;
  }

  function getAccountEntries(accName: string) {
    const entries: { date: string; ref: string; desc: string; debit: number; credit: number }[] = [];
    journal.forEach(e => {
      let d = 0, c = 0;
      e.debit.forEach(x => { if (x.account === accName) d += x.amount; });
      e.credit.forEach(x => { if (x.account === accName) c += x.amount; });
      if (d > 0 || c > 0) entries.push({ date: e.date, ref: e.ref, desc: e.desc, debit: d, credit: c });
    });
    return entries;
  }

  // Income Statement
  const pendapatan = coa.filter(a => a.type === 'pendapatan').map(a => ({ ...a, balance: getBalance(a.name) })).filter(a => a.balance !== 0);
  const beban = coa.filter(a => a.type === 'beban').map(a => ({ ...a, balance: getBalance(a.name) })).filter(a => a.balance !== 0);
  const totalPendapatan = pendapatan.reduce((s, a) => s + a.balance, 0);
  const totalBeban = beban.reduce((s, a) => s + a.balance, 0);
  const labaBersih = totalPendapatan - totalBeban;

  // Balance Sheet
  const aset = coa.filter(a => a.type === 'aset').map(a => ({ ...a, balance: getBalance(a.name) }));
  const kewajiban = coa.filter(a => a.type === 'kewajiban').map(a => ({ ...a, balance: getBalance(a.name) }));
  const modalAcc = coa.filter(a => a.type === 'modal').map(a => ({ ...a, balance: getBalance(a.name) }));
  const totalAset = aset.reduce((s, a) => s + a.balance, 0);
  const totalKewajiban = kewajiban.reduce((s, a) => s + a.balance, 0);
  const totalModal = modalAcc.reduce((s, a) => s + a.balance, 0) + labaBersih;

  // Dashboard chart data
  const chartData = coa.filter(a => a.type === 'pendapatan' || a.type === 'beban').map(a => ({ name: a.code, value: Math.abs(getBalance(a.name)), type: a.type })).filter(a => a.value > 0);

  if (!ready) return <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#94a3b8' }}>Loading ARIS...</p></div>;

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: 'dashboard', icon: '📊', label: 'Dashboard' },
    { tab: 'journal', icon: '📝', label: 'Jurnal' },
    { tab: 'ledger', icon: '📖', label: 'Buku Besar' },
    { tab: 'report', icon: '📈', label: 'Laporan' },
    { tab: 'coa', icon: '🗂️', label: 'Akun' },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;background:#f1f5f9}`}</style>
      <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", color: '#1e293b' }}>
        {/* Top Nav */}
        <header style={{ background: '#0f172a', color: 'white', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px' }}>ARIS</h1>
                <p style={{ fontSize: 9, color: '#64748b' }}>Sistem Akuntansi</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {navItems.map(n => (
                <button key={n.tab} onClick={() => setTab(n.tab)} style={{ background: tab === n.tab ? '#1e293b' : 'transparent', color: tab === n.tab ? 'white' : '#64748b', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 14 }}>{n.icon}</span> {n.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Aset', value: totalAset, color: '#3b82f6', icon: '🏦' },
                  { label: 'Kewajiban', value: totalKewajiban, color: '#ef4444', icon: '📋' },
                  { label: 'Modal', value: totalModal, color: '#8b5cf6', icon: '💎' },
                  { label: 'Pendapatan', value: totalPendapatan, color: '#10b981', icon: '📈' },
                  { label: 'Laba Bersih', value: labaBersih, color: labaBersih >= 0 ? '#10b981' : '#ef4444', icon: labaBersih >= 0 ? '✅' : '⚠️' },
                ].map((k, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: `3px solid ${k.color}` }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{k.icon} {k.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{short(k.value)}</p>
                    <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>{rp(k.value)}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16 }}>📊 Neraca (Balance Sheet)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, borderBottom: '2px solid #3b82f6', paddingBottom: 4 }}>ASET</p>
                      {aset.filter(a => a.balance !== 0).map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>{a.name}</span>
                          <span style={{ fontWeight: 600 }}>{short(a.balance)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: 4, fontSize: 12, fontWeight: 700 }}>
                        <span>Total Aset</span><span style={{ color: '#3b82f6' }}>{short(totalAset)}</span>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 8, borderBottom: '2px solid #ef4444', paddingBottom: 4 }}>KEWAJIBAN + MODAL</p>
                      {kewajiban.filter(a => a.balance !== 0).map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>{a.name}</span>
                          <span style={{ fontWeight: 600, color: '#ef4444' }}>{short(a.balance)}</span>
                        </div>
                      ))}
                      {modalAcc.filter(a => a.balance !== 0).map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>{a.name}</span>
                          <span style={{ fontWeight: 600, color: '#8b5cf6' }}>{short(a.balance)}</span>
                        </div>
                      ))}
                      {labaBersih !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>Laba/Rugi</span>
                          <span style={{ fontWeight: 600, color: labaBersih >= 0 ? '#10b981' : '#ef4444' }}>{short(labaBersih)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: 4, fontSize: 12, fontWeight: 700 }}>
                        <span>Total</span><span style={{ color: totalKewajiban + totalModal === totalAset ? '#10b981' : '#ef4444' }}>{short(totalKewajiban + totalModal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16 }}>📝 Jurnal Terakhir</h3>
                  {journal.length > 0 ? [...journal].reverse().slice(0, 6).map(j => (
                    <div key={j.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{j.ref}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{j.date}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.desc || j.debit.map(d => d.account).join(', ')}</p>
                    </div>
                  )) : <p style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', padding: 20 }}>Belum ada jurnal</p>}
                </div>
              </div>
            </div>
          )}

          {/* JOURNAL */}
          {tab === 'journal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>📝 Jurnal Umum</h2>
                <button onClick={() => setModal(true)} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>＋ Entri Baru</button>
              </div>
              <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Tanggal', 'Ref', 'Keterangan', 'Akun', 'Debit', 'Kredit'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {journal.length > 0 ? [...journal].reverse().map(j => (
                      <tr key={j.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748b' }}>{j.date}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{j.ref}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#1e293b' }}>{j.desc || '-'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>
                          {j.debit.map((d, i) => <div key={i} style={{ color: '#1e293b' }}>{d.account}</div>)}
                          {j.credit.map((c, i) => <div key={i} style={{ color: '#64748b', paddingLeft: 12 }}>  {c.account}</div>)}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>
                          {j.debit.map((d, i) => <div key={i}>{short(d.amount)}</div>)}
                          {j.credit.map((_, i) => <div key={i} style={{ color: '#f1f5f9' }}>-</div>)}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>
                          {j.debit.map((_, i) => <div key={i} style={{ color: '#f1f5f9' }}>-</div>)}
                          {j.credit.map((c, i) => <div key={i} style={{ color: '#10b981' }}>{short(c.amount)}</div>)}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#cbd5e1' }}>Belum ada entri jurnal</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEDGER */}
          {tab === 'ledger' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📖 Buku Besar</h2>
              <div style={{ marginBottom: 16 }}>
                <select value={ledgerAcc} onChange={e => setLedgerAcc(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, width: 300, background: 'white' }}>
                  <option value="">-- Pilih Akun --</option>
                  {coa.map(a => <option key={a.id} value={a.name}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              {ledgerAcc && (
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{coa.find(a => a.name === ledgerAcc)?.code} - {ledgerAcc}</span>
                    <span style={{ fontWeight: 800, color: getBalance(ledgerAcc) >= 0 ? '#10b981' : '#ef4444' }}>Saldo: {rp(getBalance(ledgerAcc))}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Tanggal', 'Ref', 'Keterangan', 'Debit', 'Kredit', 'Saldo'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Debit' || h === 'Kredit' || h === 'Saldo' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let runningBal = 0;
                        const entries = getAccountEntries(ledgerAcc);
                        return entries.length > 0 ? entries.map((e, i) => {
                          runningBal += e.debit - e.credit;
                          return (
                            <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748b' }}>{e.date}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{e.ref}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12 }}>{e.desc}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: '#1e293b' }}>{e.debit > 0 ? short(e.debit) : '-'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: '#10b981' }}>{e.credit > 0 ? short(e.credit) : '-'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: runningBal >= 0 ? '#1e293b' : '#ef4444' }}>{short(runningBal)}</td>
                            </tr>
                          );
                        }) : <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#cbd5e1' }}>Tidak ada transaksi untuk akun ini</td></tr>;
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
              {!ledgerAcc && (
                <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>📖</span>
                  <p>Pilih akun untuk melihat buku besar</p>
                </div>
              )}
            </div>
          )}

          {/* REPORT */}
          {tab === 'report' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📈 Laporan Laba Rugi</h2>
              <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', maxWidth: 600 }}>
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800 }}>LAPORAN LABA RUGI</h3>
                  <p style={{ fontSize: 11, opacity: 0.8 }}>Periode {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: 4, marginBottom: 8 }}>PENDAPATAN</p>
                  {pendapatan.length > 0 ? pendapatan.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{a.code} {a.name}</span>
                      <span style={{ fontWeight: 600 }}>{rp(a.balance)}</span>
                    </div>
                  )) : <p style={{ fontSize: 12, color: '#cbd5e1', padding: '4px 0' }}>Tidak ada data</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: 4, fontSize: 12, fontWeight: 800 }}>
                    <span>Total Pendapatan</span><span style={{ color: '#10b981' }}>{rp(totalPendapatan)}</span>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: 4, marginBottom: 8, marginTop: 16 }}>BEBAN</p>
                  {beban.length > 0 ? beban.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{a.code} {a.name}</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>{rp(a.balance)}</span>
                    </div>
                  )) : <p style={{ fontSize: 12, color: '#cbd5e1', padding: '4px 0' }}>Tidak ada data</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: 4, fontSize: 12, fontWeight: 800 }}>
                    <span>Total Beban</span><span style={{ color: '#ef4444' }}>{rp(totalBeban)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: labaBersih >= 0 ? '#ecfdf5' : '#fef2f2', borderRadius: 10, marginTop: 16, fontSize: 14, fontWeight: 800 }}>
                    <span>LABA / (RUGI) BERSIH</span>
                    <span style={{ color: labaBersih >= 0 ? '#10b981' : '#ef4444' }}>{rp(labaBersih)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COA */}
          {tab === 'coa' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🗂️ Chart of Accounts (Daftar Akun)</h2>
              {['aset', 'kewajiban', 'modal', 'pendapatan', 'beban'].map(type => (
                <div key={type} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: TYPE_COLORS[type], borderRadius: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: TYPE_COLORS[type] }}>{type}</span>
                  </div>
                  {coa.filter(a => a.type === type).map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span><span style={{ color: '#94a3b8', fontWeight: 600, marginRight: 8 }}>{a.code}</span>{a.name}</span>
                      <span style={{ fontWeight: 600, color: getBalance(a.name) >= 0 ? '#1e293b' : '#ef4444' }}>{short(getBalance(a.name))}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal Journal Entry */}
        {modal && (
          <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📝 Entri Jurnal Baru</h2>
              <form onSubmit={addJournalEntry}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 4 }}>TANGGAL</label>
                    <input type="date" value={jDate} onChange={e => setJDate(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: 4 }}>KETERANGAN</label>
                    <input type="text" value={jDesc} onChange={e => setJDesc(e.target.value)} placeholder="Deskripsi transaksi" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#f8fafc' }} />
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>AKUN</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>DEBIT</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>KREDIT</th>
                      <th style={{ padding: '8px', width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jLines.map((line, i) => (
                      <tr key={i}>
                        <td style={{ padding: 4 }}>
                          <select value={line.account} onChange={e => { const l = [...jLines]; l[i].account = e.target.value; setJLines(l); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, background: '#f8fafc' }}>
                            <option value="">-- Pilih --</option>
                            {coa.map(a => <option key={a.id} value={a.name}>{a.code} - {a.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: 4 }}>
                          <input type="number" value={line.debit} onChange={e => { const l = [...jLines]; l[i].debit = e.target.value; if (e.target.value) l[i].credit = ''; setJLines(l); }} placeholder="0" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, textAlign: 'right', background: '#f8fafc' }} />
                        </td>
                        <td style={{ padding: 4 }}>
                          <input type="number" value={line.credit} onChange={e => { const l = [...jLines]; l[i].credit = e.target.value; if (e.target.value) l[i].debit = ''; setJLines(l); }} placeholder="0" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, textAlign: 'right', background: '#f8fafc' }} />
                        </td>
                        <td style={{ padding: 4 }}>
                          <button type="button" onClick={() => removeLine(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#ef4444' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button type="button" onClick={addLine} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6366f1' }}>+ Tambah Baris</button>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, fontWeight: 700 }}>
                    <span>Total D: <span style={{ color: '#1e293b' }}>{rp(jLines.reduce((s, l) => s + (Number(l.debit) || 0), 0))}</span></span>
                    <span>Total C: <span style={{ color: '#10b981' }}>{rp(jLines.reduce((s, l) => s + (Number(l.credit) || 0), 0))}</span></span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button type="button" onClick={() => setModal(false)} style={{ padding: 12, borderRadius: 12, background: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" style={{ padding: 12, borderRadius: 12, background: '#6366f1', border: 'none', fontWeight: 700, fontSize: 13, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>💾 Simpan Jurnal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
