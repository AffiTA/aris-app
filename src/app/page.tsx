'use client';
import { useState, useEffect } from 'react';

interface Account { id: string; code: string; name: string; type: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'; }
interface JournalEntry { id: number; date: string; ref: string; desc: string; debit: { account: string; amount: number }[]; credit: { account: string; amount: number }[]; }
interface Debt { id: number; type: 'hutang' | 'piutang'; name: string; amount: number; paid: number; dueDate: string; desc: string; status: 'active' | 'paid'; }

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

const TYPE_LABEL: Record<string, string> = { aset: 'Aset', kewajiban: 'Kewajiban', modal: 'Modal', pendapatan: 'Pendapatan', beban: 'Beban' };
const TYPE_COLOR: Record<string, string> = { aset: '#3b82f6', kewajiban: '#ef4444', modal: '#8b5cf6', pendapatan: '#10b981', beban: '#f59e0b' };

function rp(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n); }
function short(n: number) { if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' Jt'; if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + ' Rb'; return n.toLocaleString('id-ID'); }
function load<T>(k: string, d: T): T { if (typeof window === 'undefined') return d; const v = localStorage.getItem('aris_' + k); return v ? JSON.parse(v) : d; }
function save(k: string, v: unknown) { localStorage.setItem('aris_' + k, JSON.stringify(v)); }

type Tab = 'home' | 'journal' | 'neraca' | 'laporan' | 'hutang';

export default function App() {
  const [coa] = useState<Account[]>(DEFAULT_COA);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<string | null>(null);

  const [jLines, setJLines] = useState([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
  const [jDate, setJDate] = useState(new Date().toISOString().slice(0, 10));
  const [jDesc, setJDesc] = useState('');

  const [dType, setDType] = useState<'hutang' | 'piutang'>('hutang');
  const [dName, setDName] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dDue, setDDue] = useState('');
  const [dDesc, setDDesc] = useState('');

  const [payId, setPayId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    setJournal(load<JournalEntry[]>('journal', []));
    setDebts(load<Debt[]>('debts', []));
    setReady(true);
  }, []);

  function reload() { setJournal(load<JournalEntry[]>('journal', [])); setDebts(load<Debt[]>('debts', [])); }
  function saveJournal(j: JournalEntry[]) { setJournal(j); save('journal', j); }
  function saveDebts(d: Debt[]) { setDebts(d); save('debts', d); }

  function getBal(name: string) { let b = 0; journal.forEach(e => { e.debit.forEach(d => { if (d.account === name) b += d.amount; }); e.credit.forEach(c => { if (c.account === name) b -= c.amount; }); }); return b; }

  const totalAset = coa.filter(a => a.type === 'aset').reduce((s, a) => s + getBal(a.name), 0);
  const totalKew = coa.filter(a => a.type === 'kewajiban').reduce((s, a) => s + getBal(a.name), 0);
  const totalPend = coa.filter(a => a.type === 'pendapatan').reduce((s, a) => s + getBal(a.name), 0);
  const totalBeban = coa.filter(a => a.type === 'beban').reduce((s, a) => s + getBal(a.name), 0);
  const laba = totalPend - totalBeban;
  const totalModal = coa.filter(a => a.type === 'modal').reduce((s, a) => s + getBal(a.name), 0) + laba;
  const totalHutang = debts.filter(d => d.type === 'hutang' && d.status === 'active').reduce((s, d) => s + (d.amount - d.paid), 0);
  const totalPiutang = debts.filter(d => d.type === 'piutang' && d.status === 'active').reduce((s, d) => s + (d.amount - d.paid), 0);
  const neracaSaldo = coa.map(a => ({ ...a, debit: getBal(a.name) > 0 ? getBal(a.name) : 0, credit: getBal(a.name) < 0 ? Math.abs(getBal(a.name)) : 0 })).filter(a => a.debit > 0 || a.credit > 0);

  const pendapatan = coa.filter(a => a.type === 'pendapatan').map(a => ({ ...a, bal: getBal(a.name) })).filter(a => a.bal !== 0);
  const beban = coa.filter(a => a.type === 'beban').map(a => ({ ...a, bal: getBal(a.name) })).filter(a => a.bal !== 0);

  function deleteJournal(id: number) {
    if (confirm('Hapus entri jurnal ini?')) {
      const updated = journal.filter(j => j.id !== id);
      saveJournal(updated);
    }
  }

  function resetAll() {
    if (confirm('Hapus SEMUA data? Ini tidak bisa dibatalkan!')) {
      localStorage.removeItem('aris_journal');
      localStorage.removeItem('aris_debts');
      setJournal([]);
      setDebts([]);
    }
  }

  function addJournal(e: React.FormEvent) {
    e.preventDefault();
    const debit = jLines.filter(l => l.account && l.debit).map(l => ({ account: l.account, amount: Number(l.debit) }));
    const credit = jLines.filter(l => l.account && l.credit).map(l => ({ account: l.account, amount: Number(l.credit) }));
    const td2 = debit.reduce((s, l) => s + l.amount, 0);
    const tc2 = credit.reduce((s, l) => s + l.amount, 0);
    if (td2 !== tc2) { alert(`Debit (${rp(td2)}) harus sama dengan Kredit (${rp(tc2)})`); return; }
    if (td2 === 0) { alert('Isi minimal 1 baris'); return; }
    saveJournal([...journal, { id: Date.now(), date: jDate, ref: `JU-${String(journal.length + 1).padStart(4, '0')}`, desc: jDesc, debit, credit }]);
    setModal(null); setJLines([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]); setJDesc('');
  }

  function addDebt(e: React.FormEvent) {
    e.preventDefault();
    saveDebts([...debts, { id: Date.now(), type: dType, name: dName, amount: Number(dAmount), paid: 0, dueDate: dDue, desc: dDesc, status: 'active' }]);
    setModal(null); setDName(''); setDAmount(''); setDDue(''); setDDesc('');
  }

  function payDebt(e: React.FormEvent) {
    e.preventDefault();
    if (!payId) return;
    const updated = debts.map(d => d.id === payId ? { ...d, paid: d.paid + Number(payAmount), status: (d.paid + Number(payAmount)) >= d.amount ? 'paid' as const : 'active' as const } : d);
    saveDebts(updated); setModal(null); setPayId(null); setPayAmount('');
  }

  function exportExcel() {
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      const nsData = neracaSaldo.map(a => [a.code, a.name, TYPE_LABEL[a.type], a.debit || '', a.credit || '']);
      nsData.push(['', '', 'TOTAL', neracaSaldo.reduce((s, a) => s + a.debit, 0), neracaSaldo.reduce((s, a) => s + a.credit, 0)]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['KODE', 'NAMA AKUN', 'TIPE', 'DEBIT', 'KREDIT'], ...nsData]), 'Neraca Saldo');
      const lrData: (string | number)[][] = [['PENDAPATAN']];
      pendapatan.forEach(a => lrData.push(['', a.code + ' ' + a.name, a.bal]));
      lrData.push(['', 'Total', totalPend], ['', ''], ['BEBAN']);
      beban.forEach(a => lrData.push(['', a.code + ' ' + a.name, a.bal]));
      lrData.push(['', 'Total', totalBeban], ['', ''], ['LABA/RUGI BERSIH', '', laba]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['LAPORAN LABA RUGI'], [''], ...lrData]), 'Laba Rugi');
      XLSX.writeFile(wb, 'ARIS_Laporan.xlsx');
    });
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', background: '#f8fafc', outline: 'none', WebkitAppearance: 'none' as const };

  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f0f2f5;color:#1e293b}input,select{-webkit-appearance:none}table{border-collapse:collapse}@media(min-width:768px){.sb{display:flex!important}.bn{display:none!important}.mh{display:none!important}.dh{display:flex!important}.ct{margin-left:220px!important;max-width:none!important;padding:24px!important}}`}</style>
      <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 72 }}>

        {/* Sidebar (Desktop) */}
        <div className="sb" style={{ display: 'none', width: 220, background: '#1e1b4b', color: 'white', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>
          <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #818cf8, #6366f1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>A</div>
            <div><div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>ARIS</div><div style={{ fontSize: 9, color: '#a5b4fc', letterSpacing: '1px', fontWeight: 500 }}>AKUNTANSI</div></div>
          </div>
          <nav style={{ padding: '8px 12px', flex: 1 }}>
            {([
              { tab: 'home' as Tab, label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z' },
              { tab: 'journal' as Tab, label: 'Jurnal Umum', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
              { tab: 'neraca' as Tab, label: 'Neraca Saldo', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { tab: 'laporan' as Tab, label: 'Laba Rugi', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { tab: 'hutang' as Tab, label: 'Hutang & Piutang', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
            ]).map(n => (
              <button key={n.tab} onClick={() => { reload(); setTab(n.tab); }} style={{ width: '100%', textAlign: 'left', background: tab === n.tab ? 'rgba(255,255,255,0.12)' : 'transparent', color: tab === n.tab ? 'white' : '#a5b4fc', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: tab === n.tab ? 600 : 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10, borderLeft: tab === n.tab ? '3px solid #818cf8' : '3px solid transparent' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={n.icon} /></svg>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={exportExcel} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export Excel
            </button>
            <button onClick={resetAll} style={{ width: '100%', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reset Data</button>
          </div>
        </div>

        {/* Mobile Header */}
        <header className="mh" style={{ background: 'white', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>A</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>ARIS</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={exportExcel} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>Export</button>
            <button onClick={resetAll} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Reset</button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="dh" style={{ display: 'none', background: 'white', padding: '0 24px', borderBottom: '1px solid #e2e8f0', justifyContent: 'space-between', alignItems: 'center', height: 56 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>Akuntansi</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{({ home: 'Dashboard', journal: 'Jurnal Umum', neraca: 'Neraca Saldo', laporan: 'Laporan Laba Rugi', hutang: 'Hutang & Piutang' } as Record<string, string>)[tab]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>A</div>
          </div>
        </header>

        <main className="ct" style={{ padding: 16 }}>
          {/* HOME */}
          {tab === 'home' && <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Aset', val: totalAset, bg: '#eff6ff', border: '#bfdbfe', col: '#1d4ed8', icon: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z' },
                { label: 'Kewajiban', val: totalKew, bg: '#fef2f2', border: '#fecaca', col: '#dc2626', icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
                { label: 'Modal', val: totalModal, bg: '#f5f3ff', border: '#ddd6fe', col: '#7c3aed', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Laba/Rugi', val: laba, bg: laba >= 0 ? '#ecfdf5' : '#fef2f2', border: laba >= 0 ? '#a7f3d0' : '#fecaca', col: laba >= 0 ? '#059669' : '#dc2626', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              ].map((k, i) => (
                <div key={i} style={{ background: k.bg, borderRadius: 12, padding: 16, border: '1px solid ' + k.border, animation: 'fadeIn 0.3s ease ' + (i * 0.05) + 's both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{k.label}</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={k.col} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={k.icon} /></svg>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.col, letterSpacing: '-0.5px' }}>{rp(k.val)}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setModal('journal')} style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Jurnal Baru
              </button>
              <button onClick={() => { setDType('hutang'); setModal('debt'); }} style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                Tambah Hutang
              </button>
            </div>

            {/* Recent Journal */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Jurnal Terakhir</span>
                <button onClick={() => { reload(); setTab('journal'); }} style={{ background: '#eef2ff', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: 6 }}>Lihat Semua</button>
              </div>
              {journal.length > 0 ? [...journal].reverse().slice(0, 5).map(j => (
                <div key={j.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{j.desc || j.debit.map(d => d.account).join(', ')}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{j.ref} · {j.date}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{short(j.debit.reduce((s, d) => s + d.amount, 0))}</div>
                </div>
              )) : <div style={{ padding: 40, textAlign: 'center' }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Belum ada jurnal</div>
              </div>}
            </div>
          </div>}

          {/* JOURNAL */}
          {tab === 'journal' && <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{journal.length} entri</span>
              <button onClick={() => setModal('journal')} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Entri</button>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {journal.length > 0 ? [...journal].reverse().map(j => (
                <div key={j.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>{j.ref}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{j.date}</span>
                      <button onClick={() => deleteJournal(j.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Hapus</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{j.desc || '-'}</div>
                  {j.debit.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', padding: '2px 0' }}>
                      <span>  {d.account}</span>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{rp(d.amount)}</span>
                    </div>
                  ))}
                  {j.credit.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', padding: '2px 0' }}>
                      <span>    {c.account}</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>{rp(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )) : <div style={{ padding: 40, textAlign: 'center', color: '#d1d5db' }}>Belum ada entri</div>}
            </div>
          </div>}

          {/* NERACA SALDO */}
          {tab === 'neraca' && <div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13 }}>Neraca Saldo</div>
              {neracaSaldo.map(a => (
                <div key={a.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{a.code} · {TYPE_LABEL[a.type]}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: a.debit > 0 ? '#1f2937' : '#f1f5f9' }}>{a.debit > 0 ? short(a.debit) : '-'}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: a.credit > 0 ? '#10b981' : '#f1f5f9' }}>{a.credit > 0 ? short(a.credit) : '-'}</div>
                  </div>
                </div>
              ))}
              {neracaSaldo.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#d1d5db' }}>Belum ada data</div>}
              <div style={{ padding: '12px 14px', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
                <span>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div>{rp(neracaSaldo.reduce((s, a) => s + a.debit, 0))}</div>
                  <div style={{ color: '#10b981' }}>{rp(neracaSaldo.reduce((s, a) => s + a.credit, 0))}</div>
                </div>
              </div>
            </div>
          </div>}

          {/* LAPORAN LABA RUGI */}
          {tab === 'laporan' && <div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              <div style={{ padding: '16px 14px', background: '#111827', color: 'white' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>LAPORAN LABA RUGI</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', borderBottom: '2px solid #10b981', paddingBottom: 4, marginBottom: 8 }}>Pendapatan</div>
                {pendapatan.map(a => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}><span style={{ color: '#6b7280' }}>{a.name}</span><span style={{ fontWeight: 600 }}>{rp(a.bal)}</span></div>)}
                {pendapatan.length === 0 && <div style={{ fontSize: 12, color: '#d1d5db', padding: '4px 0' }}>Tidak ada data</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e5e7eb', marginTop: 6, fontWeight: 700, fontSize: 13 }}><span>Total</span><span style={{ color: '#10b981' }}>{rp(totalPend)}</span></div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', borderBottom: '2px solid #f59e0b', paddingBottom: 4, marginBottom: 8, marginTop: 16 }}>Beban</div>
                {beban.map(a => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}><span style={{ color: '#6b7280' }}>{a.name}</span><span style={{ fontWeight: 600, color: '#ef4444' }}>{rp(a.bal)}</span></div>)}
                {beban.length === 0 && <div style={{ fontSize: 12, color: '#d1d5db', padding: '4px 0' }}>Tidak ada data</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e5e7eb', marginTop: 6, fontWeight: 700, fontSize: 13 }}><span>Total</span><span style={{ color: '#ef4444' }}>{rp(totalBeban)}</span></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: laba >= 0 ? '#ecfdf5' : '#fef2f2', borderRadius: 10, marginTop: 16, fontWeight: 800, fontSize: 15 }}>
                  <span>LABA/RUGI</span>
                  <span style={{ color: laba >= 0 ? '#10b981' : '#ef4444' }}>{rp(laba)}</span>
                </div>
              </div>
            </div>
          </div>}

          {/* HUTANG & PIUTANG */}
          {tab === 'hutang' && <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Hutang</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{rp(totalHutang)}</div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Piutang</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>{rp(totalPiutang)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button onClick={() => { setDType('hutang'); setModal('debt'); }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Hutang</button>
              <button onClick={() => { setDType('piutang'); setModal('debt'); }} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Piutang</button>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {debts.filter(d => d.status === 'active').length > 0 ? debts.filter(d => d.status === 'active').map(d => (
                <div key={d.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: d.type === 'hutang' ? '#ef4444' : '#3b82f6' }}>{rp(d.amount - d.paid)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{d.type === 'hutang' ? 'Hutang' : 'Piutang'} · {d.dueDate || '-'}</div>
                  <div style={{ background: '#f1f5f9', height: 4, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(d.paid / d.amount) * 100}%`, background: d.type === 'hutang' ? '#10b981' : '#3b82f6', borderRadius: 2 }} /></div>
                  <button onClick={() => { setPayId(d.id); setModal('pay'); }} style={{ marginTop: 8, background: d.type === 'hutang' ? '#ecfdf5' : '#eff6ff', color: d.type === 'hutang' ? '#10b981' : '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {d.type === 'hutang' ? 'Bayar' : 'Terima'}
                  </button>
                </div>
              )) : <div style={{ padding: 30, textAlign: 'center', color: '#d1d5db' }}>Tidak ada hutang/piutang aktif</div>}
            </div>
          </div>}
        </main>

        {/* Bottom Nav */}
        <nav className="bn" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around', padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', zIndex: 40 }}>
          {([
            { tab: 'home' as Tab, icon: '◉', label: 'Home' },
            { tab: 'journal' as Tab, icon: '✎', label: 'Jurnal' },
            { tab: 'neraca' as Tab, icon: '☰', label: 'Neraca' },
            { tab: 'laporan' as Tab, icon: '◈', label: 'Laba Rugi' },
            { tab: 'hutang' as Tab, icon: '◇', label: 'Hutang' },
          ]).map(n => (
            <button key={n.tab} onClick={() => { reload(); setTab(n.tab); }} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, color: tab === n.tab ? '#6366f1' : '#9ca3af' }}>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: tab === n.tab ? '#6366f1' : '#9ca3af' }}>{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Modal: Journal */}
        {modal === 'journal' && <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Entri Jurnal Baru</h2>
            <form onSubmit={addJournal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>TANGGAL</label><input type="date" value={jDate} onChange={e => setJDate(e.target.value)} required style={inp} /></div>
                <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>KETERANGAN</label><input value={jDesc} onChange={e => setJDesc(e.target.value)} placeholder="Deskripsi" style={inp} /></div>
              </div>
              {jLines.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, marginBottom: 8, alignItems: 'end' }}>
                  <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>{i === 0 ? 'AKUN' : ''}</label>
                    <select value={l.account} onChange={e => { const x = [...jLines]; x[i].account = e.target.value; setJLines(x); }} style={{ ...inp, fontSize: 12, padding: '10px 10px' }}><option value="">Pilih</option>{coa.map(a => <option key={a.id} value={a.name}>{a.code}-{a.name}</option>)}</select></div>
                  <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>{i === 0 ? 'DEBIT' : ''}</label>
                    <input type="number" value={l.debit} onChange={e => { const x = [...jLines]; x[i].debit = e.target.value; setJLines(x); }} placeholder="0" style={{ ...inp, textAlign: 'right', fontSize: 12, padding: '10px 10px' }} /></div>
                  <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>{i === 0 ? 'KREDIT' : ''}</label>
                    <input type="number" value={l.credit} onChange={e => { const x = [...jLines]; x[i].credit = e.target.value; setJLines(x); }} placeholder="0" style={{ ...inp, textAlign: 'right', fontSize: 12, padding: '10px 10px' }} /></div>
                  <div>{jLines.length > 2 && <button type="button" onClick={() => setJLines(jLines.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '10px', cursor: 'pointer', fontSize: 12, color: '#ef4444', height: 40, display: 'flex', alignItems: 'center' }}>x</button>}</div>
                </div>
              ))}
              <button type="button" onClick={() => setJLines([...jLines, { account: '', debit: '', credit: '' }])} style={{ background: 'none', border: '1px dashed #e5e7eb', borderRadius: 8, padding: '8px', width: '100%', cursor: 'pointer', fontSize: 12, color: '#6366f1', fontWeight: 600, marginBottom: 12 }}>+ Tambah Baris</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                <span>D: {rp(jLines.reduce((s, l) => s + (Number(l.debit) || 0), 0))}</span>
                <span style={{ color: '#10b981' }}>K: {rp(jLines.reduce((s, l) => s + (Number(l.credit) || 0), 0))}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ padding: 14, borderRadius: 12, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: 14, borderRadius: 12, background: '#6366f1', border: 'none', fontWeight: 700, fontSize: 14, color: 'white', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>}

        {/* Modal: Debt */}
        {modal === 'debt' && <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', width: '100%' }}>
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{dType === 'hutang' ? 'Tambah Hutang' : 'Tambah Piutang'}</h2>
            <form onSubmit={addDebt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>NAMA</label><input value={dName} onChange={e => setDName(e.target.value)} required placeholder="Nama" style={inp} /></div>
              <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>JUMLAH (Rp)</label><input type="number" value={dAmount} onChange={e => setDAmount(e.target.value)} required placeholder="1000000" style={inp} /></div>
              <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>JATUH TEMPO</label><input type="date" value={dDue} onChange={e => setDDue(e.target.value)} style={inp} /></div>
              <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>KETERANGAN</label><input value={dDesc} onChange={e => setDDesc(e.target.value)} placeholder="Opsional" style={inp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ padding: 14, borderRadius: 12, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: 14, borderRadius: 12, background: dType === 'hutang' ? '#ef4444' : '#3b82f6', border: 'none', fontWeight: 700, fontSize: 14, color: 'white', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>}

        {/* Modal: Pay */}
        {modal === 'pay' && payId && <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', width: '100%' }}>
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Bayar {debts.find(d => d.id === payId)?.type === 'hutang' ? 'Hutang' : 'Piutang'}</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{debts.find(d => d.id === payId)?.name} — Sisa: {rp((debts.find(d => d.id === payId)?.amount || 0) - (debts.find(d => d.id === payId)?.paid || 0))}</p>
            <form onSubmit={payDebt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: 4 }}>JUMLAH BAYAR (Rp)</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} required placeholder="Jumlah" style={inp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setModal(null)} style={{ padding: 14, borderRadius: 12, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: 14, borderRadius: 12, background: '#10b981', border: 'none', fontWeight: 700, fontSize: 14, color: 'white', cursor: 'pointer' }}>Bayar</button>
              </div>
            </form>
          </div>
        </div>}
      </div>
    </>
  );
}
