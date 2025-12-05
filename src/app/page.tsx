"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface MatchData {
  email: string;
  santaMatch: string;
  scannedAt: string;
}

interface ProgressData {
  totalParticipants: number;
  completedScans: number;
  usedQRs: number;
  matches: MatchData[];
}

export default function Home() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [currentQrId, setCurrentQrId] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
    }));
    setSnowflakes(flakes);
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/scan");
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    }
  };

  const getAvailableQrIds = (): number[] => {
    if (!progress) return [1, 2];
    const usedIds = progress.matches.map(m => {
      const match = progress.matches.find(x => x.email === m.email);
      return match ? parseInt(String(m.santaMatch === "Michael Johnson" ? 1 : 2)) : 0;
    });
    const allIds = [1, 2];
    return allIds.filter(id => !progress.matches.some(m => 
      (id === 1 && m.santaMatch === "Michael Johnson") || 
      (id === 2 && m.santaMatch === "Sarah Parker")
    ));
  };

  const generateQR = async () => {
    // Find available QR IDs (not yet used)
    const availableIds = [1, 2].filter(id => {
      if (!progress) return true;
      return !progress.matches.some(m => {
        if (id === 1) return m.santaMatch === "Michael Johnson";
        if (id === 2) return m.santaMatch === "Sarah Parker";
        return false;
      });
    });

    if (availableIds.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const qrId = availableIds[randomIndex];

    const qrData = JSON.stringify({
      studentId: qrId,
      timestamp: Date.now(),
    });

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const scanUrl = baseUrl + "/scan?data=" + encodeURIComponent(qrData);

    try {
      const url = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#1a472a", light: "#ffffff" },
      });
      setQrCodeUrl(url);
      setQrGenerated(true);
      setCurrentQrId(qrId);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const resetDatabase = async () => {
    if (!confirm("Are you sure you want to reset all data?")) return;
    try {
      await fetch("/api/scan", { method: "DELETE" });
      setQrCodeUrl("");
      setQrGenerated(false);
      setCurrentQrId(null);
      fetchProgress();
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  };

  const completedCount = progress?.completedScans || 0;
  const totalCount = progress?.totalParticipants || 2;
  const allCompleted = completedCount >= totalCount;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {snowflakes.map((flake) => (
        <span key={flake.id} className="snowflake" style={{ left: flake.left + "%", animationDelay: flake.delay + "s", animationDuration: flake.duration + "s" }}>❄</span>
      ))}

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold title-glow mb-4">
            <span className="text-red-500">🎄</span> Secret Santa <span className="text-red-500">🎄</span>
          </h1>
          <p className="text-xl text-gray-300">Generate QR codes for Secret Santa matching!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: QR Generator */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 flex flex-col items-center">
            <div className="w-full mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{completedCount} / {totalCount} completed</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all duration-500" style={{ width: (completedCount / totalCount * 100) + "%" }} />
              </div>
            </div>

            <button onClick={generateQR} disabled={allCompleted} className="christmas-btn text-white text-xl font-bold py-4 px-10 rounded-full mb-6">
              🎲 Generate Random QR
            </button>

            {qrCodeUrl && qrGenerated && (
              <div className="qr-container text-center">
                <p className="text-gray-800 font-semibold mb-3 text-lg">🎁 Secret Santa QR Code</p>
                <img src={qrCodeUrl} alt="Secret Santa QR Code" className="mx-auto" />
                <p className="text-gray-600 text-sm mt-3">Scan to reveal your match!</p>
              </div>
            )}

            {!qrCodeUrl && (
              <div className="qr-container text-center opacity-50">
                <div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 px-4">Click to generate a QR code</p>
                </div>
              </div>
            )}

            {allCompleted && (
              <div className="mt-4 text-center">
                <p className="text-yellow-400 mb-4">🎉 All Secret Santas assigned!</p>
                <button onClick={resetDatabase} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white">Reset All</button>
              </div>
            )}
          </div>

          {/* Right: Completed List */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-green-400">✅</span> Completed Scans
            </h2>

            {progress && progress.matches.length > 0 ? (
              <div className="space-y-3">
                {progress.matches.map((match, idx) => (
                  <div key={idx} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{match.email}</p>
                      <p className="text-gray-400 text-sm">Matched with: <span className="text-yellow-400">{match.santaMatch}</span></p>
                    </div>
                    <span className="text-green-400 text-2xl">🎅</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No scans yet</p>
              </div>
            )}

            {progress && progress.matches.length > 0 && (
              <button onClick={resetDatabase} className="mt-6 w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-red-400">
                🗑️ Clear All Data
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-gray-400">
          <p>🌟 Merry Christmas! 🌟</p>
        </div>
      </div>
    </div>
  );
}
