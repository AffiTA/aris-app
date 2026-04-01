'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Types
interface Account { id: string; code: string; name: string; type: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'; }
interface JournalEntry { id: number; date: string; ref: string; desc: string; debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[]; }

const DEFAULT_COA: Account[] = [
  { id: '1-101', code: '101', name: 'Kas', type: 'aset' },
  { id: '1-102', code: '102', name: 'Bank', type: 'aset' },
  { id: '1-103', code: '103', name: 'Piutang Usaha', type: 'aset' },
  { id: '1-104', code: '104', name: 'Persediaan', type: 'aset' },
  { id: '1-105', code: '105', name: 'Peralatan', type: 'aset' },
  { id: '1-106', code: '106', name: 'Kendaraan', type: 'aset' },
  { id: '2-201', code: '201', name: 'Hutang Usaha', type: 'kewajiban' },
  { id: '2-202', code: '202', name: 'Hutang Bank', type: 'kewajiban' },
  { id: '3-301', code: '301', name: 'Modal', type: 'modal' },
  { id: '3-302', code: '302', name: 'Prive', type: 'modal' },
  { id: '3-303', code: '303', name: 'Laba Ditahan', type: 'modal' },
  { id: '4-401', code: '401', name: 'Pendapatan Jasa', type: 'pendapatan' },
  { id: '4-402', code: '402', name: 'Pendapatan Penjualan', type: 'pendapatan' },
  { id: '5-501', code: '501', name: 'Beban Gaji', type: 'beban' },
  { id: '5-502', code: '502', name: 'Beban Sewa', type: 'beban' },
  { id: '5-503', code: '503', name: 'Beban Listrik', type: 'beban' },
  { id: '5-504', code: '504', name: 'Beban Transport', type: 'beban' },
  { id: '5-505', code: '505', name: 'Beban Operasional', type: 'beban' },
  { id: '5-506', code: '506', name: 'HPP', type: 'beban' },
];

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];
const TYPE_LABEL: Record<string, string> = { aset: 'Aset', kewajiban: 'Kewajiban', modal: 'Modal', pendapatan: 'Pendapatan', beban: 'Beban' };
const TYPE_COLOR: Record<string, string> = { aset: '#3b82f6', kewajiban: '#ef4444', modal: '#8b5cf6', pendapatan: '#10b981', beban: '#f59e0b' };

function rp(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
function short(n: number) { if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' Jt'; if (n >= 1e3) return (n / 1e3).toFixed(0) + ' Rb'; return n.toString(); }
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
  const [sidebar, setSidebar] = useState(true);

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
    if (totalD !== totalC) { alert(`Debit (${rp(totalD)}) harus sama dengan Kredit (${rp(totalC)})`); return; }
    if (totalD === 0) { alert('Isi minimal 1 baris debit & kredit'); return; }
    saveJournal([...journal, { id: Date.now(), date: jDate, ref: nextRef(), desc: jDesc, debit, credit }]);
    setModal(false);
    setJLines([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
    setJDesc('');
  }

  function getBal(name: string) {
    let b = 0;
    journal.forEach(e => { e.debit.forEach(d => { if (d.account === name) b += d.amount; }); e.credit.forEach(c => { if (c.account === name) b -= c.amount; }); });
    return b;
  }

  function getEntries(name: string) {
    const out: { date: string; ref: string; desc: string; debit: number; credit: number; bal: number }[] = [];
    let running = 0;
    journal.forEach(e => {
      let d = 0, c = 0;
      e.debit.forEach(x => { if (x.account === name) d += x.amount; });
      e.credit.forEach(x => { if (x.account === name) c += x.amount; });
      if (d > 0 || c > 0) { running += d - c; out.push({ date: e.date, ref: e.ref, desc: e.desc, debit: d, credit: c, bal: running }); }
    });
    return out;
  }

  const pendapatan = coa.filter(a => a.type === 'pendapatan').map(a => ({ ...a, bal: getBal(a.name) })).filter(a => a.bal !== 0);
  const beban = coa.filter(a => a.type === 'beban').map(a => ({ ...a, bal: getBal(a.name) })).filter(a => a.bal !== 0);
  const totalPend = pendapatan.reduce((s, a) => s + a.bal, 0);
  const totalBeban = beban.reduce((s, a) => s + a.bal, 0);
  const laba = totalPend - totalBeban;
  const aset = coa.filter(a => a.type === 'aset').map(a => ({ ...a, bal: getBal(a.name) }));
  const kewajiban = coa.filter(a => a.type === 'kewajiban').map(a => ({ ...a, bal: getBal(a.name) }));
  const modalAcc = coa.filter(a => a.type === 'modal').map(a => ({ ...a, bal: getBal(a.name) }));
  const totalAset = aset.reduce((s, a) => s + a.bal, 0);
  const totalKew = kewajiban.reduce((s, a) => s + a.bal, 0);
  const totalModal = modalAcc.reduce((s, a) => s + a.bal, 0) + laba;

  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>;

  const cats = coa.filter(a => a.type === (modal === true ? 'pendapatan' : 'beban'));
  const navItems: { tab: Tab; label: string }[] = [
    { tab: 'dashboard', label: 'Dashboard' },
    { tab: 'journal', label: 'Jurnal Umum' },
    { tab: 'ledger', label: 'Buku Besar' },
    { tab: 'report', label: 'Laba Rugi' },
    { tab: 'coa', label: 'Daftar Akun' },
  ];

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px', background: '#fafbfc', borderBottom: '1px solid #f1f3f5' };
  const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f7f8fa' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', background: '#fafbfc', outline: 'none', transition: 'border 0.2s' };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f8f9fb;color:#1f2937}`}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Sidebar */}
        <aside style={{ width: sidebar ? 220 : 0, overflow: 'hidden', background: '#111827', color: 'white', transition: 'width 0.3s', flexShrink: 0 }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>A</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.5px' }}>ARIS</div>
                <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.5px' }}>AKUNTANSI RAPI SISTEMATIS</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: '12px 8px' }}>
            {navItems.map(n => (
              <button key={n.tab} onClick={() => setTab(n.tab)} style={{ width: '100%', textAlign: 'left', background: tab === n.tab ? '#1f2937' : 'transparent', color: tab === n.tab ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: tab === n.tab ? 600 : 400, display: 'block', transition: 'all 0.2s', marginBottom: 2 }}>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid #1f2937', marginTop: 'auto' }}>
            <div style={{ fontSize: 10, color: '#4b5563' }}>v1.0.0 · {new Date().getFullYear()}</div>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Bar */}
          <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSidebar(!sidebar)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>{sidebar ? '◀' : '▶'}</button>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>{navItems.find(n => n.tab === tab)?.label}</h2>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </header>

          <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>

            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Aset', val: totalAset, col: '#3b82f6' },
                    { label: 'Total Kewajiban', val: totalKew, col: '#ef4444' },
                    { label: 'Total Modal', val: totalModal, col: '#8b5cf6' },
                    { label: 'Laba Bersih', val: laba, col: laba >= 0 ? '#10b981' : '#ef4444' },
                  ].map((k, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #f1f3f5' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{k.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: k.col, letterSpacing: '-0.5px' }}>{rp(k.val)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {/* Neraca */}
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f3f5', fontWeight: 700, fontSize: 13 }}>Neraca (Balance Sheet)</div>
                    <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #3b82f6' }}>ASET</div>
                        {aset.filter(a => a.bal !== 0).map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                            <span style={{ color: '#6b7280' }}>{a.name}</span>
                            <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{short(a.bal)}</span>
                          </div>
                        ))}
                        {aset.filter(a => a.bal !== 0).length === 0 && <div style={{ fontSize: 12, color: '#d1d5db', padding: '5px 0' }}>Belum ada data</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid #e5e7eb', marginTop: 8, fontSize: 12, fontWeight: 700 }}>
                          <span>Total Aset</span><span style={{ color: '#3b82f6' }}>{short(totalAset)}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #ef4444' }}>KEWAJIBAN + MODAL</div>
                        {kewajiban.filter(a => a.bal !== 0).map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                            <span style={{ color: '#6b7280' }}>{a.name}</span><span style={{ fontWeight: 600, color: '#ef4444' }}>{short(a.bal)}</span>
                          </div>
                        ))}
                        {modalAcc.filter(a => a.bal !== 0).map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                            <span style={{ color: '#6b7280' }}>{a.name}</span><span style={{ fontWeight: 600, color: '#8b5cf6' }}>{short(a.bal)}</span>
                          </div>
                        ))}
                        {laba !== 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                          <span style={{ color: '#6b7280' }}>Laba/Rugi</span><span style={{ fontWeight: 600, color: laba >= 0 ? '#10b981' : '#ef4444' }}>{short(laba)}</span>
                        </div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid #e5e7eb', marginTop: 8, fontSize: 12, fontWeight: 700 }}>
                          <span>Total</span><span style={{ color: totalKew + totalModal === totalAset ? '#10b981' : '#ef4444' }}>{short(totalKew + totalModal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Journal */}
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f3f5', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Entri Jurnal Terakhir</span>
                      <button onClick={() => setTab('journal')} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>Lihat Semua</button>
                    </div>
                    <div style={{ padding: '0 20px' }}>
                      {journal.length > 0 ? [...journal].reverse().slice(0, 8).map(j => (
                        <div key={j.id} style={{ padding: '12px 0', borderBottom: '1px solid #f7f8fa', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>{j.ref} <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>{j.date}</span></div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{j.desc || j.debit.map(d => d.account).join(', ')}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{short(j.debit.reduce((s, d) => s + d.amount, 0))}</div>
                        </div>
                      )) : <div style={{ padding: 40, textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>Belum ada entri jurnal</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* JOURNAL */}
            {tab === 'journal' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{journal.length} entri jurnal</div>
                  <button onClick={() => setModal(true)} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Entri Baru</button>
                </div>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={thStyle}>Tanggal</th><th style={thStyle}>Ref</th><th style={thStyle}>Keterangan</th><th style={thStyle}>Akun</th><th style={{ ...thStyle, textAlign: 'right' }}>Debit</th><th style={{ ...thStyle, textAlign: 'right' }}>Kredit</th></tr></thead>
                    <tbody>
                      {journal.length > 0 ? [...journal].reverse().map(j => (
                        <tr key={j.id} style={{ transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#fafbfc')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ ...tdStyle, color: '#6b7280' }}>{j.date}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#6366f1' }}>{j.ref}</td>
                          <td style={tdStyle}>{j.desc || '-'}</td>
                          <td style={tdStyle}>
                            {j.debit.map((d, i) => <div key={i} style={{ fontSize: 12 }}>{d.account}</div>)}
                            {j.credit.map((c, i) => <div key={i} style={{ fontSize: 12, color: '#9ca3af', paddingLeft: 12 }}>{c.account}</div>)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                            {j.debit.map((d, i) => <div key={i}>{short(d.amount)}</div>)}
                            {j.credit.map((_, i) => <div key={i} style={{ color: '#f1f3f5' }}>-</div>)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                            {j.debit.map((_, i) => <div key={i} style={{ color: '#f1f3f5' }}>-</div>)}
                            {j.credit.map((c, i) => <div key={i} style={{ color: '#10b981' }}>{short(c.amount)}</div>)}
                          </td>
                        </tr>
                      )) : <tr><td colSpan={6} style={{ padding: 50, textAlign: 'center', color: '#d1d5db' }}>Belum ada entri. Klik "+ Entri Baru" untuk mulai.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LEDGER */}
            {tab === 'ledger' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <select value={ledgerAcc} onChange={e => setLedgerAcc(e.target.value)} style={{ ...inputStyle, width: 320 }}>
                    <option value="">-- Pilih Akun --</option>
                    {coa.map(a => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
                {ledgerAcc ? (
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{coa.find(a => a.name === ledgerAcc)?.code} — {ledgerAcc}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: getBal(ledgerAcc) >= 0 ? '#10b981' : '#ef4444' }}>Saldo: {rp(getBal(ledgerAcc))}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={thStyle}>Tanggal</th><th style={thStyle}>Ref</th><th style={thStyle}>Keterangan</th><th style={{ ...thStyle, textAlign: 'right' }}>Debit</th><th style={{ ...thStyle, textAlign: 'right' }}>Kredit</th><th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th></tr></thead>
                      <tbody>
                        {getEntries(ledgerAcc).length > 0 ? getEntries(ledgerAcc).map((e, i) => (
                          <tr key={i}>
                            <td style={{ ...tdStyle, color: '#6b7280' }}>{e.date}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#6366f1' }}>{e.ref}</td>
                            <td style={tdStyle}>{e.desc}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{e.debit > 0 ? short(e.debit) : '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#10b981' }}>{e.credit > 0 ? short(e.credit) : '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: e.bal >= 0 ? '#1f2937' : '#ef4444' }}>{short(e.bal)}</td>
                          </tr>
                        )) : <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#d1d5db' }}>Tidak ada transaksi</td></tr>}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', padding: 50, textAlign: 'center', color: '#d1d5db' }}>Pilih akun untuk melihat buku besar</div>}
              </div>
            )}

            {/* REPORT - Laba Rugi */}
            {tab === 'report' && (
              <div style={{ maxWidth: 640 }}>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', background: '#111827', color: 'white' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>LAPORAN LABA RUGI</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Periode {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', borderBottom: '2px solid #10b981', paddingBottom: 6, marginBottom: 10 }}>Pendapatan</div>
                    {pendapatan.length > 0 ? pendapatan.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>{a.code} {a.name}</span>
                        <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{rp(a.bal)}</span>
                      </div>
                    )) : <div style={{ fontSize: 12, color: '#d1d5db', padding: '5px 0' }}>Tidak ada data</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #e5e7eb', marginTop: 8, fontWeight: 700, fontSize: 13 }}>
                      <span>Total Pendapatan</span><span style={{ color: '#10b981' }}>{rp(totalPend)}</span>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', borderBottom: '2px solid #f59e0b', paddingBottom: 6, marginBottom: 10, marginTop: 20 }}>Beban</div>
                    {beban.length > 0 ? beban.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>{a.code} {a.name}</span>
                        <span style={{ fontWeight: 600, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{rp(a.bal)}</span>
                      </div>
                    )) : <div style={{ fontSize: 12, color: '#d1d5db', padding: '5px 0' }}>Tidak ada data</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #e5e7eb', marginTop: 8, fontWeight: 700, fontSize: 13 }}>
                      <span>Total Beban</span><span style={{ color: '#ef4444' }}>{rp(totalBeban)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: laba >= 0 ? '#ecfdf5' : '#fef2f2', borderRadius: 10, marginTop: 20, fontWeight: 800, fontSize: 15 }}>
                      <span>LABA / (RUGI) BERSIH</span>
                      <span style={{ color: laba >= 0 ? '#10b981' : '#ef4444' }}>{rp(laba)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COA */}
            {tab === 'coa' && (
              <div>
                {['aset', 'kewajiban', 'modal', 'pendapatan', 'beban'].map(type => (
                  <div key={type} style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f3f5', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ padding: '10px 16px', background: '#fafbfc', borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 14, background: TYPE_COLOR[type], borderRadius: 2 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: TYPE_COLOR[type], letterSpacing: '0.5px' }}>{TYPE_LABEL[type]}</span>
                    </div>
                    {coa.filter(a => a.type === type).map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f7f8fa', fontSize: 13 }}>
                        <span><span style={{ color: '#9ca3af', fontWeight: 600, marginRight: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{a.code}</span>{a.name}</span>
                        <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: getBal(a.name) >= 0 ? '#1f2937' : '#ef4444' }}>{short(getBal(a.name))}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Modal */}
        {modal && (
          <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Entri Jurnal Baru</h2>
              <form onSubmit={addJournalEntry}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>Tanggal</label>
                    <input type="date" value={jDate} onChange={e => setJDate(e.target.value)} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>Keterangan</label>
                    <input type="text" value={jDesc} onChange={e => setJDesc(e.target.value)} placeholder="Deskripsi transaksi" style={inputStyle} />
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead><tr><th style={{ ...thStyle, fontSize: 10 }}>Akun</th><th style={{ ...thStyle, textAlign: 'right', fontSize: 10 }}>Debit</th><th style={{ ...thStyle, textAlign: 'right', fontSize: 10 }}>Kredit</th><th style={{ width: 36 }}></th></tr></thead>
                  <tbody>
                    {jLines.map((l, i) => (
                      <tr key={i}>
                        <td style={{ padding: 3 }}>
                          <select value={l.account} onChange={e => { const x = [...jLines]; x[i].account = e.target.value; setJLines(x); }} style={{ ...inputStyle, fontSize: 12, padding: '8px 10px' }}>
                            <option value="">-- Pilih --</option>
                            {coa.map(a => <option key={a.id} value={a.name}>{a.code} - {a.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: 3 }}>
                          <input type="number" value={l.debit} onChange={e => { const x = [...jLines]; x[i].debit = e.target.value; setJLines(x); }} placeholder="0" style={{ ...inputStyle, textAlign: 'right', fontSize: 12, padding: '8px 10px' }} />
                        </td>
                        <td style={{ padding: 3 }}>
                          <input type="number" value={l.credit} onChange={e => { const x = [...jLines]; x[i].credit = e.target.value; setJLines(x); }} placeholder="0" style={{ ...inputStyle, textAlign: 'right', fontSize: 12, padding: '8px 10px' }} />
                        </td>
                        <td style={{ padding: 3 }}>
                          {jLines.length > 2 && <button type="button" onClick={() => setJLines(jLines.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 11, color: '#ef4444' }}>×</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <button type="button" onClick={() => setJLines([...jLines, { account: '', debit: '', credit: '' }])} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6366f1' }}>+ Baris</button>
                  <div style={{ display: 'flex', gap: 24, fontSize: 12, fontWeight: 600 }}>
                    <span>D: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp(jLines.reduce((s, l) => s + (Number(l.debit) || 0), 0))}</span></span>
                    <span>K: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#10b981' }}>{rp(jLines.reduce((s, l) => s + (Number(l.credit) || 0), 0))}</span></span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button type="button" onClick={() => setModal(false)} style={{ padding: 12, borderRadius: 10, background: '#f3f4f6', border: 'none', fontWeight: 600, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" style={{ padding: 12, borderRadius: 10, background: '#6366f1', border: 'none', fontWeight: 600, fontSize: 13, color: 'white', cursor: 'pointer' }}>Simpan Jurnal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
