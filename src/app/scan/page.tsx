"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

export default function ScanPage() {
  const [email, setEmail] = useState("");
  const [santaMatch, setSantaMatch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  const fireCelebration = () => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#ff0000", "#00ff00", "#ffd700", "#ff6b6b", "#4ecdc4", "#ffffff"];

    // Big initial burst
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: colors
    });

    // Continuous side bursts
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
    }));
    setSnowflakes(flakes);
  }, []);

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
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorType(data.error);
        setError(data.message);
        setIsLoading(false);
        return;
      }

      setSantaMatch(data.santaMatch);
      setSubmitted(true);
      setTimeout(() => fireCelebration(), 300);
    } catch (err) {
      setError("Failed to submit. Please try again.");
      setErrorType("network_error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSnowflakes = () => snowflakes.map((flake) => (
    <span key={flake.id} className="snowflake" style={{ left: flake.left + "%", animationDelay: flake.delay + "s", animationDuration: flake.duration + "s" }}>&#10052;</span>
  ));

  if (errorType === "invalid_email") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">&#128683;</span>
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
          <span className="text-6xl mb-4 block">&#128683;</span>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Already Registered!</h1>
          <p className="text-gray-300 mb-4">You have already participated in Secret Santa.</p>
        </div>
      </div>
    );
  }

  if (errorType === "no_santas") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">&#128533;</span>
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">No Matches Left</h1>
          <p className="text-gray-300 mb-4">All Secret Santa matches have been assigned!</p>
        </div>
      </div>
    );
  }

  if (submitted && santaMatch) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <span className="text-6xl mb-4 block">&#127881;&#127873;&#127881;</span>
          <h1 className="text-4xl font-bold title-glow mb-2">Congratulations!</h1>
          <p className="text-gray-400 mb-6">Your Secret Santa match is:</p>
          <div className="bg-gradient-to-r from-green-600/20 to-red-600/20 rounded-xl p-8 mb-6 border border-yellow-500/50">
            <p className="text-4xl font-bold text-yellow-400">{santaMatch}</p>
          </div>
          <p className="text-gray-500 text-sm">Keep it a secret! &#129323;</p>
          <p className="text-green-400 text-xs mt-4">&#127876; Merry Christmas! &#127876;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {renderSnowflakes()}
      <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md w-full mx-4">
        <span className="text-6xl mb-4 block">&#127877;</span>
        <h1 className="text-3xl font-bold title-glow mb-6">&#127876; Secret Santa &#127876;</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-left text-gray-300 mb-2">Enter your email:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@company.com" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400" disabled={isLoading} />
          </div>
          {error && !errorType && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading} className="christmas-btn w-full text-white text-lg font-bold py-3 px-6 rounded-full disabled:opacity-50">
            {isLoading ? "Finding your match..." : "&#127873; Reveal My Match"}
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-6">Use your registered email</p>
      </div>
    </div>
  );
}
