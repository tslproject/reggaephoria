import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { storage } from '../services/storage';
import { soundEffects } from '../services/sound';
import { GateScanRecord, AttendeeTicket, Order } from '../types';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Keyboard,
  RefreshCw,
  Users,
  ShieldCheck,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Flame,
  ShieldAlert,
  Ban,
} from 'lucide-react';

interface GateScannerViewProps {
  onOpenTicket?: (orderId: string) => void;
}

export const GateScannerView: React.FC<GateScannerViewProps> = ({ onOpenTicket }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState<string>('');

  // Audio mute toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Verification result modal/card
  const [lastResult, setLastResult] = useState<{
    status: 'VALID' | 'ALREADY_USED' | 'INVALID';
    message: string;
    ticket?: AttendeeTicket;
    order?: Order;
    record: GateScanRecord;
  } | null>(null);

  // Scan activity log
  const [scanHistory, setScanHistory] = useState<GateScanRecord[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalTickets: 0,
    usedTickets: 0,
    remainingTickets: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const updateStats = () => {
    const orders = storage.getOrders().filter((o) => o.status === 'approved');
    let total = 0;
    let used = 0;

    orders.forEach((o) => {
      if (o.tickets) {
        total += o.tickets.length;
        used += o.tickets.filter((t) => t.isUsed || t.status === 'USED').length;
      }
    });

    setStats({
      totalTickets: total,
      usedTickets: used,
      remainingTickets: Math.max(0, total - used),
    });
    setScanHistory(storage.getGateScanRecords());
  };

  useEffect(() => {
    updateStats();
    const unsub = storage.subscribe(() => {
      updateStats();
    });
    return () => unsub();
  }, []);

  // Camera stream handler
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser tidak mendukung akses kamera langsung');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          isScanningRef.current = true;
          scanVideoFrame();
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Camera error:', error);
        setCameraError(
          error.message || 'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.'
        );
        setCameraActive(false);
      }
    };

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, facingMode]);

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Video frame decoder using jsQR
  const scanVideoFrame = () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleProcessCode(code.data);
          isScanningRef.current = false;
          setTimeout(() => {
            isScanningRef.current = true;
            scanVideoFrame();
          }, 2500);
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleProcessCode = (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    // Validate in storage
    const result = storage.validateAndCheckInTicket(trimmed, 'Staf Gate Utama');
    setLastResult(result);
    updateStats();

    // Sound alert
    if (soundEnabled) {
      if (result.status === 'VALID') {
        soundEffects.playSuccess();
      } else if (result.status === 'ALREADY_USED') {
        soundEffects.playWarning();
      } else {
        soundEffects.playError();
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode);
    setManualCode('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleProcessCode(code.data);
          } else {
            alert('Tidak dapat mendeteksi QR Code dari gambar yang diunggah.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 font-mono space-y-4">
      {/* Header Banner Brutalist */}
      <div className="bg-black border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_#16a34a] relative">
        <div className="reggae-stripe-h h-2.5 w-full mb-3" />
        <div className="flex items-center justify-between">
          <span className="bg-green-500 text-black font-black text-[10px] px-2.5 py-0.5 border-2 border-black uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            GATE ENTRANCE • REGGAEPHORIA TANGSEL
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="px-2.5 py-1 bg-yellow-400 text-black border-2 border-black text-xs font-black uppercase flex items-center gap-1 brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>BEEP: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-2">
          SCANNER VERIFIKASI PENGUNJUNG
        </h1>
        <p className="text-xs text-zinc-300 mt-1 uppercase">
          OFFICIAL REGGAE TICKETING • Arahkan kamera ke QR code tiket digital pengunjung.
        </p>
      </div>

      {/* Stats Counter Bar (Brutalist 3-Box) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-400 text-black p-3 border-3 border-black shadow-[3px_3px_0px_#000] text-center">
          <span className="text-[10px] font-black uppercase block">TOTAL TIKET</span>
          <span className="text-xl font-black">{stats.totalTickets}</span>
        </div>
        <div className="bg-green-500 text-black p-3 border-3 border-black shadow-[3px_3px_0px_#000] text-center">
          <span className="text-[10px] font-black uppercase block">CHECK-IN</span>
          <span className="text-xl font-black">{stats.usedTickets}</span>
        </div>
        <div className="bg-red-600 text-white p-3 border-3 border-black shadow-[3px_3px_0px_#000] text-center">
          <span className="text-[10px] font-black uppercase block">SISA MASUK</span>
          <span className="text-xl font-black">{stats.remainingTickets}</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab('camera')}
          className={`py-2.5 border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-1.5 brutal-btn ${
            activeTab === 'camera'
              ? 'bg-yellow-400 text-black shadow-[3px_3px_0px_#000]'
              : 'bg-black text-zinc-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>KAMERA</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`py-2.5 border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-1.5 brutal-btn ${
            activeTab === 'manual'
              ? 'bg-yellow-400 text-black shadow-[3px_3px_0px_#000]'
              : 'bg-black text-zinc-400 hover:text-white'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>KETIK KODE</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`py-2.5 border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-1.5 brutal-btn ${
            activeTab === 'upload'
              ? 'bg-yellow-400 text-black shadow-[3px_3px_0px_#000]'
              : 'bg-black text-zinc-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>FOTO QR</span>
        </button>
      </div>

      {/* Scanner Viewport Box */}
      <div className="bg-black border-4 border-black shadow-[6px_6px_0px_#000] overflow-hidden relative">
        {activeTab === 'camera' && (
          <div className="relative aspect-video max-h-80 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Brutalist Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-yellow-400 relative">
                {/* Red Scanning Beam Line */}
                <div className="absolute inset-x-0 top-0 h-1 bg-red-600 shadow-[0_0_8px_#ef4444] animate-bounce" />
                <div className="absolute top-1 left-1 text-[9px] font-black bg-black text-yellow-400 px-1 border border-black uppercase">
                  SCAN ZONE
                </div>
              </div>
            </div>

            {/* Flip camera */}
            <button
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="absolute bottom-3 right-3 p-2 bg-yellow-400 text-black border-2 border-black font-black brutal-btn shadow-[2px_2px_0px_#000]"
              title="Balik Kamera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {cameraError && (
              <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center text-xs text-red-400">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="font-black uppercase">{cameraError}</p>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase">
                  Gunakan mode &quot;Ketik Kode&quot; atau &quot;Foto QR&quot; di atas jika kamera tidak tersedia.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="p-5">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-black uppercase text-yellow-400">
                INPUT KODE TIKET SECARA MANUAL:
              </label>
              <input
                type="text"
                placeholder="CONTOH: RST-TICKET-0000001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3.5 py-3 bg-zinc-950 border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-xs tracking-wider brutal-btn shadow-[3px_3px_0px_#000]"
              >
                VERIFIKASI TIKET
              </button>
            </form>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="p-6 text-center">
            <label className="flex flex-col items-center justify-center cursor-pointer p-6 border-3 border-dashed border-zinc-700 hover:border-yellow-400 bg-zinc-950">
              <Upload className="w-10 h-10 text-yellow-400 mb-2" />
              <span className="text-xs font-black uppercase text-white">
                PILIH FOTO SCREENSHOT QR DARI HP
              </span>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase">JPG, PNG, WEBP</p>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Result Outcome Display Brutalist */}
      {lastResult && (
        <div
          className={`p-4 border-4 border-black shadow-[6px_6px_0px_#000] space-y-3 ${
            lastResult.status === 'VALID'
              ? 'bg-green-500 text-black'
              : lastResult.status === 'ALREADY_USED'
              ? 'bg-yellow-400 text-black'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.status === 'VALID' && <CheckCircle2 className="w-6 h-6 shrink-0" />}
            {lastResult.status === 'ALREADY_USED' && <AlertTriangle className="w-6 h-6 shrink-0" />}
            {lastResult.status === 'BLOCKED' && <ShieldAlert className="w-7 h-7 text-white shrink-0 animate-bounce" />}
            {lastResult.status === 'INVALID' && <XCircle className="w-6 h-6 shrink-0" />}
            <div>
              <h3 className="text-base font-black uppercase tracking-tight leading-none">
                {lastResult.message}
              </h3>
            </div>
          </div>

          {lastResult.ticket && (
            <div className="p-3 bg-black text-white border-2 border-black space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase text-[10px]">PEMEGANG:</span>
                <span className="font-black text-yellow-400 uppercase">
                  {lastResult.ticket.attendeeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase text-[10px]">KATEGORI:</span>
                <span className="font-bold uppercase">{lastResult.ticket.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase text-[10px]">KODE TIKET:</span>
                <span className="font-mono text-green-400 font-black">
                  {lastResult.ticket.ticketCode}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan Activity Log */}
      <div className="bg-black border-3 border-black p-4 shadow-[4px_4px_0px_#000] space-y-2">
        <span className="text-xs font-black uppercase text-yellow-400 block border-b border-zinc-800 pb-1.5">
          RIWAYAT SCAN MASUK GATE ({scanHistory.length}):
        </span>

        {scanHistory.length === 0 ? (
          <p className="text-[11px] text-zinc-500 uppercase py-2">Belum ada aktivitas scan pada sesi ini.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {scanHistory.slice(0, 15).map((rec) => (
              <div
                key={rec.id}
                className="p-2 bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px]"
              >
                <div>
                  <span className="font-black text-white uppercase">{rec.attendeeName || '-'}</span>
                  <span className="text-zinc-400 text-[10px] ml-2 font-mono">
                    {rec.ticketCode}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black ${
                    rec.status === 'VALID'
                      ? 'bg-green-500 text-black'
                      : rec.status === 'ALREADY_USED'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
