"use client";

import { useState, useEffect } from "react";

interface Participant {
  id: string;
  email: string;
  santaName: string;
  qrId: number;
}

interface MatchData {
  email: string;
  santaMatch: string;
  scannedAt: string;
}

interface ProgressData {
  totalParticipants: number;
  completedScans: number;
  matches: MatchData[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newSantaName, setNewSantaName] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 10,
    }));
    setSnowflakes(flakes);

    const saved = sessionStorage.getItem("adminLoggedIn");
    if (saved === "true") {
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [progressRes, participantsRes] = await Promise.all([
        fetch("/api/scan"),
        fetch("/api/participants")
      ]);
      const progressData = await progressRes.json();
      const participantsData = await participantsRes.json();
      setProgress(progressData);
      setParticipants(participantsData.participants || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
        sessionStorage.setItem("adminLoggedIn", "true");
        fetchData();
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), santaName: newSantaName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setAddSuccess("Participant added successfully!");
        setNewEmail("");
        setNewSantaName("");
        fetchData();
      } else {
        setAddError(data.error || "Failed to add participant");
      }
    } catch (err) {
      setAddError("Failed to add participant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearScans = async () => {
    if (!confirm("Are you sure you want to clear all scan data?")) return;

    try {
      await fetch("/api/scan", { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to clear scans:", err);
    }
  };

  const handleClearParticipants = async () => {
    if (!confirm("Are you sure you want to clear all participants? This will also clear scan data.")) return;

    try {
      await Promise.all([
        fetch("/api/participants", { method: "DELETE" }),
        fetch("/api/scan", { method: "DELETE" })
      ]);
      fetchData();
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("adminLoggedIn");
    setPassword("");
  };

  const renderSnowflakes = () => snowflakes.map((flake) => (
    <span key={flake.id} className="snowflake" style={{ left: flake.left + "%", animationDelay: flake.delay + "s", animationDuration: flake.duration + "s" }}>&#10052;</span>
  ));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 w-full max-w-md mx-4">
          <h1 className="text-3xl font-bold title-glow text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
                placeholder="Enter admin password"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="christmas-btn w-full text-white font-bold py-3 px-6 rounded-full">
              Login
            </button>
          </form>
          <div className="text-center mt-4">
            <a href="/" className="text-gray-500 hover:text-gray-300 text-sm">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {renderSnowflakes()}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold title-glow">Admin Dashboard</h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Participant Form */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Add Participant</h2>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Email:</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
                  placeholder="participant@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Santa Match Name:</label>
                <input
                  type="text"
                  value={newSantaName}
                  onChange={(e) => setNewSantaName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
                  placeholder="John Doe"
                  required
                />
              </div>
              {addError && <p className="text-red-400 text-sm">{addError}</p>}
              {addSuccess && <p className="text-green-400 text-sm">{addSuccess}</p>}
              <button type="submit" disabled={isLoading} className="christmas-btn w-full text-white font-bold py-3 px-6 rounded-full disabled:opacity-50">
                {isLoading ? "Adding..." : "Add Participant"}
              </button>
            </form>
          </div>

          {/* Statistics */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Total Participants:</span>
                <span className="text-white font-bold">{progress?.totalParticipants || 0}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Completed Scans:</span>
                <span className="text-white font-bold">{progress?.completedScans || 0}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all"
                  style={{ width: progress ? (progress.completedScans / (progress.totalParticipants || 1) * 100) + "%" : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="mt-6 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-400">Participants ({participants.length})</h2>
            <button onClick={handleClearParticipants} className="px-4 py-2 bg-red-600/50 hover:bg-red-600 rounded-lg text-white text-sm">
              Clear All Participants
            </button>
          </div>
          {participants.length === 0 ? (
            <p className="text-gray-500">No participants added yet.</p>
          ) : (
            <div className="grid gap-2">
              {participants.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                  <div>
                    <span className="text-white">{p.email}</span>
                    <span className="text-gray-500 mx-2">→</span>
                    <span className="text-green-400">{p.santaName}</span>
                  </div>
                  <span className="text-gray-500 text-sm">QR #{p.qrId}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Matches */}
        <div className="mt-6 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-purple-400">Completed Matches ({progress?.matches?.length || 0})</h2>
            <button onClick={handleClearScans} className="px-4 py-2 bg-orange-600/50 hover:bg-orange-600 rounded-lg text-white text-sm">
              Clear Scan Data
            </button>
          </div>
          {!progress?.matches || progress.matches.length === 0 ? (
            <p className="text-gray-500">No matches completed yet.</p>
          ) : (
            <div className="grid gap-2">
              {progress.matches.map((m, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                  <div>
                    <span className="text-white">{m.email}</span>
                    <span className="text-gray-500 mx-2">matched with</span>
                    <span className="text-yellow-400">{m.santaMatch}</span>
                  </div>
                  <span className="text-gray-500 text-sm">{new Date(m.scannedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-gray-500 hover:text-gray-300">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
