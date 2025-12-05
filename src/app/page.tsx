"use client";
import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface MatchData { email: string; santaMatch: string; scannedAt: string; }
interface ProgressData { totalParticipants: number; completedScans: number; usedQRs: number; matches: MatchData[]; }

export default function Home() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 5, duration: 5 + Math.random() * 10 }));
    setSnowflakes(flakes);
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try { const res = await fetch("/api/scan"); const data = await res.json(); setProgress(data); } catch (err) { console.error("Failed:", err); }
  };

  const generateQR = async () => {
    const availableIds = [1, 2].filter(id => {
      if (!progress) return true;
      return !progress.matches.some(m => (id === 1 && m.santaMatch === "Michael Johnson") || (id === 2 && m.santaMatch === "Sarah Parker"));
    });
    if (availableIds.length === 0) return;
    const qrId = availableIds[Math.floor(Math.random() * availableIds.length)];
    const qrData = JSON.stringify({ studentId: qrId, timestamp: Date.now() });
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const scanUrl = baseUrl + "/scan?data=" + encodeURIComponent(qrData);
    try {
      const url = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2, color: { dark: "#1a472a", light: "#ffffff" } });
      setQrCodeUrl(url);
      setQrGenerated(true);
    } catch (err) { console.error("Error:", err); }
  };

  const completedCount = progress?.completedScans || 0;
  const totalCount = progress?.totalParticipants || 2;
  const allCompleted = completedCount >= totalCount;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {snowflakes.map((f) => <span key={f.id} className="snowflake" style={{ left: f.left + "%", animationDelay: f.delay + "s", animationDuration: f.duration + "s" }}>❄</span>)}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold title-glow mb-4"><span className="text-red-500">🎄</span> Secret Santa <span className="text-red-500">🎄</span></h1>
          <p className="text-xl text-gray-300">Generate QR codes for Secret Santa matching!</p>
        </div>
        <div className="max-w-lg mx-auto">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 flex flex-col items-center">
            <div className="w-full mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2"><span>Progress</span><span>{completedCount} / {totalCount} completed</span></div>
              <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all" style={{ width: (completedCount / totalCount * 100) + "%" }} /></div>
            </div>
            <button onClick={generateQR} disabled={allCompleted} className="christmas-btn text-white text-xl font-bold py-4 px-10 rounded-full mb-6">🎲 Generate Random QR</button>
            {qrCodeUrl && qrGenerated && (
              <div className="qr-container text-center">
                <p className="text-gray-800 font-semibold mb-3 text-lg">🎁 Secret Santa QR Code</p>
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                <p className="text-gray-600 text-sm mt-3">Scan to reveal your match!</p>
              </div>
            )}
            {!qrCodeUrl && <div className="qr-container text-center opacity-50"><div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"><p className="text-gray-500 px-4">Click to generate a QR code</p></div></div>}
            {allCompleted && <p className="text-yellow-400 mt-4">🎉 All Secret Santas assigned!</p>}
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">🔐 Admin</a>
        </div>
        <div className="text-center mt-4 text-gray-400"><p>🌟 Merry Christmas! 🌟</p></div>
      </div>
    </div>
  );
}
