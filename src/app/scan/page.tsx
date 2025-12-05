"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface QRData {
  studentId: number;
  studentName: string;
  timestamp: number;
}

function ScanContent() {
  const searchParams = useSearchParams();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [scannerName, setScannerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
    }));
    setSnowflakes(flakes);
  }, []);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setQrData(parsed);
      } catch (e) {
        setError("Invalid QR code data");
      }
    } else {
      setError("No QR code data found");
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // In a real app, you would save this to a database
    // For now, we'll just show a success message
    console.log("Scan recorded:", {
      student: qrData?.studentName,
      scannedBy: scannerName,
      timestamp: new Date().toISOString(),
    });
    
    setSubmitted(true);
  };

  if (error && !qrData) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {snowflakes.map((flake) => (
          <span
            key={flake.id}
            className="snowflake"
            style={{
              left: flake.left + "%",
              animationDelay: flake.delay + "s",
              animationDuration: flake.duration + "s",
            }}
          >
            ❄
          </span>
        ))}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300">{error}</p>
          <a href="/" className="mt-6 inline-block px-6 py-2 bg-green-600 hover:bg-green-700 rounded-full transition-all text-white">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {snowflakes.map((flake) => (
          <span
            key={flake.id}
            className="snowflake"
            style={{
              left: flake.left + "%",
              animationDelay: flake.delay + "s",
              animationDuration: flake.duration + "s",
            }}
          >
            ❄
          </span>
        ))}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🎉</span>
          <h1 className="text-3xl font-bold title-glow mb-4">Success!</h1>
          <p className="text-xl text-gray-300 mb-2">
            Thank you, <span className="text-green-400 font-semibold">{scannerName}</span>!
          </p>
          <p className="text-gray-400 mb-6">
            You have been paired with <span className="text-yellow-400 font-semibold">{qrData?.studentName}</span>
          </p>
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">Your Secret Santa assignment has been recorded.</p>
          </div>
          <a href="/" className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 rounded-full transition-all text-white">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left + "%",
            animationDelay: flake.delay + "s",
            animationDuration: flake.duration + "s",
          }}
        >
          ❄
        </span>
      ))}
      
      <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md w-full mx-4">
        <span className="text-6xl mb-4 block">🎅</span>
        <h1 className="text-3xl font-bold title-glow mb-2">
          🎄 Secret Santa 🎄
        </h1>
        <p className="text-gray-300 mb-6">
          You scanned the QR code for:
        </p>
        
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <p className="text-2xl font-bold text-yellow-400">
            {qrData?.studentName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-left text-gray-300 mb-2">
              Enter your name:
            </label>
            <input
              type="text"
              id="name"
              value={scannerName}
              onChange={(e) => setScannerName(e.target.value)}
              placeholder="Your name..."
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50"
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            className="christmas-btn w-full text-white text-lg font-bold py-3 px-6 rounded-full"
          >
            🎁 Submit My Name
          </button>
        </form>
        
        <p className="text-gray-500 text-sm mt-6">
          This will record that you scanned this QR code
        </p>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
