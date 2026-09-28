'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Result = { result: string; checkedIn?: boolean; ticket?: { ticketCode: string; name: string; event?: string; product?: string } };
export default function Scanner() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [readerCycle, setReaderCycle] = useState(0);
  const busyRef = useRef(false);
  const regionId = `rgt-reader-${readerCycle}`;
  const validate = useCallback(async (ticketCode: string) => {
    if (busyRef.current || !ticketCode.trim()) return;
    busyRef.current = true;
    setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/gate/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketCode }) });
      setResult(await response.json()); setCode(ticketCode);
    } catch { setResult({ result: 'ERROR' }); }
    finally { busyRef.current = false; setBusy(false); }
  }, []);
  useEffect(() => {
    let alive = true;
    let reader: { clear: () => void | Promise<void> } | null = null;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!alive) return;
      const instance = new Html5QrcodeScanner(regionId, { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true }, false);
      instance.render((decoded) => { void validate(decoded); void instance.clear(); }, () => {});
      reader = instance;
    }).catch(() => setResult({ result: 'CAMERA_ERROR' }));
    return () => { alive = false; if (reader) void reader.clear(); };
  }, [readerCycle, validate]);
  const checkIn = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/gate/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketCode: code, checkIn: true }) });
      setResult({ ...(await response.json()), checkedIn: true });
    } catch { setResult({ result: 'ERROR' }); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const scanNext = () => { busyRef.current = false; setCode(''); setResult(null); setReaderCycle((cycle) => cycle + 1); };
  const valid = result?.result === 'VALID' && !result.checkedIn;
  const color = result?.result === 'VALID' ? 'text-[#d8ff45]' : result?.result === 'ALREADY_USED' ? 'text-yellow-300' : result ? 'text-red-300' : 'text-white';
  return <div className="space-y-5"><section className="card"><div id={regionId} className="overflow-hidden rounded-xl"/><p className="muted mt-3 text-sm">Izinkan akses kamera, lalu posisikan QR tiket di dalam kotak. Check-in membuat tiket tidak dapat digunakan kembali.</p></section><form className="card flex gap-3" onSubmit={(event) => { event.preventDefault(); void validate(code); }}><input aria-label="Kode tiket" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Atau masukkan kode tiket"/><button disabled={busy}>Periksa</button></form>{result && <section className="card space-y-3"><p className={`text-3xl font-black ${color}`}>{result.result}</p>{result.ticket && <p>{result.ticket.name} · {result.ticket.event} · {result.ticket.product}</p>}{valid && <button disabled={busy} onClick={() => void checkIn()}>CHECK IN</button>}{(result.checkedIn || result.result !== 'VALID') && <button disabled={busy} onClick={scanNext}>SCAN TIKET BERIKUTNYA</button>}</section>}</div>;
}
