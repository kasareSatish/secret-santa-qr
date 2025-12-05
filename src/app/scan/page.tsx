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
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  const [existingMatch, setExistingMatch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scannerName: scannerName.trim(),
          studentId: qrData?.studentId,
          studentName: qrData?.studentName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "already_scanned") {
          setAlreadyScanned(true);
          setExistingMatch(data.existingMatch || "");
        } else {
          setError(data.message || "Something went wrong");
        }
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSnowflakes = () => snowflakes.map((flake) => (
    <span key={flake.id} className="snowflake" style={{ left: flake.left + "%", animationDelay: flake.delay + "s", animationDuration: flake.duration + "s" }}>❄</span>
  ));

  if (error && !qrData) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (alreadyScanned) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Already Scanned!</h1>
          <p className="text-xl text-gray-300 mb-2">Sorry <span className="text-yellow-400 font-semibold">{scannerName}</span>,</p>
          <p className="text-gray-400 mb-4">You have already scanned a QR code.</p>
          {existingMatch && (
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Your existing match:</p>
              <p className="text-xl font-bold text-green-400">{existingMatch}</p>
            </div>
          )}
          <p className="text-gray-500 text-sm">Each person can only scan one QR code!</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🎉</span>
          <h1 className="text-3xl font-bold title-glow mb-4">Success!</h1>
          <p className="text-xl text-gray-300 mb-2">Thank you, <span className="text-green-400 font-semibold">{scannerName}</span>!</p>
          <p className="text-gray-400 mb-6">You are the Secret Santa for:</p>
          <div className="bg-white/10 rounded-lg p-6 mb-6">
            <p className="text-3xl font-bold text-yellow-400">{qrData?.studentName}</p>
          </div>
          <p className="text-gray-500 text-sm">Remember to keep it a secret! 🤫</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {renderSnowflakes()}
      <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md w-full mx-4">
        <span className="text-6xl mb-4 block">🎅</span>
        <h1 className="text-3xl font-bold title-glow mb-6">🎄 Secret Santa 🎄</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-left text-gray-300 mb-2">Enter your name to reveal your match:</label>
            <input type="text" id="name" value={scannerName} onChange={(e) => setScannerName(e.target.value)} placeholder="Your name..." className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400" disabled={isLoading} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading} className="christmas-btn w-full text-white text-lg font-bold py-3 px-6 rounded-full disabled:opacity-50">
            {isLoading ? "Checking..." : "🎁 Reveal My Match"}
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-6">You can only scan one QR code per person!</p>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-2xl text-white">Loading...</div></div>}>
      <ScanContent />
    </Suspense>
  );
}
