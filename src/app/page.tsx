"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";

interface MatchData { email: string; santaMatch: string; scannedAt: string; }
interface ProgressData { totalParticipants: number; totalEmails: number; totalSantas: number; completedScans: number; matches: MatchData[]; }

export default function Home() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const lastMatchCountRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fireCrackers = useCallback(() => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#ff0000", "#00ff00", "#ffd700", "#ff6b6b", "#4ecdc4", "#ffffff"];

    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: colors
    });

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });
    }, 1500);
  }, []);

  const triggerCelebration = useCallback(() => {
    setCelebrating(true);
    fireCrackers();
    setTimeout(() => setCelebrating(false), 6000);
  }, [fireCrackers]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/scan");
      const data = await res.json();
      const currentCount = data.completedScans;

      if (isFirstFetch.current) {
        isFirstFetch.current = false;
        lastMatchCountRef.current = currentCount;
      } else if (currentCount > (lastMatchCountRef.current || 0)) {
        triggerCelebration();
        lastMatchCountRef.current = currentCount;
      }

      setProgress(data);
    } catch (err) { console.error("Failed:", err); }
  }, [triggerCelebration]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 5, duration: 5 + Math.random() * 10 }));
    setSnowflakes(flakes);
    fetchData();

    pollInterval.current = setInterval(fetchData, 3000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [fetchData]);

  const generateQR = async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const scanUrl = baseUrl + "/scan";
    try {
      const url = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2, color: { dark: "#1a472a", light: "#ffffff" } });
      setQrCodeUrl(url);
      setQrGenerated(true);
    } catch (err) { console.error("Error:", err); }
  };

  const completedCount = progress?.completedScans || 0;
  const totalSantas = progress?.totalSantas || 0;
  const totalEmails = progress?.totalEmails || 0;
  const totalCount = Math.min(totalSantas, totalEmails);
  const allCompleted = totalCount > 0 && completedCount >= totalCount;
  const availableSantas = totalSantas - completedCount;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {snowflakes.map((f) => <span key={f.id} className="snowflake" style={{ left: f.left + "%", animationDelay: f.delay + "s", animationDuration: f.duration + "s" }}>&#10052;</span>)}

      {celebrating && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-10 text-center border-4 border-yellow-400 shadow-2xl animate-bounce">
            <p className="text-6xl mb-4">&#127881;&#127882;&#127881;</p>
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">Congratulations!</h2>
            <p className="text-2xl text-green-400 mb-2">Match Found!</p>
            <p className="text-white">Someone got their Secret Santa!</p>
            <p className="text-5xl mt-4">&#127877;&#127873;&#127876;</p>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold title-glow mb-4"><span className="text-red-500">&#127876;</span> Secret Santa <span className="text-red-500">&#127876;</span></h1>
          <p className="text-xl text-gray-300">Scan the QR code to get your Secret Santa match!</p>
        </div>
        <div className="max-w-lg mx-auto">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 flex flex-col items-center">
            <div className="w-full mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress <span className="text-green-400 text-xs">(live)</span></span>
                <span>{completedCount} / {totalCount} matched</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all" style={{ width: totalCount > 0 ? (completedCount / totalCount * 100) + "%" : "0%" }} /></div>
              {availableSantas > 0 && <p className="text-gray-500 text-sm mt-2">{availableSantas} santa matches available</p>}
            </div>

            {totalCount === 0 ? (
              <p className="text-gray-400 mb-6">No data yet. Add emails and santa names in Admin.</p>
            ) : allCompleted ? (
              <div className="text-center mb-6">
                <p className="text-yellow-400 text-2xl mb-2">&#127881; All Secret Santas assigned!</p>
                <p className="text-green-400">Event complete - {completedCount} matches made</p>
              </div>
            ) : (
              <button onClick={generateQR} className="christmas-btn text-white text-xl font-bold py-4 px-10 rounded-full mb-6">&#127922; Generate QR Code</button>
            )}
            {qrCodeUrl && qrGenerated && !allCompleted && (
              <div className="qr-container text-center">
                <p className="text-gray-800 font-semibold mb-3 text-lg">&#127873; Scan to get your match!</p>
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                <p className="text-gray-600 text-sm mt-3">Enter your email to reveal your Secret Santa</p>
              </div>
            )}
            {!qrCodeUrl && totalCount > 0 && !allCompleted && <div className="qr-container text-center opacity-50"><div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg"><p className="text-gray-500 px-4">Click to generate a QR code</p></div></div>}
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">&#128274; Admin</a>
        </div>
        <div className="text-center mt-4 text-gray-400"><p>&#127775; Merry Christmas! &#127775;</p></div>
      </div>
    </div>
  );
}
