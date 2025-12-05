"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ScanContent() {
  const searchParams = useSearchParams();
  const [qrId, setQrId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [santaMatch, setSantaMatch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");
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
        setQrId(parsed.studentId);
      } catch (e) {
        setError("Invalid QR code");
        setErrorType("invalid_qr");
      }
    } else {
      setError("No QR code data found");
      setErrorType("no_qr");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");
    setErrorType("");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), qrId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorType(data.error);
        setError(data.message);
        if (data.existingMatch) {
          setExistingMatch(data.existingMatch);
        }
        setIsLoading(false);
        return;
      }

      setSantaMatch(data.santaMatch);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
      setErrorType("network_error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSnowflakes = () => snowflakes.map((flake) => (
    <span key={flake.id} className="snowflake" style={{ left: flake.left + "%", animationDelay: flake.delay + "s", animationDuration: flake.duration + "s" }}>❄</span>
  ));

  if (errorType === "invalid_qr" || errorType === "no_qr") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Invalid QR Code</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (errorType === "qr_used") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-3xl font-bold text-red-400 mb-4">QR Code Expired!</h1>
          <p className="text-gray-300 mb-4">This QR code has already been used.</p>
        </div>
      </div>
    );
  }

  if (errorType === "invalid_email") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Not Registered</h1>
          <p className="text-gray-400 mb-4">This email is not registered for Secret Santa.</p>
          <button onClick={() => { setErrorType(""); setError(""); }} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-full text-white">Try Again</button>
        </div>
      </div>
    );
  }

  if (errorType === "already_scanned") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🚫</span>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Already Scanned!</h1>
          <p className="text-gray-300 mb-4">You have already participated.</p>
          {existingMatch && (
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">Your match:</p>
              <p className="text-xl font-bold text-green-400">{existingMatch}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted && santaMatch) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">🎉</span>
          <h1 className="text-3xl font-bold title-glow mb-4">Success!</h1>
          <p className="text-gray-400 mb-6">Your Secret Santa match is:</p>
          <div className="bg-white/10 rounded-lg p-6 mb-6">
            <p className="text-3xl font-bold text-yellow-400">{santaMatch}</p>
          </div>
          <p className="text-gray-500 text-sm">Keep it a secret! 🤫</p>
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
            <label htmlFor="email" className="block text-left text-gray-300 mb-2">Enter your email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@company.com" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400" disabled={isLoading} />
          </div>
          {error && !errorType && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading} className="christmas-btn w-full text-white text-lg font-bold py-3 px-6 rounded-full disabled:opacity-50">
            {isLoading ? "Checking..." : "🎁 Reveal My Match"}
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-6">Use your registered email</p>
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
