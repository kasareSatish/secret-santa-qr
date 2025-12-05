"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface Student {
  id: number;
  name: string;
  used: boolean;
}

const initialStudents: Student[] = [
  { id: 1, name: "Alice Johnson", used: false },
  { id: 2, name: "Bob Smith", used: false },
  { id: 3, name: "Charlie Brown", used: false },
  { id: 4, name: "Diana Ross", used: false },
  { id: 5, name: "Edward Wilson", used: false },
];

export default function Home() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
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

  const availableStudents = students.filter((s) => !s.used);
  const usedCount = students.filter((s) => s.used).length;
  const totalCount = students.length;

  const generateQR = async () => {
    if (availableStudents.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableStudents.length);
    const student = availableStudents[randomIndex];

    const qrData = JSON.stringify({
      studentId: student.id,
      studentName: student.name,
      timestamp: Date.now(),
    });

    // Uses current origin - works on localhost and deployed URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const scanUrl = baseUrl + "/scan?data=" + encodeURIComponent(qrData);

    try {
      const url = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1a472a",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(url);
      setQrGenerated(true);

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, used: true } : s))
      );
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const resetAll = () => {
    setStudents(initialStudents);
    setQrCodeUrl("");
    setQrGenerated(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold title-glow mb-4">
            <span className="text-red-500">🎄</span> Secret Santa{" "}
            <span className="text-red-500">🎄</span>
          </h1>
          <p className="text-xl text-gray-300">
            Generate QR codes for Secret Santa matching!
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10 flex flex-col items-center">

            {/* Progress indicator - no names shown */}
            <div className="w-full mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{usedCount} / {totalCount} assigned</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: (usedCount / totalCount * 100) + "%" }}
                />
              </div>
            </div>

            <button
              onClick={generateQR}
              disabled={availableStudents.length === 0}
              className="christmas-btn text-white text-xl font-bold py-4 px-10 rounded-full mb-8"
            >
              🎲 Generate Random QR
            </button>

            {qrCodeUrl && qrGenerated && (
              <div className="qr-container text-center">
                <p className="text-gray-800 font-semibold mb-3 text-lg">
                  🎁 Your Secret Santa QR Code
                </p>
                <img
                  src={qrCodeUrl}
                  alt="Secret Santa QR Code"
                  className="mx-auto"
                />
                <p className="text-gray-600 text-sm mt-3">
                  Scan to find out who you got!
                </p>
              </div>
            )}

            {!qrCodeUrl && (
              <div className="qr-container text-center opacity-50">
                <div className="w-[300px] h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 px-4">
                    Click the button to generate a mystery QR code
                  </p>
                </div>
              </div>
            )}

            {availableStudents.length === 0 && (
              <div className="mt-6 text-center">
                <p className="text-yellow-400 mb-4">
                  🎉 All Secret Santas have been assigned!
                </p>
                <button
                  onClick={resetAll}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-full transition-all"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>🌟 Merry Christmas! 🌟</p>
        </div>
      </div>
    </div>
  );
}
