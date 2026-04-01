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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#f8fafc;color:#1f2937;-webkit-tap-highlight-color:transparent}input,select{-webkit-appearance:none;appearance:none}`}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 72 }}>

        {/* Header */}
        <header style={{ background: 'white', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'white' }}>A</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>ARIS</div>
              </div>
            </div>
            <button onClick={exportExcel} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>Export</button>
          </div>
        </header>

        <main style={{ padding: 16 }}>
          {/* HOME */}
          {tab === 'home' && <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Aset', val: totalAset, col: '#3b82f6' },
                { label: 'Kewajiban', val: totalKew, col: '#ef4444' },
                { label: 'Modal', val: totalModal, col: '#8b5cf6' },
                { label: 'Laba', val: laba, col: laba >= 0 ? '#10b981' : '#ef4444' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: 14, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.col }}>{rp(k.val)}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setModal('journal')} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>+ Jurnal</button>
              <button onClick={() => { setDType('hutang'); setModal('debt'); }} style={{ background: 'white', color: '#1f2937', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Hutang</button>
            </div>

            {/* Recent Journal */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>Jurnal Terakhir</span>
                <button onClick={() => { reload(); setTab('journal'); }} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Lihat Semua</button>
              </div>
              {journal.length > 0 ? [...journal].reverse().slice(0, 5).map(j => (
                <div key={j.id} style={{ padding: '12px 14px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{j.desc || j.debit.map(d => d.account).join(', ')}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{j.ref} · {j.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{short(j.debit.reduce((s, d) => s + d.amount, 0))}</div>
                </div>
              )) : <div style={{ padding: 30, textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>Belum ada jurnal</div>}
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
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{j.date}</span>
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
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around', padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', zIndex: 40 }}>
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
