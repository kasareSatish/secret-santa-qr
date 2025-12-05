"use client";
import { useState, useEffect } from "react";
interface MatchData { email: string; santaMatch: string; scannedAt: string; }
interface ProgressData { totalParticipants: number; completedScans: number; usedQRs: number; matches: MatchData[]; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 30 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 5, duration: 5 + Math.random() * 10 }));
    setSnowflakes(flakes);
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") { setIsLoggedIn(true); fetchProgress(); }
  }, []);

  const fetchProgress = async () => {
    try { const res = await fetch("/api/scan"); const data = await res.json(); setProgress(data); } catch (err) { console.error("Failed:", err); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (res.ok) { sessionStorage.setItem("adminAuth", "true"); setIsLoggedIn(true); fetchProgress(); } 
      else { setError(data.message || "Invalid password"); }
    } catch (err) { setError("Failed to login"); } finally { setIsLoading(false); }
  };

  const handleLogout = () => { sessionStorage.removeItem("adminAuth"); setIsLoggedIn(false); };
  const resetDatabase = async () => { if (!confirm("Delete ALL data?")) return; try { await fetch("/api/scan", { method: "DELETE" }); fetchProgress(); } catch (err) { console.error("Failed:", err); } };
  const renderSnowflakes = () => snowflakes.map((f) => <span key={f.id} className="snowflake" style={{ left: f.left + "%", animationDelay: f.delay + "s", animationDuration: f.duration + "s" }}>❄</span>);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderSnowflakes()}
        <div className="relative z-10 bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 text-center max-w-md w-full mx-4">
          <span className="text-6xl mb-4 block">🔐</span>
          <h1 className="text-3xl font-bold title-glow mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500" disabled={isLoading} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isLoading} className="christmas-btn w-full text-white text-lg font-bold py-3 px-6 rounded-full">{isLoading ? "..." : "🎅 Login"}</button>
          </form>
          <a href="/" className="mt-6 inline-block text-gray-400 hover:text-white">Back to Home</a>
        </div>
      </div>
    );
  }

  const completedCount = progress?.completedScans || 0;
  const totalCount = progress?.totalParticipants || 2;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {renderSnowflakes()}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold title-glow">🎄 Admin Dashboard 🎄</h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">Logout</button>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">📊 Statistics</h2>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">Progress</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 bg-white/10 rounded-full h-4"><div className="bg-gradient-to-r from-green-500 to-red-500 h-4 rounded-full" style={{ width: (completedCount / totalCount * 100) + "%" }} /></div>
                <span className="text-xl font-bold text-white">{completedCount}/{totalCount}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-green-400">{completedCount}</p><p className="text-gray-400 text-sm">Completed</p></div>
              <div className="bg-white/10 rounded-lg p-4 text-center"><p className="text-3xl font-bold text-yellow-400">{totalCount - completedCount}</p><p className="text-gray-400 text-sm">Remaining</p></div>
            </div>
          </div>
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">⚙️ Actions</h2>
            <div className="space-y-4">
              <a href="/" className="block w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white text-center font-semibold">🎲 Go to QR Generator</a>
              <button onClick={fetchProgress} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">🔄 Refresh Data</button>
              <button onClick={resetDatabase} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold">🗑️ Clear All Data</button>
            </div>
          </div>
          <div className="md:col-span-2 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4">✅ Completed Scans</h2>
            {progress && progress.matches.length > 0 ? (
              <table className="w-full"><thead><tr className="text-left text-gray-400 border-b border-white/10"><th className="pb-3">#</th><th className="pb-3">Email</th><th className="pb-3">Match</th><th className="pb-3">Time</th></tr></thead>
              <tbody>{progress.matches.map((m, i) => <tr key={i} className="border-b border-white/5"><td className="py-3 text-gray-500">{i+1}</td><td className="py-3 text-white">{m.email}</td><td className="py-3 text-yellow-400">{m.santaMatch}</td><td className="py-3 text-gray-400">{new Date(m.scannedAt).toLocaleString()}</td></tr>)}</tbody></table>
            ) : <div className="text-center py-8 text-gray-500"><p className="text-4xl mb-2">📭</p><p>No scans yet</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
