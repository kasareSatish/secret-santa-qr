"use client";

import { useState, useEffect } from "react";

interface EmailData { id: string; email: string; }
interface SantaData { id: string; name: string; email: string; assigned: boolean; }
interface MatchData { email: string; santaMatch: string; scannedAt: string; }
interface ProgressData { totalParticipants: number; totalEmails: number; totalSantas: number; completedScans: number; matches: MatchData[]; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [santaNames, setSantaNames] = useState<SantaData[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newSantaName, setNewSantaName] = useState("");
  const [newSantaEmail, setNewSantaEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminLoggedIn");
    if (saved === "true") { setIsLoggedIn(true); fetchData(); }
  }, []);

  const fetchData = async () => {
    try {
      const [progressRes, participantsRes] = await Promise.all([fetch("/api/scan"), fetch("/api/participants")]);
      const progressData = await progressRes.json();
      const participantsData = await participantsRes.json();
      setProgress(progressData);
      setEmails(participantsData.emails || []);
      setSantaNames(participantsData.santaNames || []);
    } catch (err) { console.error("Failed:", err); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (res.ok) { setIsLoggedIn(true); sessionStorage.setItem("adminLoggedIn", "true"); fetchData(); }
      else { setError("Invalid password"); }
    } catch { setError("Login failed"); }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(""); setAddSuccess(""); setIsLoading(true);
    try {
      const res = await fetch("/api/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "email", value: newEmail.trim() }) });
      const data = await res.json();
      if (res.ok) { setAddSuccess("Email added!"); setNewEmail(""); fetchData(); }
      else { setAddError(data.error || "Failed"); }
    } catch { setAddError("Failed"); }
    finally { setIsLoading(false); }
  };

  const handleAddSanta = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(""); setAddSuccess(""); setIsLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "santa", value: newSantaName.trim(), email: newSantaEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) { setAddSuccess("Santa added!"); setNewSantaName(""); setNewSantaEmail(""); fetchData(); }
      else { setAddError(data.error || "Failed"); }
    } catch { setAddError("Failed"); }
    finally { setIsLoading(false); }
  };

  const handleClearScans = async () => { if (!confirm("Reset all assignments?")) return; await fetch("/api/scan", { method: "DELETE" }); fetchData(); };
  const handleClearEmails = async () => { if (!confirm("Clear all emails?")) return; await fetch("/api/participants?type=emails", { method: "DELETE" }); fetchData(); };
  const handleClearSantas = async () => { if (!confirm("Clear all santa names?")) return; await fetch("/api/participants?type=santas", { method: "DELETE" }); fetchData(); };
  const handleLogout = () => { setIsLoggedIn(false); sessionStorage.removeItem("adminLoggedIn"); setPassword(""); };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-gray-900 to-red-900">
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 w-full max-w-md mx-4">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="Password" />
            {error && <p className="text-red-400">{error}</p>}
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full">Login</button>
          </form>
          <div className="text-center mt-4"><a href="/" className="text-gray-400">Back</a></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-red-900 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin</h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded text-white">Logout</button>
        </div>
        {addError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">{addError}</div>}
        {addSuccess && <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded mb-4">{addSuccess}</div>}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Add Valid Email</h2>
            <form onSubmit={handleAddEmail} className="space-y-4">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="email@example.com" required />
              <button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full">Add Email</button>
            </form>
          </div>
          <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Add Santa Name</h2>
            <form onSubmit={handleAddSanta} className="space-y-3">
              <input type="text" value={newSantaName} onChange={(e) => setNewSantaName(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="Name (e.g. John Doe)" required />
              <input type="email" value={newSantaEmail} onChange={(e) => setNewSantaEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="Their email (to avoid self-match)" required />
              <button type="submit" disabled={isLoading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-full">Add Santa</button>
            </form>
          </div>
        </div>
        <div className="bg-black/30 rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded p-4"><p className="text-3xl font-bold text-white">{progress?.totalEmails || 0}</p><p className="text-gray-400">Emails</p></div>
            <div className="bg-white/5 rounded p-4"><p className="text-3xl font-bold text-white">{progress?.totalSantas || 0}</p><p className="text-gray-400">Santas</p></div>
            <div className="bg-white/5 rounded p-4"><p className="text-3xl font-bold text-white">{progress?.completedScans || 0}</p><p className="text-gray-400">Matched</p></div>
            <div className="bg-white/5 rounded p-4"><p className="text-3xl font-bold text-white">{(progress?.totalSantas || 0) - (progress?.completedScans || 0)}</p><p className="text-gray-400">Available</p></div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">Valid Emails ({emails.length})</h2>
              <button onClick={handleClearEmails} className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-white text-sm">Clear</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {emails.length === 0 ? <p className="text-gray-500">No emails added</p> : emails.map((e) => <div key={e.id} className="bg-white/5 rounded p-2 text-white text-sm">{e.email}</div>)}
            </div>
          </div>
          <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-yellow-400">Santa Names ({santaNames.length})</h2>
              <button onClick={handleClearSantas} className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-white text-sm">Clear</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {santaNames.length === 0 ? <p className="text-gray-500">No names added</p> : santaNames.map((s) => (
                <div key={s.id} className={"bg-white/5 rounded p-2 text-sm " + (s.assigned ? "opacity-50" : "")}>
                  <div className="flex justify-between">
                    <span className={s.assigned ? "text-gray-500 line-through" : "text-white"}>{s.name}</span>
                    {s.assigned && <span className="text-xs text-green-400">Assigned</span>}
                  </div>
                  <p className="text-gray-500 text-xs">{s.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-400">Completed Matches ({progress?.matches?.length || 0})</h2>
            <button onClick={handleClearScans} className="px-3 py-1 bg-orange-600/50 hover:bg-orange-600 rounded text-white text-sm">Reset All</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {!progress?.matches?.length ? <p className="text-gray-500">No matches yet</p> : progress.matches.map((m, i) => <div key={i} className="bg-white/5 rounded p-3 flex justify-between"><div><span className="text-white">{m.email}</span><span className="text-gray-500 mx-2">&#8594;</span><span className="text-yellow-400">{m.santaMatch}</span></div><span className="text-gray-500 text-xs">{new Date(m.scannedAt).toLocaleString()}</span></div>)}
          </div>
        </div>
        <div className="text-center mt-8"><a href="/" className="text-gray-400">Back to Home</a></div>
      </div>
    </div>
  );
}
